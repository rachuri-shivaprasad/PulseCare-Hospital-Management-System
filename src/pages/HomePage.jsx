import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarPlus, 
  Stethoscope, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  PhoneCall,
  CheckCircle,
  Building2,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';

export const HomePage = () => {
  const { doctors, appointments, activeConsultations, waitingPatients } = useAppointmentQueue();

  const currentServing = activeConsultations[0];

  return (
    <div className="home-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="app-container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '3rem', 
            alignItems: 'center' 
          }}>
            {/* Left: Copy */}
            <div>
              <span className="hero-eyebrow">
                <Activity size={14} /> Smart OPD Queue &amp; Token Management
              </span>

              <h1 className="hero-headline">
                Compassionate Care,<br />
                <span style={{ color: '#14b8a6' }}>Zero Waiting Hassle.</span>
              </h1>

              <p className="hero-sub">
                Experience seamless outpatient healthcare at PulseCare. Book specialist consultations, 
                receive live digital queue tokens, and track your OPD turn in real time.
              </p>

              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                <Link 
                  to="/book" 
                  className="btn btn-lg"
                  style={{ background: '#14b8a6', color: '#0b1f3a', fontWeight: 700 }}
                >
                  <CalendarPlus size={18} /> Book Appointment
                </Link>
                <Link 
                  to="/patient-dashboard" 
                  className="btn btn-lg btn-secondary"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Activity size={18} /> Track Live Token
                </Link>
              </div>

              {/* Stats */}
              <div className="hero-stat-grid">
                <div>
                  <span className="hero-stat-value">98.4%</span>
                  <p className="hero-stat-label">On-Time Consultations</p>
                </div>
                <div>
                  <span className="hero-stat-value">12 Min</span>
                  <p className="hero-stat-label">Avg. Queue Wait Time</p>
                </div>
                <div>
                  <span className="hero-stat-value">30+</span>
                  <p className="hero-stat-label">Senior Medical Specialists</p>
                </div>
              </div>
            </div>

            {/* Right: Live OPD Board */}
            <div>
              <div className="opd-board">
                <div className="opd-board-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="pulse-dot" style={{ background: '#14b8a6' }}></span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Live OPD Board
                    </span>
                  </div>
                  <span style={{ 
                    background: 'rgba(13,148,136,0.18)', 
                    color: '#14b8a6', 
                    border: '1px solid rgba(13,148,136,0.3)',
                    padding: '0.15rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.72rem', 
                    fontWeight: 600 
                  }}>
                    Central Triage
                  </span>
                </div>

                {/* Currently serving */}
                <div className="opd-serving-token">
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    Currently In Consultation
                  </div>
                  <div style={{ fontSize: '2.75rem', fontWeight: 800, color: '#14b8a6', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {currentServing ? currentServing.tokenNumber : 'TK-103'}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    {currentServing 
                      ? `${currentServing.doctorName} · ${currentServing.department}` 
                      : 'Dr. Sarah Jenkins · Cardiology'}
                  </div>
                </div>

                {/* Queue stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div className="opd-stat-mini">
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Waiting in Lobby</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fef08a' }}>
                      {waitingPatients.length} Patients
                    </div>
                  </div>
                  <div className="opd-stat-mini">
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Completed Today</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#6ee7b7' }}>
                      {appointments.filter(a => a.status === 'Completed').length} Consults
                    </div>
                  </div>
                </div>

                {/* Quick portal links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <Link 
                    to="/receptionist" 
                    className="btn"
                    style={{ 
                      background: 'rgba(13,148,136,0.12)', 
                      color: '#a7f3d0', 
                      border: '1px solid rgba(13,148,136,0.25)', 
                      justifyContent: 'space-between',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span><LayoutDashboard size={15} style={{ display: 'inline', marginRight: '0.4rem' }} />Receptionist Queue Desk</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link 
                    to="/doctor-dashboard" 
                    className="btn"
                    style={{ 
                      background: 'rgba(255,255,255,0.06)', 
                      color: '#cbd5e1', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      justifyContent: 'space-between',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span><Stethoscope size={15} style={{ display: 'inline', marginRight: '0.4rem' }} />Doctor Consultation Cabin</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="section-white">
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 3rem' }}>
            <span className="section-eyebrow">How PulseCare Queue Works</span>
            <h2 className="section-title">4 Simple Steps to Frictionless OPD Care</h2>
            <p className="section-subtitle">
              Our transparent, automated token system keeps patients informed and prevents crowded waiting halls.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { num: '01', title: 'Select Doctor & Slot', desc: 'Browse our board-certified specialists, choose your department and preferred appointment time.' },
              { num: '02', title: 'Receive Digital Token', desc: 'Get a unique OPD Token Number instantly, with your assigned cabin and estimated wait time.' },
              { num: '03', title: 'Track Live Position', desc: 'Monitor the live queue from your phone. See exactly how many patients are ahead of you.' },
              { num: '04', title: 'Hassle-Free Consult', desc: "Walk into the doctor's cabin when called. Receive prescription and clinical notes with zero delay." },
            ].map((step) => (
              <div key={step.num} className="step-card">
                <div className="step-number">{step.num}</div>
                <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.5rem', color: '#0b1f3a' }}>{step.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Specialists ──────────────────────────────────────────── */}
      <section className="section-light">
        <div className="app-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-eyebrow">Expert Clinicians</span>
              <h2 className="section-title" style={{ marginBottom: '0.4rem' }}>Our Senior Specialists</h2>
              <p style={{ color: '#64748b', maxWidth: '520px', fontSize: '0.9375rem' }}>
                Compassionate doctors across specialties available for outpatient care.
              </p>
            </div>
            <Link to="/doctors" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              View All Doctors <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {doctors.slice(0, 3).map((doctor) => (
              <div key={doctor.id} className="doctor-card">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                  <img 
                    src={doctor.avatar} 
                    alt={doctor.name} 
                    className="doctor-avatar"
                    style={{ width: '72px', height: '72px' }}
                  />
                  <div>
                    <span className="doctor-dept-tag">{doctor.department}</span>
                    <h3 style={{ fontSize: '1.0625rem', margin: 0, color: '#0b1f3a' }}>{doctor.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.15rem' }}>{doctor.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.3rem' }}>
                      ★ {doctor.rating}
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>({doctor.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.55, flex: 1, marginBottom: '1rem' }}>
                  {doctor.bio}
                </p>

                <div className="doctor-meta-row">
                  <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>Next Available:</span>
                  <strong style={{ color: '#0d9488', fontSize: '0.875rem' }}>{doctor.nextAvailableSlot}</strong>
                </div>

                <Link 
                  to={`/book?doctorId=${doctor.id}`} 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  <CalendarPlus size={15} /> Book with {doctor.name.split(' ')[1]}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emergency Banner ──────────────────────────────────────────────── */}
      <section className="section-white" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="app-container">
          <div style={{ 
            background: '#0b1f3a',
            borderRadius: '12px', 
            padding: '2.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            borderLeft: '5px solid #dc2626'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                <PhoneCall size={14} /> 24×7 Emergency Trauma Unit
              </div>
              <h2 style={{ color: 'white', fontSize: 'clamp(1.35rem, 2.5vw, 1.875rem)', marginBottom: '0.5rem' }}>
                Need Immediate Emergency Assistance?
              </h2>
              <p style={{ color: '#94a3b8', maxWidth: '560px', fontSize: '0.9375rem' }}>
                Our Level-1 trauma response team and critical care ambulances are available round-the-clock.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <a 
                href="tel:108" 
                className="btn btn-lg"
                style={{ background: '#dc2626', color: 'white', fontWeight: 700, fontSize: '1.0625rem', padding: '0.875rem 2rem' }}
              >
                <PhoneCall size={20} /> Dial Emergency: 108
              </a>
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                Instant Dispatch · Ambulance Tracking Active
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
