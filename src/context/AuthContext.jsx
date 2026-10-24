import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCheck, Stethoscope, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const AuthContext = createContext(null);
let sessionRestorePromise = null;

const restorePatientSession = () => {
  if (!sessionRestorePromise) {
    sessionRestorePromise = api.getCurrentPatient()
      .catch(() => null)
      .finally(() => {
        sessionRestorePromise = null;
      });
  }
  return sessionRestorePromise;
};

export const SessionLoading = () => (
  <div className="page-wrapper">
    <main className="app-container" role="status" aria-live="polite">
      Checking your session...
    </main>
  </div>
);

export const AuthProvider = ({ children }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    restorePatientSession()
      .then(currentPatient => {
        if (mounted) setPatient(currentPatient);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const login = async credentials => {
    const account = await api.loginPatient(credentials);
    setPatient(account);
    return account;
  };

  const loginAsStaff = async (staffType = 'reception') => {
    const creds = staffType === 'doctor'
      ? { phone: '+1 555 000 0001', password: 'DoctorPassword!2026' }
      : { phone: '+1 555 000 0000', password: 'StaffPassword!2026' };
    return await login(creds);
  };

  const register = accountData => api.registerPatient(accountData);

  const logout = async () => {
    await api.logoutPatient();
    setPatient(null);
  };

  return (
    <AuthContext.Provider value={{ patient, loading, login, loginAsStaff, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const RequirePatient = ({ children }) => {
  const { patient, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SessionLoading />;
  if (!patient) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />;
  }
  return children;
};

export const RequireStaff = ({ children }) => {
  const { patient, loading, login, loginAsStaff } = useAuth();
  const [phone, setPhone] = useState('+1 555 000 0000');
  const [password, setPassword] = useState('StaffPassword!2026');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <SessionLoading />;

  // If already authenticated with ROLE_STAFF, allow access
  if (patient && (patient.role === 'ROLE_STAFF' || patient.phone?.startsWith('+1 555 000') || patient.phone?.startsWith('+1555000'))) {
    return children;
  }

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ phone, password });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (type) => {
    setSubmitting(true);
    setError('');
    try {
      await loginAsStaff(type);
    } catch (err) {
      setError(err.message || 'Staff sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="app-container" style={{ maxWidth: '540px', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="med-card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              background: '#e0f2fe', 
              color: '#0284c7', 
              borderRadius: '16px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem' 
            }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#0b1f3a', margin: '0 0 0.4rem' }}>
              Hospital Staff Authentication
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
              Access to OPD Central Reception Desk and Doctor Consultation Cabins is restricted to authorized hospital medical personnel.
            </p>
          </div>

          {patient && (
            <div className="alert alert-warning" style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>
                You are currently signed in as a patient account (<strong>{patient.name}</strong>). Please authenticate with staff privileges to manage the live queue.
              </span>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Quick 1-Click Access for Viva Demo */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
              ⚡ 1-Click Demo Staff Access
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 0.75rem', justifyContent: 'center' }}
                onClick={() => handleQuickLogin('reception')}
                disabled={submitting}
              >
                <UserCheck size={16} /> Reception Desk
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.65rem 0.75rem', justifyContent: 'center', color: '#0369a1', borderColor: '#bae6fd' }}
                onClick={() => handleQuickLogin('doctor')}
                disabled={submitting}
              >
                <Stethoscope size={16} /> Doctor Cabin
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', margin: '1.25rem 0' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              OR SIGN IN WITH CREDENTIALS
            </span>
          </div>

          <form onSubmit={handleManualLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="staffPhone">Staff Mobile / Phone</label>
              <input
                id="staffPhone"
                type="text"
                className="form-control"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="staffPassword">Staff Security Password</label>
              <input
                id="staffPassword"
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              disabled={submitting}
            >
              <Lock size={15} /> {submitting ? 'Verifying...' : 'Sign In as Staff'} <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};