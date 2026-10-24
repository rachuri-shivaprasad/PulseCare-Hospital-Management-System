import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  User, 
  Clock, 
  FileText, 
  Volume2, 
  Activity, 
  Heart, 
  Thermometer, 
  ChevronRight,
  ShieldAlert,
  Save,
  Check,
  RotateCcw,
  XCircle,
  Users
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { useAuth } from '../context/AuthContext';

export const DoctorDashboardPage = () => {
  const { 
    doctors, 
    appointments, 
    callNextPatient, 
    startConsultation,
    completeConsultation,
    skipPatient,
    refreshAppointments
  } = useAppointmentQueue();

  const { patient } = useAuth();

  // Active doctor profile selector - auto-select if signed in as a doctor
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (patient?.name) {
      const match = doctors.find(d => d.name.toLowerCase() === patient.name.toLowerCase());
      if (match) return match.id;
    }
    return doctors[0]?.id || "doc-1";
  });

  useEffect(() => {
    if (patient?.name) {
      const match = doctors.find(d => d.name.toLowerCase() === patient.name.toLowerCase());
      if (match) setSelectedDoctorId(match.id);
    }
  }, [patient, doctors]);

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Prescription and clinical notes form state
  const [consultNotes, setConsultNotes] = useState("");
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [actionError, setActionError] = useState("");

  // Doctor's active patient (currently In Consultation)
  const currentPatient = appointments.find(
    a => a.doctorId === selectedDoctorId && a.status === 'In Consultation'
  );

  // Doctor's waiting patients queue
  const waitingPatients = appointments.filter(
    a => a.doctorId === selectedDoctorId && a.status === 'Waiting'
  ).sort((a, b) => (a.tokenSequence || 0) - (b.tokenSequence || 0));

  // Doctor's completed patients today
  const completedPatients = appointments.filter(
    a => a.doctorId === selectedDoctorId && a.status === 'Completed'
  );

  // Doctor's cancelled appointments
  const cancelledPatients = appointments.filter(
    a => a.doctorId === selectedDoctorId && a.status === 'Cancelled'
  );

  const handleCallNext = async () => {
    setActionError("");
    try {
      await callNextPatient(selectedDoctorId);
      setConsultNotes("");
      setPrescriptionSaved(false);
    } catch (err) {
      setActionError(err.message || "Could not call next patient.");
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    setActionError("");
    try {
      await startConsultation(appointmentId);
      setConsultNotes("");
      setPrescriptionSaved(false);
    } catch (err) {
      setActionError(err.message || "Could not start consultation.");
    }
  };

  const handleComplete = async () => {
    if (!currentPatient) return;
    setActionError("");
    try {
      await completeConsultation(currentPatient.id, consultNotes);
      setConsultNotes("");
      setPrescriptionSaved(true);
      setTimeout(() => setPrescriptionSaved(false), 3000);
    } catch (err) {
      setActionError(err.message || "Could not complete consultation.");
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#7dd3fc', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Stethoscope size={16} /> Clinical OPD Cabin
          </div>
          <h1>Doctor Consultation Dashboard</h1>
          <p>
            Review patient vitals, document diagnosis and prescriptions, call waiting patients, and complete consultations.
          </p>
        </div>
      </div>

      <div className="app-container">
        {/* Doctor Selector / Cabin Info Bar */}
        <div className="med-card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img 
                src={selectedDoctor.avatar} 
                alt={selectedDoctor.name} 
                style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #0284c7' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                    {selectedDoctor.department}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedDoctor.roomNumber}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>{selectedDoctor.name}</h2>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>{selectedDoctor.degree}</span>
              </div>
            </div>

            {/* Doctor Switcher for testing/demo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label htmlFor="doctorSelector" style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                Doctor Cabin:
              </label>
              <select
                id="doctorSelector"
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setConsultNotes("");
                }}
                className="form-control"
                style={{ width: 'auto', minWidth: '220px', fontWeight: 600 }}
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => refreshAppointments && refreshAppointments()}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', gap: '0.35rem' }}
                title="Refresh live queue"
                id="doctor-refresh-btn"
              >
                <RotateCcw size={14} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Cabin KPI Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Waiting Patients',   value: waitingPatients.length,   icon: <Clock size={18} />, bg: '#fef3c7', color: '#d97706' },
            { label: 'In Consultation',    value: currentPatient ? 1 : 0,   icon: <Activity size={18} />, bg: '#dbeafe', color: '#0284c7' },
            { label: 'Completed Consultations', value: completedPatients.length, icon: <CheckCircle2 size={18} />, bg: '#d1fae5', color: '#059669' },
            { label: 'Cancelled Appointments',  value: cancelledPatients.length, icon: <XCircle size={18} />, bg: '#fee2e2', color: '#dc2626' }
          ].map(stat => (
            <div key={stat.label} className="stat-box" style={{ padding: '0.875rem 1rem' }}>
              <div className="stat-box-icon" style={{ background: stat.bg, color: stat.color, width: '40px', height: '40px' }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-box-value" style={{ color: stat.color, fontSize: '1.4rem' }}>{stat.value}</div>
                <div className="stat-box-label" style={{ fontSize: '0.78rem' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {actionError && (
          <div className="form-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={16} /> {actionError}
          </div>
        )}

        {/* Two-column layout: Current Patient Card + Queue & History */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(280px, 1.2fr)', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT: Current Patient In Consultation Card */}
          <div>
            <div className="med-card" style={{ border: currentPatient ? '2px solid #0284c7' : '1px solid #e2e8f0', boxShadow: currentPatient ? '0 10px 25px -5px rgba(2, 132, 199, 0.15)' : 'none' }}>
              <div className="med-card-header">
                <div className="card-title-group">
                  <Activity size={22} color={currentPatient ? "#0284c7" : "#94a3b8"} />
                  <h3>Current Patient in Cabin</h3>
                </div>
                {currentPatient ? (
                  <span className="badge badge-active">
                    In Consultation
                  </span>
                ) : (
                  <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                    Cabin Available
                  </span>
                )}
              </div>

              {currentPatient ? (
                <div>
                  {/* Patient Banner */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #0b1f3a, #0284c7)', 
                    borderRadius: '12px', 
                    padding: '1.25rem 1.5rem', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#bae6fd' }}>
                        Patient Under Examination
                      </span>
                      <h3 style={{ color: 'white', fontSize: '1.5rem', margin: '0.2rem 0' }}>
                        {currentPatient.patientName}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>
                        Age: {currentPatient.patientAge} Years • Gender: {currentPatient.patientGender} • Phone: {currentPatient.patientPhone}
                      </span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#bae6fd', textTransform: 'uppercase', display: 'block' }}>Token</span>
                      <span className="token-badge lg" style={{ fontSize: '1.8rem', padding: '0.3rem 1rem' }}>
                        {currentPatient.tokenNumber}
                      </span>
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Heart size={16} color="#ef4444" /> Patient Triage Vitals
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Blood Press.</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{currentPatient.vitals?.bp || "120/80"}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Heart Rate</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{currentPatient.vitals?.heartRate || "74 bpm"}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>SpO2 Level</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{currentPatient.vitals?.spo2 || "98%"}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Body Temp</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{currentPatient.vitals?.temp || "98.6 °F"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Chief Symptoms */}
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#b45309', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Reported Symptoms / Chief Complaint
                    </span>
                    <p style={{ color: '#92400e', fontSize: '0.92rem', margin: 0 }}>
                      {currentPatient.symptoms || "Routine OPD medical consultation."}
                    </p>
                  </div>

                  {/* Consultation Notes & Prescription Textarea */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Doctor's Clinical Notes & Rx Prescription *</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>Will be saved to patient medical record</span>
                    </label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Enter clinical assessment, diagnosis, prescription medication (e.g. Paracetamol 500mg, 1 tablet TID), and lifestyle follow-up advice..."
                      value={consultNotes}
                      onChange={(e) => setConsultNotes(e.target.value)}
                    />
                  </div>

                  {/* COMPLETE CONSULTATION ACTION BUTTON */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    <button
                      onClick={handleComplete}
                      className="btn btn-success btn-lg"
                      style={{ flex: '1', minWidth: '200px', gap: '0.65rem' }}
                    >
                      <CheckCircle2 size={20} /> COMPLETE CONSULTATION
                    </button>

                    <button
                      onClick={() => skipPatient(currentPatient.id)}
                      className="btn btn-secondary"
                      style={{ gap: '0.4rem', color: '#64748b' }}
                      title="Skip patient if absent or unresponsive"
                    >
                      Skip Patient
                    </button>

                    <button
                      onClick={handleCallNext}
                      className="btn btn-secondary"
                      style={{ gap: '0.5rem' }}
                    >
                      <Volume2 size={16} /> Call Next Now
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state when doctor cabin is free */
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                    <Stethoscope size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Cabin is Free</h3>
                  <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                    {waitingPatients.length > 0 
                      ? `There are ${waitingPatients.length} patients waiting in the queue for ${selectedDoctor.name}.` 
                      : `No patients currently waiting for ${selectedDoctor.name}.`}
                  </p>

                  {waitingPatients.length > 0 && (
                    <button
                      onClick={handleCallNext}
                      className="btn btn-primary btn-lg"
                      style={{ gap: '0.65rem' }}
                    >
                      <Volume2 size={20} /> Call Next Patient ({waitingPatients[0].tokenNumber})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Success toast if prescription completed */}
            {prescriptionSaved && (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '10px', padding: '0.85rem 1.25rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={18} />
                <span>Consultation record saved and patient marked as completed!</span>
              </div>
            )}
          </div>

          {/* RIGHT: Waiting Queue & Today's Completed List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Waiting for this Doctor */}
            <div className="med-card">
              <div className="med-card-header">
                <div className="card-title-group">
                  <Clock size={18} color="#b45309" />
                  <h3 style={{ fontSize: '1.1rem' }}>Waiting Patients for Cabin</h3>
                </div>
                <span className="badge badge-waiting">
                  {waitingPatients.length} Waiting
                </span>
              </div>

              {waitingPatients.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, fontStyle: 'italic' }}>
                  Queue empty. All scheduled patients have been seen.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {waitingPatients.map((apt, index) => (
                    <div 
                      key={apt.id}
                      style={{ 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="token-badge">
                          {apt.tokenNumber}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.88rem', display: 'block', color: '#0f172a' }}>
                            {apt.patientName}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Slot: {apt.timeSlot} • {apt.patientAge}y {apt.patientGender}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleStartConsultation(apt.id)}
                          className={`btn btn-sm ${index === 0 ? 'btn-primary' : 'btn-secondary'}`}
                          title={`Call ${apt.patientName} (${apt.tokenNumber}) into consultation`}
                        >
                          <Volume2 size={13} /> {index === 0 ? 'Call Next' : 'Call'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Consultations Log */}
            <div className="med-card">
              <div className="med-card-header">
                <div className="card-title-group">
                  <CheckCircle2 size={18} color="#10b981" />
                  <h3 style={{ fontSize: '1.1rem' }}>Completed Today</h3>
                </div>
                <span className="badge badge-completed">
                  {completedPatients.length} Seen
                </span>
              </div>

              {completedPatients.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, fontStyle: 'italic' }}>
                  No completed consultations yet for this session.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {completedPatients.map(apt => (
                    <div 
                      key={apt.id}
                      style={{ 
                        background: '#f0fdf4', 
                        border: '1px solid #bbf7d0', 
                        borderRadius: '10px', 
                        padding: '0.75rem 1rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#065f46' }}>
                          {apt.tokenNumber} — {apt.patientName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                          ✓ Completed
                        </span>
                      </div>
                      {apt.notes && (
                        <p style={{ fontSize: '0.78rem', color: '#166534', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                          <em>Advice: {apt.notes}</em>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
