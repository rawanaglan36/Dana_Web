const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_DOCTOR_ID = '69316d56b6ea9f66f803e64a'; // Adelrahman Osama
const SUPER_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWVhNTIxZTA3NTVmMDQ1NzU4YjY0MmQiLCJwaG9uZSI6IjAxMjg5NjMwMjAyIiwicm9sZSI6ImRvY3RvciIsImlhdCI6MTc3Njk2NDU4MSwiZXhwIjoxNzc2OTY1NDgxfQ.uVLDLhIeV3Ab1UPCPmQqfVCNAGZmfXpi67qCHtFtxLM';

// --- Auth Token Helpers ---
export const authStorage = {
  setToken(token) {
    localStorage.setItem('dana_access_token', token);
  },
  getToken() {
    return localStorage.getItem('dana_access_token');
  },
  setDoctorId(id) {
    localStorage.setItem('dana_doctor_id', id);
  },
  getDoctorId() {
    return localStorage.getItem('dana_doctor_id') || DEFAULT_DOCTOR_ID;
  },
  clear() {
    localStorage.removeItem('dana_access_token');
    localStorage.removeItem('dana_doctor_id');
  },
};

// Helper to get the active doctor ID (from login or fallback)
const getDoctorId = () => authStorage.getDoctorId();

