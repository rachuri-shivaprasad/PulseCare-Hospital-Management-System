import React from 'react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { Activity, Clock, Users, AlertCircle } from 'lucide-react';

export const LiveQueueTicker = () => {
  const { activeConsultations, waitingPatients } = useAppointmentQueue();

  const currentActive = activeConsultations[0];

  return (
    <div className="queue-ticker">
      <div className="app-container ticker-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className="ticker-live-badge">
            <span className="pulse-dot"></span>
            Live OPD
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            Central Triage Display
          </span>
        </div>

        <div className="ticker-items">
          <div className="ticker-stat">
            <Activity size={14} color="#0d9488" />
            <span>Now Serving:</span>
            {currentActive ? (
              <span className="ticker-token-tag">
                {currentActive.tokenNumber} — {currentActive.doctorName.split(' ')[1]}
              </span>
            ) : (
              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>No active consult</span>
            )}
          </div>

          <div className="ticker-stat">
            <Users size={14} color="#d97706" />
            <span>Waiting in OPD:</span>
            <strong style={{ color: '#0b1f3a' }}>{waitingPatients.length} Patients</strong>
          </div>

          <div className="ticker-stat">
            <Clock size={14} color="#059669" />
            <span>Avg. Turnaround:</span>
            <span style={{ color: '#0b1f3a', fontWeight: 600 }}>~12 min / patient</span>
          </div>

          <div className="ticker-stat">
            <AlertCircle size={13} color="#dc2626" />
            <span style={{ color: '#dc2626', fontWeight: 600 }}>24/7 ER Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
