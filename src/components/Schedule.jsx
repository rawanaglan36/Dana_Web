import { useState, useEffect } from 'react';
import './Schedule.css';
import PatientDetails from './PatientDetails';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

import languageIcon from '../assets/Dana - ضنا_icon/Language Icon.svg';
import notificationIcon from '../assets/Dana - ضنا_icon/Notification Icon.svg';
import badgeIcon from '../assets/Dana - ضنا_icon/Badge.svg';
import avatarImg from '../assets/Dana - ضنا_img/source/image.png';
import chevronIcon from '../assets/Dana - ضنا_icon/Table/Tags/Icon.svg';
import emptyStateImg from '../assets/Dana - ضنا_img/_Empty state item.png';
import arrowNavIcon from '../assets/Dana - ضنا_icon/vuesax copy 2/outline/arrow-down.svg';

export default function Schedule({ setIsSidebarOpen }) {
  const { t, toggleLanguage } = useLanguage();
  const [apiData, setApiData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    api.getPatients()
      .then(data => { setApiData(data); setLoadingSchedule(false); })
      .catch(() => setLoadingSchedule(false));
  }, []);

  const appointments = (apiData?.patients ?? []).filter(p => p.childRecordID).map((p) => ({
    id: p.childRecordID,
    name: p.childName || p.name || 'Unknown',
    age: p.age ?? '',
    time: '',
    date: p.lastBookingDate || '',
    fileId: `#${p.childRecordID?.slice(-6) || 'N/A'}`,
    status: p.bookingStatus,
    _id: p.childId || p.childRecordID,
    bookingId: p.childRecordID,
  }));

  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dateOptions = ['Today, 8 April', 'Tomorrow, 9 April', '10 April', '11 April'];
  const [dateIndex, setDateIndex] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [viewMode, setViewMode] = useState('schedule');
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const filteredAppointments = statusFilter === 'all'
    ? appointments
    : appointments.filter(a => a.status.toLowerCase() === statusFilter.toLowerCase());

  const [viewState, setViewState] = useState('grid');
  const isActuallyEmpty = !loadingSchedule && filteredAppointments.length === 0;

  const handleCompleteConsultation = async () => {
    if (currentConsultation?._id) {
      setLoadingSchedule(true);
      try {
        // endpoint needs childId not bookingId
        const childId = currentConsultation._id;
        await api.completeConsultation(childId);
        showToast(t('consultationCompleted') || 'Consultation Completed');
      } catch (err) {
        // Ignore errors or show toast
      }
      setLoadingSchedule(false);
    }
    setViewState('grid');
    setCurrentConsultation(null);
  };

  const getStatusTranslation = (status) => {
    switch (status) {
      case 'Completed': return t('completed');
      case 'Waiting': return t('waiting');
      case 'Canceled': return t('canceled');
      default: return status;
    }
  };

  const renderHeader = () => (
    <header className="schedule-header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <h1 className="schedule-header-title">
          {viewState === 'consultation' ? (
            <>
              <span className="schedule-header-breadcrumb">{t('schedule')} \ </span> {t('startConsultation')}
            </>
          ) : (
            t('schedule')
          )}
        </h1>
      </div>
      <div className="schedule-header-actions">
        {viewState === 'consultation' && (
          <button className="complete-consultation-btn" onClick={handleCompleteConsultation}>
            {t('completeConsultation')}
          </button>
        )}
        <button className="icon-btn-rounded" title="Language Toggle" onClick={toggleLanguage}>
          <img src={languageIcon} alt="Language" width="22" height="22" />
        </button>
        <button className="icon-btn-rounded notification-btn" onClick={() => showToast(t('noNotifications'))}>
          <img src={notificationIcon} alt="Notifications" width="24" height="24" />
          <img src={badgeIcon} alt="" className="notification-badge" />
        </button>
        <div className="avatar">AO</div>
      </div>
    </header>
  );

  const renderTopControls = () => (
    <div className="schedule-controls-row">
      <div className="schedule-page-title">
        <h2>{t('dailyAppointments')}</h2>
        <p>{t('dailyAppointmentsDesc')}</p>
      </div>
      <div className="schedule-filters">
        <div style={{ position: 'relative' }}>
          <button className="filter-dropdown" onClick={() => setShowStatusDropdown(p => !p)}>
            {statusFilter === 'all' ? t('statusFilter') : statusFilter}
            <img src={chevronIcon} alt="" width="16" height="16" />
          </button>
          {showStatusDropdown && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, zIndex: 100, minWidth: 140, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {['all', 'Waiting', 'Completed', 'cancelled'].map(s => (
                <div
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                  style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: statusFilter === s ? '#00AEC0' : '#374151', background: statusFilter === s ? '#F0FDFE' : 'transparent' }}
                >
                  {s === 'all' ? t('statusFilter') || 'All' : s}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="date-selector">
          <button className="date-nav-btn" onClick={() => setDateIndex(prev => Math.max(0, prev - 1))} style={{ opacity: dateIndex === 0 ? 0.3 : 1 }}>
            <img src={arrowNavIcon} alt="Previous" style={{ transform: 'rotate(90deg)' }} width="16" height="16" />
          </button>
          <div className="date-current">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {dateOptions[dateIndex]}
          </div>
          <button className="date-nav-btn" onClick={() => setDateIndex(prev => Math.min(dateOptions.length - 1, prev + 1))} style={{ opacity: dateIndex === dateOptions.length - 1 ? 0.3 : 1 }}>
            <img src={arrowNavIcon} alt="Next" style={{ transform: 'rotate(-90deg)' }} width="16" height="16" />
          </button>
        </div>
      </div>
    </div>
  );

  // ---------- EMPTY STATE ----------
  const renderEmpty = () => (
    <div className="schedule-empty-state">
      {renderTopControls()}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="empty-graphic">
          <img src={emptyStateImg} alt="Empty Schedule" />
        </div>
        <div className="empty-text-container">
          <h3>{t('scheduleClear')}</h3>
          <p>{t('scheduleClearDesc')}</p>
        </div>
      </div>
    </div>
  );

  // ---------- GRID STATE ----------
  const renderGrid = () => (
    <div className="schedule-grid-container">
      {renderTopControls()}
      <div className="schedule-grid">
        {loadingSchedule ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 20, height: 20, border: '2px solid #00AEC0', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              {t('loading') || 'Loading...'}
            </div>
          </div>
        ) : filteredAppointments.map((appt) => (
          <div className="appointment-card" key={appt.id}>
            <div className="card-header">
              <div className="card-patient-info">
                <img src={avatarImg} alt={appt.name} className="card-avatar" />
                <div className="card-patient-text">
                  <h4>{appt.name}</h4>
                  <span>{appt.age ? `${appt.age} ${t('years') || 'yrs'}` : ''}</span>
                </div>
              </div>
              <span className={`card-status ${String(appt.status).toLowerCase()}`}>{getStatusTranslation(appt.status)}</span>
            </div>
            <div className="card-details-row">
              <div className="card-detail-col">
                <span className="card-detail-val">{appt.time}</span>
                <span className="card-detail-lbl">{t('time')}</span>
              </div>
              <div className="card-detail-col">
                <span className="card-detail-val">{appt.fileId}</span>
                <span className="card-detail-lbl">{t('id')}</span>
              </div>
            </div>
            <button
              className={`card-action-btn ${['completed','canceled','cancelled'].includes((appt.status||'').toLowerCase()) ? 'profile' : 'start'}`}
              onClick={() => {
                console.log('🔍 appt clicked:', appt);
                console.log('🔍 appt.name:', appt.name);
                setSelectedChild(appt);
                setViewMode('patient-details');
                if (!['completed','canceled','cancelled'].includes((appt.status||'').toLowerCase())) {
                  setCurrentConsultation({ _id: appt._id });
                }
              }}
            >
              {['completed','canceled','cancelled'].includes((appt.status||'').toLowerCase()) ? t('childProfile') : t('startConsultation')}
            </button>
          </div>
        ))}
      </div>

      <div className="pagination" style={{ marginTop: 0, paddingBottom: 16 }}>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">4</button>
        <button className="page-btn">5</button>
        <span className="page-dots">..</span>
        <button className="page-btn">17</button>
      </div>
    </div>
  );

  // ---------- CONSULTATION STATE ----------
  // Reused chart logic from PatientDetails components for rendering identical layout inline
  const monthKeys = ['sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const weightData = [10, 10.5, 11, 11, 11.5, 12, 12.5];
  const headData = [37, 37, 37, 37.5, 38, 38.5, 39];
  const heightData = [78, 80, 81, 83, 84, 86, 88];

  const chartW = 580;
  const chartH = 160;
  const padL = 40;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const toX = (i) => padL + (i / (monthKeys.length - 1)) * plotW;
  const toY = (val) => padT + plotH - ((val / 100) * plotH);
  const makePath = (data) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  const renderConsultation = () => (
    <div className="consultation-main-content">
      {/* Patient Profile Box */}
      <div className="consultation-patient-header">
        <img src={avatarImg} alt="Patient" className="cp-avatar" />
        <div className="cp-info">
          <div className="cp-name-age">
            <h2>Noah Abdulrahman</h2>
            <span>{t('yearsAndMonths')}</span>
          </div>
          <div className="cp-tags">
            <span className="pd-gender-tag">{t('boy')}</span>
            <span className="pd-status-tag">{t('healthyGrowth')}</span>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="consultation-metrics-row">
        <div className="pd-metric-card">
          <div className="pd-metric-header">
            <span className="pd-metric-label">{t('growthIndicator')}</span>
            <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
          </div>
          <p className="pd-metric-value">98 %</p>
          <span className="pd-metric-sub">+3%</span>
        </div>
        <div className="pd-metric-card">
          <div className="pd-metric-header">
            <span className="pd-metric-label">{t('headCircumference')}</span>
            <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5" /><path d="M3 21v-2a7 7 0 0 1 7-7h4" /></svg>
          </div>
          <p className="pd-metric-value">48 cm</p>
          <span className="pd-metric-sub">+0 cm</span>
        </div>
        <div className="pd-metric-card">
          <div className="pd-metric-header">
            <span className="pd-metric-label">{t('weight')}</span>
            <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
          </div>
          <p className="pd-metric-value">12.5 kg</p>
          <span className="pd-metric-sub">+2 kg</span>
        </div>
        <div className="pd-metric-card">
          <div className="pd-metric-header">
            <span className="pd-metric-label">{t('height')}</span>
            <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h4M18 12h4M8 6l4-4 4 4M8 18l4 4 4-4" /></svg>
          </div>
          <p className="pd-metric-value">87 cm</p>
          <span className="pd-metric-sub">+3 cm</span>
        </div>
      </div>

      {/* Chart and Progress Bars */}
      <div className="consultation-2col">
        {/* Development Curve */}
        <div className="pd-dev-curve-card" style={{ margin: 0 }}>
          <h3>{t('developmentCurve')}</h3>
          <div className="pd-chart-container">
            <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
              {[0, 25, 50, 75, 100].map((tick) => (
                <g key={tick}>
                  <line x1={padL} y1={toY(tick)} x2={chartW - padR} y2={toY(tick)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />
                  <text x={padL - 8} y={toY(tick) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{tick}</text>
                </g>
              ))}
              {monthKeys.map((m, i) => <line key={`vc-${i}`} x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + plotH} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />)}
              {monthKeys.map((m, i) => <text key={m} x={toX(i)} y={chartH - 5} textAnchor="middle" fontSize="10" fill="#9CA3AF">{t(m)}</text>)}
              <path d={makePath(weightData)} stroke="#00AEC0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d={makePath(headData)} stroke="#0B4A50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d={makePath(heightData)} stroke="#F9A87F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {weightData.map((v, i) => <circle key={`w${i}`} cx={toX(i)} cy={toY(v)} r="3.5" fill="#00AEC0" />)}
              {headData.map((v, i) => <circle key={`h${i}`} cx={toX(i)} cy={toY(v)} r="3.5" fill="#0B4A50" />)}
              {heightData.map((v, i) => <circle key={`ht${i}`} cx={toX(i)} cy={toY(v)} r="3.5" fill="#F9A87F" />)}
            </svg>
          </div>
          <div className="pd-chart-legend">
            <div className="pd-legend-item"><span className="pd-legend-dot weight"></span> {t('weightKg')}</div>
            <div className="pd-legend-item"><span className="pd-legend-dot head"></span> {t('headCircumferenceCm')}</div>
            <div className="pd-legend-item"><span className="pd-legend-dot height"></span> {t('heightCm')}</div>
          </div>
        </div>

        {/* Milestones */}
        <div className="pd-milestones-card" style={{ margin: 0 }}>
          <h3>{t('growsAndLearns')}</h3>
          <div className="pd-milestones-content">
            <img src={bodyFigure} alt="Growth" className="pd-body-figure" />
            <div className="pd-progress-list">
              {[{ l: t('movement'), v: 85 }, { l: t('speech'), v: 90 }, { l: t('understanding'), v: 75 }, { l: t('socialSkills'), v: 80 }].map((m, i) => (
                <div className="pd-progress-item" key={i}>
                  <div className="pd-progress-label-row">
                    <span className="pd-progress-label">{m.l}</span>
                    <span className="pd-progress-value">{m.v}%</span>
                  </div>
                  <div className="pd-progress-bar-bg"><div className="pd-progress-bar-fill" style={{ width: `${m.v}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vaccine Log */}
      <div className="pd-vaccine-card consultation-full-row" style={{ margin: 0 }}>
        <h3>{t('vaccineLog')}</h3>
        <div className="pd-vaccine-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { name: t('polioZeroDose'), date: 'January 24, 2025', color: 'green' },
            { name: t('measlesFirstDose'), date: 'March 15, 2025', color: 'green' },
            { name: t('hepBThirdDose'), date: 'April 30, 2025', color: 'green' },
            { name: t('polioZeroDose'), date: 'January 24, 2025', color: 'green' },
            { name: t('polioSabin'), date: 'March 15, 2025', color: 'green' },
            { name: t('polio9Month'), date: 'March 15, 2025', color: 'green' },
            { name: t('pentavalent'), date: 'April 30, 2025', color: 'yellow' }
          ].map((v, i) => (
            <div className={`pd-vaccine-item ${v.color}`} key={i}>
              <div className={`pd-vaccine-icon ${v.color}`}>
                <img src={injectionIcon} alt="Vaccine" />
              </div>
              <div className="pd-vaccine-info">
                <span className={`pd-vaccine-name ${v.color}`}>{v.name}</span>
                <span className="pd-vaccine-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {v.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  return (
    <div className="schedule-dashboard">
      {viewMode === 'patient-details' && selectedChild ? (
        <div style={{ width: '100%', minHeight: '100vh', background: '#F2F2F2' }}>
          {/* Header with back + complete consultation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => { setSelectedChild(null); setViewMode('schedule'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <span style={{ color: '#6B7280', fontSize: '14px' }}>{t('schedule')} \</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{t('startConsultation')}</span>
            </div>
            {!['completed', 'canceled', 'cancelled'].includes((selectedChild.status || '').toLowerCase()) && (
              <button
                onClick={async () => {
                  if (!selectedChild._id) return;
                  try {
                    await api.completeConsultation(selectedChild._id);
                    showToast(t('consultationCompleted') || 'Consultation Completed!');
                    setSelectedChild(null);
                    setViewMode('schedule');
                    // Refresh patients data
                    setLoadingSchedule(true);
                    api.getPatients().then(data => { setApiData(data); setLoadingSchedule(false); }).catch(() => setLoadingSchedule(false));
                  } catch (err) {
                    showToast(err.message || 'Failed to complete consultation');
                  }
                }}
                style={{ background: '#00AEC0', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                {t('completeConsultation') || 'Complete Consultation'}
              </button>
            )}
          </div>
          <div style={{ overflow: 'auto' }}>
            <PatientDetails
              patient={{
                name: selectedChild.name,
                id: selectedChild.fileId,
                age: selectedChild.age,
                status: selectedChild.status,
                _id: selectedChild._id || selectedChild.bookingId,
              }}
              onClose={() => { setSelectedChild(null); setViewMode('schedule'); }}
              isFullPage={true}
            />
          </div>
        </div>
      ) : (
        <>
          {renderHeader()}
          {(viewState === 'empty' || isActuallyEmpty) ? renderEmpty() : null}
          {(viewState === 'grid' && !isActuallyEmpty) ? renderGrid() : null}
          {viewState === 'consultation' && renderConsultation()}
        </>
      )}

      {toastMsg && <div className="toast-popup">{toastMsg}</div>}
    </div>
  );
}
