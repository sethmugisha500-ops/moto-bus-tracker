// admin-dashboard/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Users2, Bike, Bus, Truck, TrendingUp, 
  DollarSign, Eye, CheckCircle, XCircle, Clock, 
  Search, AlertCircle, RefreshCw, UserCheck, UserX,
  Calendar, ArrowUpRight, ArrowDownRight, 
  Sparkles, Shield, Star, Wallet, MapPin,
  Bell, Menu, Plus, Filter, Activity,
  BarChart3, PieChart, ChevronRight, Home,
  Settings, LogOut, HelpCircle, Award,
  Zap, Target, Crown, Flame, Gift,
  UserPlus, MessageSquare, Phone, Mail,
  Globe, Linkedin, Twitter, Instagram,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


// ─── TYPES ──────────────────────────────────────────────────────────
interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  joinedAt: string;
  isActive: boolean;
}

interface Stats {
  totalUsers: number;
  totalDrivers: number;
  totalRiders: number;
  totalRides: number;
  totalRevenue: number;
  motoCount: number;
  busCount: number;
  minibusCount: number;
  pendingDrivers: number;
  activeDrivers: number;
  completedRides: number;
  todayRides: number;
  sosAlerts: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'ride' | 'driver' | 'payment' | 'user' | 'alert';
  description: string;
  amount?: number;
  status: string;
  timestamp: string;
  user?: string;
  icon?: string;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getStats: async (): Promise<{ stats: Stats }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch stats: ${error}`);
    }
    return res.json();
  },

  getDrivers: async (params?: any): Promise<{ data: Driver[] }> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/admin/drivers?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch drivers: ${error}`);
    }
    return res.json();
  },

  getRecentActivity: async (): Promise<{ activities: RecentActivity[] }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/activity/recent`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) {
      // If endpoint doesn't exist, return empty array
      return { activities: [] };
    }
    return res.json();
  },
};

// ─── STAT CARD ──────────────────────────────────────────────────────
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  color, 
  subtitle, 
  onClick,
  loading 
}: any) => (
  <div 
    onClick={onClick}
    className="bg-[#111714] border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition-all cursor-pointer group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-2xl" />
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-${color}-500/10 group-hover:bg-${color}-500/20 transition`}>
          <Icon className={`text-${color}-500`} size={20} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
            change >= 0 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-red-500 bg-red-500/10'
          }`}>
            {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-700/30 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-white">{value?.toLocaleString() || 0}</p>
      )}
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── ACTIVITY ITEM ──────────────────────────────────────────────────
const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'ride': return <Truck size={14} className="text-blue-500" />;
      case 'driver': return <Users2 size={14} className="text-green-500" />;
      case 'payment': return <DollarSign size={14} className="text-yellow-500" />;
      case 'user': return <UserPlus size={14} className="text-purple-500" />;
      case 'alert': return <AlertTriangle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'failed':
      case 'rejected':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      case 'active':
        return 'bg-red-500/20 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-[#0A0E0B] rounded-xl hover:bg-[#111714] transition border border-transparent hover:border-gray-800">
      <div className="w-9 h-9 bg-[#111714] rounded-lg flex items-center justify-center flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{activity.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor()}`}>
            {activity.status}
          </span>
          <span className="text-[10px] text-gray-500">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
      {activity.amount && (
        <span className="text-sm font-bold text-green-500">
          RWF {activity.amount.toLocaleString()}
        </span>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Admin');
  const [currentTime, setCurrentTime] = useState('');

  // ─── Get user and time ──────────────────────────────────────────
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || 'Admin');
      } catch {
        setUserName('Admin');
      }
    }

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Fetch Data ──────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const [statsData, driversData, activityData] = await Promise.all([
        api.getStats(),
        api.getDrivers({ limit: 10 }),
        api.getRecentActivity().catch(() => ({ activities: [] })),
      ]);

      setStats(statsData.stats);
      setDrivers(driversData.data || []);
      setActivities(activityData.activities || []);
      
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      toast.error('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────
  const pendingCount = drivers.filter(d => !d.isApproved).length;
  const approvedCount = drivers.filter(d => d.isApproved).length;
  const onlineCount = drivers.filter(d => d.isOnline).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* ─── WELCOME SECTION ────────────────────────────────────── */}
        <div className="relative mb-8">
          <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      {getGreeting()}, {userName} <span className="text-2xl">👋</span>
                    </h1>
                    <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                      <Shield size={12} /> Admin
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm max-w-lg">
                    Welcome back to your MotoBus admin dashboard. Here's what's happening with your platform today.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-300">{currentTime}</p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => router.push('/drivers/pending')}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-xl border border-yellow-500/20 hover:bg-yellow-500/30 transition text-yellow-500 text-sm font-medium"
                    >
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      {pendingCount} Pending
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0E0B] rounded-full border border-gray-800">
                  <Activity size={12} className="text-green-500" />
                  <span className="text-xs text-gray-400">Active Drivers: <span className="text-white font-medium">{stats?.activeDrivers || 0}</span></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0E0B] rounded-full border border-gray-800">
                  <Target size={12} className="text-blue-500" />
                  <span className="text-xs text-gray-400">Online: <span className="text-white font-medium">{onlineCount}</span></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0E0B] rounded-full border border-gray-800">
                  <Award size={12} className="text-yellow-500" />
                  <span className="text-xs text-gray-400">Avg Rating: <span className="text-white font-medium">4.8 ★</span></span>
                </div>
                {stats?.sosAlerts && stats.sosAlerts > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
                    <AlertTriangle size={12} className="text-red-500 animate-pulse" />
                    <span className="text-xs text-red-400">{stats.sosAlerts} Active SOS</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={fetchData} className="text-green-500 hover:underline">Retry</button>
          </div>
        )}

        {/* ─── STATS GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats?.totalUsers || 0} 
            change={12} 
            color="blue"
            loading={loading}
            onClick={() => router.push('/users')}
          />
          <StatCard 
            icon={Users2} 
            label="Total Drivers" 
            value={stats?.totalDrivers || 0} 
            change={8} 
            color="green"
            subtitle={`${pendingCount} pending approvals`}
            loading={loading}
            onClick={() => router.push('/drivers')}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Total Rides" 
            value={stats?.totalRides || 0} 
            change={15} 
            color="purple"
            subtitle={`${stats?.todayRides || 0} today`}
            loading={loading}
            onClick={() => router.push('/rides')}
          />
          <StatCard 
            icon={DollarSign} 
            label="Revenue" 
            value={stats?.totalRevenue || 0} 
            change={10} 
            color="yellow"
            subtitle={`${stats?.completionRate?.toFixed(0) || 0}% completion`}
            loading={loading}
            onClick={() => router.push('/payments')}
          />
        </div>

        {/* ─── VEHICLE BREAKDOWN ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div 
            className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-orange-500/30 transition cursor-pointer group"
            onClick={() => router.push('/drivers?type=MOTO')}
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-500/20 transition">
              <Bike size={24} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.motoCount || 0}</p>
            <p className="text-xs text-gray-400">Moto Drivers</p>
          </div>
          <div 
            className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-blue-500/30 transition cursor-pointer group"
            onClick={() => router.push('/drivers?type=BUS')}
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-500/20 transition">
              <Bus size={24} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.busCount || 0}</p>
            <p className="text-xs text-gray-400">Bus Drivers</p>
          </div>
          <div 
            className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-green-500/30 transition cursor-pointer group"
            onClick={() => router.push('/drivers?type=MINIBUS')}
          >
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-green-500/20 transition">
              <Truck size={24} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.minibusCount || 0}</p>
            <p className="text-xs text-gray-400">Mini-Bus</p>
          </div>
        </div>

        {/* ─── TWO COLUMN LAYOUT ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity size={14} className="text-gray-400" />
                Recent Activity
              </h3>
              <button 
                onClick={() => router.push('/activity')}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No recent activity</p>
                  <p className="text-xs text-gray-500">Activity will appear here</p>
                </div>
              ) : (
                activities.slice(0, 6).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Zap size={14} className="text-yellow-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/drivers/pending')}
                className="w-full flex items-center gap-3 p-3 bg-[#0A0E0B] rounded-xl hover:bg-[#1A1E1C] transition group"
              >
                <div className="w-9 h-9 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition">
                  <UserCheck size={16} className="text-yellow-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Review Drivers</p>
                  <p className="text-xs text-gray-500">{pendingCount} pending approvals</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 transition" />
              </button>

              <button
                onClick={() => router.push('/notifications')}
                className="w-full flex items-center gap-3 p-3 bg-[#0A0E0B] rounded-xl hover:bg-[#1A1E1C] transition group"
              >
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition">
                  <Bell size={16} className="text-blue-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Send Notification</p>
                  <p className="text-xs text-gray-500">Broadcast to users</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 transition" />
              </button>

              <button
                onClick={() => router.push('/alerts')}
                className="w-full flex items-center gap-3 p-3 bg-[#0A0E0B] rounded-xl hover:bg-[#1A1E1C] transition group"
              >
                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">View SOS Alerts</p>
                  <p className="text-xs text-gray-500">{stats?.sosAlerts || 0} active alerts</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 transition" />
              </button>

              <button
                onClick={() => router.push('/reports')}
                className="w-full flex items-center gap-3 p-3 bg-[#0A0E0B] rounded-xl hover:bg-[#1A1E1C] transition group"
              >
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition">
                  <BarChart3 size={16} className="text-purple-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">View Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 transition" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── PENDING DRIVERS PREVIEW ────────────────────────────── */}
        {pendingCount > 0 && (
          <div className="bg-[#111714] border border-yellow-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UserCheck size={14} className="text-yellow-500" />
                Pending Approvals ({pendingCount})
                <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Action Required</span>
              </h3>
              <button
                onClick={() => router.push('/drivers/pending')}
                className="text-xs text-yellow-500 hover:text-yellow-400 transition flex items-center gap-1"
              >
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drivers.filter(d => !d.isApproved).slice(0, 3).map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-[#0A0E0B] rounded-xl border border-yellow-500/10 hover:border-yellow-500/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-yellow-500/10 rounded-full flex items-center justify-center">
                      <span className="text-yellow-500 font-bold text-sm">
                        {driver.name?.charAt(0).toUpperCase() || 'D'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.vehicleType} • {driver.vehicleNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/drivers/${driver.userId || driver.id}`)}
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs hover:bg-green-500/20 transition"
                  >
                    Review
                  </button>
                </div>
              ))}
              {pendingCount > 3 && (
                <div className="flex items-center justify-center p-3 bg-[#0A0E0B] rounded-xl border border-dashed border-gray-700">
                  <p className="text-xs text-gray-500">+{pendingCount - 3} more pending</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── FOOTER ────────────────────────────────────────────── */}
        <div className="mt-8 pt-4 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-[10px] text-gray-600">
              © {new Date().getFullYear()} MotoBus. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[10px] text-gray-600">
              <span>v2.0.1</span>
              <span className="w-px h-3 bg-gray-800" />
              <span>24/7 Support</span>
              <span className="w-px h-3 bg-gray-800" />
              <span className="flex items-center gap-1">
                <Shield size={10} /> Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}