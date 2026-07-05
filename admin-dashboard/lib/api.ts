// admin-dashboard/lib/api.ts

const API_URL = ((globalThis as any).process?.env?.NEXT_PUBLIC_API_URL) || 'https://moto-bus-backend.onrender.com/api';

export const adminAPI = {
  // ─── USERS ──────────────────────────────────────────────────────────
  getUsers: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch users');
    }
    return res.json();
  },

  getUserById: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  createUser: async (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    role: string;
  }) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create user');
    }
    return res.json();
  },

  updateUser: async (id: string, data: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  deleteUser: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  // ─── DRIVERS ──────────────────────────────────────────────────────
  getDrivers: async (params: {
    type?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/admin/drivers?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },

  getPendingDrivers: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/pending`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch pending drivers');
    return res.json();
  },

  approveDriver: async (driverId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/approve`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to approve driver');
    return res.json();
  },

  rejectDriver: async (driverId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/reject`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to reject driver');
    return res.json();
  },

  suspendDriver: async (driverId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/suspend`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to suspend driver');
    return res.json();
  },

  toggleOnlineStatus: async (driverId: string, isOnline: boolean) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ isOnline }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  getDriverDetails: async (driverId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch driver details');
    return res.json();
  },

  // ─── STATS ──────────────────────────────────────────────────────
  getStats: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // ─── NOTIFICATIONS ─────────────────────────────────────────────
  sendNotification: async (data: {
    title: string;
    message: string;
    type: string;
    audience: string;
    scheduledAt?: string;
  }) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return res.json();
  },

  getNotifications: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  deleteNotification: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },

  // ─── REPORTS ────────────────────────────────────────────────────
  getReports: async (params: {
    period: string;
    vehicleType: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    queryParams.append('period', params.period);
    if (params.vehicleType !== 'all') queryParams.append('vehicleType', params.vehicleType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const res = await fetch(`${API_URL}/admin/reports?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  exportReport: async (params: {
    type: string;
    period: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);
    queryParams.append('period', params.period);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const res = await fetch(`${API_URL}/admin/reports/export?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export report');
    return res.blob();
  },

  // ─── PAYMENTS ────────────────────────────────────────────────────
  getPayments: async (params: {
    search?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.method) queryParams.append('method', params.method);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/admin/payments?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  getPaymentStats: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payments/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch payment stats');
    return res.json();
  },

  processPayout: async (data: { driverId: string; amount: number; method: string }) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payouts/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to process payout');
    return res.json();
  },
};

export default adminAPI;