import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  update: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  delete: (id) => api.delete(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/available-slots/${doctorId}`, { params: { date } }),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (prescriptionData) => api.post('/prescriptions', prescriptionData),
  update: (id, prescriptionData) => api.put(`/prescriptions/${id}`, prescriptionData),
  delete: (id) => api.delete(`/prescriptions/${id}`),
  downloadPDF: (id) => api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
};

// Check-in API
export const checkInAPI = {
  getAll: (params) => api.get('/checkin', { params }),
  getById: (id) => api.get(`/checkin/${id}`),
  create: (checkInData) => api.post('/checkin', checkInData),
  update: (id, checkInData) => api.put(`/checkin/${id}`, checkInData),
  delete: (id) => api.delete(`/checkin/${id}`),
  getWaitingList: (clinicId) => api.get(`/checkin/waiting-list/${clinicId}`),
};

// Organizations API
export const organizationsAPI = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (organizationData) => api.post('/organizations', organizationData),
  update: (id, organizationData) => api.put(`/organizations/${id}`, organizationData),
  delete: (id) => api.delete(`/organizations/${id}`),
  getUsers: (id) => api.get(`/organizations/${id}/users`),
  addUser: (id, userId) => api.post(`/organizations/${id}/users`, { userId }),
  removeUser: (id, userId) => api.delete(`/organizations/${id}/users/${userId}`),
};

// Clinics API
export const clinicsAPI = {
  getAll: (params) => api.get('/clinic', { params }),
  getById: (id) => api.get(`/clinic/${id}`),
  create: (clinicData) => api.post('/clinic', clinicData),
  update: (id, clinicData) => api.put(`/clinic/${id}`, clinicData),
  delete: (id) => api.delete(`/clinic/${id}`),
  getDoctors: (id) => api.get(`/clinic/${id}/doctors`),
  getAppointments: (id, params) => api.get(`/clinic/${id}/appointments`, { params }),
  addDoctor: (id, doctorId) => api.post(`/clinic/${id}/doctors`, { doctorId }),
  removeDoctor: (id, doctorId) => api.delete(`/clinic/${id}/doctors/${doctorId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  createTest: (data) => api.post('/notifications/test', data),
  createSystemAnnouncement: (data) => api.post('/notifications/system-announcement', data),
  getStats: (params) => api.get('/notifications/stats', { params }),
};

// Self Check-in API
export const selfCheckInAPI = {
  getAll: (params) => api.get('/self-checkin', { params }),
  getById: (id) => api.get(`/self-checkin/${id}`),
  create: (data) => api.post('/self-checkin', data),
  update: (id, data) => api.put(`/self-checkin/${id}`, data),
  delete: (id) => api.delete(`/self-checkin/${id}`),
  review: (id, data) => api.put(`/self-checkin/${id}/review`, data),
  getStats: () => api.get('/self-checkin/stats/overview'),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getAppointments: (params) => api.get('/analytics/appointments', { params }),
  getPrescriptions: (params) => api.get('/analytics/prescriptions', { params }),
  getSelfCheckIns: (params) => api.get('/analytics/self-checkins', { params }),
  getUsers: () => api.get('/analytics/users'),
  getNotifications: (params) => api.get('/analytics/notifications', { params }),
};

// Users API (admin)
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
};

// Email API
export const emailAPI = {
  sendAppointmentConfirmation: (data) => api.post('/email/send-appointment-confirmation', data),
  sendAppointmentReminder: (data) => api.post('/email/send-appointment-reminder', data),
  sendPrescriptionNotification: (data) => api.post('/email/send-prescription-notification', data),
  sendPrescriptionExpiryWarning: (data) => api.post('/email/send-prescription-expiry-warning', data),
  sendSystemAnnouncement: (data) => api.post('/email/send-system-announcement', data),
  sendPasswordReset: (data) => api.post('/email/send-password-reset', data),
  sendTestEmail: (data) => api.post('/email/test-email', data),
};

export default api;
