import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function ApplyToJoin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    phone: '',
    email: '',
    experience: '',
    license: '',
    detectionPrice: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = t('fullNameRequired');
    if (!formData.specialty.trim()) newErrors.specialty = t('specialtyRequired');
    if (!formData.phone.trim()) {
      newErrors.phone = t('phoneRequired');
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = t('invalidPhone');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('invalidEmailPhone');
    }
    if (!formData.experience.trim()) newErrors.experience = t('experienceRequired');
    if (!formData.license.trim()) newErrors.license = t('licenseRequired');
    if (!formData.detectionPrice.trim()) {
      newErrors.detectionPrice = 'Detection price is required';
    } else if (isNaN(formData.detectionPrice) || Number(formData.detectionPrice) <= 0) {
      newErrors.detectionPrice = 'Please enter a valid price';
    }
    if (!selectedFile) newErrors.file = t('uploadRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const doctor = await api.createDoctor({
        doctorName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        specialty: formData.specialty.trim(),
        licenseNumber: formData.license.trim(),
        expirtes: parseInt(formData.experience) || 1,
        detectionPrice: parseInt(formData.detectionPrice) || 0,
        file: selectedFile,
      });

      console.log('✅ Doctor created:', doctor);
      navigate('/done');
    } catch (err) {
      console.error('❌ Signup failed:', err);
      setApiError(err.message || t('signupFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="form-header">
        <h1>{t('becomePartner')}</h1>
        <p>{t('applySubtitle')}</p>
      </div>

      <form className="login-form apply-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group half-width">
            <label>{t('fullName')}</label>
            <input 
              type="text" name="fullName" placeholder={t('fullNamePlaceholder')}
              value={formData.fullName} onChange={handleInputChange}
              className={errors.fullName ? 'error-input' : ''}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
          <div className="form-group half-width">
            <label>Email Address</label>
            <input
              type="email" name="email" placeholder="Enter your email address"
              value={formData.email} onChange={handleInputChange}
              className={errors.email ? 'error-input' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label>{t('medicalSpecialty')}</label>
            <input 
              type="text" name="specialty" placeholder={t('specialtyPlaceholder')}
              value={formData.specialty} onChange={handleInputChange}
              className={errors.specialty ? 'error-input' : ''}
            />
            {errors.specialty && <span className="error-text">{errors.specialty}</span>}
          </div>
          <div className="form-group half-width">
            <label>{t('phoneNumber')}</label>
            <input 
              type="text" name="phone" placeholder={t('phonePlaceholder')}
              value={formData.phone} onChange={handleInputChange}
              className={errors.phone ? 'error-input' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label>{t('yearsOfExperience')}</label>
            <input 
              type="text" name="experience" placeholder={t('experiencePlaceholder')}
              value={formData.experience} onChange={handleInputChange}
              className={errors.experience ? 'error-input' : ''}
            />
            {errors.experience && <span className="error-text">{errors.experience}</span>}
          </div>
          <div className="form-group half-width">
            <label>{t('licenseNumber')}</label>
            <input 
              type="text" name="license" placeholder={t('licensePlaceholder')}
              value={formData.license} onChange={handleInputChange}
              className={errors.license ? 'error-input' : ''}
            />
            {errors.license && <span className="error-text">{errors.license}</span>}
          </div>
        </div>

        <div className="form-group full-width">
          <label>Detection Price (EGP)</label>
          <input 
            type="number" 
            name="detectionPrice" 
            placeholder="Enter consultation price"
            value={formData.detectionPrice} 
            onChange={handleInputChange}
            className={errors.detectionPrice ? 'error-input' : ''}
            min="0"
          />
          {errors.detectionPrice && <span className="error-text">{errors.detectionPrice}</span>}
        </div>

        <div className="form-group full-width dropzone">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className={`dropzone-content ${errors.file ? 'error-border' : ''}`} onClick={triggerUpload}>
            <div className="upload-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#00353E" />
                <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 20H16C17.1046 20 18 19.1046 18 18V10C18 8.89543 17.1046 8 16 8H14.4142C13.8839 8 13.3753 7.78929 13 7.41421L11.5858 6.00001C11.1097 5.52386 10.4632 5.25702 9.79033 5.25702H8C6.89543 5.25702 6 6.15245 6 7.25702V18C6 19.1046 6.89543 20 8 20Z" fill="#00353E" />
                <path d="M8 20H16C17.1046 20 18 19.1046 18 18V10C18 8.89543 17.1046 8 16 8H14.4142C13.8839 8 13.3753 7.78929 13 7.41421L12.5858 7.00001C12.1097 6.52386 11.4632 6.25702 10.7903 6.25702H8C6.89543 6.25702 6 7.15245 6 8.25702V18C6 19.1046 6.89543 20 8 20Z" fill="#005A69" />
                <path d="M12 15L12 9M12 9L10 11M12 9L14 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {selectedFile ? (
              <>
                <h4 style={{ color: '#00AEC0' }}>{t('fileSelected')}</h4>
                <p>{selectedFile.name}</p>
              </>
            ) : (
              <>
                <h4>{t('professionalCredentials')}</h4>
                <p>{t('uploadInstructions')}</p>
              </>
            )}
          </div>
          {errors.file && <span className="error-text">{errors.file}</span>}
        </div>

        {apiError && (
          <div className="api-error-banner" style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center',
            width: '100%',
          }}>
            <p style={{ margin: 0, marginBottom: apiError.toLowerCase().includes('already exist') ? '8px' : '0' }}>{apiError}</p>
            {apiError.toLowerCase().includes('already exist') && (
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#00AEC0', 
                  fontWeight: 'bold', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                {t('login') || 'Login now'}
              </button>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t('loading') : t('submit')}
        </button>
      </form>

      <div className="form-footer">
        <p>{t('alreadyMember') || 'Already a member?'} <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>{t('login')}</a></p>
      </div>
    </div>
  );
}
