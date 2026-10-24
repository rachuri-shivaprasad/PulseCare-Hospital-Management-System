import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initialAppointments } from '../data/initialAppointments';
import { mockDoctors } from '../data/mockDoctors';
import { playQueueChime } from '../components/AudioNotification';
import { api } from '../services/api';

const AppointmentQueueContext = createContext();

const normalizeAppointment = (apt) => {
  if (!apt) return null;
  const statusStr = apt.statusDisplayName || 
    (apt.status === 'IN_CONSULTATION' ? 'In Consultation' : 
     apt.status === 'WAITING' ? 'Waiting' : 
     apt.status === 'COMPLETED' ? 'Completed' : 
     apt.status === 'SKIPPED' ? 'Skipped' : 
     apt.status === 'CANCELLED' ? 'Cancelled' : apt.status || 'Waiting');

  return {
    ...apt,
    status: statusStr,
    rawStatus: apt.status,
    statusDisplayName: statusStr,
    tokenSequence: apt.tokenSequence != null ? Number(apt.tokenSequence) : 0,
    vitals: apt.vitals || {
      bp: apt.bp || '120/80',
      heartRate: apt.heartRate || '72 bpm',
      temp: apt.temp || '98.6 °F',
      spo2: apt.spo2 || '99%'
    }
  };
};

