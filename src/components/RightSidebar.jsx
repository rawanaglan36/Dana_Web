import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import emptyStateImg from '../assets/Dana - ضنا_img/_Empty state item.png';

export default function RightSidebar() {
  const { t } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDayIndex, setActiveDayIndex] = useState(today.getDay()); // Sunday=0

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // Generate week dates dynamically based on current real date
  const weekData = useMemo(() => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    return dayKeys.map((key, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        key,
        date,
        number: date.getDate()
      };
    });
  }, [weekOffset, today]);

  const activeDateObj = weekData[activeDayIndex].date;
  const formattedDateString = activeDateObj.toISOString().split('T')[0];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const currentDayNumber = activeDateObj.getDate();
  const displayDay = t(dayNames[activeDayIndex]);
  const displayMonth = t(monthNames[activeDateObj.getMonth()].toLowerCase()) || monthNames[activeDateObj.getMonth()];

  const [loading, setLoading] = useState(true);
  const [slotsData, setSlotsData] = useState(null);
  const [patientsList, setPatientsList] = useState([]);

  // Fetch slots when selected date changes
  useEffect(() => {
    setLoading(true);
    api.getAvailableSlots(formattedDateString)
      .then(data => setSlotsData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [formattedDateString]);

  // Fetch global patients list
  useEffect(() => {
    api.getPatients()
      .then(data => setPatientsList(data?.patients || []))
      .catch(console.error);
  }, []);

  // Map the patients to display based on API response
  const displayPatients = useMemo(() => {
    const colors = ['#ffb3a7', '#a7d8ff', '#ffd6a7', '#a7ffb1', '#dca7ff', '#ffeca7'];
    
    if (slotsData?.bookedTimes && slotsData.bookedTimes.length > 0) {
      return slotsData.bookedTimes.map((bt, i) => {
        // If bookedTimes is an array of objects or strings
        const time = typeof bt === 'string' ? `${bt} - Booked` : (bt.time || 'N/A');
        const name = typeof bt === 'string' ? `Patient ${i+1}` : (bt.name || bt.patientName || `Patient ${i+1}`);
        const age = typeof bt === 'object' && bt.age ? `${bt.age} Years` : 'N/A';
        return { name, age, time, color: colors[i % colors.length] };
      });
    } else if (patientsList.length > 0) {
      // Fallback: Just show patients from the general list
      return patientsList.map((p, i) => ({
        name: p.name || p.childName || `Patient ${i+1}`,
        age: p.age ? `${p.age} Years` : 'N/A',
        time: p.time || '10:00 AM - 10:30 AM',
        color: colors[i % colors.length]
      }));
    }
    
    return []; // Empty if no data
  }, [slotsData, patientsList]);

  return (
    <aside className="dashboard-right">
      <header className="right-header">
        <button className="chevron-btn-custom" onClick={() => { setWeekOffset(prev => prev - 1); setActiveDayIndex(0); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#004951"/>
            <path d="M14 16L10 12L14 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="date-display">
          <span>{weekOffset === 0 ? t('today') : ''}</span>
          <strong>{displayMonth} {currentDayNumber} , {displayDay}</strong>
        </div>
        <button className="chevron-btn-custom" onClick={() => { setWeekOffset(prev => prev + 1); setActiveDayIndex(0); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#004951"/>
            <path d="M10 8L14 12L10 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      <div className="calendar-week">
        {weekData.map((day, i) => (
          <div
            key={day.key}
            className={`day ${activeDayIndex === i ? 'active' : ''}`}
            onClick={() => setActiveDayIndex(i)}
            style={{ cursor: 'pointer' }}
          >
            <span>{t(day.key)}</span>
            <div className="day-number">{day.number}</div>
          </div>
        ))}
      </div>

      <div className="right-schedule-header">
        <h3>{t('scheduleLabel')}</h3>
        <div className="time-filter">10:00 AM - 03:00 PM</div>
      </div>

      <div className="patient-list">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>Loading schedule...</div>
        ) : displayPatients.length > 0 ? (
          displayPatients.map((p, idx) => (
            <div className="patient-item" key={idx} style={{ cursor: 'pointer' }}>
              <div className="patient-avatar-img">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name.replace(' ', '')}&backgroundColor=${p.color.replace('#', '')}`} alt={p.name} />
              </div>
              <div className="patient-info-container">
                <div className="patient-info-left">
                  <h4>{p.name}</h4>
                  <span className="patient-age">{p.age}</span>
                </div>
                <div className="patient-time">
                  {p.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="right-sidebar-empty">
            <img src={emptyStateImg} alt="Empty Schedule" />
            <p>No appointments found for this day.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
