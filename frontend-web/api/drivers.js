// api/drivers.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchPendingDrivers = async (type = 'all') => {
  try {
    console.log(`🔍 Fetching pending drivers with type: ${type}`);
    
    const response = await axios.get(`${API_BASE_URL}/drivers/pending`, {
      params: { type },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    console.log('✅ API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config,
    });
    throw error;
  }
};