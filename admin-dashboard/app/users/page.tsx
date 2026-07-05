'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Safely access env var without referencing the undeclared `process` in the client
const API_URL = ((typeof globalThis !== 'undefined' && (globalThis as any).process && (globalThis as any).process.env && (globalThis as any).process.env.NEXT_PUBLIC_API_URL) as string) || 'http://localhost:5000/api';

// Admin API functions
const adminAPI = {
  getDrivers: async (params: { search?: string; status?: string }) => {
    const token = localStorage.getItem('token');
    const apiUrl = API_URL;
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    const res = await fetch(`${apiUrl}/admin/drivers?${queryParams}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch drivers');
    return res.json();
  },
  suspendDriver: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/drivers/${id}/suspend`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to suspend driver');
    return res.json();
  },
};
import { 
  Search, Eye, UserCheck, UserX, Users, UserPlus, 
  RefreshCw, Filter, Calendar, TrendingUp, AlertCircle,
  Phone, Mail, MapPin, Star, Clock, MoreVertical,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RidersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const ridersAPI = {
    getAll: (params: { search?: string; status?: string; sort?: string }) =>
      adminAPI.getDrivers({
        search: params.search,
        status: params.status,
      }),
    suspend: (id: string) => adminAPI.suspendDriver(id),
    activate: async (id: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/drivers/${id}/activate`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to activate rider');
      return res.json();
    },
  };

  // Fetch riders
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['riders', search, statusFilter, sortBy],
    queryFn: () => ridersAPI.getAll({ 
      search, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sort: sortBy,
    }).then(res => res.data),
    refetchInterval: 30000,
  });

  // Suspend rider mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => ridersAPI.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider suspended successfully');
    },
    onError: () => {
      toast.error('Failed to suspend rider');
    },
  });

  // Activate rider mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => ridersAPI.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Rider activated successfully');
    },
    onError: () => {
      toast.error('Failed to activate rider');
    },
  });

  const riders = data?.riders || [];
  const stats = data?.stats || {
    total: 0,
    active: 0,
    newThisMonth: 0,
    totalTrips: 0,
    totalSpent: 0,
  };

  const handleSuspend = (id: string) => {
    if (confirm('Are you sure you want to suspend this rider?')) {
      suspendMutation.mutate(id);
    }
  };

  const handleActivate = (id: string) => {
    if (confirm('Are you sure you want to activate this rider?')) {
      activateMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number) => `RWF ${amount?.toLocaleString() || 0}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Rider Management</h1>
            <p className="text-muted text-xs">Manage passenger accounts and ride history</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Users size={18} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Riders</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <UserCheck size={18} className="text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <TrendingUp size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-500">{stats.totalTrips}</p>
            <p className="text-xs text-muted">Total Trips</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Wallet size={18} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-xs text-muted">Total Spent</p>
          </div>
        </div>

        {/* New Riders This Month */}
        <div className="bg-darkCard border border-border rounded-xl p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium">New Riders This Month</p>
              <p className="text-xs text-muted">New signups in the last 30 days</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.newThisMonth}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_trips">Most Trips</option>
            <option value="most_spent">Most Spent</option>
          </select>
        </div>

        {/* Riders Table - Desktop */}
        <div className="hidden md:block bg-darkCard border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-darkInput border-b border-border">
                <tr>
                  <th className="text-left p-4 text-muted font-medium text-sm">Rider</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Contact</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Trips</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Total Spent</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Status</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Joined</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider: any) => (
                  <tr key={rider.id} className="border-b border-border hover:bg-darkInput/50 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-semibold">{rider.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{rider.name}</p>
                          <p className="text-xs text-muted">ID: {rider.id?.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone size={12} className="text-muted" />
                          <span>{rider.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail size={12} className="text-muted" />
                          <span className="text-xs text-muted">{rider.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold">{rider.totalTrips}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary font-semibold">{formatCurrency(rider.totalSpent)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rider.status === 'active' ? 'bg-green-500/20 text-green-500' :
                        rider.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {rider.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(rider.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRider(rider);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-darkInput transition-all"
                          title="View Details"
                        >
                          <Eye size={16} className="text-primary" />
                        </button>
                        {rider.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(rider.id)}
                            className="p-2 rounded-lg hover:bg-darkInput transition-all"
                            title="Suspend"
                          >
                            <UserX size={16} className="text-red-500" />
                          </button>
                        ) : rider.status === 'suspended' ? (
                          <button
                            onClick={() => handleActivate(rider.id)}
                            className="p-2 rounded-lg hover:bg-darkInput transition-all"
                            title="Activate"
                          >
                            <UserCheck size={16} className="text-green-500" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riders Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {riders.map((rider: any) => (
            <div
              key={rider.id}
              className="bg-darkCard border border-border rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-semibold">{rider.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{rider.name}</p>
                    <p className="text-xs text-muted">{rider.phone}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  rider.status === 'active' ? 'bg-green-500/20 text-green-500' :
                  rider.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {rider.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <p className="text-muted text-xs">Trips</p>
                  <p className="font-bold">{rider.totalTrips}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <p className="text-muted text-xs">Spent</p>
                  <p className="font-bold text-primary">{formatCurrency(rider.totalSpent)}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <p className="text-muted text-xs">Joined</p>
                  <p className="text-xs">{new Date(rider.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setSelectedRider(rider);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 bg-primary/10 text-primary py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Eye size={14} /> View Details
                </button>
                {rider.status === 'active' ? (
                  <button
                    onClick={() => handleSuspend(rider.id)}
                    className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg text-sm font-semibold"
                  >
                    Suspend
                  </button>
                ) : rider.status === 'suspended' ? (
                  <button
                    onClick={() => handleActivate(rider.id)}
                    className="flex-1 bg-green-500/10 text-green-500 py-2 rounded-lg text-sm font-semibold"
                  >
                    Activate
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {riders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-muted" />
            </div>
            <p className="text-muted">No riders found</p>
            <p className="text-xs text-muted mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Rider Details Modal */}
      {showDetailsModal && selectedRider && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowDetailsModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-darkCard pt-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-3xl font-semibold">{selectedRider.name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedRider.name}</h3>
                  <p className="text-xs text-muted">ID: {selectedRider.id?.slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-darkInput rounded-full">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Status & Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-darkInput rounded-lg p-3 text-center">
                  <p className="text-muted text-xs">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                    selectedRider.status === 'active' ? 'bg-green-500/20 text-green-500' :
                    selectedRider.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedRider.status}
                  </span>
                </div>
                <div className="bg-darkInput rounded-lg p-3 text-center">
                  <p className="text-muted text-xs">Total Trips</p>
                  <p className="text-xl font-bold">{selectedRider.totalTrips}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-3 text-center">
                  <p className="text-muted text-xs">Total Spent</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedRider.totalSpent)}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-darkInput rounded-lg p-4">
                <p className="text-muted text-xs mb-3">Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={14} className="text-muted" />
                    <span>{selectedRider.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={14} className="text-muted" />
                    <span>{selectedRider.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={14} className="text-muted" />
                    <span>Joined: {new Date(selectedRider.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Ride History Preview */}
              <div className="bg-darkInput rounded-lg p-4">
                <p className="text-muted text-xs mb-3">Recent Rides</p>
                {selectedRider.recentRides?.slice(0, 3).map((ride: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm">{ride.pickup?.address} → {ride.destination?.address}</p>
                      <p className="text-xs text-muted">{new Date(ride.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-primary font-semibold">{formatCurrency(ride.fare)}</span>
                  </div>
                ))}
                {(!selectedRider.recentRides || selectedRider.recentRides.length === 0) && (
                  <p className="text-sm text-muted">No recent rides</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 sticky bottom-0 bg-darkCard pt-2 pb-2">
                <button className="flex-1 bg-primary text-dark py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <Eye size={16} /> View Full History
                </button>
                {selectedRider.status === 'active' ? (
                  <button
                    onClick={() => {
                      handleSuspend(selectedRider.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-red-500/20 text-red-500 py-3 rounded-lg font-semibold"
                  >
                    Suspend Rider
                  </button>
                ) : selectedRider.status === 'suspended' ? (
                  <button
                    onClick={() => {
                      handleActivate(selectedRider.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-green-500/20 text-green-500 py-3 rounded-lg font-semibold"
                  >
                    Activate Rider
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}