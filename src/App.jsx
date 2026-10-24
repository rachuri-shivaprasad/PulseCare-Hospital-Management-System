import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppointmentQueueProvider, useAppointmentQueue } from './context/AppointmentQueueContext';
import { Navbar } from './components/Navbar';
import { LiveQueueTicker } from './components/LiveQueueTicker';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DoctorsPage } from './pages/DoctorsPage';
import { BookingPage } from './pages/BookingPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { ReceptionistDashboardPage } from './pages/ReceptionistDashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { AuthProvider, RequirePatient, RequireStaff, SessionLoading, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Volume2, X } from 'lucide-react';

const GlobalToast = () => {
  const { announcement, setAnnouncement } = useAppointmentQueue();

  if (!announcement) return null;

  return (
    <div className={`global-toast-banner ${announcement.type || ''}`}>
      <Volume2 size={24} color={announcement.type === 'call' ? '#10b981' : '#0284c7'} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>
          {announcement.type === 'call' ? 'OPD Queue Announcement' : 'Notification'}
        </strong>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#475569' }}>
          {announcement.message}
        </p>
      </div>
      <button 
        onClick={() => setAnnouncement(null)}
        style={{ color: '#94a3b8', padding: '0.2rem', cursor: 'pointer' }}
        aria-label="Dismiss toast"
      >
        <X size={18} />
      </button>
    </div>
  );
};

const AppRoutes = () => {
  const { patient, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (loading) return <SessionLoading />;
  if (isAuthPage) return patient ? <Navigate to="/" replace /> : <AuthPage />;

  return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <LiveQueueTicker />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={patient ? <HomePage /> : <Navigate to="/login" replace />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/login" element={patient ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/register" element={patient ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/patient-dashboard" element={<RequirePatient><PatientDashboardPage /></RequirePatient>} />
            <Route path="/receptionist" element={<RequireStaff><ReceptionistDashboardPage /></RequireStaff>} />
            <Route path="/doctor-dashboard" element={<RequireStaff><DoctorDashboardPage /></RequireStaff>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <GlobalToast />
        <Footer />
      </div>
  );
};

export const App = () => (
  <AppointmentQueueProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </AppointmentQueueProvider>
);

export default App;
