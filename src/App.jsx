import { Routes, Route, Navigate } from 'react-router-dom';
import doctorImg from './assets/Doctor-rafiki 1.png';
import './App.css';

import Login from './components/Login.jsx';
import ApplyToJoin from './components/ApplyToJoin.jsx';
import OTP from './components/OTP.jsx';
import Done from './components/Done.jsx';
import Dashboard from './components/Dashboard.jsx';
import SuperAdminLogin from './components/SuperAdminLogin.jsx';
import SuperAdmin from './components/SuperAdmin.jsx';

import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';

import { authStorage } from './services/api';

function SuperAdminGuard({ children }) {
  const isLoggedIn = authStorage.isSuperAdminLoggedIn();
  if (!isLoggedIn) {
    // Clear any stale flags
    authStorage.clearSuperAdmin();
    return <Navigate to="/super-admin-login" replace />;
  }
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <Routes>
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/super-admin/*" element={
          <SuperAdminGuard>
            <div className="dashboard-layout">
              <div className="dashboard-content-wrapper" style={{ padding: '24px', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
                <SuperAdmin />
              </div>
            </div>
          </SuperAdminGuard>
        } />
        <Route path="/*" element={
          <div className="login-page">
            <div className="login-left">
              <img src={doctorImg} alt="Doctor" className="hero-img" />
            </div>
            <div className="login-right">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/apply" element={<ApplyToJoin />} />
                <Route path="/otp" element={<OTP />} />
                <Route path="/done" element={<Done />} />
                <Route path="/super-admin-login" element={<SuperAdminLogin />} />
              </Routes>
            </div>
          </div>
        } />
      </Routes>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