export const AppointmentQueueProvider = ({ children }) => {
  const [doctors, setDoctors] = useState(mockDoctors);
  const [appointments, setAppointments] = useState(() => initialAppointments.map(normalizeAppointment));
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const pollingTimerRef = useRef(null);

  // Load doctors from backend API
  useEffect(() => {
    let mounted = true;
    api.getDoctors()
      .then(docList => {
        if (mounted && Array.isArray(docList) && docList.length > 0) {
          setDoctors(docList);
        }
      })
      .catch(err => {
        console.warn('Could not load doctors from backend API, using cached doctors:', err.message);
      });
    return () => { mounted = false; };
  }, []);

  // Fetch appointments from backend
  const refreshAppointments = useCallback(async () => {
    try {
      const records = await api.getAppointments();
      if (Array.isArray(records)) {
        const normalized = records.map(normalizeAppointment);
        setAppointments(normalized);
        setIsStaffAuthenticated(true);
        return normalized;
      }
    } catch (err) {
      // 401 or 403 means staff session is not active yet (normal for unauthenticated users)
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Denied'))) {
        setIsStaffAuthenticated(false);
      }
    }
    return appointments;
  }, [appointments]);

  // Initial load and periodic polling for real-time queue synchronization
  useEffect(() => {
    refreshAppointments();

    const poll = async () => {
      await refreshAppointments();
    };

    pollingTimerRef.current = setInterval(poll, 4000);
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [refreshAppointments]);

  // Derived filtered collections (status matched flexibly)
  const activeConsultations = appointments.filter(a => a.status === 'In Consultation');
  const waitingPatients = appointments
    .filter(a => a.status === 'Waiting')
    .sort((a, b) => (a.tokenSequence || 0) - (b.tokenSequence || 0));
  const completedPatients = appointments.filter(a => a.status === 'Completed');
  const skippedPatients = appointments.filter(a => a.status === 'Skipped');
  const cancelledPatients = appointments.filter(a => a.status === 'Cancelled');

  // Book an appointment via backend API
  const bookAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      const created = await api.createAppointment(appointmentData);
      const normalized = normalizeAppointment(created);
      
      setAppointments(prev => [normalized, ...prev.filter(a => a.id !== normalized.id)]);
      await refreshAppointments();

      setAnnouncement({
        message: `Token ${normalized.tokenNumber} issued to ${normalized.patientName} (${normalized.doctorName})`,
        type: "success",
        timestamp: Date.now()
      });

      return normalized;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Call Next Patient (Strict Queue Rule: Only ONE patient per doctor in consultation at a time)
  const callNextPatient = async (doctorId = null) => {
    try {
      const response = await api.callNextPatient(doctorId);
      await refreshAppointments();

      if (!response.available) {
        setAnnouncement({
          message: response.message || "No patients could be called at this time.",
          type: "warning",
          timestamp: Date.now()
        });
        return { success: false, reason: "BUSY_OR_EMPTY", message: response.message };
      }

      playQueueChime();

      setAnnouncement({
        message: `🔔 Calling Token ${response.appointment?.tokenNumber} — ${response.appointment?.patientName} to Dr. ${response.doctorName}'s Cabin (${response.roomNumber || 'Cabin'})!`,
        type: "call",
        token: response.appointment?.tokenNumber,
        patientName: response.appointment?.patientName,
        doctorName: response.doctorName,
        timestamp: Date.now()
      });

      return { success: true, patient: response.appointment };
    } catch (err) {
      setAnnouncement({
        message: `Could not call next patient: ${err.message}`,
        type: "warning",
        timestamp: Date.now()
      });
      return { success: false, error: err.message };
    }
  };

  // Start consultation for a specific appointment
  const startConsultation = async (appointmentId) => {
    try {
      const updated = await api.startConsultation(appointmentId);
      const normalized = normalizeAppointment(updated);
      setAppointments(prev => prev.map(a => a.id === appointmentId ? normalized : a));
      await refreshAppointments();
      playQueueChime();

      setAnnouncement({
        message: `🔔 Consultation started for Token ${normalized.tokenNumber} (${normalized.patientName})!`,
        type: "call",
        token: normalized.tokenNumber,
        patientName: normalized.patientName,
        doctorName: normalized.doctorName,
        timestamp: Date.now()
      });
      return normalized;
    } catch (err) {
      setAnnouncement({
        message: `Error starting consultation: ${err.message}`,
        type: "warning",
        timestamp: Date.now()
      });
      throw err;
    }
  };

  // Complete consultation
  const completeConsultation = async (appointmentId, consultationNotes = "") => {
    try {
      const updated = await api.completeConsultation(appointmentId, consultationNotes);
      const normalized = normalizeAppointment(updated);
      setAppointments(prev => prev.map(a => a.id === appointmentId ? normalized : a));
      await refreshAppointments();

      setAnnouncement({
        message: `✓ Consultation completed for Token ${normalized?.tokenNumber || ''} (${normalized?.patientName || ''}). Doctor cabin is now free.`,
        type: "success",
        timestamp: Date.now()
      });
      return normalized;
    } catch (err) {
      setAnnouncement({
        message: `Error completing consultation: ${err.message}`,
        type: "warning",
        timestamp: Date.now()
      });
      throw err;
    }
  };

  // Skip patient
  const skipPatient = async (appointmentId, reason = "Patient not present when token called") => {
    try {
      const updated = await api.skipPatient(appointmentId, reason);
      const normalized = normalizeAppointment(updated);
      setAppointments(prev => prev.map(a => a.id === appointmentId ? normalized : a));
      await refreshAppointments();

      setAnnouncement({
        message: `Token ${normalized?.tokenNumber || ''} (${normalized?.patientName || ''}) marked as Skipped.`,
        type: "warning",
        timestamp: Date.now()
      });
      return normalized;
    } catch (err) {
      setAnnouncement({
        message: `Error skipping patient: ${err.message}`,
        type: "warning",
        timestamp: Date.now()
      });
      throw err;
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      const updated = await api.cancelAppointment(appointmentId);
      const normalized = normalizeAppointment(updated);
      setAppointments(prev => prev.map(a => a.id === appointmentId ? normalized : a));
      await refreshAppointments();

      setAnnouncement({
        message: `Token ${normalized?.tokenNumber || ''} appointment was cancelled.`,
        type: "warning",
        timestamp: Date.now()
      });
      return normalized;
    } catch (err) {
      setAnnouncement({
        message: `Error cancelling appointment: ${err.message}`,
        type: "warning",
        timestamp: Date.now()
      });
      throw err;
    }
  };

  // Quick Walk-In Registration by Receptionist
  const registerWalkIn = async (patientData) => {
    const today = new Date().toISOString().split('T')[0];
    return await bookAppointment({
      ...patientData,
      timeSlot: patientData.timeSlot || "Immediate (Walk-In)",
      date: patientData.date || today
    });
  };

  // Reload / Refresh Demo Data
  const resetDemoData = async () => {
    await refreshAppointments();
    setAnnouncement({
      message: "Refreshed live hospital appointments and queue from central database.",
      type: "info",
      timestamp: Date.now()
    });
  };

  return (
    <AppointmentQueueContext.Provider
      value={{
        doctors,
        appointments,
        activeConsultations,
        waitingPatients,
        completedPatients,
        skippedPatients,
        cancelledPatients,
        announcement,
        setAnnouncement,
        loading,
        isStaffAuthenticated,
        bookAppointment,
        callNextPatient,
        startConsultation,
        completeConsultation,
        skipPatient,
        cancelAppointment,
        registerWalkIn,
        refreshAppointments,
        resetDemoData
      }}
    >
      {children}
    </AppointmentQueueContext.Provider>
  );
};

export const useAppointmentQueue = () => {
  const context = useContext(AppointmentQueueContext);
  if (!context) {
    throw new Error('useAppointmentQueue must be used within an AppointmentQueueProvider');
  }
  return context;
};
