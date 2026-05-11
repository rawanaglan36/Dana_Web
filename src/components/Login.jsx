import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const newErrors = {};
    const emailStr = email.trim();
    if (!emailStr) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr) && !/^\+?[0-9]{7,15}$/.test(emailStr)) {
      newErrors.email = t('invalidEmailPhone');
    }

    if (!password) {
      newErrors.password = t('passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('passwordMin');
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
      const result = await api.preSignIn({
        phone: email.trim(), 
        password: password,
      });
      console.log('✅ pre-signIn success:', result);
      // Navigate to OTP and pass the email/phone and password so OTP screen can use them
      navigate('/otp', { state: { phone: email.trim(), password, from: 'login' } });
    } catch (err) {
      console.error('❌ Login failed:', err);
      setApiError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="form-header">
        <h1>{t('welcomeBack')}</h1>
        <p>{t('loginSubtitle')}</p>
      </div>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="text" 
            placeholder={t('emailPlaceholder')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'error-input' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>{t('password')}</label>
          <input 
            type="password" 
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'error-input' : ''}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        <div className="form-actions">
          <label className="remember-me">
            <input type="checkbox" />
            <span>{t('rememberMe')}</span>
          </label>
          <a href="#" className="forgot-password">{t('forgotPassword')}</a>
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
          {isSubmitting ? t('loading') : t('login')}
        </button>
      </form>

      <div className="form-footer">
        <p>{t('notMember')} <a href="#" onClick={(e) => { e.preventDefault(); navigate('/apply'); }}>{t('applyToJoin')}</a></p>
      </div>
    </div>
  );
}
