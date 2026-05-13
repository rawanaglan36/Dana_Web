import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api, authStorage } from '../services/api';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // If already logged in with a valid token, redirect to dashboard
  useEffect(() => {
    if (authStorage.isSuperAdminLoggedIn()) {
      navigate('/super-admin', { replace: true });
    }
  }, [navigate]);

  // Load saved email if remember me was checked before
  useEffect(() => {
    const savedEmail = localStorage.getItem('dana_sa_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = t('emailRequired') || 'Email/Phone is required';
    }
    if (!password) {
      newErrors.password = t('passwordRequired') || 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = t('passwordMin') || 'Password too short';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.adminSignIn({ email, password });

      if (rememberMe) {
        localStorage.setItem('dana_sa_remember_email', email.trim());
      } else {
        localStorage.removeItem('dana_sa_remember_email');
      }

      navigate('/super-admin');
    } catch (err) {
      console.error('❌ Login failed:', err);
      setApiError(err.message || 'Login failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="form-header">
        <h1>Super Admin</h1>
        <p>Login to manage the platform</p>
      </div>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email or Username</label>
          <input
            type="text"
            placeholder="superadmin@dana.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'error-input' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'error-input' : ''}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="remember-forgot-row">
          <label className="remember-me-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember Me
          </label>
        </div>

        {apiError && (
          <div className="api-error-banner" style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize: '14px',
            textAlign: 'center',
            width: '100%',
          }}>
            {apiError}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
