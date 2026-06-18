'use client';

import { useState, useEffect } from 'react';
import { Minibus, Search, Star, Eye, CheckCircle, XCircle, Loader2, Users, MapPin, Clock } from 'lucide-react';
import { driversAPI } from '@/lib/api';

interface MinibusDriver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  rating: number;
  trips: number;
  status: 'approved' | 'pending' | 'suspended';
  online: boolean;
  earnings: number;
  license: string;
  experience: number;
  // Minibus specific fields
  capacity: number;
  route: string;
  departureTime: string;
  returnTime: string;
  assistantName?: string;
  assistantPhone?: string;
}

export default function MinibusDriversPage() {
  const [drivers, setDrivers] = useState<MinibusDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'suspended'>('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await driversAPI.getAll({ 
        type: 'minibus',
        search: search || undefined,
        status: filter === 'all' ? undefined : filter
      });
      setDrivers(response.data);
    } catch (err: any) {
      console.error('Error fetching minibus drivers:', err);
      setError(err.response?.data?.message || 'Failed to load minibus drivers');
      
      // Fallback to mock data
      if (err.response?.status === 404) {
        console.warn('API endpoint not found, using mock data');
        setDrivers(getMockMinibusDrivers());
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockMinibusDrivers = (): MinibusDriver[] => {
    return [
      { 
        id: '1', 
        name: 'Jean Paul Niyonzima', 
        phone: '+250788123401', 
        vehicleNumber: 'MB-001A',
        rating: 4.8, 
        trips: 1247, 
        status: 'approved',
        online: true, 
        earnings: 875500, 
        license: 'DL001234', 
        experience: 7,
        capacity: 18,
        route: 'Kigali - Musanze',
        departureTime: '06:00',
        returnTime: '18:00',
        assistantName: 'Eric Musoni',
        assistantPhone: '+250788123411'
      },
      { 
        id: '2', 
        name: 'Marie Uwimana', 
        phone: '+250788123402', 
        vehicleNumber: 'MB-002B',
        rating: 4.9, 
        trips: 987, 
        status: 'approved',
        online: true, 
        earnings: 734000, 
        license: 'DL002345', 
        experience: 5,
        capacity: 18,
        route: 'Kigali - Rubavu',
        departureTime: '07:00',
        returnTime: '19:00',
        assistantName: 'David Mugisha',
        assistantPhone: '+250788123412'
      },
      { 
        id: '3', 
        name: 'Emmanuel Hakizimana', 
        phone: '+250788123403', 
        vehicleNumber: 'MB-003C',
        rating: 0, 
        trips: 0, 
        status: 'pending',
        online: false, 
        earnings: 0, 
        license: 'DL003456', 
        experience: 2,
        capacity: 18,
        route: 'Kigali - Huye',
        departureTime: '05:30',
        returnTime: '17:30',
        assistantName: '',
        assistantPhone: ''
      },
    ];
  };

  const approveDriver = async (id: string) => {
    setActionLoading(id);
    try {
      await driversAPI.approve(id);
      await fetchDrivers();
    } catch (err: any) {
      console.error('Error approving driver:', err);
      alert(err.response?.data?.message || 'Failed to approve driver');
    } finally {
      setActionLoading(null);
    }
  };

  const suspendDriver = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this minibus driver?')) return;
    
    setActionLoading(id);
    try {
      await driversAPI.suspend(id);
      await fetchDrivers();
    } catch (err: any) {
      console.error('Error suspending driver:', err);
      alert(err.response?.data?.message || 'Failed to suspend driver');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'suspended': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-500/20 text-green-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'suspended': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Minibus className="text-blue-500" size={28} /> 
            Minibus Drivers
          </h1>
          <p className="text-muted text-sm">Manage minibus drivers and their routes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-darkInput border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary w-full sm:w-64"
            />
          </div>
          <button 
            onClick={fetchDrivers}
            className="px-4 py-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'approved', 'pending', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              filter === status 
                ? 'bg-blue-500 text-white' 
                : 'bg-darkInput text-muted hover:bg-darkInput/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && drivers.length > 0 && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-500 text-sm">
          ⚠️ {error} (showing cached data)
        </div>
      )}

      {/* Drivers Grid */}
      <div className="grid gap-6">
        {drivers.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Minibus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No minibus drivers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          drivers.map((driver) => (
            <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-6 hover:border-blue-500/30 transition">
              {/* Main Info */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚐</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{driver.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                    <p className="text-muted text-sm">{driver.phone}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs bg-darkInput px-2 py-1 rounded">License: {driver.license}</span>
                      <span className="text-xs bg-darkInput px-2 py-1 rounded">{driver.experience} years exp</span>
                      <span className="text-xs bg-blue-500/20 px-2 py-1 rounded text-blue-500">
                        {driver.capacity} seats
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{driver.rating || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-muted">{driver.trips} trips</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">RWF {driver.earnings.toLocaleString()}</p>
                    <div className="flex items-center gap-2 justify-end">
                      {driver.online ? (
                        <span className="text-green-500 text-xs">● Online</span>
                      ) : (
                        <span className="text-gray-500 text-xs">● Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <MapPin size={12} /> Route
                  </p>
                  <p className="font-medium">{driver.route}</p>
                </div>
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} /> Schedule
                  </p>
                  <p className="font-medium">{driver.departureTime} - {driver.returnTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Users size={12} /> Vehicle Number
                  </p>
                  <p className="font-mono font-medium">{driver.vehicleNumber}</p>
                </div>
              </div>

              {/* Assistant Info (if available) */}
              {driver.assistantName && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted">Assistant</p>
                  <p className="text-sm">
                    {driver.assistantName} 
                    <span className="text-muted text-xs ml-2">({driver.assistantPhone})</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition">
                  <Eye size={16} /> View Details
                </button>
                {driver.status === 'pending' && (
                  <button 
                    onClick={() => approveDriver(driver.id)}
                    disabled={actionLoading === driver.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                  >
                    {actionLoading === driver.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approve
                  </button>
                )}
                {driver.status !== 'suspended' && (
                  <button 
                    onClick={() => suspendDriver(driver.id)}
                    disabled={actionLoading === driver.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                  >
                    {actionLoading === driver.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Suspend
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition">
                  <Clock size={16} /> View Schedule
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}