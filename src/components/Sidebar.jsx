import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/Group.png';
import dashIcon from '../assets/Dana - ضنا_icon/vuesax copy/outline/element-4.svg';
import schedIcon from '../assets/Dana - ضنا_icon/vuesax copy/outline/menu-board.svg';
import patIcon from '../assets/Dana - ضنا_icon/vuesax copy 2/outline/profile-2user.svg';
import msgIcon from '../assets/Dana - ضنا_icon/vuesax copy/outline/messages.svg';
import setIcon from '../assets/Dana - ضنا_icon/vuesax copy/outline/setting-2.svg';
import logoutIcon from '../assets/Dana - ضنا_icon/vuesax copy/bold/logout.svg';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeTab, onLogout, isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigation = (path) => {
    navigate(path);
    if (closeSidebar) closeSidebar();
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <img src={logoImg} alt="Dana Logo" />
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">{t('main')}</p>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard'); }}>
            <img src={dashIcon} alt="Dashboard" width="20" height="20" />
            <span>{t('dashboard')}</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard/schedule'); }}>
            <img src={schedIcon} alt="Schedule" width="20" height="20" />
            <span>{t('schedule')}</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard/patients'); }}>
            <img src={patIcon} alt="Patients" width="20" height="20" />
            <span>{t('patients')}</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard/messages'); }}>
            <img src={msgIcon} alt="Messages" width="20" height="20" />
            <span>{t('messages')}</span>
          </a>
        </nav>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">{t('settingsSection')}</p>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard/settings'); }}>
            <img src={setIcon} alt="Settings" width="20" height="20" />
            <span>{t('settings')}</span>
          </a>
        </nav>
      </div>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-logout">
        <a href="#" className="nav-item text-error" onClick={(e) => { e.preventDefault(); onLogout && onLogout(); }}>
          <img src={logoutIcon} alt="Log out" width="20" height="20" />
          <span>{t('logout')}</span>
        </a>
      </div>
    </aside>
  );
}
