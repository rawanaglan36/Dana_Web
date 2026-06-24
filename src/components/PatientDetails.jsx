import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './PatientDetails.css';
import avatarImg from '../assets/Dana - ضنا_img/source/image.png';
import bodyFigure from '../assets/Dana - ضنا_img/image 13.png';
import injectionIcon from '../assets/Dana - ضنا_icon/mingcute_injection-fill.svg';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { calculateAge, formatAge } from '../utils/ageUtils';

export default function PatientDetails({ patient, onClose, triggerPosition, isFullPage, hideControls }) {
  const { t } = useLanguage();

  const [recordData, setRecordData] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [latestGrowth, setLatestGrowth] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [vaccineDefinitions, setVaccineDefinitions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [realChildId, setRealChildId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (!isFullPage) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isFullPage]);

  useEffect(() => {
    const childId = patient?.childId || patient?._id;
    if (!childId) return;
    setLoading(true);

    // Fetch all data in parallel
    Promise.all([
      // Primary: Get child record by childId (GET endpoint)
      api.getChildRecordByChildId(childId).catch(() => null),
      // Child profile (for birthDate)
      api.getChildProfile(childId).catch(() => null),
      // Growth history
      api.getChildGrowth(childId).catch(() => []),
      // Latest growth
      api.getChildLatestGrowth(childId).catch(() => null),
      // Vaccine definitions (for name lookup)
      api.getAllVaccinations().catch(() => []),
      // Skills progress (aggregates all categories)
      api.getChildSkillsProgress(childId).catch(() => []),
    ]).then(([record, profile, growth, latest, vaccineDefs, skills]) => {
      setRecordData(record);
      setChildProfile(profile);
      setVaccineDefinitions(Array.isArray(vaccineDefs) ? vaccineDefs : []);

      // Growth data: prefer record data, fallback to individual API
      const growthHistory = record?.growthHistory?.length > 0 ? record.growthHistory : (Array.isArray(growth) ? growth : []);
      setGrowthData(growthHistory);

      // Latest growth: prefer record, then individual API, then compute from history
      const latestG = record?.latestGrowth || record?.currentStats || latest || (growthHistory.length > 0 ? growthHistory[growthHistory.length - 1] : null);
      setLatestGrowth(latestG);

      // Vaccinations from child record
      setVaccinations(record?.vaccinations ?? []);

      // Milestones from skills checklist
      setMilestones(Array.isArray(skills) ? skills : []);

      if (record?.childId) setRealChildId(typeof record.childId === 'string' ? record.childId : record.childId._id || record.childId);
      setLoading(false);
    }).catch((err) => {
      setLoading(false);
    });
  }, [patient]);

  const history = growthData.length > 0 ? growthData : (recordData?.growthHistory ?? []);

  let stats = latestGrowth ?? recordData?.currentStats ?? recordData?.latestGrowth ?? {};
  if (!stats.weight && !stats.height && !stats.headCircumference && history.length > 0) {
    stats = history[history.length - 1] ?? {};
  }
  
  const weight = stats.weight ?? null;
  const height = stats.height ?? null;
  const headCirc = stats.headCircumference ?? null;

  const childInfo = recordData?.childData ?? {};
  const gender = childInfo.gender || patient.gender || '';

  // Try to get birthDate from any available source
  const rawBirthDate =
    childProfile?.birthDate ||
    childProfile?.dateOfBirth ||
    childInfo.birthDate ||
    childInfo.dateOfBirth ||
    patient.birthDate ||
    patient.dateOfBirth ||
    null;

  // If we have a real birthDate → precise years+months
  // If we only have an integer age → show years only (can't know months)
  const ageObj = rawBirthDate
    ? calculateAge(rawBirthDate)
    : null;

  const fallbackAge = childInfo.age ?? patient.age ?? null;

  const ageDisplay = ageObj
    ? formatAge(ageObj, { yr: t('yr') || 'yr', mo: t('mo') || 'mo' })
    : (fallbackAge != null ? `${fallbackAge} ${t('years') || 'years'}` : '');

  // Build vaccine name lookup map from definitions
  const vaccineNameMap = {};
  vaccineDefinitions.forEach(v => { if (v._id) vaccineNameMap[v._id] = v.name; });

  // Growth history → chart
  const monthKeys = history.length > 0
    ? history.map(g => new Date(g.recordDate).toLocaleString('en', { month: 'short' }).toLowerCase())
    : ['sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
  const weightData = history.length > 0 ? history.map(g => g.weight ?? 0) : [0, 0, 0, 0, 0, 0, 0];
  const headData = history.length > 0 ? history.map(g => g.headCircumference ?? 0) : [0, 0, 0, 0, 0, 0, 0];
  const heightData = history.length > 0 ? history.map(g => g.height ?? 0) : [0, 0, 0, 0, 0, 0, 0];

  // Vaccinations - resolve names from definitions
  const vaccines = vaccinations.map(v => {
    const vaccineIdStr = typeof v.vaccineId === 'string' ? v.vaccineId : v.vaccineId?._id || '';
    const vaccineName = v.vaccineId?.name || vaccineNameMap[vaccineIdStr] || v.vaccine?.name || 'Vaccine';
    return {
      name: vaccineName,
      date: v.takenDate
        ? new Date(v.takenDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date(v.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      color: v.status === 'taken' ? 'green' : v.status === 'missed' ? 'red' : 'yellow',
    };
  });


  const chartW = 580;
  const chartH = 160;
  const padL = 40;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const toX = (i) => padL + (monthKeys.length > 1 ? (i / (monthKeys.length - 1)) : 0) * plotW;
  const allVals = [...weightData, ...headData, ...heightData].filter(v => v > 0);
  const maxVal = allVals.length > 0 ? Math.max(...allVals) * 1.2 : 100;
  const toY = (val) => padT + plotH - ((val / maxVal) * plotH);
  const yTicks = [0, 25, 50, 75, 100].map(p => Math.round((p / 100) * maxVal));
  const makePath = (data) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  if (!patient) return null;

  const content = (
    <>
      {/* Controls */}
      {isFullPage ? (
        !hideControls && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onClose) {
                onClose();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#00AEC0',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 0',
              zIndex: 1000
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('back') || 'Back'}
          </button>
        )
      ) : (
        <button className="pd-close-btn" onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#F87171" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ borderRadius: '50%' }}>
            <circle cx="12" cy="12" r="10" fill="#F87171" stroke="none"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </button>
      )}

      {/* Header */}

          <div className="pd-header" style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={avatarImg} alt={patient.name} className="pd-avatar" />
              <div className="pd-header-info">
                <h2>{patient.name}</h2>
                <span>{ageDisplay}</span>
                <div className="pd-badges-row">
                  <span className="pd-gender-tag">{gender === 'female' ? t('girl') || 'Girl' : t('boy')}</span>
                  <span className="pd-status-tag">{t('healthyGrowth')}</span>
                </div>
              </div>
            </div>

            {/* Start Consultation Button - only show if not completed/canceled and hideControls is false */}
            {!hideControls && !['completed', 'canceled', 'cancelled'].includes((patient.status || '').toLowerCase()) && (
              <button
                onClick={async () => {
                  const bookingId = patient.bookingId;
                  if (!bookingId) {
                    alert('No booking ID found for this patient');
                    return;
                  }
                  try {
                    await api.completeConsultation(bookingId);
                    alert(t('consultationCompleted') || 'Consultation Completed!');
                    // Close and let parent refresh
                    if (onClose) onClose();
                  } catch (err) {
                    alert(err.message || 'Failed to complete consultation');
                  }
                }}
                style={{
                  background: '#00AEC0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                {t('startConsultation') || 'Start Consultation'}
              </button>
            )}
          </div>

          {/* Health Metrics */}
          <div className="pd-metrics-row">
            <div className="pd-metric-card">
              <div className="pd-metric-header">
                <span className="pd-metric-label">{t('growthIndicator')}</span>
                <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
              </div>
              <p className="pd-metric-value">{stats?.growthPercentage ?? stats?.growthIndicator ?? '—'} %</p>
              <span className="pd-metric-sub"></span>
            </div>

            <div className="pd-metric-card">
              <div className="pd-metric-header">
                <span className="pd-metric-label">{t('headCircumference')}</span>
                <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5" /><path d="M3 21v-2a7 7 0 0 1 7-7h4" /></svg>
              </div>
              <p className="pd-metric-value">{headCirc != null ? `${headCirc} cm` : '—'}</p>
              <span className="pd-metric-sub"></span>
            </div>

            <div className="pd-metric-card">
              <div className="pd-metric-header">
                <span className="pd-metric-label">{t('weight')}</span>
                <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
              </div>
              <p className="pd-metric-value">{weight != null ? `${weight} kg` : '—'}</p>
              <span className="pd-metric-sub"></span>
            </div>

            <div className="pd-metric-card">
              <div className="pd-metric-header">
                <span className="pd-metric-label">{t('height')}</span>
                <svg className="pd-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h4M18 12h4M8 6l4-4 4 4M8 18l4 4 4-4" /></svg>
              </div>
              <p className="pd-metric-value">{height != null ? `${height} cm` : '—'}</p>
              <span className="pd-metric-sub"></span>
            </div>
          </div>

          {/* Development Curve */}
          <div className="pd-dev-curve-card">
            <h3>{t('developmentCurve')}</h3>
            <div className="pd-chart-container">
              <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line x1={padL} y1={toY(tick)} x2={chartW - padR} y2={toY(tick)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />
                    <text x={padL - 8} y={toY(tick) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{tick}</text>
                  </g>
                ))}
                {monthKeys.map((m, i) => (
                  <line key={`v-${i}`} x1={toX(i)} y1={padT} x2={toX(i)} y2={padT + plotH} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />
                ))}
                {monthKeys.map((m, i) => (
                  <text key={m} x={toX(i)} y={chartH - 5} textAnchor="middle" fontSize="10" fill="#9CA3AF">{t(m)}</text>
                ))}
                <path d={makePath(weightData)} stroke="#00AEC0" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d={makePath(headData)} stroke="#0B4A50" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d={makePath(heightData)} stroke="#F9A87F" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
          <div className="pd-milestones-card">
            <h3>{t('growsAndLearns')}</h3>
            <div className="pd-milestones-content">
              <img src={bodyFigure} alt="Growth" className="pd-body-figure" />
              <div className="pd-progress-list">
                {milestones.length > 0 ? milestones.map((m, i) => (
                  <div className="pd-progress-item" key={i}>
                    <div className="pd-progress-label-row">
                      <span className="pd-progress-label">{m.title}</span>
                      <span className="pd-progress-value">{m.percentage || 0}%</span>
                    </div>
                    <div className="pd-progress-bar-bg"><div className="pd-progress-bar-fill" style={{ width: `${m.percentage || 0}%` }}></div></div>
                  </div>
                )) : (
                  <div style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', width: '100%', padding: '20px 0' }}>{t('noData') || 'No milestones data'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Vaccine Log */}
          <div className="pd-vaccine-card">
            <h3>{t('vaccineLog')}</h3>
            <div className="pd-vaccine-grid">
              {vaccines.length > 0 ? vaccines.map((v, i) => (
                <div className={`pd-vaccine-item ${v.color || 'green'}`} key={i}>
                  <div className={`pd-vaccine-icon ${v.color || 'green'}`}>
                    <img src={injectionIcon} alt="Vaccine" />
                  </div>
                  <div className="pd-vaccine-info">
                    <span className={`pd-vaccine-name ${v.color || 'green'}`}>{v.name || v.label}</span>
                    <span className="pd-vaccine-date">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {v.date}
                    </span>
                  </div>
                </div>
              )) : (
                <div style={{ color: '#9CA3AF', fontSize: '14px', gridColumn: '1 / -1' }}>
                  {t('noPatientsFound') || 'No vaccines found'}
                </div>
              )}
            </div>
          </div>


    </>
  );

  if (isFullPage) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', background: '#F2F2F2', padding: '24px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {content}
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="patient-details-overlay" onClick={onClose}>
      <div className="patient-details-panel" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>,
    document.body
  );
}
