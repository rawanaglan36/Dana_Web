import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Messages.css';
import emptyStateImg from '../assets/Dana - ضنا_img/_Empty state item.png';
import { useLanguage } from '../context/LanguageContext';
import { api, authStorage } from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://rhostdev.qzz.io/';

export default function Messages({ setIsSidebarOpen }) {
  const { t, isRTL } = useLanguage();
  const [activeChat, setActiveChat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const doctorId = authStorage.getDoctorId();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!doctorId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(' Socket connected:', socket.id);
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log(' Socket disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Confirmation of room join
    socket.on('joinedRoom', (data) => {
      console.log('Joined Room:', data);
    });

    // Track online users
    socket.on('getUsers', (users) => {
      console.log('Online Users:', users);
      setOnlineUsers(Array.isArray(users) ? users : []);
    });

    // Listen for incoming messages
    socket.on('getMessage', (data) => {
      console.log(' Received message:', data);
      if (data.roomId) {
        const newMsg = {
          _id: data._id || Date.now().toString(),
          senderId: data.senderId,
          receiverId: data.receiverId,
          senderModel: data.senderModel,
          message: data.message,
          type: data.type || 'TEXT',
          createdAt: data.createdAt || new Date().toISOString(),
          roomId: data.roomId,
        };
        setChatMessages(prev => {
          const existing = prev[data.roomId] || [];
          // Avoid duplicates
          if (existing.find(m => m._id === newMsg._id)) return prev;
          return { ...prev, [data.roomId]: [...existing, newMsg] };
        });

        // Mark as delivered if it's not from us
        if (data.senderId !== doctorId && data._id) {
          api.markMessageDelivered(data._id).catch(() => {});
        }

        // Update contact snippet and unread badge for messages not in active chat
        if (data.senderId !== doctorId) {
          setContacts(prev => prev.map(c => {
            if (c.roomId === data.roomId || c.parentId === data.senderId) {
              return { ...c, snippet: data.message, unread: true, time: 'Just now', timestamp: Date.now() };
            }
            return c;
          }));
        }
      }
    });

    // Listen for notifications
    socket.on('getNotification', (data) => {
      console.log('Notification received in Chat:', data);
      const isMessage = data.type === 'message' || 
                        data.type === 'MESSAGE' || 
                        data.type === 'chat' ||
                        (data.title && data.title.toLowerCase().includes('message')) ||
                        (data.body && data.body.toLowerCase().includes('message'));
      
      if (isMessage) {
        setNotifications(prev => [{
          id: Date.now(),
          title: data.title || 'New Message',
          body: data.body || data.message || '',
          time: new Date().toISOString(),
          read: false,
          senderId: data.senderId || '',
        }, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [doctorId]);

  // ========== LOAD CONTACTS FROM PATIENTS API ==========
  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await api.getPatients();
        const patients = data?.patients ?? [];
        // Group by parentId since chat is between Doctor and Parent (not child)
        const parentMap = new Map();
        patients.forEach(p => {
          const pid = p.parentId || '';
          if (!pid) return;
          if (!parentMap.has(pid)) {
            parentMap.set(pid, {
              parentId: pid,
              children: [],
              bookingId: p.bookingId || p._id || '',
              lastBookingDate: p.lastBookingDate || '',
            });
          }
          parentMap.get(pid).children.push({
            childName: p.childName || 'Unknown',
            childId: p.childId || '',
            age: p.age,
          });
          // Use latest booking date
          if (p.lastBookingDate && p.lastBookingDate > parentMap.get(pid).lastBookingDate) {
            parentMap.get(pid).lastBookingDate = p.lastBookingDate;
          }
        });

        const contactsList = Array.from(parentMap.values()).map((parent, idx) => {
          const childNames = parent.children.map(c => c.childName).join(', ');
          const displayName = parent.children.length === 1
            ? `${parent.children[0].childName}'s Parent`
            : `Parent of ${childNames}`;
          return {
            id: idx + 1,
            name: displayName,
            parentId: parent.parentId,
            childId: parent.children[0]?.childId || '',
            children: parent.children,
            bookingId: parent.bookingId,
            avatarText: displayName.charAt(0).toUpperCase(),
            roomId: null,
            snippet: parent.lastBookingDate ? `Last visit: ${parent.lastBookingDate}` : 'No messages yet',
            time: parent.lastBookingDate || '',
            timestamp: parent.lastBookingDate ? new Date(parent.lastBookingDate).getTime() : 0,
            unread: false,
            age: parent.children[0]?.age,
          };
        });

        setContacts(contactsList);

        // Load unread messages to set badges
        try {
          const unread = await api.getUnreadMessages();
          if (Array.isArray(unread) && unread.length > 0) {
            // Group unread by parentId to mark contacts
            const unreadParents = new Set(unread.map(m => m.parentId));
            setContacts(prev => prev.map(c => ({
              ...c,
              unread: unreadParents.has(c.parentId),
              snippet: unreadParents.has(c.parentId)
                ? unread.find(m => m.parentId === c.parentId)?.message || c.snippet
                : c.snippet,
            })));
          }
        } catch {}
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
      setLoadingContacts(false);
    }
    loadContacts();
  }, []);

  const handleDeleteMessage = async (msgId, roomId) => {
    // Optimistically remove from UI
    setChatMessages(prev => {
      const roomMsgs = prev[roomId] || [];
      return { ...prev, [roomId]: roomMsgs.filter(m => m._id !== msgId) };
    });

    try {
      await api.deleteMessage(msgId);
    } catch (err) {
      console.warn('Backend message delete failed or not implemented:', err.message);
      // Optional: show Toast
    }
  };

  // ========== JOIN ROOM & LOAD MESSAGES WHEN CHAT IS OPENED ==========
  const openChat = useCallback(async (contact) => {
    setActiveChat(contact);
    setShowProfile(false);
    setLoadingMessages(true);

    console.log('💬 Opening chat for:', contact.name, contact);

    try {
      let roomId = contact.roomId;
      let parentId = contact.parentId;
      
      // Step 1: Try to create/get conversation by booking
      if (!roomId && contact.bookingId) {
        console.log('📞 Creating conversation with bookingId:', contact.bookingId);
        try {
          const convData = await api.createConversationByBooking(contact.bookingId);
          console.log('📞 Conversation response:', convData);
          if (convData?.roomId) {
            roomId = convData.roomId;
            parentId = convData.parentId || parentId;
          }
        } catch (err) {
          console.warn('⚠️ createConversationByBooking failed:', err.message);
        }
      }

      // Step 2: Fallback - build roomId from parentId + doctorId
      if (!roomId && parentId && doctorId) {
        roomId = `${parentId}_${doctorId}`;
        console.log('🔧 Built roomId from parentId+doctorId:', roomId);
      }

      // Update activeChat and contacts with the roomId
      if (roomId) {
        setActiveChat(prev => ({ ...prev, roomId, parentId }));
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, roomId, parentId } : c
        ));

        // Step 3: Join the socket room
        if (socketRef.current?.connected) {
          socketRef.current.emit('joinRoom', {
            userId: doctorId,
            roomId: roomId,
          });
          console.log('🏠 Joined room:', roomId);
        } else {
          console.warn('⚠️ Socket not connected, cannot join room');
        }

        // Step 4: Load existing messages
        try {
          const messages = await api.getMessagesByRoom(roomId);
          console.log('📨 Loaded messages:', messages?.length || 0);
          if (Array.isArray(messages)) {
            setChatMessages(prev => ({ ...prev, [roomId]: messages }));
            
            // Mark unread messages as read
            messages.forEach(msg => {
              if (msg.senderId !== doctorId && !msg.readAt) {
                api.markMessageRead(msg._id).catch(() => {});
              }
            });
          }
        } catch (err) {
          console.warn('⚠️ getMessagesByRoom failed:', err.message);
          setChatMessages(prev => ({ ...prev, [roomId]: [] }));
        }
      } else {
        console.error('❌ Cannot open chat: no roomId could be determined');
      }
    } catch (err) {
      console.error('❌ Failed to open chat:', err);
    }
    setLoadingMessages(false);
  }, [doctorId]);

  // ========== AUTO-OPEN CHAT FROM URL PARAMS (e.g. from Schedule Message button) ==========
  const location = useLocation();
  const [autoOpenHandled, setAutoOpenHandled] = useState(false);

  useEffect(() => {
    if (autoOpenHandled || loadingContacts) return;
    const params = new URLSearchParams(location.search);
    const patientName = params.get('patientName');
    const parentId = params.get('parentId');
    const childId = params.get('childId');
    const bookingId = params.get('bookingId');

    if (patientName || parentId) {
      setAutoOpenHandled(true);
      console.log('🔗 Auto-opening chat from URL params:', { patientName, parentId, childId, bookingId });

      // Try to find existing contact
      const existing = contacts.find(c => 
        (patientName && c.name.toLowerCase() === patientName.toLowerCase()) ||
        (parentId && c.parentId === parentId) ||
        (childId && c.childId === childId)
      );

      if (existing) {
        openChat(existing);
      } else {
        // Create a temporary contact entry
        const tempContact = {
          id: Date.now(),
          name: patientName || 'Patient',
          parentId: parentId || '',
          childId: childId || '',
          bookingId: bookingId || '',
          avatarText: (patientName || 'P').charAt(0).toUpperCase(),
          roomId: null,
          snippet: 'New conversation',
          time: 'Now',
          timestamp: Date.now(),
          unread: false,
          age: '',
        };
        setContacts(prev => [tempContact, ...prev]);
        openChat(tempContact);
      }
    }
  }, [loadingContacts, contacts, location.search, autoOpenHandled, openChat]);

  // ========== SEND MESSAGE ==========
  const sendMessage = useCallback(() => {
    if (!messageInput.trim() || !activeChat) return;

    let roomId = activeChat.roomId;
    
    // Try to build roomId if missing
    if (!roomId && activeChat.parentId && doctorId) {
      roomId = `${activeChat.parentId}_${doctorId}`;
      setActiveChat(prev => ({ ...prev, roomId }));
      console.log('🔧 Built roomId for sending:', roomId);
    }

    if (!roomId) {
      console.error('❌ Cannot send: no roomId available. activeChat:', activeChat);
      return;
    }

    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected, message will be sent when reconnected');
      // Still add it locally for now
    }

    const msgPayload = {
      roomId,
      senderId: doctorId,
      receiverId: activeChat.parentId,
      senderModel: 'Doctor',
      message: messageInput.trim(),
      parentId: activeChat.parentId,
      doctorId: doctorId,
      type: 'TEXT',
    };

    console.log('📤 Sending message:', msgPayload);
    if (socketRef.current?.connected) {
      // Make sure we're in the room
      socketRef.current.emit('joinRoom', { userId: doctorId, roomId });
      socketRef.current.emit('sendMessage', msgPayload);
    } else {
      console.warn('⚠️ Socket disconnected, message saved locally only');
    }

    // Optimistic UI: add message locally
    const localMsg = {
      _id: `local-${Date.now()}`,
      senderId: doctorId,
      receiverId: activeChat.parentId,
      senderModel: 'Doctor',
      message: messageInput.trim(),
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      roomId,
    };

    setChatMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), localMsg],
    }));

    // Update snippet in contact list and set timestamp to sort newest
    setContacts(prev => prev.map(c =>
      c.id === activeChat.id
        ? { ...c, snippet: messageInput.trim(), time: 'Just now', timestamp: Date.now() }
        : c
    ));

    setMessageInput('');
  }, [messageInput, activeChat, doctorId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = (e) => {
    if (!e.target.files?.length || !activeChat) return;
    const file = e.target.files[0];
    // For now, just show file name as message
    const roomId = activeChat.roomId;
    if (roomId) {
      const localMsg = {
        _id: `local-${Date.now()}`,
        senderId: doctorId,
        senderModel: 'Doctor',
        message: `📎 ${file.name}`,
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        roomId,
      };
      setChatMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), localMsg],
      }));
    }
    e.target.value = '';
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  // Filter contacts by search and sort by newest first
  const filteredContacts = [...contacts]
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // ========== FORMAT TIME ==========
  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ========== RENDER ==========
  const renderSidebar = () => (
    <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
      <div className="chat-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h2>{t('chats')}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="add-chat-btn"
              title="Notifications"
              onClick={() => setShowNotifications(p => !p)}
              style={{ position: 'relative' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#EF4444', color: '#fff', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute', top: '110%', right: '0', width: '280px',
                maxWidth: 'calc(100vw - 32px)',
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: '350px', overflow: 'auto',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Notifications</h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      style={{ background: 'none', border: 'none', fontSize: '12px', color: '#00AEC0', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                      style={{
                        padding: '10px 16px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer',
                        background: n.read ? 'transparent' : '#F0FDFE',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🔔</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
                        </div>
                        <span style={{ fontSize: '10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{formatMessageTime(n.time)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="add-chat-btn" title="New Chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
      <div className="chat-search-wrap">
        <svg className="chat-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" className="chat-search-input" placeholder={t('searchHere')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="chat-list">
        {loadingContacts ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            <div style={{ width: 20, height: 20, border: '2px solid #00AEC0', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
            {t('loading') || 'Loading contacts...'}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            {t('noContactsFound') || 'No contacts found'}
          </div>
        ) : (
          filteredContacts.map(c => (
            <div key={c.id} className={`chat-list-item ${activeChat?.id === c.id ? 'active' : ''} ${c.unread ? 'unread' : ''}`} onClick={() => openChat(c)}>
              <div className="chat-list-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8F8F9', color: '#00AEC0', fontWeight: '600' }}>
                {c.avatarText}
              </div>
              <div className="chat-list-info">
                <h4 className="chat-list-name">{c.name}</h4>
                <p className="chat-list-snippet">{c.snippet}</p>
              </div>
              {c.unread && (
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00AEC0', flexShrink: 0 }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="chat-main-area mobile-hidden">
      <div className="chat-empty-state">
        <div className="chat-empty-graphic"><img src={emptyStateImg} alt="Messenger" /></div>
        <h3>{t('messenger')}</h3>
        <p>{t('messengerEncrypted')}</p>
      </div>
    </div>
  );

  const renderChatWindow = () => {
    const roomId = activeChat?.roomId;
    const messages = roomId ? (chatMessages[roomId] || []) : [];

    return (
      <div className="chat-main-area">
        <div className="chat-window-header" onClick={() => setShowProfile(!showProfile)}>
          <div className="cwh-left">
            <button className="chat-back-btn" onClick={(e) => { e.stopPropagation(); setActiveChat(null); setShowProfile(false); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div className="cwh-avatar">{activeChat.avatarText}</div>
            <div className="cwh-info">
              <h3>{activeChat.name}</h3>
              <p style={{ color: '#9CA3AF', fontSize: '12px' }}>
                {activeChat.age ? `${activeChat.age} ${t('years') || 'years'}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {loadingMessages ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9CA3AF', gap: '10px' }}>
              <div style={{ width: 20, height: 20, border: '2px solid #00AEC0', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              {t('loadingMessages') || 'Loading messages...'}
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#9CA3AF', gap: '8px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p style={{ fontSize: '14px', margin: 0 }}>{t('noMessagesYet') || 'No messages yet. Start the conversation!'}</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSent = msg.senderId === doctorId;
              const msgId = msg._id || idx;
              return (
                <div 
                  className={`message-row ${isSent ? 'sent' : 'received'}`} 
                  key={msgId}
                  onMouseEnter={() => isSent && setHoveredMessageId(msgId)}
                  onMouseLeave={() => isSent && setHoveredMessageId(null)}
                >
                  <div className="message-meta">
                    {!isSent && <span className="message-sender">{activeChat.name}</span>}
                    <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                    {isSent && <span className="message-sender">{t('you') || 'You'}</span>}
                  </div>
                  <div className="message-bubble" style={{ position: 'relative' }}>
                    {msg.message}
                    {isSent && hoveredMessageId === msgId && (
                      <button
                        onClick={() => handleDeleteMessage(msgId, activeChat.roomId)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          left: isRTL ? '-8px' : 'auto',
                          right: isRTL ? 'auto' : '-8px',
                          background: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          zIndex: 10,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title={t('delete') || 'Delete'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                  {isSent && (
                    <div style={{ alignSelf: 'flex-end', fontSize: '10px', color: '#9CA3AF', marginTop: '-2px' }}>
                      {msg.readAt ? '✓✓' : msg.deliveredAt ? '✓✓' : '✓'}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileAttach} />
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button className="chat-attach-btn" onClick={() => fileInputRef.current?.click()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>
            <input type="text" className="chat-input" placeholder={t('typeHere')} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={handleKeyDown} />
            <div className="chat-actions">
              <button className="chat-emoji-btn" onClick={() => setMessageInput(prev => prev + '😊')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
              </button>
              <button className="chat-send-btn" onClick={sendMessage}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfilePanel = () => {
    const roomMessages = activeChat?.roomId ? (chatMessages[activeChat.roomId] || []) : [];
    const lastReceivedMsg = [...roomMessages].reverse().find(m => m.senderId !== doctorId);
    
    return (
    <div className="chat-profile-panel">
      <div className="profile-cover">
        <button className="profile-close-btn" onClick={() => setShowProfile(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        {/* Code/Dev icon in top right corner */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
      </div>
      <div className="profile-header-info">
        <div className="profile-large-avatar">{activeChat.avatarText}</div>
        <h2 className="profile-name">{activeChat.name}</h2>
        <p className="profile-phone">
          {activeChat.children?.length 
            ? activeChat.children.map(c => c.childName).join(', ')
            : activeChat.parentId ? `ID: ${activeChat.parentId.slice(-8)}` : ''}
        </p>
      </div>
      <div className="profile-section">
        <h3 className="profile-section-title">{t('statusLabel') || 'Status'}</h3>
        <p className="profile-status-text">
          {activeChat.children?.length 
            ? `Parent of ${activeChat.children.map(c => `${c.childName} (${c.age || '?'} yrs)`).join(', ')}`
            : 'Active parent'}
        </p>
      </div>
      <div className="profile-section">
        <h3 className="profile-section-title">{t('savedMessages') || 'Saved messages'}</h3>
        {lastReceivedMsg ? (
          <div className="saved-message-card">
            <div className="smc-header">
              <div className="smc-avatar">{activeChat.avatarText}</div>
              <div className="smc-info">
                <h4>{activeChat.name}</h4>
                <p>{formatMessageTime(lastReceivedMsg.createdAt)}</p>
              </div>
              <svg className="smc-star" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <p className="smc-body">{lastReceivedMsg.message}</p>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{t('noSavedMessages') || 'No saved messages yet'}</p>
        )}
        <a className="show-more-link">{t('showMore') || 'Show more'}</a>
      </div>
    </div>
    );
  };

  return (
    <div className="messages-dashboard">
      {renderSidebar()}
      {!activeChat ? renderEmptyState() : renderChatWindow()}
      {activeChat && showProfile && renderProfilePanel()}
    </div>
  );
}
