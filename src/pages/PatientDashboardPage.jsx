import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Printer,
  Stethoscope,
  UserRound,
  XCircle,
  CreditCard,
  Receipt
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TokenSlipModal } from '../components/TokenSlipModal';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const PatientDashboardPage = () => {
  const { patient } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  const [paymentModalAppointment, setPaymentModalAppointment] = useState(null);
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [fetchingReceipt, setFetchingReceipt] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getMyAppointments()
      .then(records => {
        if (!mounted) return;
        const ownAppointments = records.map(appointment => ({
          ...appointment,
          status: appointment.statusDisplayName || appointment.status
        }));
        setAppointments(ownAppointments);
        setSelectedAppointmentId(ownAppointments[0]?.id || null);
      })
      .catch(error => {
        if (mounted) setLoadError(error.message || 'Could not load your appointments.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedAppointment = appointments.find(appointment => appointment.id === selectedAppointmentId) || appointments[0];

  const handleCancel = async appointmentId => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionError('');
    try {
      const cancelled = await api.cancelMyAppointment(appointmentId);
      const updated = { ...cancelled, status: cancelled.statusDisplayName || cancelled.status };
      setAppointments(current => current.map(appointment => appointment.id === appointmentId ? updated : appointment));
    } catch (error) {
      setActionError(error.message || 'Could not cancel this appointment.');
    }
  };

  const handleViewReceipt = async (apt) => {
    setFetchingReceipt(true);
    setActionError('');
    try {
      const receipt = await api.getPaymentReceipt(apt.paymentId || apt.id);
      setReceiptModalData(receipt);
    } catch (err) {
      try {
        const receipt = await api.getAppointmentPayment(apt.id);
        if (receipt) {
          setReceiptModalData(receipt);
        } else {
          setActionError('No receipt found for this appointment yet.');
        }
      } catch (e) {
        setActionError(err.message || 'Could not retrieve receipt.');
      }
    } finally {
      setFetchingReceipt(false);
    }
  };

  const handlePaymentSuccess = (receipt) => {
    const newStatus = receipt.status || (receipt.awaitingVerification ? 'PENDING_VERIFICATION' : 'PAID');
    setAppointments(prev => prev.map(a =>
      a.id === receipt.appointmentId
        ? { ...a, paymentStatus: newStatus, paymentId: receipt.paymentId }
        : a
    ));
    setPaymentModalAppointment(null);
    // Only show receipt modal for PAID payments
    if (newStatus === 'PAID') {
      setReceiptModalData(receipt);
    }
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.tokenNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
    appointment.doctorName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    appointment.department.toLowerCase().includes(filterQuery.toLowerCase())
  );
  const today = new Date().toISOString().slice(0, 10);
  const isUpcoming = appointment => appointment.date >= today &&
    ['Waiting', 'In Consultation'].includes(appointment.status);
  const upcomingAppointments = filteredAppointments.filter(isUpcoming);
  const pastAppointments = filteredAppointments.filter(appointment => !isUpcoming(appointment));

  // Step tracker helper
  const getStepStatus = (step) => {
    if (!selectedAppointment) return 'pending';
    const s = selectedAppointment.status;
    if (step === 0) return 'done';
    if (step === 1) return s === 'Waiting' ? 'active' : (s === 'In Consultation' || s === 'Completed') ? 'done' : 'pending';
    if (step === 2) return s === 'In Consultation' ? 'active' : s === 'Completed' ? 'done' : 'pending';
    if (step === 3) return s === 'Completed' ? 'done' : 'pending';
    return 'pending';
  };

  const steps = [
    { label: 'Token Issued', sub: 'OPD slot confirmed' },
    { label: 'Waiting Lounge', sub: 'Room assigned' },
    { label: 'In Cabin', sub: 'Doctor examining' },
    { label: 'Completed', sub: 'Prescription issued' },
  ];

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-eyebrow">
            <UserRound size={14} /> Patient Portal
          </div>
          <h1>Patient Dashboard &amp; Token Tracker</h1>
          <p>
            View your appointments, issued tokens, and recorded consultation status.
          </p>
        </div>
      </div>

      <div className="app-container">

        <section className="med-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f0fdfa', color: '#0d9488', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <UserRound size={22} />
          </div>
          <div>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.8125rem' }}>Patient profile</span>
            <strong style={{ display: 'block', color: '#0b1f3a', fontSize: '1rem' }}>{patient?.name}</strong>
            <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>Phone: {patient?.phone}</span>
          </div>
        </section>

        {loadError && <div className="form-error" role="alert"><AlertCircle size={14} /> {loadError}</div>}
        {actionError && <div className="form-error" role="alert"><AlertCircle size={14} /> {actionError}</div>}
        {loading && <div className="med-card" role="status">Loading your appointments...</div>}
        {!loading && !loadError && appointments.length === 0 && (
          <div className="med-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <CalendarPlus size={28} color="#0d9488" style={{ margin: '0 auto 0.75rem' }} />
            <h2 style={{ fontSize: '1.125rem' }}>No appointments yet</h2>
            <Link to="/book" className="btn btn-primary"><CalendarPlus size={15} /> Book an Appointment</Link>
          </div>
        )}

        {selectedAppointment && (
          <>
            {/* ── Queue Status Banner ─────────────────────────────────── */}
            <div style={{ 
              background: '#0b1f3a',
              border: '1px solid #1e3a5f',
              borderLeft: `5px solid ${
                selectedAppointment.status === 'Completed' ? '#059669' :
                selectedAppointment.status === 'In Consultation' ? '#0d9488' :
                selectedAppointment.status === 'Cancelled' ? '#dc2626' : '#d97706'
              }`,
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              {/* Banner header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                flexWrap: 'wrap', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, display: 'block' }}>
                    Patient Receiving Care
                  </span>
                  <h2 style={{ color: 'white', fontSize: '1.5rem', margin: '0.25rem 0 0.15rem', fontWeight: 700 }}>
                    {selectedAppointment.patientName}
                  </h2>
                  {patient?.name && patient.name.toLowerCase() !== selectedAppointment.patientName.toLowerCase() && (
                    <div style={{ margin: '0.25rem 0' }}>
                      <span style={{ display: 'inline-block', background: 'rgba(20, 184, 166, 0.2)', border: '1px solid rgba(20, 184, 166, 0.4)', color: '#5eead4', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        Booked for Family / Relative · Account Booker: {patient.name}
                      </span>
                    </div>
                  )}
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Phone: {selectedAppointment.patientPhone} · Ref: {selectedAppointment.id}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setActiveSlipModal(selectedAppointment)}
                    className="btn btn-sm btn-secondary" 
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.15)' }}
                    id="view-slip-btn"
                  >
                    <Printer size={14} /> View Token Slip
                  </button>
                  <Link to="/book" className="btn btn-sm" style={{ background: '#14b8a6', color: '#0b1f3a', fontWeight: 700 }}>
                    <CalendarPlus size={14} /> New Booking
                  </Link>
                </div>
              </div>

              {/* Core metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  {
                    label: 'Your Token',
                    value: selectedAppointment.tokenNumber,
                    sub: `Issued for ${selectedAppointment.timeSlot}`,
                    mono: true,
                    teal: true
                  },
                  {
                    label: 'Booking Status',
                    value: selectedAppointment.status,
                    sub: selectedAppointment.doctorName,
                    mono: true,
                    green: true
                  },
                  {
                    label: 'Appointment Date',
                    value: selectedAppointment.date,
                    sub: selectedAppointment.timeSlot,
                    yellow: true
                  },
                  {
                    label: 'Department',
                    value: selectedAppointment.department,
                    sub: selectedAppointment.doctorName,
                    amber: true
                  }
                ].map((metric) => (
                  <div key={metric.label} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', 
                    padding: '1rem 1.125rem' 
                  }}>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: '0.25rem' }}>
                      {metric.label}
                    </span>
                    <div style={{ 
                      fontSize: metric.mono ? '1.75rem' : '1.5rem', 
                      fontWeight: 800, 
                      fontFamily: metric.mono ? 'monospace' : 'inherit',
                      color: metric.teal ? '#14b8a6' : metric.green ? '#34d399' : metric.yellow ? '#fef08a' : '#fed7aa',
                      lineHeight: 1.1,
                      marginBottom: '0.2rem'
                    }}>
                      {metric.value}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{metric.sub}</span>
                  </div>
                ))}
              </div>

              {/* Progress stepper */}
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px', 
                padding: '1.25rem 1.5rem',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live OPD Journey
                </div>
                <div className="progress-steps">
                  {steps.map((step, i) => {
                    const status = getStepStatus(i);
                    return (
                      <div key={step.label} className="progress-step">
                        <div className={`progress-step-circle ${
                          status === 'done' ? 'step-done' : 
                          status === 'active' ? 'step-active' : 'step-pending'
                        }`}>
                          {status === 'done' ? <CheckCircle2 size={16} /> : i + 1}
                        </div>
                        <div className="progress-step-label" style={{ color: status === 'pending' ? '#475569' : '#e2e8f0' }}>
                          <strong style={{ display: 'block', fontSize: '0.8125rem' }}>{step.label}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{step.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Two Column: Details + List ──────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Selected Appointment Details */}
          {selectedAppointment && (
            <div className="med-card">
              <div className="med-card-header">
                <div className="card-title-group">
                  <Stethoscope size={18} color="#0d9488" />
                  <h3>Consultation Information</h3>
                </div>
                <span className={`badge badge-${selectedAppointment.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
                {[
                  { label: 'Assigned Specialist', value: selectedAppointment.doctorName, strong: true },
                  { label: 'Department', value: selectedAppointment.department },
                  { label: 'Date & Time', value: `${selectedAppointment.date} at ${selectedAppointment.timeSlot}`, strong: true },
                  { label: 'Symptoms', value: selectedAppointment.symptoms || 'Routine OPD' },
                  { 
                    label: 'Payment Status', 
                    value: selectedAppointment.paymentStatus === 'PAID'
                      ? 'PAID (Verified)'
                      : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION'
                      ? 'UNDER VERIFICATION'
                      : selectedAppointment.paymentStatus === 'FAILED'
                      ? 'FAILED'
                      : 'PENDING (Unpaid)',
                    isPayment: true,
                    isPaid: selectedAppointment.paymentStatus === 'PAID',
                    isPendingVerification: selectedAppointment.paymentStatus === 'PENDING_VERIFICATION',
                    isFailed: selectedAppointment.paymentStatus === 'FAILED',
                  },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.625rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                    gap: '1rem'
                  }}>
                    <span style={{ color: '#64748b', flexShrink: 0 }}>{row.label}:</span>
                    {row.isPayment ? (
                      <span className={`badge ${
                        row.isPaid ? 'badge-completed'
                        : row.isPendingVerification ? 'badge-active'
                        : row.isFailed ? 'badge-cancelled'
                        : 'badge-waiting'
                      }`}>
                        {row.value}
                      </span>
                    ) : row.strong ? (
                      <strong style={{ color: '#0b1f3a', textAlign: 'right' }}>{row.value}</strong>
                    ) : (
                      <span style={{ color: '#334155', textAlign: 'right' }}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment Box */}
              <div style={{ 
                background: selectedAppointment.paymentStatus === 'PAID' ? '#ecfdf5'
                  : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? '#eff6ff'
                  : '#f0fdfa', 
                border: selectedAppointment.paymentStatus === 'PAID' ? '1px solid #a7f3d0'
                  : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? '1px solid #bfdbfe'
                  : '1px solid #ccfbf1',
                borderRadius: '8px', 
                padding: '0.875rem 1rem', 
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color:
                    selectedAppointment.paymentStatus === 'PAID' ? '#065f46'
                    : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? '#1e40af'
                    : '#0f766e',
                    textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Consultation Fee
                  </span>
                  <strong style={{ fontSize: '0.875rem', color:
                    selectedAppointment.paymentStatus === 'PAID' ? '#047857'
                    : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? '#1d4ed8'
                    : '#0f766e' }}>
                    {selectedAppointment.paymentStatus === 'PAID' ? 'Payment Verified & Confirmed'
                    : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? '⏳ Payment Under Verification'
                    : 'Pending Payment'}
                  </strong>
                </div>
                {selectedAppointment.paymentStatus === 'PAID' ? (
                  <button 
                    onClick={() => handleViewReceipt(selectedAppointment)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    id="view-receipt-btn"
                    disabled={fetchingReceipt}
                  >
                    <Receipt size={14} /> View Receipt
                  </button>
                ) : selectedAppointment.paymentStatus === 'PENDING_VERIFICATION' ? (
                  <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>
                    Reception confirming…
                  </span>
                ) : (
                  <button 
                    onClick={() => setPaymentModalAppointment(selectedAppointment)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    id="pay-consultation-btn"
                  >
                    <CreditCard size={14} /> Pay Fee Now
                  </button>
                )}
              </div>


              {/* Vitals */}
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '8px', 
                padding: '0.875rem', 
                border: '1px solid #f1f5f9',
                marginTop: '1rem'
              }}>
                <strong style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.625rem' }}>
                  Triage Vitals Record
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {[
                    { label: 'Blood Press.', value: selectedAppointment.bp || 'Not recorded' },
                    { label: 'Pulse', value: selectedAppointment.heartRate || 'Not recorded' },
                    { label: 'Temp', value: selectedAppointment.temp || 'Not recorded' },
                  ].map(v => (
                    <div key={v.label} style={{ background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>{v.label}</span>
                      <strong style={{ fontSize: '0.875rem', color: '#0b1f3a' }}>{v.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor notes */}
              {selectedAppointment.notes && (
                <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Physician Notes</strong>
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}

              {/* Cancel */}
              {selectedAppointment.status === 'Waiting' && (
                <button 
                  onClick={() => handleCancel(selectedAppointment.id)} 
                  className="btn btn-danger"
                  style={{ width: '100%', marginTop: '1rem' }}
                  id="cancel-appointment-btn"
                >
                  <XCircle size={15} /> Cancel This Appointment
                </button>
              )}
            </div>
          )}

          <div>
            <input
              type="text"
              placeholder="Search by token, doctor, or department…"
              className="form-control"
              style={{ marginBottom: '0.875rem', fontSize: '0.875rem' }}
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              id="appointment-search"
              aria-label="Search your appointments"
            />

            {[
              { title: 'Upcoming Appointments', records: upcomingAppointments, empty: 'You have no upcoming appointments.' },
              { title: 'Appointment History', records: pastAppointments, empty: 'Your past appointments will appear here.' }
            ].map(section => (
              <section className="med-card" key={section.title} style={{ marginBottom: '1rem' }}>
                <div className="med-card-header">
                  <div className="card-title-group">
                    <Calendar size={18} color="#0d9488" />
                    <h3>{section.title}</h3>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{section.records.length}</span>
                </div>

                {loading ? (
                  <p role="status" style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading appointments...</p>
                ) : section.records.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>{filterQuery ? 'No appointments match your search.' : section.empty}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '480px', overflowY: 'auto' }}>
                    {section.records.map(appointment => {
                      const isSelected = appointment.id === selectedAppointment?.id;
                      return (
                        <div
                          key={appointment.id}
                          onClick={() => setSelectedAppointmentId(appointment.id)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') setSelectedAppointmentId(appointment.id);
                          }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          className={`queue-row${isSelected ? ' selected' : ''}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="token-badge" style={{ fontSize: '0.75rem' }}>{appointment.tokenNumber}</span>
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.875rem', color: '#0b1f3a' }}>
                                {appointment.patientName} · {appointment.date} · {appointment.timeSlot}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                {appointment.doctorName} · {appointment.department}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <span 
                              className={`badge ${
                                appointment.paymentStatus === 'PAID' ? 'badge-completed'
                                : appointment.paymentStatus === 'PENDING_VERIFICATION' ? 'badge-active'
                                : appointment.paymentStatus === 'FAILED' ? 'badge-cancelled'
                                : 'badge-waiting'
                              }`}
                              style={{ fontSize: '0.6875rem', padding: '0.15rem 0.45rem' }}
                            >
                              {appointment.paymentStatus === 'PAID' ? 'Paid'
                                : appointment.paymentStatus === 'PENDING_VERIFICATION' ? 'Verifying'
                                : appointment.paymentStatus === 'FAILED' ? 'Failed'
                                : 'Unpaid'}
                            </span>
                            <span className={`badge badge-${appointment.status.toLowerCase().replace(' ', '-')}`}>
                              {appointment.status}
                            </span>
                            <ChevronRight size={15} color={isSelected ? '#0d9488' : '#94a3b8'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Token Slip Modal */}
      {activeSlipModal && (
        <TokenSlipModal 
          appointment={activeSlipModal} 
          onClose={() => setActiveSlipModal(null)} 
        />
      )}

      {/* Payment Checkout Modal */}
      {paymentModalAppointment && (
        <PaymentModal 
          appointment={paymentModalAppointment}
          onClose={() => setPaymentModalAppointment(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {receiptModalData && (
        <ReceiptModal 
          receipt={receiptModalData}
          onClose={() => setReceiptModalData(null)}
        />
      )}
    </div>
  );
};
