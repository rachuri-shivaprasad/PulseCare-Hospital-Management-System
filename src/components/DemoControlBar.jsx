import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  UserRound, 
  LayoutDashboard, 
  Stethoscope, 
  RotateCcw, 
  Sparkles, 
  Info,
  CalendarPlus,
  Home
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';

export const DemoControlBar = () => {
  const { resetDemoData, appointments, waitingPatients, activeConsultations } = useAppointmentQueue();

  const handleReset = (e) => {
    e.preventDefault();
    if (window.confirm("Reload initial sample demo appointments and reset the OPD queue?")) {
      resetDemoData();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #07172c 0%, #0f2744 50%, #07172c 100%)',
      color: '#e2e8f0',
      borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
      fontSize: '0.82rem',
      padding: '0.5rem 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div className="app-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Left: Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ 
            background: 'rgba(56, 189, 248, 0.2)', 
            color: '#38bdf8', 
            fontWeight: 700, 
            padding: '0.2rem 0.6rem', 
            borderRadius: '4px',
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            Demo Switcher
          </span>

          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Role Views:</span>

          <NavLink 
            to="/patient-dashboard" 
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: isActive ? '#0284c7' : 'rgba(255,255,255,0.08)',
              color: isActive ? 'white' : '#cbd5e1',
              border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)'
            })}
          >
            <UserRound size={13} /> Patient View
          </NavLink>

          <NavLink 
            to="/receptionist" 
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: isActive ? '#0284c7' : 'rgba(255,255,255,0.08)',
              color: isActive ? 'white' : '#cbd5e1',
              border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)'
            })}
          >
            <LayoutDashboard size={13} /> Receptionist View
          </NavLink>

          <NavLink 
            to="/doctor-dashboard" 
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: isActive ? '#0284c7' : 'rgba(255,255,255,0.08)',
              color: isActive ? 'white' : '#cbd5e1',
              border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)'
            })}
          >
            <Stethoscope size={13} /> Doctor View
          </NavLink>
        </div>

        {/* Right: Reset Action & Disclaimer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.76rem' }}>
            <Info size={13} color="#38bdf8" />
            <span>Local demo storage (localStorage) — No external database</span>
          </div>

          <button
            onClick={handleReset}
            className="btn btn-sm"
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              gap: '0.35rem'
            }}
            title="Reload fictional sample appointments and reset the OPD queue"
          >
            <RotateCcw size={12} /> Reload Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
