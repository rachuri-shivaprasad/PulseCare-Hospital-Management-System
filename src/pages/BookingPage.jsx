import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CalendarPlus, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TokenSlipModal } from '../components/TokenSlipModal';

export const BookingPage = () => {
  const { doctors, refreshAppointments } = useAppointmentQueue();
  const { patient } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get('doctorId');
  const [bookingFor, setBookingFor] = useState('self');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'Male',
    doctorId: preselectedDoctorId || doctors[0]?.id || '',
    date: todayStr,
    timeSlot: '10:00 AM',
    symptoms: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const submissionInProgress = useRef(false);

  useEffect(() => {
    if (preselectedDoctorId && doctors.some(d => d.id === preselectedDoctorId)) {
      setFormData(prev => ({ ...prev, doctorId: preselectedDoctorId }));
    }
  }, [preselectedDoctorId, doctors]);

  const selectedDoctor = doctors.find(d => d.id === formData.doctorId) || doctors[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.patientName.trim())
      newErrors.patientName = 'Patient full name is required';
    if (!formData.patientPhone.trim())
      newErrors.patientPhone = 'Phone number is required';
    if (!formData.patientAge || Number(formData.patientAge) <= 0 || Number(formData.patientAge) > 120)
      newErrors.patientAge = 'Please enter a valid age (1–120)';
    if (!formData.date)
      newErrors.date = 'Appointment date is required';
    if (!formData.timeSlot)
      newErrors.timeSlot = 'Please select a time slot';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionInProgress.current || !validate()) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setBookingError('');

    try {
      const createdAppointment = await api.createAppointment({
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        patientAge: Number(formData.patientAge),
        patientGender: formData.patientGender,
        doctorId: formData.doctorId,
        date: formData.date,
        timeSlot: formData.timeSlot,
        symptoms: formData.symptoms.trim() || 'General OPD Consultation'
      });

      setConfirmedAppointment(createdAppointment);
      if (refreshAppointments) {
        refreshAppointments().catch(() => {});
      }
    } catch (error) {
      const message = error instanceof TypeError
        ? 'Could not connect to the booking server. Check that the backend is running and try again.'
        : error.message || 'The appointment could not be created. Please try again.';
      setBookingError(message);
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-eyebrow">
            <CalendarPlus size={14} /> Online OPD Desk
          </div>
          <h1>Book a Hospital Appointment</h1>
          <p>
            Schedule your consultation with a specialist and receive your real-time digital queue token immediately.
          </p>
        </div>
      </div>

      <div className="app-container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', 
          gap: '2rem', 
          alignItems: 'start' 
        }}>
          
          {/* ── Main Form ───────────────────────────────────────────────── */}
          <div className="med-card" style={{ padding: '2rem' }}>
            {/* Form section heading */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginBottom: '1.75rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{ 
                width: '38px', 
                height: '38px', 
                background: '#f0fdfa', 
                border: '1px solid #ccfbf1',
                color: '#0d9488', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', margin: 0, color: '#0b1f3a' }}>Patient &amp; Appointment Details</h2>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Fill in patient details to issue your OPD token</span>
              </div>
            </div>

            {patient && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                  Who is this appointment for?
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${bookingFor === 'self' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setBookingFor('self');
                      setFormData(prev => ({ ...prev, patientName: patient.name, patientPhone: patient.phone }));
                    }}
                  >
                    For Myself ({patient.name})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${bookingFor === 'family' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setBookingFor('family');
                      setFormData(prev => ({ ...prev, patientName: '', patientPhone: '' }));
                    }}
                  >
                    For Family Member / Relative / Friend
                  </button>
                </div>
                {bookingFor === 'family' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#0d9488' }}>
                    ✓ Enter the patient's actual name and contact details below. The appointment will be saved under their name and tracked in your portal.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate id="booking-form">
              {/* Patient Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="patientName">
                  Patient Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="patientName"
                  type="text"
                  name="patientName"
                  className={`form-control${errors.patientName ? ' form-control-error' : ''}`}
                  placeholder="e.g. John Doe"
                  value={formData.patientName}
                  onChange={handleChange}
                  style={errors.patientName ? { borderColor: '#dc2626' } : {}}
                />
                {errors.patientName && (
                  <div className="form-error">
                    <AlertCircle size={13} /> {errors.patientName}
                  </div>
                )}
              </div>

              {/* Phone, Age, Gender */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="patientPhone">
                    Phone / Mobile <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="patientPhone"
                    type="tel"
                    name="patientPhone"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    style={errors.patientPhone ? { borderColor: '#dc2626' } : {}}
                  />
                  {errors.patientPhone && (
                    <div className="form-error"><AlertCircle size={13} /> {errors.patientPhone}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="patientAge">
                    Age (Years) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="patientAge"
                    type="number"
                    name="patientAge"
                    min="1"
                    max="120"
                    className="form-control"
                    placeholder="e.g. 35"
                    value={formData.patientAge}
                    onChange={handleChange}
                    style={errors.patientAge ? { borderColor: '#dc2626' } : {}}
                  />
                  {errors.patientAge && (
                    <div className="form-error"><AlertCircle size={13} /> {errors.patientAge}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="patientGender">Gender</label>
                  <select
                    id="patientGender"
                    name="patientGender"
                    className="form-control"
                    value={formData.patientGender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Doctor Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="doctorId">
                  Consulting Doctor &amp; Department <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="doctorId"
                  name="doctorId"
                  className="form-control"
                  value={formData.doctorId}
                  onChange={handleChange}
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.department} ({doc.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="form-group">
                <label className="form-label">
                  Appointment Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.625rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${formData.date === todayStr ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData(prev => ({ ...prev, date: todayStr }))}
                    id="date-today"
                  >
                    Today ({todayStr})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${formData.date === tomorrowStr ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData(prev => ({ ...prev, date: tomorrowStr }))}
                    id="date-tomorrow"
                  >
                    Tomorrow ({tomorrowStr})
                  </button>
                </div>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleChange}
                  min={todayStr}
                  id="appointment-date"
                />
                {errors.date && (
                  <div className="form-error"><AlertCircle size={13} /> {errors.date}</div>
                )}
              </div>

              {/* Time Slot Selector */}
              <div className="form-group">
                <label className="form-label">
                  Preferred Time Slot <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.5rem' }}>
                  {(selectedDoctor?.timeSlots || ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM']).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot }))}
                      style={{
                        padding: '0.5625rem 0.5rem',
                        borderRadius: '6px',
                        border: formData.timeSlot === slot 
                          ? '2px solid #0d9488' 
                          : '1px solid #e2e8f0',
                        background: formData.timeSlot === slot ? '#f0fdfa' : 'white',
                        color: formData.timeSlot === slot ? '#0d9488' : '#475569',
                        fontWeight: formData.timeSlot === slot ? 700 : 500,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.12s'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.timeSlot && (
                  <div className="form-error" style={{ marginTop: '0.375rem' }}>
                    <AlertCircle size={13} /> {errors.timeSlot}
                  </div>
                )}
              </div>

              {/* Symptoms / Reason */}
              <div className="form-group">
                <label className="form-label" htmlFor="symptoms">
                  Primary Symptoms / Medical Reason
                  <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '0.4rem' }}>(Optional)</span>
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={3}
                  className="form-control"
                  placeholder="e.g. Mild persistent headache, routine blood pressure check…"
                  value={formData.symptoms}
                  onChange={handleChange}
                />
              </div>

              {/* Submit */}
              {bookingError && (
                <div className="form-error" role="alert" style={{ marginTop: '0.75rem' }}>
                  <AlertCircle size={13} /> {bookingError}
                </div>
              )}
              <button
                type="submit"
                id="submit-booking"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                <CalendarPlus size={18} /> {isSubmitting ? 'Saving Appointment...' : 'Confirm Appointment & Generate Token'}
              </button>
            </form>
          </div>

          {/* ── Sidebar Summary ──────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="med-card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <Stethoscope size={18} color="#0d9488" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Consultation Summary</h3>
              </div>

              {selectedDoctor && (
                <div>
                  {/* Doctor mini profile */}
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={selectedDoctor.avatar} 
                      alt={selectedDoctor.name} 
                      style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1rem', margin: 0, color: '#0b1f3a' }}>{selectedDoctor.name}</h4>
                      <p style={{ color: '#0d9488', fontSize: '0.8125rem', fontWeight: 600, margin: '0.1rem 0' }}>{selectedDoctor.department}</p>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{selectedDoctor.experience} clinical experience</span>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div style={{ 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    border: '1px solid #f1f5f9',
                    padding: '0.875rem', 
                    fontSize: '0.875rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    marginBottom: '1rem' 
                  }}>
                    {[
                      { label: 'Assigned Cabin', value: selectedDoctor.roomNumber, bold: true },
                      { label: 'Selected Date', value: formData.date || 'Today', bold: true },
                      { label: 'Selected Slot', value: formData.timeSlot, teal: true },
                      { 
                        label: 'Consultation Fee (INR)', 
                        value: selectedDoctor?.consultationFee 
                          ? (() => {
                              const digits = selectedDoctor.consultationFee.replace(/[^0-9.]/g, '');
                              const num = parseFloat(digits);
                              const inr = (!num || isNaN(num)) ? 500 : (num < 100 ? num * 10 : num);
                              return `₹${inr.toFixed(2)}`;
                            })()
                          : '₹500.00', 
                        green: true 
                      },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>{item.label}:</span>
                        <span style={{ 
                          fontWeight: item.bold || item.teal || item.green ? 700 : 400,
                          color: item.teal ? '#0d9488' : item.green ? '#059669' : '#0b1f3a',
                          fontSize: item.green ? '0.9375rem' : '0.875rem'
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Token info notice */}
                  <div className="alert alert-teal" style={{ fontSize: '0.8125rem' }}>
                    <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      An instant digital token will be added to the OPD central triage queue upon confirmation.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Help notice */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              padding: '0.875rem', 
              background: '#fffbeb', 
              border: '1px solid #fde68a',
              borderRadius: '8px',
              marginTop: '1rem',
              fontSize: '0.8125rem',
              color: '#78350f'
            }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Bring a valid photo ID and this token slip on the day of your appointment.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Slip Modal */}
      {confirmedAppointment && (
        <TokenSlipModal
          appointment={confirmedAppointment}
          onClose={() => setConfirmedAppointment(null)}
        />
      )}
    </div>
  );
};
