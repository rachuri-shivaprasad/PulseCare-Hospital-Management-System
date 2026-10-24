import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Building2, 
  CalendarPlus, 
  UserRound, 
  LayoutDashboard, 
  Stethoscope, 
  PhoneCall, 
  RotateCcw,
  Menu,
  X,
  HeartPulse
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resetDemoData } = useAppointmentQueue();
  const { patient, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (window.confirm("Reset all appointment & queue data to initial demo state?")) {
      resetDemoData();
    }
  };

  return (
    <header className="main-navbar">
      {/* Top micro bar */}
      <div className="navbar-top-bar">
        <div className="app-container top-bar-content">
          <div className="top-bar-left">
            <span className="emergency-pill">
              <PhoneCall size={11} />
              EMERGENCY: 108
            </span>
            <span>Accredited Tertiary Hospital&nbsp;·&nbsp;OPD Hours: 8:00 AM – 8:00 PM</span>
          </div>
          <div className="top-bar-right">
            <button 
              onClick={handleReset}
              title="Reset queue and appointments to initial demo data"
              style={{ 
                color: '#64748b', 
                fontSize: '0.78rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                cursor: 'pointer' 
              }}
            >
              <RotateCcw size={11} /> Reset Demo Data
            </button>
            <span>Central Hospital Plaza, Medical City</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="app-container">
        <div className="nav-inner">
          {/* Logo / Brand */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">
              <HeartPulse size={22} strokeWidth={2.2} />
            </div>
            <div className="brand-title">
              PulseCare
              <span className="brand-subtitle">Hospital &amp; Queue Care</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ position: 'relative' }}>
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              end
            >
              <Building2 size={15} /> Home
            </NavLink>

            <NavLink 
              to="/doctors" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Stethoscope size={15} /> Doctors
            </NavLink>

            <NavLink 
              to="/patient-dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <UserRound size={15} /> Patient Portal
            </NavLink>

            <NavLink 
              to="/receptionist" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard size={15} /> Reception Desk
            </NavLink>

            <NavLink 
              to="/doctor-dashboard" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Stethoscope size={15} /> Doctor Cabin
            </NavLink>

            <NavLink 
              to="/book" 
              className="btn nav-cta-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <CalendarPlus size={15} /> Book Appointment
            </NavLink>

            {patient ? (
              <button className="btn btn-secondary" onClick={handleLogout} type="button">Sign out</button>
            ) : (
              <NavLink to="/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </NavLink>
            )}
          </nav>

          {/* Mobile hamburger toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
};
