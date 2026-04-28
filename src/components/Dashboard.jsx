import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainDashboard from './MainDashboard';
import RightSidebar from './RightSidebar';
import Patients from './Patients';
import Schedule from './Schedule';
import Messages from './Messages';
import Settings from './Settings';
import '../Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  // Get active tab from current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/patients')) return 'patients';
    if (path.includes('/schedule')) return 'schedule';
    if (path.includes('/messages')) return 'messages';
    if (path.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  return (
    <div className="dashboard-layout">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <Sidebar 
        activeTab={getActiveTab()} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        closeSidebar={() => setIsSidebarOpen(false)} 
      />
      <div className="dashboard-content-wrapper">
        <Routes>
          <Route path="/" element={
            <div className="home-dashboard-wrapper">
              <MainDashboard setIsSidebarOpen={setIsSidebarOpen} />
              <RightSidebar />
            </div>
          } />
          <Route path="/patients" element={<Patients setIsSidebarOpen={setIsSidebarOpen} />} />
          <Route path="/schedule" element={<Schedule setIsSidebarOpen={setIsSidebarOpen} />} />
          <Route path="/messages" element={<Messages setIsSidebarOpen={setIsSidebarOpen} />} />
          <Route path="/settings" element={<Settings setIsSidebarOpen={setIsSidebarOpen} />} />
        </Routes>
      </div>
    </div>
  );
}