// Helper to build auth headers
const getAuthHeaders = (extra = {}, useSuperAdmin = false) => {
  const token = useSuperAdmin ? SUPER_ADMIN_TOKEN : authStorage.getToken();
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // ====== AUTH ======

  // Create Doctor - POST /v1/doctor
  // Creates a new doctor record and returns the doctor data (including _id)
  async createDoctor({ doctorName, email, phone, licenseNumber, expirtes, specialty, detectionPrice, file }) {
    const doctorData = JSON.stringify({
      doctorName,
      email,
      phone,
      licenseNumber,
      expirtes: Math.max(1, expirtes || 1),
      specialty,
      detectionPrice: detectionPrice || 0,
    });

    const formData = new FormData();
    formData.append('data', doctorData);
    if (file) {
      formData.append('file', file);
    }

    console.log('📤 createDoctor payload:', doctorData);

    const res = await fetch(`${API_BASE}/v1/doctor`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Failed to create doctor');
    }
    const doctor = json.response?.data;
    if (doctor?._id) {
      authStorage.setDoctorId(doctor._id);
    }
    return doctor;
  },

  // Admin Signup - POST /v1/doctor/admin-signup/:doctorId
  // Creates login credentials (email, phone, password) for a doctor
  async adminSignup(doctorId, { email, phone, password }) {
    const res = await fetch(`${API_BASE}/v1/doctor/admin-signup/${doctorId}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, true),
      body: JSON.stringify({ email, phone, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Signup failed');
    }
    // Store the access token and doctor ID
    if (json.accessToken?.access_token) {
      authStorage.setToken(json.accessToken.access_token);
    }
    authStorage.setDoctorId(doctorId);
    return json;
  },

  // Pre-SignIn (Login) - POST /v1/doctor/pre-signIn
  async preSignIn({ phone, password }) {
    // Determine if input is email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phone);
    const body = isEmail
      ? { email: phone, password }
      : { phone, password };

    const res = await fetch(`${API_BASE}/v1/doctor/pre-signIn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(res.status === 502 ? 'Server is currently unavailable (502). Please try again later.' : `Server error (${res.status}). Please try again.`);
    }
    if (!res.ok || json.response?.status !== 200) {
      throw new Error(json.response?.message || json.message || 'Login failed');
    }
    return json;
  },

  // Verify SignIn (OTP) - POST /v1/doctor/verify-signIn
  async verifySignIn({ phone, otp }) {
    const res = await fetch(`${API_BASE}/v1/doctor/verify-signIn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: phone, otp: Number(otp) }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'OTP verification failed');
    }
    if (json.accessToken?.access_token) {
      authStorage.setToken(json.accessToken.access_token);
    }

    console.log('🔐 verifySignIn full response:', JSON.stringify(json, null, 2));

    // Try to extract doctorId from response data first (most reliable)
    const responseData = json.response?.data || json.data || {};
    const doctorIdFromResponse = responseData.doctorId || responseData._id || responseData.id;

    if (doctorIdFromResponse) {
      authStorage.setDoctorId(doctorIdFromResponse);
      console.log('✅ DoctorId from response data:', doctorIdFromResponse);
    } else if (json.accessToken?.access_token) {
      try {
        const payload = JSON.parse(atob(json.accessToken.access_token.split('.')[1]));
        if (payload.sub) {
          authStorage.setDoctorId(payload.sub);
          console.log('ℹ️ DoctorId from JWT sub:', payload.sub);
        }
      } catch (e) {
        console.error('Failed to parse JWT payload', e);
      }
    }
    return json;
  },

  // ====== SUPER ADMIN ======

  // Admin Sign In - POST /v1/admin/sign-in
  async adminSignIn({ email, password }) {
    const res = await fetch(`${API_BASE}/v1/admin/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error(res.status === 502 ? 'Server unavailable (502).' : `Server error (${res.status}).`);
    }
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Admin login failed');
    }
    if (json.accessToken?.access_token || json.access_token) {
      authStorage.setToken(json.accessToken?.access_token || json.access_token);
    }
    localStorage.setItem('dana_super_admin', 'true');
    return json;
  },

  // Get All Doctors - GET /v1/doctor
  async getAllDoctors() {
    const res = await fetch(`${API_BASE}/v1/doctor`, {
      headers: getAuthHeaders({}, true),
    });
    const json = await res.json();
    return json.response?.data || [];
  },

  // Delete Doctor - DELETE /v1/doctor/admin-delete/:doctorId
  async deleteDoctor(doctorId) {
    const res = await fetch(`${API_BASE}/v1/doctor/admin-delete/${doctorId}`, {
      method: 'DELETE',
      headers: getAuthHeaders({}, true),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Failed to delete doctor');
    }
    return json;
  },

  // Toggle Doctor Verified Status - PATCH /v1/doctor/:doctorId/update-doctor-admin
  async toggleDoctorVerified(doctorId, isVerified) {
    const res = await fetch(`${API_BASE}/v1/doctor/${doctorId}/update-doctor-admin`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, true),
      body: JSON.stringify({ isVerified }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Failed to update verified status');
    }
    return json;
  },

  // Toggle Doctor Status - PATCH /v1/doctor/:doctorId/profile
  async toggleDoctorStatus(doctorId, isActive) {
    const res = await fetch(`${API_BASE}/v1/doctor/${doctorId}/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }, true),
      body: JSON.stringify({ isActive }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Failed to update status');
    }
    return json;
  },

  // ====== DASHBOARD ======

  // Dashboard Analytics - GET
  async getDashboardAnalytics() {
    const res = await fetch(`${API_BASE}/v1/booking/doctor-record/${getDoctorId()}/analytics`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.response?.data?.record || json.response?.data?.record || null;
  },

  // Bookings - GET /v1/booking?doctorId=:doctorId
  async getBookings() {
    const res = await fetch(`${API_BASE}/v1/booking?doctorId=${getDoctorId()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || json.response?.data || [];
  },

  // Patients List - POST
  async getPatients() {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/patients/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Available Slots - GET
  async getAvailableSlots(date) {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/available-slots?date=${date}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Child Growth Records - GET /v1/child/:childId/growth
  async getChildGrowth(childId) {
    const res = await fetch(`${API_BASE}/v1/child/${childId}/growth`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || [];
  },

  // Child Skill Checklist - GET /v1/skills/:skillId/child/:childId/checklist
  async getChildSkillChecklist(skillId, childId) {
    const res = await fetch(`${API_BASE}/v1/skills/${skillId}/child/${childId}/checklist`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || [];
  },

  // Child Skills Progress (Aggregates all categories)
  async getChildSkillsProgress(childId) {
    try {
      const skillsRes = await fetch(`${API_BASE}/v1/skills`, { headers: getAuthHeaders() });
      const skillsJson = await skillsRes.json();
      const categories = skillsJson.response?.data || skillsJson.data || [];
      
      const progress = await Promise.all(categories.map(async (cat) => {
        const res = await fetch(`${API_BASE}/v1/skills/${cat._id}/child/${childId}/checklist`, { headers: getAuthHeaders() });
        const json = await res.json();
        const checklist = json.response?.data || json.data || [];
        const total = checklist.length;
        const checked = checklist.filter(item => item.checked).length;
        return {
          id: cat._id,
          title: cat.name,
          checked: checked,
          total: total,
          percentage: total > 0 ? Math.round((checked / total) * 100) : 0
        };
      }));
      return progress;
    } catch (e) {
      console.error('Error fetching skills progress:', e);
      return [];
    }
  },

  // Child Vaccinations - GET /v1/child/:childId/childVaccinations
  async getChildVaccinations(childId) {
    const res = await fetch(`${API_BASE}/v1/child/${childId}/childVaccinations`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || [];
  },

  // Child Latest Growth - GET /v1/child/:childId/growth/latest
  async getChildLatestGrowth(childId) {
    const res = await fetch(`${API_BASE}/v1/child/${childId}/growth/latest`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || null;
  },

  // Child Record - POST /v1/child-record/generate/:childId
  // childId here is actually the childRecordID from patients/generate
  async getChildRecord(childId) {
    if (!childId) return null;
    const res = await fetch(`${API_BASE}/v1/child-record/generate/${childId}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    if (!res.ok && (json.statusCode === 400 || json.response?.status === 400)) {
      // Record already exists or bad request - try to return whatever data came back
      return json.response?.data || null;
    }
    if (!res.ok) {
      throw new Error(json.response?.message || json.message || 'Failed to get child record');
    }
    return json.response?.data || json.data || null;
  },

  // Child Record by childId - GET /v1/child-record/child/:childId
  // Returns full child record with growthHistory, latestGrowth, vaccinations, childData
  async getChildRecordByChildId(childId) {
    if (!childId) return null;
    const res = await fetch(`${API_BASE}/v1/child-record/child/${childId}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    const data = json.response?.data || json.data || null;
    // API returns an array, take the first (latest) record
    if (Array.isArray(data) && data.length > 0) return data[0];
    return data;
  },

  // All Vaccinations definitions - GET /v1/vaccinations
  async getAllVaccinations() {
    const res = await fetch(`${API_BASE}/v1/vaccinations`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || json || [];
  },

  // Complete Consultation - PATCH
  async completeConsultation(bookingId) {
    const res = await fetch(`${API_BASE}/v1/doctor/booking/${bookingId}/compelete-consultation`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Settings - Update Doctor Profile Image
  async updateDoctorProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/add-profile-image`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authStorage.getToken()}` },
      body: formData,
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Settings - Get Doctor Profile (GET)
  async getDoctorProfile() {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || null;
  },

  // Settings - Update Doctor Profile (JSON)
  async updateDoctorProfile(data) {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Settings - Update Doctor Appointments
  async updateDoctorAppointments(data) {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/appointments`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // Settings - Update Doctor Notifications
  async updateDoctorNotifications(data) {
    const res = await fetch(`${API_BASE}/v1/doctor/${getDoctorId()}/notifications`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.response?.data || null;
  },

  // ====== CHAT / MESSAGES ======

  // Create conversation (doctor side) by booking ID
  async createConversationByBooking(bookingId) {
    const res = await fetch(`${API_BASE}/v1/chat/conversations/${bookingId}/parent`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    return json.response?.data || json.data || null;
  },

  // Check if room exists for user
  async checkRoom(userId, roomId) {
    const res = await fetch(`${API_BASE}/v1/chat/check-room/${userId}/room/${roomId}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  },

  // Get messages by room ID
  async getMessagesByRoom(roomId) {
    const res = await fetch(`${API_BASE}/v1/chat/messages/room/${roomId}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || [];
  },

  // Mark message as delivered
  async markMessageDelivered(messageId) {
    const res = await fetch(`${API_BASE}/v1/chat/messages/${messageId}/delivered`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    return json.response?.data || json;
  },

  // Mark message as read
  async markMessageRead(messageId) {
    const res = await fetch(`${API_BASE}/v1/chat/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const json = await res.json();
    return json.response?.data || json;
  },

  // Get unread messages for receiver (doctor)
  async getUnreadMessages() {
    const res = await fetch(`${API_BASE}/v1/chat/messages/unread/${getDoctorId()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.response?.data || json.data || json || [];
  },
};
