import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Volume2, 
  UserPlus, 
  Filter, 
  Search, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Printer,
  XCircle,
  X,
  Stethoscope,
  ArrowRight,
  Activity,
  SkipForward,
  Check,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { TokenSlipModal } from '../components/TokenSlipModal';
import { ManualPaymentVerificationModal } from '../components/ManualPaymentVerificationModal';
import { hospitalDepartments } from '../data/mockDoctors';


export const ReceptionistDashboardPage = () => {
  const { 
    appointments, 
    doctors, 
    waitingPatients, 
    activeConsultations, 
    completedPatients, 
    skippedPatients,
    cancelledPatients,
    callNextPatient, 
    cancelAppointment,
    skipPatient,
    completeConsultation,
    registerWalkIn,
    refreshAppointments,
    announcement 
  } = useAppointmentQueue();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("All");

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [activeSlipModal, setActiveSlipModal] = useState(null);
  const [paymentVerifyModal, setPaymentVerifyModal] = useState(null); // appointment to manually verify


  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'Male',
    doctorId: doctors[0]?.id || '',
    date: todayStr,
    symptoms: 'Walk-In OPD Triage'
  });

  const handleCallNext = () => {
    const docId = selectedDoctorFilter === "All" ? null : selectedDoctorFilter;
    callNextPatient(docId);
  };

  const handleCallSpecificPatient = (apt) => {
    callNextPatient(apt.doctorId);
  };

  const handleWalkInSubmit = (e) => {
    e.preventDefault();
    if (!walkInForm.patientName || !walkInForm.patientPhone) {
      alert("Please provide patient name and phone number");
      return;
    }

    const newApt = registerWalkIn(walkInForm);
    setShowWalkInModal(false);
    setActiveSlipModal(newApt);
    setWalkInForm({
      patientName: '',
      patientPhone: '',
      patientAge: '',
      patientGender: 'Male',
      doctorId: doctors[0]?.id || '',
      date: todayStr,
      symptoms: 'Walk-In OPD Triage'
    });
  };

  const handlePaymentVerified = (receipt) => {
    // Refresh appointments list to reflect updated payment status
    if (refreshAppointments) refreshAppointments().catch(() => {});
    setPaymentVerifyModal(null);
  };


  // Filter and order appointments
  const filteredQueue = appointments
    .filter(apt => {
      const matchesDate = !selectedDate || apt.date === selectedDate;
      const matchesDept = selectedDept === "All" || apt.department.toLowerCase() === selectedDept.toLowerCase();
      const matchesStatus = selectedStatus === "All" || apt.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDoctor = selectedDoctorFilter === "All" || apt.doctorId === selectedDoctorFilter;
      const matchesSearch = 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDate && matchesDept && matchesStatus && matchesDoctor && matchesSearch;
    })
    .sort((a, b) => {
      // Order: Waiting first by tokenSequence, then In Consultation, then Completed/Skipped/Cancelled
      const statusWeight = {
        'In Consultation': 1,
        'Waiting': 2,
        'Completed': 3,
        'Skipped': 4,
        'Cancelled': 5
      };
      const diff = (statusWeight[a.status] || 9) - (statusWeight[b.status] || 9);
      if (diff !== 0) return diff;
      return (a.tokenSequence || 0) - (b.tokenSequence || 0);
    });

  // Selected Date calculations for real-world Reception KPIs
  const dateAppointments = appointments.filter(a => !selectedDate || a.date === selectedDate);
  const dateWaiting = dateAppointments.filter(a => a.status === 'Waiting');
  const dateActive = dateAppointments.filter(a => a.status === 'In Consultation');
  const dateCompleted = dateAppointments.filter(a => a.status === 'Completed');
  const dateCancelled = dateAppointments.filter(a => a.status === 'Cancelled');
  const uniquePatientsCount = new Set(
    dateAppointments.map(a => (a.patientPhone || a.patientName || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-eyebrow">
            <LayoutDashboard size={14} /> Central Hospital Reception
          </div>
          <h1>Receptionist Queue Management Desk</h1>
          <p>
            Manage outpatient queues, dispatch calling announcements, register walk-in patients, and update real-time consultation statuses.
          </p>
        </div>
      </div>

      <div className="app-container">
        {/* KPI Stats Row for Selected Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Bookings',    value: dateAppointments.length, icon: <Users size={20} />, bg: '#f0fdfa', color: '#0d9488' },
            { label: 'Waiting Patients',  value: dateWaiting.length,      icon: <Clock size={20} />, bg: '#fef3c7', color: '#d97706' },
            { label: 'In Consultation',   value: dateActive.length,       icon: <Activity size={20} />, bg: '#dbeafe', color: '#0369a1' },
            { label: 'Completed',         value: dateCompleted.length,    icon: <CheckCircle2 size={20} />, bg: '#d1fae5', color: '#059669' },
            { label: 'Cancelled',         value: dateCancelled.length,    icon: <XCircle size={20} />, bg: '#fee2e2', color: '#dc2626' },
            { label: 'Unique Patients',   value: uniquePatientsCount,     icon: <Users size={20} />, bg: '#f5f3ff', color: '#7c3aed' },
          ].map(stat => (
            <div key={stat.label} className="stat-box">
              <div className="stat-box-icon" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-box-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-box-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CURRENT IN-CONSULTATION BANNER (Showing Current Patient per Doctor) */}
        {activeConsultations.length > 0 && (
          <div className="med-card" style={{ marginBottom: '2rem', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Activity size={17} color="#0d9488" />
              <h3 style={{ fontSize: '1rem', margin: 0, color: '#0b1f3a' }}>Active Consultations — Currently In Cabins</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
              {activeConsultations.map(active => (
                <div key={active.id} style={{ background: 'white', borderRadius: '8px', padding: '0.875rem 1rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="token-badge">{active.tokenNumber}</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0b1f3a' }}>{active.patientName}</strong>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                      {active.doctorName} · {active.department}
                    </span>
                  </div>
                  <button 
                    onClick={() => completeConsultation(active.id)}
                    className="btn btn-sm btn-success"
                  >
                    <Check size={13} /> Mark Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Dispatcher Action Panel */}
        <div style={{ 
          background: '#0b1f3a', 
          border: '1px solid #1e3a5f',
          borderLeft: '5px solid #0d9488',
          borderRadius: '12px', 
          padding: '1.5rem 1.75rem', 
          color: 'white', 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#14b8a6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              <Volume2 size={14} /> Public Address &amp; Triage Dispatch
            </div>
            <h2 style={{ color: 'white', fontSize: '1.375rem', margin: '0 0 0.25rem', fontWeight: 700 }}>
              OPD Token Queue Dispatcher
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              {waitingPatients.length > 0 
                ? `Next: Token ${waitingPatients[0].tokenNumber} · ${waitingPatients[0].patientName} — ${waitingPatients[0].doctorName}` 
                : 'No patients currently waiting in the OPD queue.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="form-control"
              style={{ maxWidth: '190px', fontSize: '0.875rem', background: '#fff', color: '#0b1f3a' }}
              id="doctor-filter-select"
            >
              <option value="All">Any Free Doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <button 
              onClick={handleCallNext}
              className="btn btn-lg"
              style={{ background: '#059669', color: 'white', fontWeight: 700 }}
              id="call-next-btn"
            >
              <Volume2 size={18} /> Call Next Patient
            </button>

            <button 
              onClick={() => setShowWalkInModal(true)}
              className="btn btn-secondary btn-lg"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.15)', fontWeight: 600 }}
              id="walkin-register-btn"
            >
              <UserPlus size={16} /> Register Walk-In
            </button>
          </div>
        </div>

        {/* Live Calling Alert Toast (if announced recently) */}
        {announcement && (
          <div className={`alert ${announcement.type === 'call' ? 'alert-success' : announcement.type === 'warning' ? 'alert-warning' : 'alert-info'}`} style={{ marginBottom: '1.5rem' }}>
            <Volume2 size={17} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>{announcement.message}</strong>
              <span style={{ fontSize: '0.78rem', color: 'inherit', opacity: 0.7, marginLeft: '0.75rem' }}>Live Dispatch</span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="med-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search patient, token, doctor…"
                className="form-control"
                style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="receptionist-search"
              />
            </div>

            <input
              type="date"
              className="form-control"
              style={{ fontSize: '0.875rem' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Filter by date"
              id="filter-date"
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.875rem' }}
              id="filter-dept"
            >
              {hospitalDepartments.map(d => (
                <option key={d} value={d}>Dept: {d}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.875rem' }}
              id="filter-status"
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Skipped">Skipped</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { setSelectedDate(""); setSelectedDept("All"); setSelectedStatus("All"); setSearchQuery(""); setSelectedDoctorFilter("All"); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
                id="clear-filters-btn"
              >
                Clear
              </button>

              <button 
                onClick={() => refreshAppointments && refreshAppointments()}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', gap: '0.35rem' }}
                title="Refresh latest queue from central server"
                id="refresh-queue-btn"
              >
                <RotateCcw size={14} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Waiting Queue Table */}
        <div className="med-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>OPD Patient Queue Table</h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Ordered by token sequence. Total matching: {filteredQueue.length} records {selectedDate ? `for ${selectedDate}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-waiting">Waiting ({dateWaiting.length})</span>
              <span className="badge badge-active">In Cabin ({dateActive.length})</span>
              <span className="badge badge-completed">Completed ({dateCompleted.length})</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="med-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Patient Details</th>
                  <th>Department</th>
                  <th>Assigned Doctor</th>
                  <th>Date & Time</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Queue Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      No appointment records found for the selected date and filters.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((apt) => (
                    <tr key={apt.id}>
                      <td>
                        <span className="token-badge">
                          {apt.tokenNumber}
                        </span>
                      </td>
                      <td>
                        <strong>{apt.patientName}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {apt.patientAge}y, {apt.patientGender} • {apt.patientPhone}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                          {apt.department}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.875rem', color: '#0d9488' }}>
                          {apt.doctorName}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                          {apt.date} • {apt.timeSlot}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const ps = apt.paymentStatus || 'PENDING';
                          const badgeClass = ps === 'PAID' ? 'badge-completed'
                            : ps === 'PENDING_VERIFICATION' ? 'badge-active'
                            : ps === 'FAILED' ? 'badge-cancelled'
                            : 'badge-waiting';
                          const label = ps === 'PAID' ? 'Paid'
                            : ps === 'PENDING_VERIFICATION' ? 'Verify'
                            : ps === 'FAILED' ? 'Failed'
                            : 'Pending';
                          return (
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem' }}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>

                      <td>
                        <span className={`badge badge-${apt.status.toLowerCase().replace(' ', '-')}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {/* Call button if waiting */}
                          {apt.status === 'Waiting' && (
                            <button
                              onClick={() => handleCallSpecificPatient(apt)}
                              className="btn btn-sm btn-primary"
                              title="Call this patient into cabin"
                            >
                              <Volume2 size={13} /> Call
                            </button>
                          )}

                          {/* Complete button if in consultation */}
                          {apt.status === 'In Consultation' && (
                            <button
                              onClick={() => completeConsultation(apt.id)}
                              className="btn btn-sm btn-success"
                              title="Mark consultation completed"
                            >
                              <Check size={13} /> Complete
                            </button>
                          )}

                          {/* Skip button if waiting or in consultation */}
                          {(apt.status === 'Waiting' || apt.status === 'In Consultation') && (
                            <button
                              onClick={() => skipPatient(apt.id)}
                              className="btn btn-sm btn-secondary"
                              title="Mark as skipped (patient absent)"
                              style={{ color: '#64748b' }}
                            >
                              <SkipForward size={13} /> Skip
                            </button>
                          )}

                          {/* Print token slip */}
                          <button
                            onClick={() => setActiveSlipModal(apt)}
                            className="btn btn-sm btn-secondary"
                            title="Print or view token slip"
                          >
                            <Printer size={13} />
                          </button>

                          {/* Verify payment if pending verification */}
                          {(apt.paymentStatus === 'PENDING_VERIFICATION' || apt.paymentStatus === 'PENDING') && (
                            <button
                              onClick={() => setPaymentVerifyModal(apt)}
                              className="btn btn-sm"
                              style={{
                                background: apt.paymentStatus === 'PENDING_VERIFICATION' ? '#0369a1' : '#64748b',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                              title={apt.paymentStatus === 'PENDING_VERIFICATION' ? 'Verify payment claim from patient' : 'Manually verify payment'}
                            >
                              ₹ Verify
                            </button>
                          )}

                          {/* Cancel if waiting */}
                          {apt.status === 'Waiting' && (
                            <button
                              onClick={() => cancelAppointment(apt.id)}
                              className="btn btn-sm btn-danger"
                              title="Cancel appointment"
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Walk-In Registration Modal */}
      {showWalkInModal && (
        <div className="modal-overlay" onClick={() => setShowWalkInModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <UserPlus size={18} />
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Register Walk-In Patient</h3>
              </div>
              <button onClick={() => setShowWalkInModal(false)} style={{ color: '#64748b', lineHeight: 0 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="modal-body" id="walkin-form">
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Mary Higgins"
                  value={walkInForm.patientName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patientName: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="+1 (555) 999-8877"
                    value={walkInForm.patientPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientPhone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    className="form-control"
                    placeholder="45"
                    value={walkInForm.patientAge}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientAge: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={walkInForm.patientGender}
                    onChange={(e) => setWalkInForm({ ...walkInForm, patientGender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Doctor & Department *</label>
                <select
                  className="form-control"
                  value={walkInForm.doctorId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, doctorId: e.target.value })}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.department} ({d.roomNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Triage Symptoms / Chief Complaint</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Acute stomach pain, sprained ankle"
                  value={walkInForm.symptoms}
                  onChange={(e) => setWalkInForm({ ...walkInForm, symptoms: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowWalkInModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={16} /> Issue Instant Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip modal */}
      {activeSlipModal && (
        <TokenSlipModal
          appointment={activeSlipModal}
          onClose={() => setActiveSlipModal(null)}
        />
      )}

      {/* Manual Payment Verification Modal (staff only) */}
      {paymentVerifyModal && (
        <ManualPaymentVerificationModal
          appointment={paymentVerifyModal}
          onClose={() => setPaymentVerifyModal(null)}
          onVerified={handlePaymentVerified}
        />
      )}
    </div>
  );
};
