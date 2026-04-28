import React, { useState, useRef, useEffect } from 'react';
import './Messages.css';
import emptyStateImg from '../assets/Dana - ضنا_img/_Empty state item.png';
import { useLanguage } from '../context/LanguageContext';

const contactsData = [
  { id: 1, name: 'Ethan Smith', avatarText: 'E', snippet: "Paul - Come around at my house, I'm making food f...", time: '12:00 PM', unread: false },
  { id: 2, name: 'Ava Williams', avatarText: 'A', snippet: "I found this amazing book the other day at the librar...", time: 'Yesterday', unread: true },
  { id: 3, name: 'Isabella Rais', avatarText: 'I', snippet: "Did you find out about the missing cup in the kitchen?", time: 'Monday', unread: false },
  { id: 4, name: 'Lana Steiner', avatarText: 'L', snippet: "What do you think about this report?", time: 'Monday', unread: false },
  { id: 5, name: 'Laura Coppen', avatarText: 'LC', snippet: "Hello! Check out this post, it's unbelievable.", time: 'Sunday', unread: false },
  { id: 6, name: 'Oscar Roe', avatarText: 'O', snippet: "Sam Ottman - Come around at my house, I'm makin...", time: 'Last week', unread: false },
  { id: 7, name: 'Support', avatarText: 'S', snippet: "Pedro Rivera (Technical support) - Hello! I'm here t...", time: 'Last month', unread: false },
];

export default function Messages({ setIsSidebarOpen }) {
  const { t } = useLanguage();
  const [activeChat, setActiveChat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Default messages for each contact
  const getDefaultMessages = (contact) => [
    { id: 1, sender: contact.name, text: "Hey! Here's the report for this year, please have a look.", time: 'Monday 4:23pm', type: 'received' },
    { id: 2, sender: 'You', text: "Thanks! It looks all good to me.", time: 'Thursday 11:41am', type: 'sent' },
    { id: 3, sender: contact.name, text: "I submitted the report this morning, I'll let you know if anything comes up.", time: 'Monday 4:23pm', type: 'received' },
  ];

  const getMessages = (contactId) => {
    if (!contactId) return [];
    if (!chatMessages[contactId]) {
      const contact = contactsData.find(c => c.id === contactId);
      return contact ? getDefaultMessages(contact) : [];
    }
    return chatMessages[contactId];
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !activeChat) return;
    const contactId = activeChat.id;
    const currentMsgs = chatMessages[contactId] || getDefaultMessages(activeChat);
    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: messageInput.trim(),
      time: 'Just now',
      type: 'sent'
    };
    setChatMessages(prev => ({ ...prev, [contactId]: [...currentMsgs, newMsg] }));
    setMessageInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileAttach = (e) => {
    if (!e.target.files?.length || !activeChat) return;
    const file = e.target.files[0];
    const contactId = activeChat.id;
    const currentMsgs = chatMessages[contactId] || getDefaultMessages(activeChat);
    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: `📎 ${file.name}`,
      time: 'Just now',
      type: 'sent'
    };
    setChatMessages(prev => ({ ...prev, [contactId]: [...currentMsgs, newMsg] }));
    e.target.value = '';
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  // Filter contacts by search
  const filteredContacts = contactsData.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactClick = (contact) => {
    setActiveChat(contact);
    setShowProfile(false);
  };

  const renderSidebar = () => (
    <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
      <div className="chat-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h2>{t('chats')}</h2>
        </div>
        <button className="add-chat-btn" title="New Chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      <div className="chat-search-wrap">
        <svg className="chat-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" className="chat-search-input" placeholder={t('searchHere')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="chat-list">
        {filteredContacts.map(c => (
          <div key={c.id} className={`chat-list-item ${activeChat?.id === c.id ? 'active' : ''} ${c.unread ? 'unread' : ''}`} onClick={() => handleContactClick(c)}>
            <div className="chat-list-avatar" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'#E8F8F9', color:'#00AEC0', fontWeight:'600'}}>
              {c.avatarText}
            </div>
            <div className="chat-list-info">
              <h4 className="chat-list-name">{c.name}</h4>
              <p className="chat-list-snippet">{c.snippet}</p>
            </div>
          </div>
        ))}
        {filteredContacts.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No contacts found</div>
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
    const messages = getMessages(activeChat?.id);
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
              <p>+32658029525</p>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div className={`message-row ${msg.type}`} key={msg.id}>
              <div className="message-meta">
                {msg.type === 'received' && <span className="message-sender">{msg.sender}</span>}
                <span className="message-time">{msg.time}</span>
                {msg.type === 'sent' && <span className="message-sender">{t('you')}</span>}
              </div>
              <div className="message-bubble">{msg.text}</div>
            </div>
          ))}
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

  const renderProfilePanel = () => (
    <div className="chat-profile-panel">
      <div className="profile-cover">
        <button className="profile-close-btn" onClick={() => setShowProfile(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div className="profile-header-info">
        <div className="profile-large-avatar">{activeChat.avatarText}</div>
        <h2 className="profile-name">{activeChat.name}</h2>
        <p className="profile-phone">+32658029525</p>
      </div>
      <div className="profile-section">
        <h3 className="profile-section-title">{t('statusLabel')}</h3>
        <p className="profile-status-text">When there's no more hope, think of the lobster in the restaurant's aquarium of the Titanic.</p>
      </div>
      <div className="profile-section">
        <h3 className="profile-section-title">{t('savedMessages')}</h3>
        <div className="saved-message-card">
          <div className="smc-header">
            <div className="smc-avatar">{activeChat.avatarText}</div>
            <div className="smc-info"><h4>{activeChat.name}</h4><p>Yesterday at 9:54 AM</p></div>
            <svg className="smc-star" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <p className="smc-body">Take a look at my latest design exploration about article detail page.</p>
        </div>
        <a className="show-more-link">{t('showMore')}</a>
      </div>
    </div>
  );

  return (
    <div className="messages-dashboard">
      {renderSidebar()}
      {!activeChat ? renderEmptyState() : renderChatWindow()}
      {activeChat && showProfile && renderProfilePanel()}
    </div>
  );
}
