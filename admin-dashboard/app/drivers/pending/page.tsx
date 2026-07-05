// app/drivers/pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  UserCheck,
  RefreshCw,
  AlertCircle,
  Bike,
  Bus,
  Truck,
  Eye,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Star,
  Search,
  ChevronDown,
  Grid3x3,
  List,
  ArrowUpDown,
  UserPlus,
  Clock,
  Shield,
  Award
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PendingDriver {
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
  walletBalance?: number;
}

export default function PendingDriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      setRefreshing(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login as admin');
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/admin/drivers/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          router.push('/login');
          throw new Error('Session expired');
        }
        const errorData = await res.text();
        throw new Error(`Failed to fetch pending drivers: ${errorData}`);
      }

      const data = await res.json();
      setDrivers(data.drivers || []);
      setError('');
      
      if (data.drivers?.length === 0) {
        toast.success('All clear! No pending drivers');
      } else if (data.drivers?.length > 0) {
        toast.success(`Found ${data.drivers.length} pending drivers`);
      }
    } catch (err: any) {
      console.error('Fetch pending drivers error:', err);
      setError(err.message || 'Failed to fetch pending drivers');
      toast.error(err.message || 'Failed to fetch pending drivers');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const handleApprove = async (driverId: string) => {
    if (processingId) return;
    
    setProcessingId(driverId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to approve driver: ${errorData}`);
      }

      const data = await res.json();
      setDrivers(prev => prev.filter(d => d.id !== driverId));
      toast.success(`✅ ${data.driver?.user?.name || 'Driver'} approved successfully!`);
      
    } catch (err: any) {
      console.error('Approve driver error:', err);
      toast.error(err.message || 'Failed to approve driver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (driverId: string) => {
    if (processingId) return;
    
    const driver = drivers.find(d => d.id === driverId);
    if (!confirm(`Are you sure you want to reject ${driver?.name || 'this driver'}?`)) {
      return;
    }
    
    setProcessingId(driverId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to reject driver: ${errorData}`);
      }

      setDrivers(prev => prev.filter(d => d.id !== driverId));
      toast.error(`❌ ${driver?.name || 'Driver'} rejected`);
      
    } catch (err: any) {
      console.error('Reject driver error:', err);
      toast.error(err.message || 'Failed to reject driver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (driver: PendingDriver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const handleCallDriver = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'MOTO': return <Bike size={20} className="text-orange-500" />;
      case 'BUS': return <Bus size={20} className="text-blue-500" />;
      case 'MINIBUS': return <Truck size={20} className="text-green-500" />;
      default: return <Bike size={20} className="text-gray-500" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch(type) {
      case 'MOTO': return 'Moto';
      case 'BUS': return 'Bus';
      case 'MINIBUS': return 'Mini-Bus';
      default: return 'Unknown';
    }
  };

  const getVehicleColor = (type: string) => {
    switch(type) {
      case 'MOTO': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'BUS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'MINIBUS': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredDrivers = drivers
    .filter(driver => {
      const matchesSearch = 
        driver.name?.toLowerCase().includes(search.toLowerCase()) ||
        driver.phone?.includes(search) ||
        driver.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
        driver.vehicleType?.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        case 'oldest':
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const stats = {
    total: drivers.length,
    moto: drivers.filter(d => d.vehicleType === 'MOTO').length,
    bus: drivers.filter(d => d.vehicleType === 'BUS').length,
    minibus: drivers.filter(d => d.vehicleType === 'MINIBUS').length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading pending drivers...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return <div className="min-h-screen bg-[#080C09]" />;

  return (
    <div className="text-white">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <UserCheck className="text-yellow-500" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Pending Approvals</h1>
                  <p className="text-sm text-gray-400">
                    Review and approve new driver registrations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => router.push('/drivers')}
                className="px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl hover:bg-[#1A1E1C] transition text-sm flex items-center gap-2"
              >
                <Users size={18} />
                All Drivers
              </button>
              <button 
                onClick={fetchPendingDrivers} 
                disabled={refreshing}
                className="px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl hover:bg-[#1A1E1C] transition disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS ROW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Total Pending</p>
          <p className="text-xl font-bold text-yellow-500">{stats.total}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Moto</p>
          <p className="text-xl font-bold text-orange-500">{stats.moto}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Bus</p>
          <p className="text-xl font-bold text-blue-500">{stats.bus}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Mini-Bus</p>
          <p className="text-xl font-bold text-green-500">{stats.minibus}</p>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search pending drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0A0E0B] border border-gray-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'grid'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1E1C]'
            }`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1E1C]'
            }`}
          >
            <List size={18} />
          </button>
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none px-4 py-2.5 bg-[#0A0E0B] border border-gray-700 rounded-xl text-sm text-white pr-10 focus:outline-none focus:border-yellow-500 transition cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      {/* ─── ERROR ────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="flex-1 text-sm">{error}</span>
          <button 
            onClick={fetchPendingDrivers}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── DRIVERS LIST ────────────────────────────────────────── */}
      {drivers.length === 0 ? (
        <div className="text-center py-20 bg-[#111714] border border-gray-800 rounded-2xl">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-400 text-xl font-semibold">All clear!</p>
          <p className="text-gray-500 text-sm mt-2">No pending driver approvals</p>
          <button
            onClick={fetchPendingDrivers}
            className="mt-4 px-6 py-2 bg-yellow-500/10 text-yellow-500 rounded-xl hover:bg-yellow-500/20 transition text-sm"
          >
            Refresh
          </button>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center py-20 bg-[#111714] border border-gray-800 rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400 text-xl font-semibold">No results found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className={`bg-[#111714] border border-gray-800 rounded-xl hover:border-yellow-500/30 transition-all duration-300 group ${
                viewMode === 'grid' ? 'p-5' : 'p-4 flex flex-col md:flex-row md:items-center gap-4'
              }`}
            >
              {viewMode === 'grid' ? (
                // ─── GRID VIEW ──────────────────────────────────────
                <>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center">
                        <span className="text-yellow-500 font-bold text-lg">
                          {driver.name?.charAt(0).toUpperCase() || 'D'}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#111714] flex items-center justify-center text-[10px] ${getVehicleColor(driver.vehicleType)}`}>
                        {driver.vehicleType === 'MOTO' ? '🛵' : driver.vehicleType === 'BUS' ? '🚌' : '🚐'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{driver.name}</h3>
                      <p className="text-xs text-gray-400">{driver.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#0A0E0B] rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Vehicle</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {getVehicleIcon(driver.vehicleType)}
                        {driver.vehicleNumber}
                      </p>
                    </div>
                    <div className="bg-[#0A0E0B] rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Type</p>
                      <p className="text-sm font-medium">{getVehicleTypeLabel(driver.vehicleType)}</p>
                    </div>
                    <div className="bg-[#0A0E0B] rounded-lg p-2.5 col-span-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Model</p>
                      <p className="text-sm font-medium">{driver.vehicleModel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-800 pt-3">
                    <span className="px-2 py-1 rounded-full text-[10px] font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      ⏳ Pending
                    </span>
                    <button
                      onClick={() => handleViewDetails(driver)}
                      className="ml-auto p-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleApprove(driver.id)}
                      disabled={processingId === driver.id}
                      className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-500 hover:bg-green-500/20 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {processingId === driver.id ? (
                        <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(driver.id)}
                      disabled={processingId === driver.id}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 hover:bg-red-500/20 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {processingId === driver.id ? (
                        <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                // ─── LIST VIEW ──────────────────────────────────────
                <>
                  <div className="flex items-center flex-1 min-w-0 gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-500 font-bold text-sm">
                        {driver.name?.charAt(0).toUpperCase() || 'D'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm truncate">{driver.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                        <span>{driver.phone}</span>
                        <span className="flex items-center gap-1">
                          {getVehicleIcon(driver.vehicleType)}
                          {driver.vehicleNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${getVehicleColor(driver.vehicleType)}`}>
                          {getVehicleTypeLabel(driver.vehicleType)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          ⏳ Pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetails(driver)}
                      className="p-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleCallDriver(driver.phone)}
                      className="p-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-gray-400 hover:text-green-400 hover:border-green-500/30 transition"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => handleApprove(driver.id)}
                      disabled={processingId === driver.id}
                      className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-500 hover:bg-green-500/20 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {processingId === driver.id ? (
                        <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(driver.id)}
                      disabled={processingId === driver.id}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 hover:bg-red-500/20 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {processingId === driver.id ? (
                        <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-gray-600">
            {filteredDrivers.length} pending drivers • {drivers.length} total
          </p>
          <div className="flex items-center gap-4 text-[10px] text-gray-600">
            <span>v2.0.1</span>
            <span className="w-px h-3 bg-gray-800" />
            <span className="flex items-center gap-1">
              <Shield size={10} /> Secure Admin
            </span>
          </div>
        </div>
      </div>

      {/* ─── DETAILS MODAL ──────────────────────────────────────────── */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111714] border border-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#111714] border-b border-gray-800 p-5 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center">
                  <span className="text-yellow-500 font-bold text-xl">
                    {selectedDriver.name?.charAt(0).toUpperCase() || 'D'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedDriver.name}</h2>
                  <p className="text-xs text-gray-400">Pending Driver Details</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 hover:bg-[#0A0E0B] rounded-lg transition text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0E0B] rounded-xl p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    {selectedDriver.phone}
                  </p>
                </div>
                {selectedDriver.email && (
                  <div className="bg-[#0A0E0B] rounded-xl p-3">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm truncate flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {selectedDriver.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#0A0E0B] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">Vehicle Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Type</p>
                    <p className="font-medium text-sm flex items-center gap-2">
                      {getVehicleIcon(selectedDriver.vehicleType)}
                      {getVehicleTypeLabel(selectedDriver.vehicleType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Number</p>
                    <p className="font-medium text-sm">{selectedDriver.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Model</p>
                    <p className="font-medium text-sm">{selectedDriver.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">License</p>
                    <p className="font-medium text-sm">{selectedDriver.licenseNumber}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0E0B] rounded-xl p-3 flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  Applied: {new Date(selectedDriver.joinedAt).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    handleApprove(selectedDriver.id);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 py-3 bg-green-500/10 text-green-500 rounded-xl font-medium hover:bg-green-500/20 transition flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle size={18} />
                  Approve Driver
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedDriver.id);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition flex items-center justify-center gap-2 text-sm"
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}