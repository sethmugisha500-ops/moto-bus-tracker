// admin-dashboard/app/notifications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Send, Users, User, UserCheck, Truck, Bus, Bike,
  AlertCircle, AlertTriangle, Info, CheckCircle, XCircle,
  Search, Filter, Calendar, Clock, Eye, Trash2,
  RefreshCw, Loader2, Mail, Megaphone, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'promotion' | 'warning' | 'info' | 'system';
  sentTo: string;
  audience: 'all' | 'riders' | 'drivers' | 'moto' | 'bus' | 'minibus';
  date: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  readCount?: number;
  deliveryCount?: number;
  createdBy?: string;
}

interface Stats {
  sentToday: number;
  totalSent: number;
  deliveryRate: number;
  pendingCount: number;
  scheduledCount: number;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getNotifications: async (): Promise<{ data: Notification[]; stats: Stats }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  sendNotification: async (data: {
    title: string;
    message: string;
    type: string;
    audience: string;
    scheduledAt?: string;
  }): Promise<any> => {
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

  deleteNotification: async (id: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to delete notification');
    return res.json();
  },

  getNotificationStats: async (): Promise<{ stats: Stats }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/notifications/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};

// ─── NOTIFICATION CARD ─────────────────────────────────────────────
const NotificationCard = ({ notification, onDelete, onView }: any) => {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'alert': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'promotion': return <Megaphone size={16} className="text-purple-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'alert': return 'bg-red-500/20 text-red-500 border-red-500/20';
      case 'warning': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'promotion': return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'info': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getAudienceIcon = () => {
    switch (notification.audience) {
      case 'all': return <Users size={12} />;
      case 'riders': return <User size={12} />;
      case 'drivers': return <UserCheck size={12} />;
      case 'moto': return <Bike size={12} />;
      case 'bus': return <Bus size={12} />;
      case 'minibus': return <Truck size={12} />;
      default: return <Users size={12} />;
    }
  };

  const getStatusColor = () => {
    switch (notification.status) {
      case 'sent': return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'failed': return 'bg-red-500/20 text-red-500 border-red-500/20';
      case 'scheduled': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="bg-[#0A0E0B] rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon()}
            <h3 className="font-semibold text-white truncate">{notification.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeColor()}`}>
              {notification.type}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{notification.message}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              {getAudienceIcon()}
              {notification.sentTo || notification.audience}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(notification.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(notification.date).toLocaleTimeString()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor()}`}>
              {notification.status}
            </span>
            {notification.readCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {notification.readCount} reads
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onView(notification)}
            className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
          >
            <Eye size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(notification.id)}
            className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── STAT CARD ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, color, subtitle }: any) => (
  <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`text-${color}-500`} size={18} />
      </div>
      {change !== undefined && (
        <span className={`text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{value?.toLocaleString() || 0}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
    {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({
    sentToday: 0,
    totalSent: 0,
    deliveryRate: 0,
    pendingCount: 0,
    scheduledCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ─── Modal State ──────────────────────────────────────────────────
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);

  // ─── Filter State ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const [notificationsData, statsData] = await Promise.all([
        api.getNotifications(),
        api.getNotificationStats(),
      ]);

      setNotifications(notificationsData.data || []);
      setStats(statsData.stats || {
        sentToday: 0,
        totalSent: 0,
        deliveryRate: 0,
        pendingCount: 0,
        scheduledCount: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      toast.error('Failed to load notifications');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Send Notification ──────────────────────────────────────────
  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await api.sendNotification({
        title,
        message,
        type: notificationType,
        audience: selectedAudience,
        scheduledAt: scheduledAt || undefined,
      });

      toast.success('Notification sent successfully!');
      setShowSendModal(false);
      setTitle('');
      setMessage('');
      setScheduledAt('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // ─── Delete Notification ────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await api.deleteNotification(id);
      toast.success('Notification deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete notification');
    }
  };

  // ─── Filter Notifications ───────────────────────────────────────
  const filteredNotifications = notifications.filter((notif) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        notif.title.toLowerCase().includes(term) ||
        notif.message.toLowerCase().includes(term) ||
        notif.sentTo?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && notif.type !== filterType) return false;

    // Status filter
    if (filterStatus !== 'all' && notif.status !== filterStatus) return false;

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell size={24} className="text-yellow-500" />
              Notification Management
            </h1>
            <p className="text-sm text-gray-400">Send and manage system notifications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 bg-[#0A0E0B] hover:bg-[#1A1E1C] rounded-lg border border-gray-800 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-green-500 text-black rounded-lg font-semibold hover:bg-green-400 transition flex items-center gap-2"
            >
              <Send size={16} />
              Send Notification
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard 
            icon={Send} 
            label="Sent Today" 
            value={stats.sentToday} 
            change={12} 
            color="green"
          />
          <StatCard 
            icon={Bell} 
            label="Total Sent" 
            value={stats.totalSent} 
            change={8} 
            color="blue"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Delivery Rate" 
            value={stats.deliveryRate} 
            change={5} 
            color="purple"
            subtitle="98% average"
          />
          <StatCard 
            icon={Clock} 
            label="Pending" 
            value={stats.pendingCount} 
            change={-3} 
            color="yellow"
          />
          <StatCard 
            icon={Calendar} 
            label="Scheduled" 
            value={stats.scheduledCount} 
            change={10} 
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          >
            <option value="all">All Types</option>
            <option value="alert">Alerts</option>
            <option value="warning">Warnings</option>
            <option value="promotion">Promotions</option>
            <option value="info">Info</option>
            <option value="system">System</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            {filteredNotifications.length} notifications
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="bg-[#0A0E0B] rounded-xl p-8 text-center border border-gray-800">
              <Bell size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications found</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Send your first notification'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDelete={handleDelete}
                onView={setSelectedNotification}
              />
            ))
          )}
        </div>

        {/* Send Notification Modal */}
        {showSendModal && (
          <>
            <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowSendModal(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Send size={20} className="text-green-500" />
                  Send Notification
                </h2>
                <button onClick={() => setShowSendModal(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                  <XCircle size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Audience */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Audience</label>
                  <select
                    value={selectedAudience}
                    onChange={(e) => setSelectedAudience(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="all">👥 All Users</option>
                    <option value="riders">👤 All Riders</option>
                    <option value="drivers">👤 All Drivers</option>
                    <option value="moto">🏍️ Moto Drivers</option>
                    <option value="bus">🚌 Bus Drivers</option>
                    <option value="minibus">🚐 Mini-Bus Drivers</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Notification Type</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="info">ℹ️ Info</option>
                    <option value="alert">🚨 Alert</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="promotion">🎉 Promotion</option>
                    <option value="system">⚙️ System</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Title</label>
                  <input
                    type="text"
                    placeholder="Enter notification title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message</label>
                  <textarea
                    placeholder="Enter notification message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500 resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {message.length}/500
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={handleSendNotification}
                    disabled={sending || !title || !message}
                    className="flex-1 bg-green-500 text-black py-2.5 rounded-lg font-semibold hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Notification
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 bg-[#0A0E0B] text-gray-400 py-2.5 rounded-lg hover:text-white transition border border-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* View Notification Modal */}
        {selectedNotification && (
          <>
            <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedNotification(null)} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedNotification.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(selectedNotification.date).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                  <XCircle size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="bg-[#0A0E0B] rounded-xl p-4 border border-gray-800 mb-4">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Type</p>
                  <p className="font-medium capitalize">{selectedNotification.type}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Audience</p>
                  <p className="font-medium">{selectedNotification.sentTo || selectedNotification.audience}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Status</p>
                  <p className="font-medium capitalize">{selectedNotification.status}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Delivery</p>
                  <p className="font-medium">{selectedNotification.deliveryCount || 0} delivered</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className="w-full mt-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-gray-400 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}