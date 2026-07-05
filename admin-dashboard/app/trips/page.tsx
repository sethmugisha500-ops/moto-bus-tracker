// admin-dashboard/app/trips/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Eye, Filter, RefreshCw, AlertCircle, 
  CheckCircle, Clock, XCircle, Loader2, 
  MapPin, Users, DollarSign, Calendar, 
  Phone, User, Truck, Star, MessageSquare,
  ArrowUpRight, ArrowDownRight, ChevronDown,
  MoreVertical, Edit, Trash2, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Trip {
  id: string;
  rideId: string;
  rider: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    rating: number;
    vehicleType: string;
  };
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  fare: number;
  distance: number;
  duration: number;
  status: 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
  paymentMethod: string;
  paymentStatus: string;
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  totalRevenue: number;
  pending: number;
}

// ─── STATUS CONFIG ──────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
  accepted: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
  arrived: 'bg-purple-500/20 text-purple-500 border-purple-500/20',
  started: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/20',
  completed: 'bg-green-500/20 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/20',
};

const statusIcons: Record<string, any> = {
  pending: <Clock size={12} className="text-yellow-500" />,
  accepted: <CheckCircle size={12} className="text-blue-500" />,
  arrived: <AlertCircle size={12} className="text-purple-500" />,
  started: <Clock size={12} className="text-indigo-500" />,
  completed: <CheckCircle size={12} className="text-green-500" />,
  cancelled: <XCircle size={12} className="text-red-500" />,
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  arrived: 'Arrived',
  started: 'Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getTrips: async (params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Trip[]; stats: Stats; pagination: any }> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/admin/trips?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch trips');
    return res.json();
  },

  updateTripStatus: async (id: string, status: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/trips/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update trip status');
    return res.json();
  },

  cancelTrip: async (id: string, reason: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/trips/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel trip');
    return res.json();
  },

  getTripDetails: async (id: string): Promise<{ data: Trip }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/trips/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch trip details');
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

