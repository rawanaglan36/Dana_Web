import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

// Mask email: show only last few chars before @ and full domain
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 4) {
    return '*'.repeat(local.length) + '@' + domain;
  }
  const visible = local.slice(-4);
  return '*'.repeat(local.length - 4) + visible + '@' + domain;
}

// Mask phone: show only last 4 digits
function maskPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return phone;
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

export default function OTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  // Get phone and password from state (passed from login)
  const phone = location.state?.phone || '';
  const password = location.state?.password || '';
  const fromRoute = location.state?.from || '';

  // Determine if input was email or phone
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phone);
  const maskedIdentifier = isEmail ? maskEmail(phone) : maskPhone(phone);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on Backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      // Focus the next empty input or the last one
      const nextEmpty = newOtp.findIndex(v => !v);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    // Only resend if we have the credentials from login
    if (fromRoute === 'login' && phone && password) {
      try {
        await api.preSignIn({ phone, password });
        showSuccess('OTP resent successfully');
      } catch (err) {
        setError(err.message || 'Failed to resend OTP');
        return;
      }
    }

    setTimer(59);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const showSuccess = (msg) => {
    // Simple way to show temporary success, you could add a toast here
    console.log(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError(t('enterCompleteCode'));
      return;
    }

    // If coming from login, verify the OTP with the API
    if (fromRoute === 'login') {
      if (!phone) {
        setError('Missing phone number. Please login again.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await api.verifySignIn({ phone, otp: code });
        console.log('✅ OTP verified:', result);
        navigate('/dashboard'); // Go straight to dashboard on login
      } catch (err) {
        console.error('❌ OTP verification failed:', err);
        setError(err.message || 'OTP verification failed');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Original apply-to-join flow just goes to done screen
      navigate('/done');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="login-form-container otp-container">
      <div className="form-header">
        <h1>{t('verifyNumber')}</h1>
        <p>
          {isEmail
            ? (t('otpSubtitleEmail') || '').replace('{{email}}', maskedIdentifier)
              || `A verification code has been sent to your Email ending in ${maskedIdentifier}. Enter it below to confirm your identity.`
            : (t('otpSubtitlePhone') || '').replace('{{phone}}', maskedIdentifier)
              || `A verification code has been sent to your Phone number ending in ${maskedIdentifier}. Enter it below to confirm your identity.`
          }
        </p>
      </div>

      <form className="otp-form" onSubmit={handleSubmit}>
        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-${index}`}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`otp-input ${digit ? 'otp-input-filled' : ''} ${error ? 'otp-input-error' : ''}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && <span className="error-text otp-error">{error}</span>}

        <div className="otp-timer">
          {canResend ? (
            <p>{t('didntReceive')} <button type="button" className="otp-resend-btn" onClick={handleResend}>{t('resendCode')}</button></p>
          ) : (
            <p>{t('resendCodeIn')} <strong>{formatTime(timer)}</strong></p>
          )}
        </div>

        <button type="submit" className="btn-primary otp-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? t('loading') || 'Loading...' : t('submit')}
        </button>
      </form>

      <div className="otp-footer">
        <p>
          {isEmail
            ? (t('wrongUsername') || 'Wrong Username?')
            : (t('wrongNumber') || 'Wrong number?')
          }
          {' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate(fromRoute === 'login' ? '/' : '/apply'); }}>
            {isEmail
              ? (t('changeEmail') || 'Change Email')
              : (t('changePhone') || 'Change Phone Number')
            }
          </a>
        </p>
      </div>
    </div>
  );
}
