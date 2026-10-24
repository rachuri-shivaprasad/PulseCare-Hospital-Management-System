import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, HeartPulse, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const isRegistration = location.pathname === '/register';
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = event => {
    setFormData(current => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (isRegistration && formData.password !== formData.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (isRegistration) {
        await register({ name: formData.name.trim(), phone: formData.phone.trim(), password: formData.password });
      }
      await login({ phone: formData.phone.trim(), password: formData.password });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || (isRegistration
        ? 'Account registration failed. Check your details and try again.'
        : 'Sign-in failed. Check your phone number and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-eyebrow"><HeartPulse size={14} /> Patient Account</div>
          <h1>{isRegistration ? 'Create your PulseCare account' : 'Sign in to PulseCare'}</h1>
          <p>{isRegistration ? 'Register with your phone number to access your patient portal.' : 'Access your appointments and patient portal.'}</p>
        </div>
      </div>

      <div className="app-container" style={{ maxWidth: '560px', paddingBottom: '3rem' }}>
        <div className="med-card" style={{ padding: '2rem' }}>
          <div className="card-title-group" style={{ marginBottom: '1.5rem' }}>
            {isRegistration ? <UserPlus size={20} color="#0d9488" /> : <LockKeyhole size={20} color="#0d9488" />}
            <h2 style={{ margin: 0 }}>{isRegistration ? 'Patient registration' : 'Patient login'}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistration && (
              <div className="form-group">
                <label className="form-label" htmlFor="account-name">Full name</label>
                <input id="account-name" name="name" autoComplete="name" className="form-control" maxLength={120} required value={formData.name} onChange={updateField} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="account-phone">Phone number</label>
              <input id="account-phone" name="phone" type="tel" autoComplete="tel" className="form-control" required value={formData.phone} onChange={updateField} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="account-password">Password</label>
              <input id="account-password" name="password" type="password" autoComplete={isRegistration ? 'new-password' : 'current-password'} className="form-control" minLength={12} maxLength={72} required value={formData.password} onChange={updateField} />
              {isRegistration && <div className="form-hint">Use at least 12 characters.</div>}
            </div>
            {isRegistration && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm password</label>
                <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" className="form-control" minLength={12} maxLength={72} required value={formData.confirmPassword} onChange={updateField} />
              </div>
            )}
            {error && <div className="form-error" role="alert"><AlertCircle size={14} /> {error}</div>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ width: '100%', marginTop: '0.75rem' }}>
              {isRegistration ? <UserPlus size={17} /> : <LogIn size={17} />}
              {submitting ? 'Please wait...' : isRegistration ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p style={{ margin: '1.25rem 0 0', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            {isRegistration ? 'Already registered? ' : 'New to PulseCare? '}
            <Link to={isRegistration ? '/login' : '/register'}>
              {isRegistration ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};