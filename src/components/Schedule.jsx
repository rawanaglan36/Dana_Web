import { useState, useEffect, useMemo, useCallback } from 'react';
import './Schedule.css';
import PatientDetails from './PatientDetails';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

import languageIcon from '../assets/Dana - ضنا_icon/Language Icon.svg';
import avatarImg from '../assets/Dana - ضنا_img/source/image.png';
import chevronIcon from '../assets/Dana - ضنا_icon/Table/Tags/Icon.svg';
import emptyStateImg from '../assets/Dana - ضنا_img/_Empty state item.png';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';

export default function Schedule({ setIsSidebarOpen }) {
  const { t, toggleLanguage } = useLanguage();
  const { doctorInitial, doctorProfilePic } = useNotifications();
  const [apiData, setApiData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const [rawBookings, setRawBookings] = useState([]);

  const refreshData = useCallback(() => {
    setLoadingSchedule(true);
    Promise.all([
      api.getPatients().catch(() => null),
      api.getBookings().catch(() => []),
    ]).then(([pData, bData]) => {
      setApiData(pData);
      setRawBookings(Array.isArray(bData) ? bData : []);
      setLoadingSchedule(false);
    }).catch(() => setLoadingSchedule(false));
  }, []);

  useEffect(() => { refreshData(); }, []);

  // Build a patient lookup from the patients API for enriching booking data
  const patientsLookup = useMemo(() => {
    const lookup = {};
    (apiData?.patients ?? []).forEach(p => {
      if (p.childId) lookup[p.childId] = p;
    });
    return lookup;
  }, [apiData]);

  // Build appointments from ALL bookings (not just one per child)
  const appointments = useMemo(() => rawBookings.map((b) => {
    const childId = b.childId?._id || b.childId || '';
    const patientInfo = patientsLookup[childId] || {};
    const childName = b.childId?.childName || patientInfo.childName || patientInfo.name || 'Unknown';
    const childAge = b.childId?.birthDate
      ? Math.floor((Date.now() - new Date(b.childId.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : (patientInfo.age ?? '');
    return {
      id: patientInfo.childRecordID || b._id,
      name: childName,
      age: childAge,
      time: b.time || '',
      date: b.date || patientInfo.lastBookingDate || '',
      fileId: `#${(patientInfo.childRecordID || b._id || '').slice(-6)}`,
      status: b.status || patientInfo.bookingStatus || '',
      _id: childId || b._id,
      bookingId: b._id,
      childId: childId,
    };
  }), [rawBookings, patientsLookup]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Dynamic date selector - defaults to today
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDateLabel = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;

    if (d.getTime() === today.getTime()) return `Today, ${dayLabel}`;
    if (d.getTime() === tomorrow.getTime()) return `Tomorrow, ${dayLabel}`;
    return dayLabel;
  };

  const navigateDate = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
    setCurrentPage(1);
  };

  // Format selected date to YYYY-MM-DD for comparison with API dates
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const [selectedChild, setSelectedChild] = useState(null);
  const [viewMode, setViewMode] = useState('schedule');
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  // Filter by date first, then by status
  const dateFilteredAppointments = useMemo(() => appointments.filter(a => {
    if (!a.date) return false;
    const apptDate = a.date.split('T')[0];
    return apptDate === selectedDateStr;
  }), [appointments, selectedDateStr]);

  const filteredAppointments = useMemo(() => statusFilter === 'all'
    ? dateFilteredAppointments
    : dateFilteredAppointments.filter(a => {
        const qStatus = statusFilter.toLowerCase();
        const itemStatus = (a.status || '').toLowerCase();
        if (qStatus === 'waiting') return itemStatus === 'pending' || itemStatus === 'waiting';
        return itemStatus === qStatus;
      }), [dateFilteredAppointments, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [viewState, setViewState] = useState('grid');
  const isActuallyEmpty = !loadingSchedule && filteredAppointments.length === 0;

  const handleCompleteConsultation = async () => {
    const bookingId = currentConsultation?.bookingId;
    if (bookingId) {
      setLoadingSchedule(true);
      try {
        await api.completeConsultation(bookingId);
        showToast(t('consultationCompleted') || 'Consultation Completed');
        refreshData();
      } catch (err) {
        showToast(err.message || 'Failed to complete consultation');
      }
      setLoadingSchedule(false);
    } else {
      showToast('No booking ID found');
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
        <NotificationBell />
        <div className="avatar" style={{ overflow: 'hidden' }}>
          {doctorProfilePic ? <img src={doctorProfilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : doctorInitial}
        </div>
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
                  onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); setCurrentPage(1); }}
                  style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: statusFilter === s ? '#00AEC0' : '#374151', background: statusFilter === s ? '#F0FDFE' : 'transparent' }}
                >
                  {s === 'all' ? t('statusFilter') || 'All' : s}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="date-selector">
          <button className="date-nav-btn" onClick={() => navigateDate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="date-current" style={{ position: 'relative', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>{formatDateLabel(selectedDate)}</span>
            <input 
              type="date" 
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                if(e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                  setCurrentPage(1);
                }
              }}
              style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer'
              }}
            />
          </div>
          <button className="date-nav-btn" onClick={() => navigateDate(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
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
        ) : paginatedAppointments.map((appt, idx) => (
          <div className="appointment-card" key={appt.bookingId || `appt-${idx}`}>
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
                setSelectedChild(appt);
                setViewMode('patient-details');
                if (!['completed','canceled','cancelled'].includes((appt.status||'').toLowerCase())) {
                  setCurrentConsultation({ _id: appt._id, bookingId: appt.bookingId });
                }
              }}
            >
              {['completed','canceled','cancelled'].includes((appt.status||'').toLowerCase()) ? t('childProfile') : t('startConsultation')}
            </button>
          </div>
        ))}
      </div>

      <div className="pagination" style={{ marginTop: 0, paddingBottom: 16 }}>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            ‹
          </button>
          {(() => {
            const pages = [];
            const maxVisible = 5;
            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(totalPages, start + maxVisible - 1);
            if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

            if (start > 1) {
              pages.push(<button key={1} className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>);
              if (start > 2) pages.push(<span key="dots-start" className="page-dots">..</span>);
            }
            for (let i = start; i <= end; i++) {
              pages.push(
                <button key={i} className={`page-btn ${currentPage === i ? 'active' : ''}`} onClick={() => setCurrentPage(i)}>{i}</button>
              );
            }
            if (end < totalPages) {
              if (end < totalPages - 1) pages.push(<span key="dots-end" className="page-dots">..</span>);
              pages.push(<button key={totalPages} className={`page-btn ${currentPage === totalPages ? 'active' : ''}`} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>);
            }
            return pages;
          })()}
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            ›
          </button>
          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#9CA3AF' }}>
            {filteredAppointments.length} {t('totalPatients') || 'total'}
          </span>
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
          <div className="patient-details-header">
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
            <div className="patient-details-actions">
              {/* Message Button */}
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    patientName: selectedChild.name || '',
                    childId: selectedChild.childId || selectedChild._id || '',
                  });
                  window.location.href = `/dashboard/messages?${params.toString()}`;
                }}
                className="pd-message-btn"
              >
                {t('message') || 'Message'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zM7 12h7v2H7z"/></svg>
              </button>

              {/* Complete Consultation Button */}
              {!['completed', 'canceled', 'cancelled'].includes((selectedChild.status || '').toLowerCase()) && (
                <button
                  onClick={async () => {
                    const bookingId = selectedChild.bookingId;
                    if (!bookingId) {
                      showToast('No booking ID found for this patient');
                      return;
                    }
                    try {
                      await api.completeConsultation(bookingId);
                      showToast(t('consultationCompleted') || 'Consultation Completed!');
                      setSelectedChild(null);
                      setViewMode('schedule');
                      refreshData();
                    } catch (err) {
                      showToast(err.message || 'Failed to complete consultation');
                    }
                  }}
                  className="pd-complete-btn"
                >
                  {t('completeConsultation') || 'Complete Consultation'}
                </button>
              )}
            </div>
          </div>
          <div style={{ overflow: 'auto' }}>
            <PatientDetails
              patient={{
                name: selectedChild.name,
                id: selectedChild.fileId,
                age: selectedChild.age,
                status: selectedChild.status,
                _id: selectedChild._id,
                bookingId: selectedChild.bookingId,
                childId: selectedChild.childId || selectedChild._id,
              }}
              onClose={() => { setSelectedChild(null); setViewMode('schedule'); }}
              isFullPage={true}
              hideControls={true}
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
