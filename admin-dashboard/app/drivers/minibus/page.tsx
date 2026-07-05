// admin-dashboard/app/drivers/minibus/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Minus, Search, Star, Eye, CheckCircle, XCircle, 
  Loader2, Users, MapPin, Clock, RefreshCw, 
  AlertCircle, UserX, Phone, Calendar, DollarSign,
  Route, Wifi, WifiOff, UserCheck, Award,
  Shield, Zap, Target, BarChart3, Filter,
  ChevronDown, UserPlus, Crown, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface MinibusDriver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleType: 'MINIBUS';
  vehicleModel: string;
  licenseNumber: string;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isApproved: boolean;
  isOnline: boolean;
  isActive: boolean;
  experience: number;
  joinedAt: string;
  // Minibus specific fields
  capacity: number;
  route: string;
  departureTime: string;
  returnTime: string;
  assistantName?: string;
  assistantPhone?: string;
  currentLat?: number;
  currentLng?: number;
}

interface Stats {
  total: number;
  online: number;
  offline: number;
  approved: number;
  pending: number;
  active: number;
  totalEarnings: number;
  averageRating: number;
  totalCapacity: number;
  totalRoutes: number;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getDrivers: async (params: {
    type?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: MinibusDriver[]; stats: Stats; pagination: any }> => {
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

  approveDriver: async (driverId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/approve`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to approve driver');
    return res.json();
  },

  rejectDriver: async (driverId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/reject`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to reject driver');
    return res.json();
  },

  suspendDriver: async (driverId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}/suspend`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to suspend driver');
    return res.json();
  },

  toggleOnlineStatus: async (driverId: string, isOnline: boolean): Promise<any> => {
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

  getDriverDetails: async (driverId: string): Promise<{ data: MinibusDriver }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${driverId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch driver details');
    return res.json();
  },
};

// ─── STAT CARD ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subtitle, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl bg-${color}-500/10 group-hover:bg-${color}-500/20 transition`}>
        <Icon className={`text-${color}-500`} size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value?.toLocaleString() || 0}</p>
        <p className="text-xs text-gray-400">{label}</p>
        {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// ─── DRIVER CARD ──────────────────────────────────────────────────
const DriverCard = ({ 
  driver, 
  onApprove, 
  onReject, 
  onSuspend,
  onToggleStatus,
  onView 
}: any) => {
  return (
    <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left Section */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🚐</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white group-hover:text-green-500 transition">
                {driver.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                driver.isOnline 
                  ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/20'
              }`}>
                {driver.isOnline ? '🟢 Online' : '⚪ Offline'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                driver.isApproved 
                  ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                  : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
              }`}>
                {driver.isApproved ? '✅ Approved' : '⏳ Pending'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-500 border border-green-500/20">
                {driver.capacity || 18} seats
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Phone size={10} /> {driver.phone}</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>License: {driver.licenseNumber}</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>{driver.experience || 0} years</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={10} /> Joined: {new Date(driver.joinedAt).toLocaleDateString()}</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>Route: {driver.route}</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-white">{driver.rating || 4.8}</span>
              </div>
              <p className="text-xs text-gray-400">{driver.totalTrips || 0} trips</p>
            </div>
            <div className="text-right">
              <p className="text-green-500 font-semibold text-sm">
                RWF {(driver.totalEarnings || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{driver.vehicleNumber}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!driver.isApproved ? (
              <>
                <button
                  onClick={() => onApprove(driver.id)}
                  className="px-3 py-1.5 bg-green-500 text-black rounded-lg text-xs font-semibold hover:bg-green-400 transition flex items-center gap-1"
                >
                  <CheckCircle size={12} /> Approve
                </button>
                <button
                  onClick={() => onReject(driver.id)}
                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition flex items-center gap-1"
                >
                  <XCircle size={12} /> Reject
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onToggleStatus(driver.id, !driver.isOnline)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    driver.isOnline 
                      ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                  }`}
                >
                  {driver.isOnline ? 'Go Offline' : 'Go Online'}
                </button>
                <button
                  onClick={() => onView(driver.id)}
                  className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
                >
                  <Eye size={16} className="text-gray-400 hover:text-green-500" />
                </button>
                {driver.isActive && (
                  <button
                    onClick={() => onSuspend(driver.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <UserX size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Route Information */}
      {driver.route && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Route size={12} /> Route
            </p>
            <p className="font-medium text-white">{driver.route}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} /> Departure
            </p>
            <p className="font-medium text-white">{driver.departureTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} /> Return
            </p>
            <p className="font-medium text-white">{driver.returnTime}</p>
          </div>
          {driver.assistantName && (
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Users size={12} /> Assistant
              </p>
              <p className="font-medium text-white">{driver.assistantName}</p>
              <p className="text-xs text-gray-500">{driver.assistantPhone}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function MinibusDriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<MinibusDriver[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    online: 0,
    offline: 0,
    approved: 0,
    pending: 0,
    active: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalCapacity: 0,
    totalRoutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [selectedDriver, setSelectedDriver] = useState<MinibusDriver | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ─── Fetch Drivers ──────────────────────────────────────────────
  const fetchDrivers = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const data = await api.getDrivers({
        type: 'MINIBUS',
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setDrivers(data.data || []);
      setStats(data.stats || {
        total: 0,
        online: 0,
        offline: 0,
        approved: 0,
        pending: 0,
        active: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalCapacity: 0,
        totalRoutes: 0,
      });
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drivers');
      toast.error('Failed to load drivers');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // ─── Actions ─────────────────────────────────────────────────────
  const handleApprove = async (driverId: string) => {
    setProcessingId(driverId);
    try {
      await api.approveDriver(driverId);
      toast.success('Driver approved successfully!');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve driver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (driverId: string) => {
    if (!confirm('Are you sure you want to reject this driver?')) return;
    setProcessingId(driverId);
    try {
      await api.rejectDriver(driverId);
      toast.success('Driver rejected');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject driver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (driverId: string) => {
    if (!confirm('Are you sure you want to suspend this driver?')) return;
    setProcessingId(driverId);
    try {
      await api.suspendDriver(driverId);
      toast.success('Driver suspended');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend driver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (driverId: string, isOnline: boolean) => {
    setProcessingId(driverId);
    try {
      await api.toggleOnlineStatus(driverId, isOnline);
      toast.success(`Driver ${isOnline ? 'online' : 'offline'}`);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDriver = async (driverId: string) => {
    try {
      const data = await api.getDriverDetails(driverId);
      setSelectedDriver(data.data);
      setShowDetailsModal(true);
    } catch (err: any) {
      toast.error('Failed to load driver details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading minibus drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* ─── HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Minus className="text-green-500" size={28} />
              <h1 className="text-2xl font-bold">Minibus Drivers</h1>
              <span className="text-sm text-gray-400 bg-[#0A0E0B] px-3 py-1 rounded-full border border-gray-800">
                {pagination.total} total
              </span>
            </div>
            <p className="text-sm text-gray-400">Manage minibus drivers and their routes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-9 pr-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500 w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
            >
              <option value="all">All Status</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="suspended">⛔ Suspended</option>
            </select>
            <button
              onClick={fetchDrivers}
              disabled={refreshing}
              className="p-2 bg-[#0A0E0B] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-green-500' : 'text-gray-400'} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchDrivers} className="ml-auto text-green-500 hover:underline">Retry</button>
          </div>
        )}

        {/* ─── STATS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          <StatCard 
            icon={Users} 
            label="Total Drivers" 
            value={stats.total} 
            color="blue"
            onClick={() => setStatusFilter('all')}
          />
          <StatCard 
            icon={Wifi} 
            label="Online" 
            value={stats.online} 
            color="green"
          />
          <StatCard 
            icon={WifiOff} 
            label="Offline" 
            value={stats.offline} 
            color="gray"
          />
          <StatCard 
            icon={UserCheck} 
            label="Approved" 
            value={stats.approved} 
            color="green"
            onClick={() => setStatusFilter('approved')}
          />
          <StatCard 
            icon={Clock} 
            label="Pending" 
            value={stats.pending} 
            color="yellow"
            onClick={() => setStatusFilter('pending')}
          />
        </div>

        {/* ─── DRIVERS LIST ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {drivers.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
              <Minus size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No minibus drivers found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Drivers will appear here once they register'}
              </p>
            </div>
          ) : (
            drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onApprove={handleApprove}
                onReject={handleReject}
                onSuspend={handleSuspend}
                onToggleStatus={handleToggleStatus}
                onView={handleViewDriver}
              />
            ))
          )}
        </div>

        {/* ─── PAGINATION ───────────────────────────────────────────── */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-4 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── DRIVER DETAILS MODAL ──────────────────────────────────── */}
      {showDetailsModal && selectedDriver && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowDetailsModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedDriver.name}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedDriver.isApproved 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {selectedDriver.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </h2>
                <p className="text-gray-400 text-sm flex items-center gap-1">
                  <Phone size={12} /> {selectedDriver.phone}
                </p>
                {selectedDriver.email && (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <Mail size={12} /> {selectedDriver.email}
                  </p>
                )}
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Vehicle</p>
                <p className="font-semibold text-white">{selectedDriver.vehicleNumber}</p>
                <p className="text-xs text-gray-500">{selectedDriver.vehicleModel}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">License</p>
                <p className="font-semibold text-white">{selectedDriver.licenseNumber}</p>
                <p className="text-xs text-gray-500">{selectedDriver.experience} years exp</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Rating</p>
                <p className="font-semibold text-yellow-500">⭐ {selectedDriver.rating || 4.8}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Earnings</p>
                <p className="font-semibold text-green-500">RWF {(selectedDriver.totalEarnings || 0).toLocaleString()}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Route</p>
                <p className="font-semibold text-white">{selectedDriver.route}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Capacity</p>
                <p className="font-semibold text-white">{selectedDriver.capacity} seats</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Schedule</p>
                <p className="font-semibold text-white">{selectedDriver.departureTime} - {selectedDriver.returnTime}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Status</p>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedDriver.isOnline 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedDriver.isOnline ? '🟢 Online' : '⚪ Offline'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedDriver.isActive 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {selectedDriver.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            </div>

            {selectedDriver.assistantName && (
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800 mb-4">
                <p className="text-gray-500 text-xs">Assistant</p>
                <p className="font-semibold text-white">{selectedDriver.assistantName}</p>
                <p className="text-xs text-gray-500">{selectedDriver.assistantPhone}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!selectedDriver.isApproved && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedDriver.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-green-500 text-black py-2.5 rounded-lg font-semibold hover:bg-green-400 transition"
                  >
                    Approve Driver
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedDriver.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 rounded-lg font-semibold hover:bg-red-500/20 transition"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedDriver.isApproved && (
                <>
                  <button
                    onClick={() => {
                      handleToggleStatus(selectedDriver.id, !selectedDriver.isOnline);
                      setShowDetailsModal(false);
                    }}
                    className={`flex-1 py-2.5 rounded-lg font-semibold transition ${
                      selectedDriver.isOnline 
                        ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                        : 'bg-green-500 text-black hover:bg-green-400'
                    }`}
                  >
                    {selectedDriver.isOnline ? 'Go Offline' : 'Go Online'}
                  </button>
                  <button
                    onClick={() => router.push(`/drivers/${selectedDriver.id}/edit`)}
                    className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 py-2.5 rounded-lg font-semibold hover:bg-blue-500/20 transition"
                  >
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}