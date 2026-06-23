import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api, authStorage } from '../services/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [globalSocket, setGlobalSocket] = useState(null);
  const [dashboardNotifications, setDashboardNotifications] = useState([]);
  const [dashboardUnreadCount, setDashboardUnreadCount] = useState(0);
  const [doctorInitial, setDoctorInitial] = useState('');
  const [doctorProfilePic, setDoctorProfilePic] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getDoctorProfile();
        if (data?.doctorName) {
          setDoctorInitial(data.doctorName.charAt(0).toUpperCase());
        }
        if (data?.profileImage) {
          setDoctorProfilePic(data.profileImage);
        }
      } catch (err) {
        console.warn('Failed to fetch doctor profile:', err);
      }
    };
    fetchProfile();
    const doctorId = authStorage.getDoctorId();
    if (!doctorId) return;

    const newSocket = io('https://rhostdev.qzz.io');
    setGlobalSocket(newSocket);

    newSocket.emit('setup', doctorId);

    newSocket.on('getNotification', (data) => {
      console.log('Global Notification received:', data);
      
      // Filter out message notifications from the global dashboard bell
      // Adjust the condition based on how your backend identifies chat messages
      const isMessage = data.type === 'message' || 
                        data.type === 'MESSAGE' || 
                        data.type === 'chat' ||
                        (data.title && data.title.toLowerCase().includes('message')) ||
                        (data.body && data.body.toLowerCase().includes('message'));
      
      if (!isMessage) {
        setDashboardNotifications(prev => [{
          id: Date.now(),
          title: data.title || 'New Notification',
          body: data.body || data.message || '',
          time: new Date().toISOString(),
          read: false,
          senderId: data.senderId || '',
        }, ...prev]);
        setDashboardUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markAllAsRead = () => {
    setDashboardUnreadCount(0);
    setDashboardNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ 
      globalSocket, 
      dashboardNotifications, 
      dashboardUnreadCount, 
      markAllAsRead,
      doctorInitial,
      doctorProfilePic
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
