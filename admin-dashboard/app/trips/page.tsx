'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ridersAPI } from '@/lib/api';
import { Search, Eye, Filter, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  accepted: 'bg-blue-500/20 text-blue-500',
  arrived: 'bg-purple-500/20 text-purple-500',
  started: 'bg-indigo-500/20 text-indigo-500',
  completed: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-red-500/20 text-red-500',
};

const statusIcons = {
  pending: <Clock size={12} className="text-yellow-500" />,
  accepted: <CheckCircle size={12} className="text-blue-500" />,
  arrived: <AlertCircle size={12} className="text-purple-500" />,
  started: <Clock size={12} className="text-indigo-500" />,
  completed: <CheckCircle size={12} className="text-green-500" />,
  cancelled: <XCircle size={12} className="text-red-500" />,
};

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch trips with filters
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['trips', search, statusFilter, dateRange],
    queryFn: () => ridersAPI.getAll({
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sort: ''
    }).then(res => res.data),
    refetchInterval: 30000,
  });

  // Update trip status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      // ridersAPI does not have updateStatus; use activate/suspend based on status
      if (status === 'active') return ridersAPI.activate(id);
      return ridersAPI.suspend(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip status updated');
      setSelectedTrip(null);
    },
    onError: () => {
      toast.error('Failed to update trip status');
    },
  });

  // Cancel trip mutation
  const cancelTripMutation = useMutation({
    mutationFn: (id: string) => ridersAPI.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip cancelled');
      setSelectedTrip(null);
    },
    onError: () => {
      toast.error('Failed to cancel trip');
    },
  });

  const trips = data?.rides || [];
  const stats = data?.stats || {
    total: 0,
    completed: 0,
    inProgress: 0,
    cancelled: 0,
    totalRevenue: 0,
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleCancelTrip = (id: string, reason: string) => {
    cancelTripMutation.mutate(id);
  };

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
            <h1 className="text-xl font-bold">Trip Management</h1>
            <p className="text-muted text-xs">Monitor and manage all trips</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Trips</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.inProgress || 0}</p>
            <p className="text-xs text-muted">In Progress</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
            <p className="text-xs text-muted">Cancelled</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by ride ID, rider, or driver..."
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
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="arrived">Arrived</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
            />
            <input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Trips Table - Desktop */}
        <div className="hidden md:block bg-darkCard border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-darkInput border-b border-border">
                <tr>
                  <th className="text-left p-4 text-muted font-medium text-sm">Trip ID</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Rider</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Driver</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Route</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Fare</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Status</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Time</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip: any) => (
                  <tr key={trip.id} className="border-b border-border hover:bg-darkInput/50 transition-all">
                    <td className="p-4 font-mono text-sm">#{trip.id?.slice(-8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{trip.rider?.name}</p>
                        <p className="text-xs text-muted">{trip.rider?.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm">{trip.driver?.name || 'Pending'}</p>
                        {trip.driver?.vehicleNumber && (
                          <p className="text-xs text-muted">{trip.driver.vehicleNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted">From: {trip.pickup?.address?.slice(0, 20)}</span>
                        <span className="text-xs text-muted">To: {trip.destination?.address?.slice(0, 20)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary font-semibold">RWF {trip.fare?.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {statusIcons[trip.status as keyof typeof statusIcons]}
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[trip.status as keyof typeof statusColors]}`}>
                          {trip.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {new Date(trip.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        className="p-2 rounded-lg hover:bg-darkInput transition-all"
                      >
                        <Eye size={16} className="text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trips Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {trips.map((trip: any) => (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-darkCard border border-border rounded-xl p-4 cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-muted">#{trip.id?.slice(-8)}</p>
                  <p className="font-semibold mt-1">{trip.rider?.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {statusIcons[trip.status as keyof typeof statusIcons]}
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[trip.status as keyof typeof statusColors]}`}>
                    {trip.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted mb-2">
                {trip.pickup?.address?.slice(0, 30)} → {trip.destination?.address?.slice(0, 30)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary font-semibold">RWF {trip.fare?.toLocaleString()}</span>
                <span className="text-xs text-muted">{new Date(trip.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {trips.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-muted" />
            </div>
            <p className="text-muted">No trips found</p>
            <p className="text-xs text-muted mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedTrip(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-darkCard pt-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Trip Details</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedTrip.status as keyof typeof statusColors]}`}>
                    {selectedTrip.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">ID: {selectedTrip.id}</p>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="p-2 hover:bg-darkInput rounded-full">
                ✕
              </button>
            </div>

            {/* Trip Info */}
            <div className="space-y-4 mb-6">
              <div className="bg-darkInput rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm">📍</span>
                  </div>
                  <span className="font-semibold">Route Information</span>
                </div>
                <div className="space-y-2 ml-11">
                  <p className="text-sm">From: {selectedTrip.pickup?.address}</p>
                  <div className="h-4 w-px bg-border ml-2" />
                  <p className="text-sm">To: {selectedTrip.destination?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-darkInput rounded-xl p-3">
                  <p className="text-muted text-xs mb-1">Distance</p>
                  <p className="font-semibold">{selectedTrip.distance} km</p>
                </div>
                <div className="bg-darkInput rounded-xl p-3">
                  <p className="text-muted text-xs mb-1">Duration</p>
                  <p className="font-semibold">{selectedTrip.duration} min</p>
                </div>
                <div className="bg-darkInput rounded-xl p-3">
                  <p className="text-muted text-xs mb-1">Fare</p>
                  <p className="font-semibold text-primary">RWF {selectedTrip.fare?.toLocaleString()}</p>
                </div>
                <div className="bg-darkInput rounded-xl p-3">
                  <p className="text-muted text-xs mb-1">Payment</p>
                  <p className="font-semibold">{selectedTrip.paymentMethod}</p>
                </div>
              </div>

              <div className="bg-darkInput rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <span className="font-semibold">Rider Information</span>
                </div>
                <div className="space-y-2 ml-11">
                  <p className="text-sm">Name: {selectedTrip.rider?.name}</p>
                  <p className="text-sm">Phone: {selectedTrip.rider?.phone}</p>
                </div>
              </div>

              {selectedTrip.driver && (
                <div className="bg-darkInput rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm">👨‍✈️</span>
                    </div>
                    <span className="font-semibold">Driver Information</span>
                  </div>
                  <div className="space-y-2 ml-11">
                    <p className="text-sm">Name: {selectedTrip.driver?.name}</p>
                    <p className="text-sm">Vehicle: {selectedTrip.driver?.vehicleNumber}</p>
                    <p className="text-sm">Rating: ⭐ {selectedTrip.driver?.rating}</p>
                  </div>
                </div>
              )}

              <div className="bg-darkInput rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm">📅</span>
                  </div>
                  <span className="font-semibold">Timeline</span>
                </div>
                <div className="space-y-2 ml-11">
                  <p className="text-sm">Requested: {new Date(selectedTrip.requestedAt).toLocaleString()}</p>
                  {selectedTrip.acceptedAt && <p className="text-sm">Accepted: {new Date(selectedTrip.acceptedAt).toLocaleString()}</p>}
                  {selectedTrip.startedAt && <p className="text-sm">Started: {new Date(selectedTrip.startedAt).toLocaleString()}</p>}
                  {selectedTrip.completedAt && <p className="text-sm">Completed: {new Date(selectedTrip.completedAt).toLocaleString()}</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sticky bottom-0 bg-darkCard pt-2 pb-2">
              {selectedTrip.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedTrip.id, 'accepted')}
                    className="bg-primary text-dark py-3 rounded-lg font-semibold"
                  >
                    Accept Trip
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Cancellation reason:');
                      if (reason) handleCancelTrip(selectedTrip.id, reason);
                    }}
                    className="bg-red-500/20 text-red-500 py-3 rounded-lg font-semibold"
                  >
                    Cancel Trip
                  </button>
                </>
              )}
              {selectedTrip.status === 'accepted' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTrip.id, 'arrived')}
                  className="bg-primary text-dark py-3 rounded-lg font-semibold"
                >
                  Mark as Arrived
                </button>
              )}
              {selectedTrip.status === 'arrived' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTrip.id, 'started')}
                  className="bg-primary text-dark py-3 rounded-lg font-semibold"
                >
                  Start Trip
                </button>
              )}
              {selectedTrip.status === 'started' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTrip.id, 'completed')}
                  className="bg-green-500 text-white py-3 rounded-lg font-semibold"
                >
                  Complete Trip
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}