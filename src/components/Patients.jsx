import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patients.css';
import PatientDetails from './PatientDetails';
import searchIcon from '../assets/Dana - ضنا_icon/Table/Tags/Icon-1.svg';
import chevronIcon from '../assets/Dana - ضنا_icon/Table/Tags/Icon.svg';
import languageIcon from '../assets/Dana - ضنا_icon/Language Icon.svg';
import notificationIcon from '../assets/Dana - ضنا_icon/Notification Icon.svg';
import badgeIcon from '../assets/Dana - ضنا_icon/Badge.svg';
import trendIcon from '../assets/Dana - ضنا_icon/Icon-2.svg';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';
import { calculateAge, formatAge } from '../utils/ageUtils';

export default function Patients({ setIsSidebarOpen }) {
  const { t, toggleLanguage, language } = useLanguage();
  const { doctorInitial, doctorProfilePic } = useNotifications();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'patient-details'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const [apiData, setApiData] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [bookingsMap, setBookingsMap] = useState({});

  const refreshData = () => {
    setLoadingPatients(true);
    Promise.all([
      api.getPatients().catch(() => null),
      api.getBookings().catch(() => []),
    ]).then(([pData, bData]) => {
      setApiData(pData);
      const bMap = {};
      (Array.isArray(bData) ? bData : []).forEach(b => {
        const cId = b.childId?._id || b.childId || '';
        if (cId) bMap[cId] = { bookingId: b._id, time: b.time || '', date: b.date || '', status: b.status || '' };
      });
      setBookingsMap(bMap);
      setLoadingPatients(false);
    }).catch(() => setLoadingPatients(false));
  };

  useEffect(() => { refreshData(); }, []);

  const patientData = (apiData?.patients ?? []).map(p => {
    const booking = bookingsMap[p.childId] || {};
    return {
      name: p.childName || 'Unknown',
      id: p.childRecordID ? `#${p.childRecordID.slice(-6)}` : (p.childId ? `#${p.childId.slice(-6)}` : '—'),
      age: p.birthDate ? calculateAge(p.birthDate) : (p.age ?? null),
      birthDate: p.birthDate || null,
      lastVisit: p.lastBookingDate || booking.date || '',
      status: p.bookingStatus === 'completed' ? 'Active' : 'Pending',
      _id: p.childRecordID,
      childId: p.childId,
      bookingId: booking.bookingId || '',
      parentId: p.parentId || '',
    };
  });

  const totalPatientsCount = apiData?.totalPatients ?? patientData.length;
  const needsAttentionCount = apiData?.needsAttention?.total ?? patientData.filter(p => p.status === 'Pending').length;
  const activeWeekCount = apiData?.activeThisWeek?.total ?? patientData.filter(p => p.status === 'Active').length;

  return (
    <div className="patients-dashboard">
        <>
          <header className="patients-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="hamburger-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h1>{t('patients')}</h1>
            </div>
            <div className="header-actions">
              <button className="icon-btn-rounded" title="Language Toggle" onClick={toggleLanguage}>
                <img src={languageIcon} alt="Language" width="22" height="22" />
              </button>
              <NotificationBell />
              <div className="avatar" style={{ overflow: 'hidden' }}>
                {doctorProfilePic ? <img src={doctorProfilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : doctorInitial}
              </div>
            </div>
          </header>

          <div className="kpi-cards-row">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
          </div>
          <div className="kpi-stats">
            <h2>{totalPatientsCount.toLocaleString()}</h2>
            <span className="trend positive">+5% <img src={trendIcon} alt="" width="10" height="6" /></span>
          </div>
          <p>{t('totalPatients')}</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-teal-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <div className="kpi-stats">
            <h2>{needsAttentionCount}</h2>
          </div>
          <p>{t('needsAttention')}</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper kpi-teal-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" /></svg>
          </div>
          <div className="kpi-stats">
            <h2>{activeWeekCount}</h2>
            <span className="trend positive">+5% <img src={trendIcon} alt="" width="10" height="6" /></span>
          </div>
          <p>{t('activeThisWeek')}</p>
        </div>
      </div>

      <div className="directory-container">
        <div className="directory-header">
          <h2>{t('patientDirectory')}</h2>
          <p>{t('patientDirectoryDesc')}</p>
        </div>

        <div className="directory-controls">
          <div className="search-box">
            <img src={searchIcon} alt="Search" width="20" height="20" />
            <input
              type="text"
              placeholder={t('findPatient')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="patients-table">
            <thead>
              <tr>
                <th>{t('patient')}</th>
                <th>{t('fileId')}</th>
                <th>{t('age')}</th>
                <th>{t('lastVisit')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingPatients ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #00AEC0', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    {t('loading') || 'Loading...'}
                  </div>
                </td></tr>
              ) : patientData.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '14px' }}>
                  {t('noPatientsFound') || 'No patients found'}
                </td></tr>
              ) : (
              patientData
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm))
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((patient, idx) => (
                  <tr key={idx}>
                    <td className="patient-name">{patient.name}</td>
                    <td className="file-id">{patient.id}</td>
                    <td>{patient.age
                      ? (typeof patient.age === 'object'
                          ? formatAge(patient.age, { yr: t('yr') || 'yr', mo: t('mo') || 'mo' })
                          : `${patient.age} ${t('yr') || 'yr'}`)
                      : '—'}</td>
                    <td>{patient.lastVisit}</td>
                    <td>
                      <span className={`status-badge ${patient.status === 'Active' ? 'status-active' : 'status-overdue'}`}>
                        <span className="status-dot"></span> {patient.status === 'Active' ? t('active') : t('overdue')}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setViewMode('patient-details');
                          }}
                          title="View patient details"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          {[1, 2, 3].map(page => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <span className="page-dots">..</span>
          <button className="page-btn">17</button>
        </div>
      </div>

      {/* Patient Details Overlay */}
      {viewMode === 'patient-details' && selectedPatient && (
        <PatientDetails
          patient={selectedPatient}
          onClose={() => { setSelectedPatient(null); setViewMode('list'); }}
          isFullPage={false}
          hideControls={true}
        />
      )}
      </>

      {toastMsg && <div className="toast-popup">{toastMsg}</div>}
    </div>
  );
}
