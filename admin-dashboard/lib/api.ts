import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/admin/login', { email, password }),
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  getMe: () => api.get('/auth/me'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/admin/stats'),
  getCharts: () => api.get('/admin/charts'),
  getRecentActivity: () => api.get('/admin/recent'),
};

// Drivers API
export const driversAPI = {
  getAll: (params?: any) => api.get('/admin/drivers', { params }),
  getById: (id: string) => api.get(`/admin/drivers/${id}`),
  approve: (id: string) => api.put(`/admin/drivers/${id}/approve`),
  suspend: (id: string) => api.put(`/admin/drivers/${id}/suspend`),
  getEarnings: (id: string) => api.get(`/admin/drivers/${id}/earnings`),
};


// Riders API
export const ridersAPI = {
  getAll: (p0: { search: string; status: string | undefined; sort: string; }) => api.get('/admin/riders'),
  getById: (id: string) => api.get(`/admin/riders/${id}`),
  suspend: (id: string) => api.put(`/admin/riders/${id}/suspend`),
  activate: (id: string) => api.put(`/admin/riders/${id}/activate`),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: () => api.get('/admin/vehicles'),
  getById: (id: string) => api.get(`/admin/vehicles/${id}`),
  create: (data: any) => api.post('/admin/vehicles', data),
  update: (id: string, data: any) => api.put(`/admin/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/admin/vehicles/${id}`),
};

// Payments API
export const paymentsAPI = {
  getAll: (params?: any) => api.get('/admin/payments', { params }),
  getStats: () => api.get('/admin/payments/stats'),
  getPayoutRequests: () => api.get('/admin/payouts/requests'),
  processPayout: (driverId: string, amount: number, method: string) => 
    api.post('/admin/payouts/process', { driverId, amount, method }),
  getReceipt: (paymentId: string) => api.get(`/admin/payments/${paymentId}/receipt`, { responseType: 'blob' }),
};
// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/admin/notifications'),
  send: (data: any) => api.post('/admin/notifications/send', data),
  markAsRead: (id: string) => api.put(`/admin/notifications/${id}/read`),
};

// Reports API
export const reportsAPI = {
  getRevenue: (start: string, end: string) => api.get('/admin/reports/revenue', { params: { start, end } }),
  getDrivers: (start: string, end: string) => api.get('/admin/reports/drivers', { params: { start, end } }),
  exportCSV: (type: string, start: string, end: string) => api.get(`/admin/reports/export/${type}`, { params: { start, end }, responseType: 'blob' }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: any) => api.put('/admin/settings', data),
  updatePricing: (data: any) => api.put('/admin/settings/pricing', data),
};

export default api;