import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import profile2userIcon from '../assets/Dana - ضنا_icon/vuesax copy/bold/profile-2user.svg';
import line6Icon from '../assets/Dana - ضنا_icon/Line 6.svg';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';

export default function MainDashboard({ setIsSidebarOpen }) {
  const navigate = useNavigate();
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const { doctorInitial, doctorProfilePic } = useNotifications();
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };


  // ✅ Real API data
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.getDashboardAnalytics().then(data => {
      setAnalytics(data);
    }).catch(() => {});
  }, []);

  // ✅ Pure API values — no fallbacks
  const monthlyPerf = analytics?.monthlyPerformance ?? 0;
  const todaysAppts = analytics?.todaysAppointmentsCount ?? 0;
  const totalActive = analytics?.totalActivePatients ?? 0;
  const apptStatus = analytics?.appointmentStatusCount ?? { completed: 0, cancelled: 0, pending: 0 };
  const paymentMethods = analytics?.paymentMethodCount ?? { visa: 0, cash: 0 };
  const totalApptPie = (apptStatus.completed ?? 0) + (apptStatus.cancelled ?? 0) + (apptStatus.pending ?? 0);
  const totalPayPie = (paymentMethods.visa ?? 0) + (paymentMethods.cash ?? 0);

  // Chart from monthlyOverview API data
  const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const apiMonthly = analytics?.monthlyOverview ?? [];
  
  // Fixed scale as requested: Y-axis is 0-100
  const yAxisMax = 100;

  const chartDataRaw = monthKeys.map((key, i) => {
    const apiEntry = apiMonthly.find(m => m.month === i + 1);
    const raw = apiEntry?.count ?? 0;
    // Directly scale to 100% since Y-axis is fixed at 100
    const val = raw > 100 ? 100 : raw; 
    return { month: key, val, curveVal: Math.min(val + 8, 100), rawCount: raw };
  });
  // Reverse chart data in RTL so January starts from the right
  const chartData = isRTL ? [...chartDataRaw].reverse() : chartDataRaw;

  const generatePath = (data) => {
    if (!data || data.length === 0) return "";
    let x0_val = (0.5 * 100) / 12;
    let path = `M ${x0_val} ${100 - data[0].val}`;
    const smoothing = 0.15;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = i === 0 ? x0_val : ((i - 1 + 0.5) * 100) / 12;
      const y0 = i === 0 ? 100 - data[0].val : 100 - data[i - 1].val;
      const x1 = ((i + 0.5) * 100) / 12;
      const y1 = 100 - data[i].val;
      const x2 = ((i + 1 + 0.5) * 100) / 12;
      const y2 = 100 - data[i + 1].val;
      const x3 = i + 2 < data.length ? ((i + 2 + 0.5) * 100) / 12 : x2;
      const y3 = i + 2 < data.length ? 100 - data[i + 2].val : y2;

      const cp1x = x1 + (x2 - x0) * smoothing;
      const cp1y = y1 + (y2 - y0) * smoothing;
      const cp2x = x2 - (x3 - x1) * smoothing;
      const cp2y = y2 - (y3 - y1) * smoothing;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }
    return path;
  };
  const curvePath = generatePath(chartData);
  const firstX = (0.5 * 100) / 12;
  const lastX = (11.5 * 100) / 12;

  return (
    <div className="main-dashboard">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1>{t('dashboard')}</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn" style={{ fontWeight: 'bold' }} onClick={toggleLanguage} title={isRTL ? 'Switch to English' : 'التبديل للعربية'}>
            {language === 'en' ? 'عربي' : 'En'}
          </button>
          <NotificationBell />
          <div className="avatar" onClick={() => navigate('/dashboard/settings')} style={{ cursor: 'pointer', overflow: 'hidden' }} title={t('settings')}>
            {doctorProfilePic ? <img src={doctorProfilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : doctorInitial}
          </div>
        </div>
      </header>

      {toastMsg && <div className="toast-notification">{toastMsg}</div>}

      <div className="kpi-cards" style={{ cursor: 'pointer' }}>
        <div className="kpi-card" onClick={() => navigate('/dashboard/patients')}>
          <div className="kpi-icon-wrapper kpi-teal-light">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="kpi-stats">
            <h2>{monthlyPerf.toLocaleString()}</h2>
            <span className="trend positive">+5% <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></span>
          </div>
          <p>{t('monthlyPerformance')}</p>
        </div>
        <div className="kpi-card" onClick={() => navigate('/dashboard/schedule')}>
          <div className="kpi-icon-wrapper kpi-teal-light">
            <img src={profile2userIcon} alt="patients" width="24" height="24" />
          </div>
          <div className="kpi-stats">
            <h2>{todaysAppts.toLocaleString()}</h2>
            <span className="trend positive">+5% <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></span>
          </div>
          <p>{t('todaysAppointments')}</p>
        </div>
        <div className="kpi-card" onClick={() => navigate('/dashboard/patients')}>
          <div className="kpi-icon-wrapper kpi-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div className="kpi-stats">
            <h2>{totalActive.toLocaleString()}</h2>
            <span className="trend positive">+5% <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></span>
          </div>
          <p>{t('totalActivePatients')}</p>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>{t('appointmentsOverview')}</h3>
          <div className="title-underline"></div>
        </div>
        <div className="chart-placeholder" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div className="chart-y-axis" style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', marginRight: isRTL ? 0 : '8px', marginLeft: isRTL ? '8px' : 0 }}>
            <span>100</span>
            <span>80</span>
            <span>60</span>
            <span>40</span>
            <span>20</span>
            <span>0</span>
          </div>
          <div className="chart-content-area">
            <div className="chart-grid">
              <div className="grid-line"></div>
              <div className="grid-line"></div>
              <div className="grid-line"></div>
              <div className="grid-line"></div>
              <div className="grid-line"></div>
              <div className="grid-line"></div>
            </div>

            <div className="chart-bars" style={{ position: 'relative', marginLeft: '16px', marginRight: '16px' }}>
              {/* Overlay dynamic curve directly inside the bars container to match dimensions precisely */}
              <div className="chart-curve-overlay" style={{ position: 'absolute', left: '0', right: '0', top: '0', bottom: '0' }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EFA987" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#EFA987" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={curvePath} fill="none" stroke="#EFA987" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  <path d={`${curvePath} L ${lastX} 100 L ${firstX} 100 Z`} fill="url(#curveGradient)" stroke="none" />
                </svg>
              </div>

              {chartData.map((d, i) => {
                const barColor = '#00AEC0';
                const opacity = 1;
                const leftPos = ((i + 0.5) * 100) / 12;
                return (
                  <div className="bar-wrapper" key={i} style={{ position: 'absolute', height: '100%', bottom: 0, left: `${leftPos}%`, transform: 'translateX(-50%)', width: 'clamp(10px, 2.2vw, 20px)' }}>
                    <div className="point-dot" style={{ bottom: `${d.val}%` }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="3.5" fill="#FFFFFF" stroke="#EFA987" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="bar" style={{ height: `${Math.max(d.val, d.rawCount > 0 ? 4 : 0)}%`, backgroundColor: barColor, opacity: opacity }}>
                      <span>{d.rawCount}</span>
                    </div>
                    <div className="bar-label" style={{ position: 'absolute', bottom: '-36px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', fontSize: 'clamp(8px, 1.8vw, 11px)', color: '#9CA3AF', width: 'max-content' }}>
                      {t(d.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="pie-charts-row">
        <div className="pie-card">
          <div className="pie-header-row">
            <div className="chart-header">
              <h3>{t('appointmentStatus')}</h3>
              <div className="title-underline"></div>
            </div>
            <span className="text-more" onClick={() => navigate('/dashboard/schedule')}>{t('more')}</span>
          </div>
          <div className="pie-wrapper-relative">
            <div 
              className="pie-visual appointment-pie"
              data-total={totalApptPie}
              style={{
                background: totalApptPie > 0 ? `conic-gradient(
                  #4ADE80 0% ${(apptStatus.completed / totalApptPie) * 100}%,
                  #F87171 ${(apptStatus.completed / totalApptPie) * 100}% ${((apptStatus.completed + apptStatus.cancelled) / totalApptPie) * 100}%,
                  #FB923C ${((apptStatus.completed + apptStatus.cancelled) / totalApptPie) * 100}% 100%
                )` : '#E5E7EB'
              }}
            >
              <div className="pie-center">
                <h2>{totalApptPie}</h2>
              </div>
            </div>
            {/* Absolute positioned floating labels precisely matching Figma */}
            <div className="floating-label rs-label">
              {t('rescheduled')}<span>{apptStatus.pending ?? 0} {t('patientsUnit')}</span>
              <img src={line6Icon} alt="line" style={{ position: 'absolute', top: '15px', left: isRTL ? 'auto' : 'calc(100% + 4px)', right: isRTL ? 'calc(100% + 4px)' : 'auto', transform: isRTL ? 'none' : 'scaleX(-1)', transformOrigin: 'center center', width: '50px' }} />
            </div>
            <div className="floating-label cm-label">
              {t('completed')}<span>{apptStatus.completed ?? 0} {t('patientsUnit')}</span>
              <img src={line6Icon} alt="line" style={{ position: 'absolute', top: '10px', left: isRTL ? 'auto' : 'calc(100% + 4px)', right: isRTL ? 'calc(100% + 4px)' : 'auto', transform: isRTL ? 'scaleY(-1)' : 'scaleX(-1) scaleY(-1)', transformOrigin: 'center center', width: '35px' }} />
            </div>
            <div className="floating-label ca-label">
              {t('canceled')}<span>{apptStatus.cancelled ?? 0} {t('patientsUnit')}</span>
              <img src={line6Icon} alt="line" style={{ position: 'absolute', top: '10px', right: isRTL ? 'auto' : 'calc(100% + 4px)', left: isRTL ? 'calc(100% + 4px)' : 'auto', transform: isRTL ? 'scaleX(-1) scaleY(-1)' : 'scaleY(-1)', transformOrigin: 'center center', width: '50px' }} />
            </div>
          </div>
          <div className="pie-legend">
            <span><span className="dot teal"></span> {t('completed')}</span>
            <span><span className="dot orange"></span> {t('rescheduled')}</span>
            <span><span className="dot red"></span> {t('canceled')}</span>
          </div>
        </div>

        <div className="pie-card">
          <div className="pie-header-row">
            <div className="chart-header">
              <h3>{t('paymentMethods')}</h3>
              <div className="title-underline"></div>
            </div>
            <span className="text-more" onClick={() => navigate('/dashboard/patients')}>{t('more')}</span>
          </div>
          <div className="pie-wrapper-relative">
            <div 
              className="pie-visual payment-pie"
              data-total={totalPayPie}
              style={{
                background: totalPayPie > 0 ? `conic-gradient(
                  #FDBA74 0% ${(paymentMethods.cash / totalPayPie) * 100}%,
                  var(--color-primary-default, #00AEC0) ${(paymentMethods.cash / totalPayPie) * 100}% 100%
                )` : '#E5E7EB'
              }}
            >
              <div className="pie-center">
                <h2>{totalPayPie}</h2>
              </div>
            </div>
            {/* Absolute positioned floating labels precisely matching Figma */}
            <div className="floating-label cr-label">
              {t('card')}<span>{paymentMethods.visa ?? 0} {t('patientsUnit')}</span>
              <img src={line6Icon} alt="line" style={{ position: 'absolute', top: '15px', left: isRTL ? 'auto' : 'calc(100% + 4px)', right: isRTL ? 'calc(100% + 4px)' : 'auto', transform: isRTL ? 'none' : 'scaleX(-1)', transformOrigin: 'center center', width: '50px' }} />
            </div>
            <div className="floating-label csh-label">
              {t('cash')}<span>{paymentMethods.cash ?? 0} {t('patientsUnit')}</span>
              <img src={line6Icon} alt="line" style={{ position: 'absolute', top: '10px', right: isRTL ? 'auto' : 'calc(100% + 4px)', left: isRTL ? 'calc(100% + 4px)' : 'auto', transform: isRTL ? 'none' : 'scaleY(-1)', transformOrigin: 'center center', width: '45px' }} />
            </div>
          </div>
          <div className="pie-legend">
            <span><span className="dot teal"></span> {t('card')}</span>
            <span><span className="dot orange"></span> {t('cash')}</span>
          </div>
        </div>
      </div>


      {toastMsg && <div className="toast-popup">{toastMsg}</div>}
    </div>
  );
}
