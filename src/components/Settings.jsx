import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Settings.css';
import coverImg from '../assets/Dana - ضنا_img/Image.png';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/Select';

export default function Settings({ setIsSidebarOpen }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isTabsMenuOpen, setIsTabsMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  // Warning Modal States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [cancelEntireDay, setCancelEntireDay] = useState(false);
  const [selectedCancelSlots, setSelectedCancelSlots] = useState([]);
  const [pendingAvailabilityPayload, setPendingAvailabilityPayload] = useState(null);
  const [affectedBookings, setAffectedBookings] = useState([]);
  const [pendingChangedDay, setPendingChangedDay] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [notifications, setNotifications] = useState({
    appointmentNotification: false,
    cancellationsNotification: false,
    patientUpdateNotification: false,
    messageNotification: false,
  });

  const [availability, setAvailability] = useState({
    avilableDate: [],
    avilableTime: [],
    dayOff: [],
    consultTime: 30
  });

  const [workingDays, setWorkingDays] = useState({
    friday: false,
    saturday: true,
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: false,
  });

  const [dayTimes, setDayTimes] = useState({
    friday: { from: '10:00 AM', to: '06:00 PM' },
    saturday: { from: '04:30 PM', to: '08:00 PM' },
    sunday: { from: '10:00 AM', to: '06:00 PM' },
    monday: { from: '10:00 AM', to: '06:00 PM' },
    tuesday: { from: '10:00 AM', to: '06:00 PM' },
    wednesday: { from: '10:00 AM', to: '06:00 PM' },
    thursday: { from: '10:00 AM', to: '06:00 PM' },
  });

  const timeOptions = [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
    "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
    "08:00 PM"
  ];

  const toggleWorkingDay = (day) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const updateDayTime = (day, type, value) => {
    setDayTimes(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ Profile data state — linked to both header and form
  const [profileData, setProfileData] = useState({
    fullName: '',
    specialization: '',
    clinicAddress: '',
    consultationFee: '',
    phone: '',
    bio: '',
    isVerified: false,
    profileImage: null,
  });
  const [profileLoading, setProfileLoading] = useState(true);

  const updateProfile = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await api.updateDoctorProfileImage(file);
      if (result?.profileImage) {
        setProfileData(prev => ({ ...prev, profileImage: result.profileImage }));
      }
    } catch (err) {
      showToast('Failed to upload profile image');
    }
  };

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const data = await api.getDoctorProfile();
        if (data) {
          setProfileData({
            fullName: data.doctorName || '',
            specialization: data.specialty || '',
            clinicAddress: data.address || '',
            consultationFee: data.detectionPrice !== undefined ? `${data.detectionPrice} EGP` : '',
            phone: data.phone || '',
            bio: data.bio || '',
            profileImage: data.profileImage || null,
          });
          setNotifications({
            appointmentNotification: data.appointmentNotification ?? false,
            cancellationsNotification: data.cancellationsNotification ?? false,
            patientUpdateNotification: data.patientUpdateNotification ?? false,
            messageNotification: data.messageNotification ?? false,
          });
          setAvailability({
            avilableDate: data.avilableDate || [],
            avilableTime: data.avilableTime || [],
            dayOff: data.dayOff || [],
            consultTime: data.consultTime || 30
          });

          // Convert availability array to workingDays format
          if (data.availability && data.availability.length > 0) {
            const dayMap = {
              0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
              4: 'thursday', 5: 'friday', 6: 'saturday'
            };
            
            const newWorkingDays = {
              friday: false,
              saturday: false,
              sunday: false,
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
            };
            
            const newDayTimes = { ...dayTimes };

            // Helper to convert 24h to 12h format
            const formatTo12h = (time24) => {
              const [hours, minutes] = time24.split(':').map(Number);
              const period = hours >= 12 ? 'PM' : 'AM';
              const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
              return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
            };

            data.availability.forEach(avail => {
              const date = new Date(avail.date);
              const dayOfWeek = date.getDay();
              const dayName = dayMap[dayOfWeek];
              
              if (dayName && avail.times && avail.times.length > 0) {
                newWorkingDays[dayName] = true;
                const firstTime = formatTo12h(avail.times[0]);
                const lastTime = formatTo12h(avail.times[avail.times.length - 1]);
                
                // Calculate the end time by adding slot duration to last slot
                const [lastHours, lastMinutes] = avail.times[avail.times.length - 1].split(':').map(Number);
                const endMinutes = lastHours * 60 + lastMinutes + (data.consultTime || 30);
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                const endTime = formatTo12h(`${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
                
                newDayTimes[dayName] = {
                  from: firstTime,
                  to: endTime
                };
              }
            });

            setWorkingDays(newWorkingDays);
            setDayTimes(newDayTimes);
          }
        }
      } catch (err) {
        // Silent fail on initial load
      }
    }
    loadDoctorData();
  }, []);

  const formatTimeTo24h = (timeStr) => {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (period === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
    if (period === 'AM' && hours === '12') hours = '00';
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const generateTimeSlots = (fromTime, toTime, slotDuration) => {
    const slots = [];
    const from24h = formatTimeTo24h(fromTime);
    const to24h = formatTimeTo24h(toTime);
    
    const [fromHours, fromMinutes] = from24h.split(':').map(Number);
    const [toHours, toMinutes] = to24h.split(':').map(Number);
    
    let currentMinutes = fromHours * 60 + fromMinutes;
    const endMinutes = toHours * 60 + toMinutes;
    
    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      currentMinutes += slotDuration;
    }
    
    return slots;
  };

  const getNextDateForDay = (dayName) => {
    const dayMap = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };
    
    const today = new Date();
    const targetDay = dayMap[dayName.toLowerCase()];
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (activeTab === 'profile') {
      if (!profileData.fullName.trim()) {
        showToast('Full name is required');
        return;
      }
      if (!profileData.specialization.trim()) {
        showToast('Specialization is required');
        return;
      }
      if (!profileData.clinicAddress.trim()) {
        showToast('Clinic address is required');
        return;
      }
      if (!profileData.consultationFee.trim()) {
        showToast('Consultation fee is required');
        return;
      }
    }
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        const payload = {
          doctorName: profileData.fullName,
          specialty: profileData.specialization,
          address: profileData.clinicAddress,
          detectionPrice: parseInt(profileData.consultationFee) || 0,
          bio: profileData.bio
        };
        await api.updateDoctorProfile(payload);
      } else if (activeTab === 'notifications') {
        await api.updateDoctorNotifications(notifications);
      } else if (activeTab === 'availability') {
        // Construct the availability array as required by the API
        const availabilityArray = Object.keys(workingDays)
          .filter(day => workingDays[day]) // Only active days
          .map(day => {
            const date = getNextDateForDay(day);
            const times = generateTimeSlots(
              dayTimes[day].from,
              dayTimes[day].to,
              availability.consultTime
            );
            return { date, times };
          });

        const payload = {
          availability: availabilityArray,
          consultTime: availability.consultTime
        };
        
        // Fetch real bookings to check for conflicts
        setLoadingBookings(true);
        try {
          const bookingsData = await api.getBookings();
          const allBookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || []);
          
          // Find bookings that fall on dates being changed
          // Find bookings that fall on dates being changed
          const todayStr = new Date().toISOString().split('T')[0];
          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          
          // Check which bookings have confirmed/waiting status and match affected dates/times
          const conflicting = allBookings.filter(b => {
            if (!b.date || !b.time) return false;
            const bookingDate = b.date.split('T')[0];
            // Only care about today or future bookings
            if (bookingDate < todayStr) return false;
            
            const bookingStatus = (b.status || '').toLowerCase();
            if (!['confirmed', 'waiting', 'pending'].includes(bookingStatus)) return false;

            const bDayIndex = new Date(bookingDate).getDay();
            const bookingDayName = daysOfWeek[bDayIndex];

            // If the entire day is now turned off, it's a conflict
            if (!workingDays[bookingDayName]) {
              return true;
            }

            // If the day is on, check if the specific time slot was removed
            const generatedTimes = generateTimeSlots(
              dayTimes[bookingDayName].from,
              dayTimes[bookingDayName].to,
              availability.consultTime
            );
            
            // Format booking time to 24h to match generated slots
            const bTime24h = formatTimeTo24h(b.time);
            
            if (!generatedTimes.includes(bTime24h)) {
              return true;
            }

            return false;
          });
          
          if (conflicting.length > 0) {
            setAffectedBookings(conflicting);
            setPendingAvailabilityPayload(payload);
            setCancelEntireDay(false);
            setSelectedCancelSlots([]);
            setShowWarningModal(true);
            setLoadingBookings(false);
            setIsSaving(false);
            return; // Early return to show modal
          }
        } catch (err) {
          // Silent fail - proceed with save if bookings check fails
        }
        setLoadingBookings(false);
        
        // No conflicts - save directly
        await api.updateDoctorAppointments(payload);
      }
    } catch (err) {
      showToast('Failed to save settings');
    }
    setTimeout(() => setIsSaving(false), 2000);
  };

  const handleConfirmWarning = async () => {
    setIsSaving(true);
    setShowWarningModal(false);
    try {
      // Build cancellation info
      const cancellationData = {
        ...pendingAvailabilityPayload,
        cancelEntireDay,
        cancelledSlots: cancelEntireDay 
          ? affectedBookings.map(b => b._id) 
          : selectedCancelSlots,
        affectedBookingIds: cancelEntireDay
          ? affectedBookings.map(b => b._id)
          : affectedBookings
              .filter(b => {
                const bookingTime = b.time || '';
                return selectedCancelSlots.includes(bookingTime);
              })
              .map(b => b._id),
      };
      
      await api.updateDoctorAppointments(cancellationData);
      
      // Reset modal state
      setAffectedBookings([]);
      setCancelEntireDay(false);
      setSelectedCancelSlots([]);
    } catch (err) {
      showToast('Failed to save availability');
    }
    setTimeout(() => setIsSaving(false), 2000);
  };

  const renderProfileTab = () => (
    <div className="profile-form-grid">
      <div className="form-group">
        <label>{t('fullName')}</label>
        <input type="text" className="form-input" value={profileData.fullName} onChange={(e) => updateProfile('fullName', e.target.value)} />
      </div>
      <div className="form-group">
        <label>{t('specialization')}</label>
        <input type="text" className="form-input" value={profileData.specialization} onChange={(e) => updateProfile('specialization', e.target.value)} />
      </div>
      <div className="form-group">
        <label>{t('clinicAddress')}</label>
        <input type="text" className="form-input" value={profileData.clinicAddress} onChange={(e) => updateProfile('clinicAddress', e.target.value)} />
      </div>
      <div className="form-group">
        <label>{t('consultationFee')}</label>
        <input type="text" className="form-input" value={profileData.consultationFee} onChange={(e) => updateProfile('consultationFee', e.target.value)} />
      </div>

      <div className="form-group form-group-full">
        <label>{t('bio')}</label>
        <textarea className="form-input" value={profileData.bio} onChange={(e) => updateProfile('bio', e.target.value)} />
      </div>
    </div>
  );

  const renderAvailabilityTab = () => (
    <div className="availability-grid">
      <div className="av-card">
        <h3>{t('workingDays')}</h3>
        <div className="working-days-list">
          {['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].map((day) => (
            <div className="work-day-row" key={day}>
              <span className="day-label">{t(day)}</span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={workingDays[day]} 
                  onChange={() => toggleWorkingDay(day)} 
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="day-time-inputs">
                {workingDays[day] && (
                  <>
                    <div className="time-input-wrap">
                      <span style={{fontSize:'12px', color:'#6B7280'}}>{t('from')}:</span>
                      <Select 
                        value={dayTimes[day].from} 
                        onValueChange={(val) => updateDayTime(day, 'from', val)}
                      >
                        <SelectTrigger className="time-select-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="time-input-wrap">
                      <span style={{fontSize:'12px', color:'#6B7280'}}>{t('to')}:</span>
                      <Select 
                        value={dayTimes[day].to} 
                        onValueChange={(val) => updateDayTime(day, 'to', val)}
                      >
                        <SelectTrigger className="time-select-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions
                            .filter(t => timeToMinutes(t) > timeToMinutes(dayTimes[day].from))
                            .map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="av-row-2">
          <div>
            <h3 style={{fontSize:'14px', marginBottom:'12px', color:'#111827'}}>{t('consultationTime')}</h3>
            <div className="form-group" style={{background:'#F9FAFA', padding:'20px', borderRadius:'12px', border:'1px solid #E5E7EB', maxWidth:'280px'}}>
              <label style={{color:'#6B7280', fontSize:'12px', marginBottom:'4px'}}>{t('slotDuration')}</label>
              <Select 
                value={`${availability.consultTime} Minute`} 
                onValueChange={(val) => setAvailability(prev => ({ ...prev, consultTime: parseInt(val) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('slotDuration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 Minute">30 {t('minute')}</SelectItem>
                  <SelectItem value="45 Minute">45 {t('minute')}</SelectItem>
                  <SelectItem value="60 Minute">60 {t('minute')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  const renderNotificationsTab = () => (
    <div className="notif-card">
      <h3>{t('alertPreferences')}</h3>
      <div className="notif-list">
        
        <div className="notif-item">
          <div className="notif-left">
            <div className="notif-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className="notif-text">
              <h4>{t('newAppointments')}</h4>
              <p>{t('newAppointmentsDesc')}</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={notifications.appointmentNotification} onChange={() => toggleNotification('appointmentNotification')} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notif-item">
          <div className="notif-left">
            <div className="notif-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="9" y1="14" x2="15" y2="14"></line><line x1="15" y1="14" x2="15" y2="10"></line></svg>
            </div>
            <div className="notif-text">
              <h4>{t('cancellations')}</h4>
              <p>{t('cancellationsDesc')}</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={notifications.cancellationsNotification} onChange={() => toggleNotification('cancellationsNotification')} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notif-item">
          <div className="notif-left">
            <div className="notif-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="notif-text">
              <h4>{t('patientUpdates')}</h4>
              <p>{t('patientUpdatesDesc')}</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={notifications.patientUpdateNotification} onChange={() => toggleNotification('patientUpdateNotification')} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notif-item">
          <div className="notif-left">
            <div className="notif-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="notif-text">
              <h4>{t('directMessages')}</h4>
              <p>{t('directMessagesDesc')}</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={notifications.messageNotification} onChange={() => toggleNotification('messageNotification')} />
            <span className="toggle-slider"></span>
          </label>
        </div>

      </div>
    </div>
  );

  return (
    <div className="settings-dashboard" style={{ position: 'relative' }}>
      <button 
        className="hamburger-btn" 
        onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}
        style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '10px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div className="settings-cover-wrapper">
        <img src={coverImg} alt="Cover" className="settings-cover-image" />
      </div>
      
      <div className="settings-profile-header">
        <div className="sp-avatar-container">
          {profileData.profileImage
            ? <img src={profileData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : profileData.fullName.charAt(0).toUpperCase()
          }
          <label className="sp-edit-btn" style={{ cursor: 'pointer' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageUpload} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </label>
        </div>
        <div className="sp-info">
          <h1>{profileData.fullName}</h1>
          <p>{profileData.phone}</p>
        </div>
      </div>

      <div className="settings-tabs-container">
        <div className="settings-tabs hidden-on-mobile">
          <button 
            className={`set-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t('profileClinic')}
          </button>
          <button 
            className={`set-tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            {t('availabilitySchedule')}
          </button>
          <button 
            className={`set-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            {t('notifications')}
          </button>
        </div>

        <div className="mobile-tabs-dropdown visible-on-mobile" style={{ width: '100%', position: 'relative' }}>
          <button 
            className="mobile-tabs-toggle" 
            onClick={() => setIsTabsMenuOpen(!isTabsMenuOpen)}
            style={{ width: '100%', padding: '12px 16px', background: '#F9FAFA', border: '1px solid #E5E7EB', borderRadius: '8px', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#111827', cursor: 'pointer' }}
          >
            {activeTab === 'profile' ? t('profileClinic') : activeTab === 'availability' ? t('availabilitySchedule') : t('notifications')}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          {isTabsMenuOpen && (
            <div className="mobile-tabs-menu" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB', marginTop: '8px', zIndex: 20, overflow: 'hidden' }}>
              <button 
                style={{ width: '100%', padding: '14px 16px', textAlign: 'start', background: 'none', border: 'none', borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontWeight: activeTab === 'profile' ? '600' : '500', color: activeTab === 'profile' ? '#00AEC0' : '#4B5563', cursor: 'pointer' }}
                onClick={() => { setActiveTab('profile'); setIsTabsMenuOpen(false); }}
              >
                {t('profileClinic')}
              </button>
              <button 
                style={{ width: '100%', padding: '14px 16px', textAlign: 'start', background: 'none', border: 'none', borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontWeight: activeTab === 'availability' ? '600' : '500', color: activeTab === 'availability' ? '#00AEC0' : '#4B5563', cursor: 'pointer' }}
                onClick={() => { setActiveTab('availability'); setIsTabsMenuOpen(false); }}
              >
                {t('availabilitySchedule')}
              </button>
              <button 
                style={{ width: '100%', padding: '14px 16px', textAlign: 'start', background: 'none', border: 'none', fontSize: '14px', fontWeight: activeTab === 'notifications' ? '600' : '500', color: activeTab === 'notifications' ? '#00AEC0' : '#4B5563', cursor: 'pointer' }}
                onClick={() => { setActiveTab('notifications'); setIsTabsMenuOpen(false); }}
              >
                {t('notifications')}
              </button>
            </div>
          )}
        </div>
        {(
          <button 
            className="save-changes-btn"
            onClick={handleSave}
            style={{ 
              backgroundColor: isSaving ? '#10B981' : '',
              color: isSaving ? 'white' : '',
              borderColor: isSaving ? '#10B981' : '',
              transition: 'all 0.3s'
            }}
          >
            {isSaving ? t('saved') : t('saveChanges')}
          </button>
        )}
      </div>

      <div className="settings-content-body">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'availability' && renderAvailabilityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
      </div>

      {/* Warning Modal */}
      {showWarningModal && createPortal(
        <div className="warning-modal-overlay">
          <div className="warning-modal-content">
            <div className="warning-modal-header">
              <div className="warning-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100" fill="none">
                  <path d="M81.291 24.3752L56.541 10.0835C52.4994 7.75016 47.4994 7.75016 43.416 10.0835L18.7077 24.3752C14.666 26.7085 12.166 31.0418 12.166 35.7502V64.2502C12.166 68.9168 14.666 73.2502 18.7077 75.6252L43.4577 89.9168C47.4994 92.2502 52.4994 92.2502 56.5827 89.9168L81.3327 75.6252C85.3744 73.2918 87.8744 68.9585 87.8744 64.2502V35.7502C87.8327 31.0418 85.3327 26.7502 81.291 24.3752ZM46.8744 32.2918C46.8744 30.5835 48.291 29.1668 49.9994 29.1668C51.7077 29.1668 53.1244 30.5835 53.1244 32.2918V54.1668C53.1244 55.8752 51.7077 57.2918 49.9994 57.2918C48.291 57.2918 46.8744 55.8752 46.8744 54.1668V32.2918ZM53.8327 69.2918C53.6244 69.7918 53.3327 70.2502 52.9577 70.6668C52.166 71.4585 51.1244 71.8752 49.9994 71.8752C49.4577 71.8752 48.916 71.7502 48.416 71.5418C47.8744 71.3335 47.4577 71.0418 47.041 70.6668C46.666 70.2502 46.3744 69.7918 46.1244 69.2918C45.916 68.7918 45.8327 68.2502 45.8327 67.7085C45.8327 66.6252 46.2494 65.5418 47.041 64.7502C47.4577 64.3752 47.8744 64.0835 48.416 63.8752C49.9577 63.2085 51.791 63.5835 52.9577 64.7502C53.3327 65.1668 53.6244 65.5835 53.8327 66.1252C54.041 66.6252 54.166 67.1668 54.166 67.7085C54.166 68.2502 54.041 68.7918 53.8327 69.2918Z" fill="#F49E25"/>
                </svg>
              </div>
              <h3>Warning: Scheduled Appointments Exist</h3>
              <p>There are confirmed patient bookings on this date. How would you like to proceed with these appointments?</p>
            </div>
            
            <div className="warning-options-container">
              <div className="warning-option-box">
                <div className="warning-option-text">
                  <h4>Cancel the entire day</h4>
                  <p>All appointments will be canceled</p>
                </div>
                <div className="warning-toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={cancelEntireDay} 
                    onChange={() => {
                      setCancelEntireDay(!cancelEntireDay);
                      if (!cancelEntireDay) setSelectedCancelSlots([]); // Clear slots if entire day is selected
                    }} 
                    id="cancel-day-toggle"
                  />
                  <label htmlFor="cancel-day-toggle"></label>
                </div>
              </div>

              <div className={`warning-option-box slots-box ${cancelEntireDay ? 'disabled' : ''}`}>
                <div className="warning-option-text">
                  <h4 style={{ color: '#F49E25' }}>Cancel specific time slots</h4>
                </div>
                <div className="time-slots-grid">
                  {affectedBookings.length > 0 ? (
                    [...new Set(affectedBookings.map(b => b.time || b.appointmentTime).filter(Boolean))].map(time => {
                      const isSelected = selectedCancelSlots.includes(time);
                      return (
                        <div 
                          key={time} 
                          className={`time-slot-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (cancelEntireDay) return;
                            if (isSelected) {
                              setSelectedCancelSlots(prev => prev.filter(t => t !== time));
                            } else {
                              setSelectedCancelSlots(prev => [...prev, time]);
                            }
                          }}
                        >
                          <div className="time-slot-content">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px', color: '#00AEC0'}}>
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>{time}</span>
                          </div>
                          <div className={`radio-circle ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <div className="inner-circle"></div>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '20px', color: '#6B7280', fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center' }}>
                      No specific time slots found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="warning-modal-actions">
              <button className="keep-schedule-btn" onClick={() => setShowWarningModal(false)}>Keep Schedule</button>
              <button className="confirm-cancel-btn" onClick={handleConfirmWarning}>
                {isSaving ? (
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', color: 'white', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: '500', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999 }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