// ─── TRIP CARD ────────────────────────────────────────────────────
const TripCard = ({ trip, onView, onStatusUpdate, onCancel }: any) => {
  const getStatusColor = statusColors[trip.status] || 'bg-gray-500/20 text-gray-400';
  const getStatusIcon = statusIcons[trip.status] || <Clock size={12} className="text-gray-400" />;
  
  return (
    <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-gray-500">#{trip.rideId?.slice(-8) || trip.id?.slice(-8)}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${getStatusColor}`}>
              {getStatusIcon}
              {statusLabels[trip.status] || trip.status}
            </span>
            <span className="text-xs text-gray-500">{trip.paymentMethod}</span>
          </div>
          
          <div className="mt-2 flex flex-col gap-0.5 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={12} className="text-green-500 flex-shrink-0" />
              <span className="truncate">{trip.pickup?.address || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 ml-4">
              <ArrowDownRight size={12} className="text-red-500 flex-shrink-0" />
              <span className="truncate">{trip.destination?.address || 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User size={12} /> {trip.rider?.name || 'N/A'}
            </span>
            {trip.driver && (
              <span className="flex items-center gap-1">
                <Truck size={12} /> {trip.driver.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <DollarSign size={12} className="text-green-500" />
              RWF {trip.fare?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {trip.duration || 0} min
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(trip.id)}
            className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
          >
            <Eye size={16} className="text-gray-400 hover:text-green-500" />
          </button>
          
          {trip.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusUpdate(trip.id, 'accepted')}
                className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Cancellation reason:');
                  if (reason) onCancel(trip.id, reason);
                }}
                className="px-2 py-1 bg-red-500/20 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/30 transition"
              >
                Cancel
              </button>
            </>
          )}
          
          {trip.status === 'accepted' && (
            <button
              onClick={() => onStatusUpdate(trip.id, 'arrived')}
              className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition"
            >
              Arrived
            </button>
          )}
          
          {trip.status === 'arrived' && (
            <button
              onClick={() => onStatusUpdate(trip.id, 'started')}
              className="px-2 py-1 bg-indigo-500/20 text-indigo-500 rounded-lg text-xs font-medium hover:bg-indigo-500/30 transition"
            >
              Start
            </button>
          )}
          
          {trip.status === 'started' && (
            <button
              onClick={() => onStatusUpdate(trip.id, 'completed')}
              className="px-2 py-1 bg-green-500/20 text-green-500 rounded-lg text-xs font-medium hover:bg-green-500/30 transition"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0,
    totalRevenue: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ─── Fetch Trips ──────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const data = await api.getTrips({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTrips(data.data || []);
      setStats(data.stats || {
        total: 0,
        completed: 0,
        inProgress: 0,
        cancelled: 0,
        totalRevenue: 0,
        pending: 0,
      });
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trips');
      toast.error('Failed to load trips');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search, statusFilter, dateRange.start, dateRange.end, pagination.page]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ─── Update Status ─────────────────────────────────────────────
  const handleStatusUpdate = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await api.updateTripStatus(id, status);
      toast.success(`Trip ${status} successfully`);
      fetchTrips();
      if (selectedTrip) setSelectedTrip(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Cancel Trip ──────────────────────────────────────────────
  const handleCancelTrip = async (id: string, reason: string) => {
    setProcessingId(id);
    try {
      await api.cancelTrip(id, reason);
      toast.success('Trip cancelled');
      fetchTrips();
      if (selectedTrip) setSelectedTrip(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel trip');
    } finally {
      setProcessingId(null);
    }
  };

  // ─── View Trip Details ────────────────────────────────────────
  const handleViewTrip = async (id: string) => {
    try {
      const data = await api.getTripDetails(id);
      setSelectedTrip(data.data);
      setShowDetailsModal(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load trip details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading trips...</p>
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
              <MapPin className="text-green-500" size={28} />
              <h1 className="text-2xl font-bold">Trip Management</h1>
              <span className="text-sm text-gray-400 bg-[#0A0E0B] px-3 py-1 rounded-full border border-gray-800">
                {pagination.total} total
              </span>
            </div>
            <p className="text-sm text-gray-400">Monitor and manage all trips</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrips}
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
            <button onClick={fetchTrips} className="ml-auto text-green-500 hover:underline">Retry</button>
          </div>
        )}

        {/* ─── STATS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard 
            icon={MapPin} 
            label="Total Trips" 
            value={stats.total} 
            color="blue"
            onClick={() => setStatusFilter('all')}
          />
          <StatCard 
            icon={CheckCircle} 
            label="Completed" 
            value={stats.completed} 
            color="green"
            onClick={() => setStatusFilter('completed')}
          />
          <StatCard 
            icon={Clock} 
            label="In Progress" 
            value={stats.inProgress} 
            color="yellow"
            onClick={() => setStatusFilter('started')}
          />
          <StatCard 
            icon={Clock} 
            label="Pending" 
            value={stats.pending} 
            color="yellow"
            onClick={() => setStatusFilter('pending')}
          />
          <StatCard 
            icon={XCircle} 
            label="Cancelled" 
            value={stats.cancelled} 
            color="red"
            onClick={() => setStatusFilter('cancelled')}
          />
        </div>

        {/* ─── SEARCH & FILTER ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search trips..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          >
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="accepted">✅ Accepted</option>
            <option value="arrived">📍 Arrived</option>
            <option value="started">🚀 Started</option>
            <option value="completed">🎉 Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          />
          <div className="text-sm text-gray-500 flex items-center">
            {trips.length} trips
          </div>
        </div>

        {/* ─── TRIPS LIST ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
              <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No trips found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Trips will appear here once riders start booking'}
              </p>
            </div>
          ) : (
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onView={handleViewTrip}
                onStatusUpdate={handleStatusUpdate}
                onCancel={handleCancelTrip}
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

      {/* ─── TRIP DETAILS MODAL ──────────────────────────────────── */}
      {showDetailsModal && selectedTrip && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowDetailsModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-[#111714] pt-2 pb-3 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Trip Details</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${statusColors[selectedTrip.status]}`}>
                    {statusIcons[selectedTrip.status]}
                    {statusLabels[selectedTrip.status] || selectedTrip.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">ID: {selectedTrip.id}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Route */}
            <div className="bg-[#0A0E0B] rounded-xl p-4 border border-gray-800 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-green-500" />
                <span className="font-semibold text-white">Route Information</span>
              </div>
              <div className="space-y-2 ml-6">
                <p className="text-sm text-gray-300">From: {selectedTrip.pickup?.address || 'N/A'}</p>
                <div className="h-4 w-px bg-gray-700 ml-2" />
                <p className="text-sm text-gray-300">To: {selectedTrip.destination?.address || 'N/A'}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Distance</p>
                <p className="font-semibold text-white">{selectedTrip.distance || 0} km</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Duration</p>
                <p className="font-semibold text-white">{selectedTrip.duration || 0} min</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Fare</p>
                <p className="font-semibold text-green-500">RWF {selectedTrip.fare?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Payment</p>
                <p className="font-semibold text-white">{selectedTrip.paymentMethod || 'N/A'}</p>
              </div>
            </div>

            {/* Rider & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-blue-500" />
                  <span className="font-semibold text-white">Rider</span>
                </div>
                <p className="text-sm text-white">{selectedTrip.rider?.name || 'N/A'}</p>
                <p className="text-xs text-gray-400">{selectedTrip.rider?.phone || 'N/A'}</p>
              </div>
              {selectedTrip.driver && (
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-green-500" />
                    <span className="font-semibold text-white">Driver</span>
                  </div>
                  <p className="text-sm text-white">{selectedTrip.driver.name}</p>
                  <p className="text-xs text-gray-400">{selectedTrip.driver.vehicleNumber} • ⭐ {selectedTrip.driver.rating}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-yellow-500" />
                <span className="font-semibold text-white">Timeline</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-gray-400">Requested: {new Date(selectedTrip.requestedAt || selectedTrip.createdAt).toLocaleString()}</p>
                {selectedTrip.acceptedAt && <p className="text-gray-400">Accepted: {new Date(selectedTrip.acceptedAt).toLocaleString()}</p>}
                {selectedTrip.startedAt && <p className="text-gray-400">Started: {new Date(selectedTrip.startedAt).toLocaleString()}</p>}
                {selectedTrip.completedAt && <p className="text-gray-400">Completed: {new Date(selectedTrip.completedAt).toLocaleString()}</p>}
                {selectedTrip.cancelledAt && <p className="text-red-400">Cancelled: {new Date(selectedTrip.cancelledAt).toLocaleString()}</p>}
                {selectedTrip.cancellationReason && <p className="text-red-400">Reason: {selectedTrip.cancellationReason}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sticky bottom-0 bg-[#111714] pt-3 border-t border-gray-800">
              {selectedTrip.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedTrip.id, 'accepted');
                      setShowDetailsModal(false);
                    }}
                    disabled={processingId === selectedTrip.id}
                    className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-400 transition"
                  >
                    Accept Trip
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Cancellation reason:');
                      if (reason) {
                        handleCancelTrip(selectedTrip.id, reason);
                        setShowDetailsModal(false);
                      }
                    }}
                    disabled={processingId === selectedTrip.id}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 rounded-lg font-semibold hover:bg-red-500/20 transition"
                  >
                    Cancel
                  </button>
                </>
              )}
              {selectedTrip.status === 'accepted' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedTrip.id, 'arrived');
                    setShowDetailsModal(false);
                  }}
                  disabled={processingId === selectedTrip.id}
                  className="flex-1 bg-purple-500 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-400 transition"
                >
                  Mark as Arrived
                </button>
              )}
              {selectedTrip.status === 'arrived' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedTrip.id, 'started');
                    setShowDetailsModal(false);
                  }}
                  disabled={processingId === selectedTrip.id}
                  className="flex-1 bg-indigo-500 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-400 transition"
                >
                  Start Trip
                </button>
              )}
              {selectedTrip.status === 'started' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedTrip.id, 'completed');
                    setShowDetailsModal(false);
                  }}
                  disabled={processingId === selectedTrip.id}
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-lg font-semibold hover:bg-green-400 transition"
                >
                  Complete Trip
                </button>
              )}
              {(selectedTrip.status === 'completed' || selectedTrip.status === 'cancelled') && (
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-[#0A0E0B] text-gray-400 py-2.5 rounded-lg hover:text-white transition border border-gray-800"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
