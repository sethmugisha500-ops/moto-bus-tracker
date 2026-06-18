// admin-dashboard/src/services/api.js
import axios from 'axios';

// Use the same IP as your backend
const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.100:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://192.168.1.100:5000';

console.log(`🌐 Admin API URL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error('❌ Network Error - Make sure backend is running');
      return Promise.reject(new Error('Cannot connect to server'));
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard stats
  async getStats() {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },

  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  },

  async getRides() {
    try {
      const response = await api.get('/admin/rides');
      return response.data;
    } catch (error) {
      console.error('Failed to get rides:', error);
      throw error;
    }
  },

  async getDrivers() {
    try {
      const response = await api.get('/admin/drivers');
      return response.data;
    } catch (error) {
      console.error('Failed to get drivers:', error);
      throw error;
    }
  },

  // Socket connection for real-time updates
  socket: null,

  connectSocket(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    const io = require('socket.io-client');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('🔗 Admin socket connected');
    });

    return this.socket;
  },

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  },
};

export default api;