import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import notificationIcon from '../assets/Dana - ضنا_icon/Notification Icon.svg';
import badgeIcon from '../assets/Dana - ضنا_icon/Badge.svg';

export default function NotificationBell() {
  const { dashboardNotifications, dashboardUnreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && dashboardUnreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button className="icon-btn-rounded notification-btn" onClick={toggleDropdown} style={{ position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer' }}>
        <img src={notificationIcon} alt="Notifications" width="24" height="24" />
        {dashboardUnreadCount > 0 && (
          <div className="notification-badge" style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {dashboardUnreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 'bold', color: '#111827' }}>
            Notifications
          </div>
          <div className="notification-list">
            {dashboardNotifications.length > 0 ? (
              dashboardNotifications.map(notif => (
                <div key={notif.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  background: notif.read ? 'white' : '#F9FAFB'
                }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827' }}>{notif.title}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>{notif.body}</p>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px', display: 'block' }}>
                    {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
