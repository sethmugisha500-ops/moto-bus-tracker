// admin-dashboard/app/routes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit, Eye, Trash2, X, 
  Loader2, RefreshCw, AlertCircle, MapPin,
  Clock, Bus, Truck, Route as RouteIcon,
  CheckCircle, XCircle, Calendar, ChevronDown,
  User, Phone, Mail, Map, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Route {
  id: string;
  name: string;
  number: string;
  stops: string[];
  vehicles: string[];
  schedule: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  assignedDrivers?: number;
  totalVehicles?: number;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getRoutes: async (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Route[]; stats: Stats; pagination: any }> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/admin/routes?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
  },

  createRoute: async (data: {
    name: string;
    number: string;
    stops: string[];
    vehicles: string[];
    schedule: string;
  }): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create route');
    return res.json();
  },

  updateRoute: async (id: string, data: Partial<Route>): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/routes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update route');
    return res.json();
  },

  deleteRoute: async (id: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/routes/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to delete route');
    return res.json();
  },

  toggleRouteStatus: async (id: string, status: string): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/routes/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update route status');
    return res.json();
  },
};

// ─── STAT CARD ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, subtitle, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition-all cursor-pointer group"
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

// ─── ROUTE CARD ──────────────────────────────────────────────────
const RouteCard = ({ 
  route, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onView 
}: any) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-blue-500/30 transition-all group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-white group-hover:text-blue-500 transition">
              {route.name}
            </h3>
            <span className="text-sm text-gray-400">#{route.number}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(route.status)}`}>
              {route.status}
            </span>
            {route.assignedDrivers !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-500 border border-blue-500/20">
                {route.assignedDrivers} drivers
              </span>
            )}
          </div>
          
          {/* Stops */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <MapPin size={12} /> Stops
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {route.stops?.map((stop: string, idx: number) => (
                <div key={idx} className="flex items-center">
                  <span className="text-xs bg-[#0A0E0B] px-2 py-1 rounded text-gray-300">
                    {stop}
                  </span>
                  {idx < route.stops.length - 1 && (
                    <span className="mx-1 text-gray-600">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vehicles & Schedule */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Bus size={12} /> Vehicles
              </p>
              <p className="text-white text-xs">
                {route.vehicles?.join(', ') || 'No vehicles assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> Schedule
              </p>
              <p className="text-white text-xs">{route.schedule || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onView(route.id)}
            className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
            title="View Details"
          >
            <Eye size={16} className="text-gray-400 hover:text-blue-500" />
          </button>
          <button
            onClick={() => onEdit(route)}
            className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
            title="Edit Route"
          >
            <Edit size={16} className="text-gray-400 hover:text-yellow-500" />
          </button>
          <button
            onClick={() => onToggleStatus(route.id, route.status === 'active' ? 'inactive' : 'active')}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
              route.status === 'active' 
                ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
            }`}
          >
            {route.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
            title="Delete Route"
          >
            <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    stops: '',
    vehicles: '',
    schedule: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch Routes ──────────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const data = await api.getRoutes({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setRoutes(data.data || []);
      setStats(data.stats || { total: 0, active: 0, inactive: 0, pending: 0 });
      setPagination(data.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch routes');
      toast.error('Failed to load routes');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search, statusFilter, pagination.page]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // ─── Create Route ──────────────────────────────────────────────
  const handleCreateRoute = async () => {
    if (!formData.name || !formData.number || !formData.stops) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.createRoute({
        name: formData.name,
        number: formData.number,
        stops: formData.stops.split(',').map(s => s.trim()),
        vehicles: formData.vehicles.split(',').map(v => v.trim()).filter(v => v),
        schedule: formData.schedule,
      });
      toast.success('Route created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create route');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Update Route ──────────────────────────────────────────────
  const handleUpdateRoute = async () => {
    if (!editingRoute || !formData.name || !formData.number) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateRoute(editingRoute.id, {
        name: formData.name,
        number: formData.number,
        stops: formData.stops.split(',').map(s => s.trim()),
        vehicles: formData.vehicles.split(',').map(v => v.trim()).filter(v => v),
        schedule: formData.schedule,
      });
      toast.success('Route updated successfully!');
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update route');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Route ──────────────────────────────────────────────
  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.deleteRoute(id);
      toast.success('Route deleted');
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete route');
    }
  };

  // ─── Toggle Status ─────────────────────────────────────────────
  const handleToggleStatus = async (id: string, status: string) => {
    try {
      await api.toggleRouteStatus(id, status);
      toast.success(`Route ${status === 'active' ? 'activated' : 'deactivated'}`);
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // ─── Edit Route ────────────────────────────────────────────────
  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      number: route.number,
      stops: route.stops?.join(', ') || '',
      vehicles: route.vehicles?.join(', ') || '',
      schedule: route.schedule || '',
    });
  };

  // ─── Reset Form ────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      stops: '',
      vehicles: '',
      schedule: '',
    });
  };

  // ─── Close Modal ───────────────────────────────────────────────
  const closeModal = () => {
    setShowAddModal(false);
    setEditingRoute(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading routes...</p>
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
              <RouteIcon className="text-blue-500" size={28} />
              <h1 className="text-2xl font-bold">Route Management</h1>
              <span className="text-sm text-gray-400 bg-[#0A0E0B] px-3 py-1 rounded-full border border-gray-800">
                {pagination.total} total
              </span>
            </div>
            <p className="text-sm text-gray-400">Manage bus and mini-bus routes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRoutes}
              disabled={refreshing}
              className="p-2 bg-[#0A0E0B] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-blue-500' : 'text-gray-400'} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-500 text-black rounded-lg text-sm font-semibold hover:bg-blue-400 transition flex items-center gap-2"
            >
              <Plus size={16} /> Add Route
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchRoutes} className="ml-auto text-blue-500 hover:underline">Retry</button>
          </div>
        )}

        {/* ─── STATS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard 
            icon={RouteIcon} 
            label="Total Routes" 
            value={stats.total} 
            color="blue"
            onClick={() => setStatusFilter('all')}
          />
          <StatCard 
            icon={CheckCircle} 
            label="Active" 
            value={stats.active} 
            color="green"
            onClick={() => setStatusFilter('active')}
          />
          <StatCard 
            icon={XCircle} 
            label="Inactive" 
            value={stats.inactive} 
            color="gray"
            onClick={() => setStatusFilter('inactive')}
          />
          <StatCard 
            icon={Clock} 
            label="Pending" 
            value={stats.pending} 
            color="yellow"
            onClick={() => setStatusFilter('pending')}
          />
        </div>

        {/* ─── SEARCH & FILTER ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search routes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Status</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
            <option value="pending">⏳ Pending</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Showing {routes.length} of {pagination.total}
          </div>
        </div>

        {/* ─── ROUTES LIST ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {routes.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
              <RouteIcon size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No routes found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first route to get started'}
              </p>
            </div>
          ) : (
            routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={handleEditRoute}
                onDelete={handleDeleteRoute}
                onToggleStatus={handleToggleStatus}
                onView={(id: string) => router.push(`/routes/${id}`)}
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

      {/* ─── ADD/EDIT ROUTE MODAL ──────────────────────────────────── */}
      {(showAddModal || editingRoute) && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={closeModal} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingRoute ? 'Edit Route' : 'Add New Route'}
                </h2>
                <p className="text-sm text-gray-400">
                  {editingRoute ? 'Update route information' : 'Create a new bus route'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Route Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Express"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Route Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Stops * (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Kigali City Center, Kimironko, Kacyiru"
                  value={formData.stops}
                  onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate stops with commas</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Assigned Vehicles (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. BUS-101, BUS-102"
                  value={formData.vehicles}
                  onChange={(e) => setFormData({ ...formData, vehicles: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 6:00 AM - 8:00 PM"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500 transition placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={editingRoute ? handleUpdateRoute : handleCreateRoute}
                  disabled={submitting}
                  className="flex-1 bg-blue-500 text-black py-2.5 rounded-lg font-semibold hover:bg-blue-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {editingRoute ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingRoute ? 'Update Route' : 'Create Route'
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-[#0A0E0B] text-gray-400 py-2.5 rounded-lg hover:text-white transition border border-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}