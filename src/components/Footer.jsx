import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Phone, Mail, MapPin, ShieldCheck, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="app-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.875rem' }}>
              <div style={{ 
                width: '34px', 
                height: '34px', 
                background: '#0d9488',
                borderRadius: '7px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                <HeartPulse size={20} />
              </div>
              <span style={{ color: 'white', fontSize: '1.1875rem', fontWeight: 700 }}>PulseCare Health</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1rem' }}>
              Next-generation hospital appointment and automated outpatient queue management system. 
              Designed to minimize waiting-room friction and optimize clinical workflows.
            </p>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#0d9488', fontSize: '0.8125rem' }}>
              <ShieldCheck size={15} /> JCI &amp; NABH Healthcare Accredited
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Access</h4>
            <ul className="footer-links">
              <li><Link to="/">Home Overview</Link></li>
              <li><Link to="/doctors">Find a Doctor</Link></li>
              <li><Link to="/book">Book OPD Appointment</Link></li>
              <li><Link to="/patient-dashboard">Patient Token Tracker</Link></li>
              <li><Link to="/receptionist">Reception Desk</Link></li>
              <li><Link to="/doctor-dashboard">Doctor Cabin</Link></li>
            </ul>
          </div>

          {/* Departments */}
          <div className="footer-col">
            <h4>Clinical Specialties</h4>
            <ul className="footer-links">
              <li><Link to="/doctors">Cardiology &amp; Heart Center</Link></li>
              <li><Link to="/doctors">Neurology &amp; Brain Sciences</Link></li>
              <li><Link to="/doctors">Pediatrics &amp; Child Care</Link></li>
              <li><Link to="/doctors">Orthopedics &amp; Joint Clinic</Link></li>
              <li><Link to="/doctors">Dermatology &amp; Skin Clinic</Link></li>
              <li><Link to="/doctors">General Internal Medicine</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Hospital Helpline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={15} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#64748b' }}>Medical Enclave, Sector 4, Metro Hospital Road</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="#0d9488" style={{ flexShrink: 0 }} />
                <span style={{ color: '#64748b' }}>Emergency: 108 / +1 (800) 555-0199</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} color="#0d9488" style={{ flexShrink: 0 }} />
                <span style={{ color: '#64748b' }}>appointments@pulsecare-health.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} color="#0d9488" style={{ flexShrink: 0 }} />
                <span style={{ color: '#64748b' }}>OPD: 08:00 AM – 08:00 PM (Mon–Sat)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PulseCare Medical Center. Hospital Appointment &amp; Queue Management System.</span>
          <span>College Project Demo · Built with React &amp; Vite</span>
        </div>
      </div>
    </footer>
  );
};
