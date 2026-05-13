import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './SuperAdmin.css';
import { api, authStorage } from '../services/api';
import searchIcon from '../assets/Dana - ضنا_icon/Table/Tags/Icon-1.svg';

export default function SuperAdmin({ setIsSidebarOpen }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [doctorToToggle, setDoctorToToggle] = useState(null);
  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  const [doctorToVerify, setDoctorToVerify] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState(null);

  const fetchDoctors = () => {
    setLoading(true);
    api.getAllDoctors()
      .then(data => {
        setDoctors(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch doctors:', err);
        showToast('Failed to fetch doctors');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleCreatePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.adminSignup(selectedDoctor._id, {
        email: selectedDoctor.email,
        phone: selectedDoctor.phone,
        password: newPassword
      });
      showToast('Password created successfully & doctor verified!');
      setPasswordModalOpen(false);
      setNewPassword('');
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to create password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!doctorToToggle) return;
    setIsSubmitting(true);
    try {
      await api.toggleDoctorStatus(doctorToToggle._id, !doctorToToggle.isActive);
      showToast(`Doctor ${doctorToToggle.isActive ? 'deactivated' : 'activated'} successfully!`);
      setConfirmModalOpen(false);
      setDoctorToToggle(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to change status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!doctorToVerify) return;
    setIsSubmitting(true);
    try {
      await api.toggleDoctorVerified(doctorToVerify._id, !doctorToVerify.isVerified);
      showToast(`Doctor ${doctorToVerify.isVerified ? 'unverified' : 'verified'} successfully!`);
      setConfirmVerifyOpen(false);
      setDoctorToVerify(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to change verified status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsSubmitting(true);
    try {
      await api.deleteDoctor(doctorToDelete._id);
      showToast(`Doctor deleted successfully!`);
      setConfirmDeleteOpen(false);
      setDoctorToDelete(null);
      fetchDoctors();
    } catch (err) {
      showToast(err.message || 'Failed to delete doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(d =>
    (d.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phone || '').includes(searchTerm)
  );

  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.isActive).length;
  const verifiedDoctors = doctors.filter(d => d.isVerified).length;
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  return (
    <div className="super-admin-dashboard">
      <header className="sa-header">
        <div className="sa-header-left">
          <button className="sa-icon-btn" onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1>Platform Overview</h1>
        </div>
        <div className="sa-header-actions">
          <button
            onClick={() => {
              authStorage.clearSuperAdmin();
              navigate('/super-admin-login', { replace: true });
            }}
            style={{
              background: 'none',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
          <div className="sa-avatar">SA</div>
        </div>
      </header>

      <div className="sa-kpi-row">
        <div className="sa-kpi-card">
          <div className="sa-kpi-icon kpi-blue">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
          </div>
          <div className="sa-kpi-content">
            <p>Total Registered Doctors</p>
            {loading ? <div className="sa-skeleton" style={{ height: '32px', width: '60px', marginTop: '4px' }}></div> : <h2>{totalDoctors}</h2>}
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-icon kpi-emerald">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
          </div>
          <div className="sa-kpi-content">
            <p>Active Doctors</p>
            {loading ? <div className="sa-skeleton" style={{ height: '32px', width: '60px', marginTop: '4px' }}></div> : <h2>{activeDoctors}</h2>}
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-icon kpi-purple">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
          </div>
          <div className="sa-kpi-content">
            <p>Verified Profiles</p>
            {loading ? <div className="sa-skeleton" style={{ height: '32px', width: '60px', marginTop: '4px' }}></div> : <h2>{verifiedDoctors}</h2>}
          </div>
        </div>
      </div>

      <div className="sa-directory">
        <div className="sa-dir-header">
          <div className="sa-dir-title-wrapper">
            <div className="sa-dir-title">
              <div className="sa-dir-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2>Doctors Directory</h2>
              <span className="sa-dir-badge">{totalDoctors} Total</span>
            </div>
            <p>Manage access, verify profiles, and update status</p>
          </div>
          <div className="sa-search">
            <img src={searchIcon} alt="Search" width="18" height="18" style={{ opacity: 0.5 }} />
            <input
              type="text"
              name="sa-search-input"
              autoComplete="off"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Contact Details</th>
                <th>Specialty</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td>
                      <div className="sa-doctor-name">
                        <div className="sa-skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }}></div>
                        <div className="sa-skeleton" style={{ width: '120px', height: '16px' }}></div>
                      </div>
                    </td>
                    <td>
                      <div className="sa-skeleton" style={{ width: '100px', height: '14px', marginBottom: '8px' }}></div>
                      <div className="sa-skeleton" style={{ width: '140px', height: '12px' }}></div>
                    </td>
                    <td><div className="sa-skeleton" style={{ width: '80px', height: '14px' }}></div></td>
                    <td><div className="sa-skeleton" style={{ width: '70px', height: '28px', borderRadius: '100px' }}></div></td>
                    <td><div className="sa-skeleton" style={{ width: '75px', height: '24px', borderRadius: '100px' }}></div></td>
                    <td><div className="sa-skeleton" style={{ width: '95px', height: '32px', borderRadius: '100px' }}></div></td>
                  </tr>
                ))
              ) : filteredDoctors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                  No doctors found matching your criteria.
                </td></tr>
              ) : (
                filteredDoctors
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((doctor, idx) => (
                    <tr key={doctor._id || idx}>
                      <td>
                        <div
                          className="sa-doctor-name"
                          style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#00AEC0'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#0F172A'}
                          onClick={() => {
                            setViewDoctor(doctor);
                            setDetailsModalOpen(true);
                          }}
                          title="Click to view full details"
                        >
                          <div className="sa-doc-avatar">
                            {doctor.profileImage ? (
                              <img src={doctor.profileImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                            ) : (
                              (doctor.doctorName || 'D')[0].toUpperCase()
                            )}
                          </div>
                          {doctor.doctorName || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div>{doctor.phone}</div>
                        <div className="sa-email">{doctor.email}</div>
                      </td>
                      <td>{doctor.specialty || 'N/A'}</td>
                      <td>
                        <button
                          className={`sa-btn-toggle ${doctor.isActive ? 'sa-btn-inactive' : 'sa-btn-active'}`}
                          title={doctor.isActive ? "Click to Deactivate" : "Click to Activate"}
                          onClick={() => {
                            setDoctorToToggle(doctor);
                            setConfirmModalOpen(true);
                          }}
                        >
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`sa-btn-toggle ${doctor.isVerified ? 'sa-btn-inactive' : 'sa-btn-active'}`}
                          title={doctor.isVerified ? "Click to Unverify" : "Click to Verify"}
                          onClick={() => {
                            setDoctorToVerify(doctor);
                            setConfirmVerifyOpen(true);
                          }}
                        >
                          {doctor.isVerified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td>
                        <div className="sa-actions">
                          <button
                            className="sa-btn-create"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setPasswordModalOpen(true);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Set Password
                          </button>
                          <button
                            className="sa-btn-delete"
                            onClick={() => { setDoctorToDelete(doctor); setConfirmDeleteOpen(true); }}
                            title="Delete Doctor"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sa-pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`sa-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {passwordModalOpen && selectedDoctor && createPortal(
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <h3>Verify Doctor Profile</h3>
            <p>Set an initial password to verify <strong>{selectedDoctor.doctorName}</strong>'s account and grant them access.</p>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748B', marginBottom: '8px', fontWeight: '500' }}>New Password</label>
              <input
                type="password"
                name="new-doc-password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="sa-input"
              />
            </div>

            <div className="sa-modal-actions">
              <button
                className="sa-modal-btn-cancel"
                onClick={() => { setPasswordModalOpen(false); setNewPassword(''); setSelectedDoctor(null); }}
              >
                Cancel
              </button>
              <button
                className="sa-modal-btn-confirm"
                onClick={handleCreatePasswordSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Verified Toggle Modal */}
      {confirmVerifyOpen && doctorToVerify && createPortal(
        <div className="sa-modal-overlay" onClick={() => setConfirmVerifyOpen(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Verified Status</h3>
            <p>
              Are you sure you want to <strong>{doctorToVerify.isVerified ? 'unverify' : 'verify'}</strong> the profile for <strong>{doctorToVerify.doctorName}</strong>?
            </p>
            <div className="sa-modal-actions">
              <button className="sa-modal-btn-cancel" onClick={() => { setConfirmVerifyOpen(false); setDoctorToVerify(null); }}>
                Cancel
              </button>
              <button
                className={`sa-modal-btn-confirm ${doctorToVerify.isVerified ? 'sa-modal-btn-danger' : ''}`}
                onClick={handleToggleVerified}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Yes, ${doctorToVerify.isVerified ? 'Unverify' : 'Verify'}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteOpen && doctorToDelete && createPortal(
        <div className="sa-modal-overlay" onClick={() => setConfirmDeleteOpen(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Doctor</h3>
            <p>Are you sure you want to permanently delete <strong>{doctorToDelete.doctorName}</strong>? This action cannot be undone.</p>
            <div className="sa-modal-actions">
              <button className="sa-modal-btn-cancel" onClick={() => { setConfirmDeleteOpen(false); setDoctorToDelete(null); }}>
                Cancel
              </button>
              <button className="sa-modal-btn-confirm sa-modal-btn-danger" onClick={handleDeleteDoctor} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Status Toggle Modal */}
      {confirmModalOpen && doctorToToggle && createPortal(
        <div className="sa-modal-overlay" onClick={() => setConfirmModalOpen(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Access Status</h3>
            <p>
              Are you sure you want to <strong>{doctorToToggle.isActive ? 'deactivate' : 'activate'}</strong> the profile for <strong>{doctorToToggle.doctorName}</strong>?
            </p>

            <div className="sa-modal-actions">
              <button
                className="sa-modal-btn-cancel"
                onClick={() => { setConfirmModalOpen(false); setDoctorToToggle(null); }}
              >
                Cancel
              </button>
              <button
                className={`sa-modal-btn-confirm ${doctorToToggle.isActive ? 'sa-modal-btn-danger' : ''}`}
                onClick={handleToggleStatus}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Yes, ${doctorToToggle.isActive ? 'Deactivate' : 'Activate'}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Doctor Details Modal */}
      {detailsModalOpen && viewDoctor && createPortal(
        <div className="sa-modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="sa-modal sa-modal-large" onClick={e => e.stopPropagation()}>
            <button
              className="sa-modal-close-icon"
              onClick={() => { setDetailsModalOpen(false); setViewDoctor(null); }}
              title="Close Details"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingRight: '32px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#64748B' }}>
                {viewDoctor.profileImage ? (
                  <img src={viewDoctor.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (viewDoctor.doctorName || 'D')[0].toUpperCase()
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '24px' }}>{viewDoctor.doctorName}</h3>
                <span className={`sa-badge ${viewDoctor.isVerified ? 'sa-badge-yes' : 'sa-badge-no'}`} style={{ marginTop: '8px' }}>
                  {viewDoctor.isVerified ? 'Verified' : 'Unverified'} • {viewDoctor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="sa-details-grid">
              <div className="sa-detail-item">
                <label>Email</label>
                <div>{viewDoctor.email || 'N/A'}</div>
              </div>
              <div className="sa-detail-item">
                <label>Phone</label>
                <div>{viewDoctor.phone || 'N/A'}</div>
              </div>
              <div className="sa-detail-item">
                <label>Specialty</label>
                <div>{viewDoctor.specialty || 'N/A'}</div>
              </div>
              <div className="sa-detail-item">
                <label>Location</label>
                <div>{viewDoctor.city ? `${viewDoctor.address}, ${viewDoctor.city}` : (viewDoctor.address || 'Not specified')}</div>
              </div>
              <div className="sa-detail-item">
                <label>Detection Price</label>
                <div>{viewDoctor.detectionPrice ? `${viewDoctor.detectionPrice} EGP` : 'Not specified'}</div>
              </div>
              <div className="sa-detail-item">
                <label>Experience (Years)</label>
                <div>{viewDoctor.expirtes || 'Not specified'}</div>
              </div>
              <div className="sa-detail-item">
                <label>Total Bookings</label>
                <div>{viewDoctor.bookings?.length || 0}</div>
              </div>
              <div className="sa-detail-item">
                <label>Joined Date</label>
                <div>{viewDoctor.createdAt ? new Date(viewDoctor.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            {viewDoctor.bio && (
              <div className="sa-detail-item" style={{ marginBottom: '24px' }}>
                <label>Bio</label>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{viewDoctor.bio}</div>
              </div>
            )}

            {viewDoctor.cv ? (
              <a href={viewDoctor.cv} target="_blank" rel="noreferrer" className="sa-cv-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View Doctor's CV (PDF)
              </a>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '12px', color: '#94A3B8', fontSize: '14px' }}>
                No CV uploaded by this doctor.
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', color: 'white', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: '500', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, animation: 'slideUp 0.3s ease' }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
