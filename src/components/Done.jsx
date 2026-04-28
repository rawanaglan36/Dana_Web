import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Done() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <div className="done-container">
      <div className="done-icon-wrapper">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18.9" y="11.4" width="23.4" height="19.2" rx="4.8" fill="#4B9A6F" />
          <rect x="7" y="18" width="24" height="20" rx="6" fill="#4ADE80" stroke="#FFFFFF" strokeWidth="3" />
          <path d="M14 28L18 32L25 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2>{t('applicationSubmitted')}</h2>
      <p>{t('doneMessage')}</p>
      <button type="button" className="btn-primary done-btn" onClick={() => navigate('/')}>{t('done')}</button>
    </div>
  );
}
