// app/driver/rides/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, MapPin, DollarSign, Star, 
  ChevronRight, RefreshCw, Loader2,
  CheckCircle, XCircle, AlertCircle,
  Calendar, Search, Filter, Users,
  TrendingUp, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Ride {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  status: string;
  createdAt: string;
  riderName?: string;
  riderPhone?: string;
  distance?: number;
  duration?: number;
  paymentMethod?: string;
  completedAt?: string;
  rating?: number;
}

export default function DriverRides() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [driverName, setDriverName] = useState("Driver");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get driver name from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name || "Driver");
      }
    } catch {}
    
    fetchRides();
  }, [router]);

  const fetchRides = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/drivers/rides`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRides(data.rides || []);
          if (data.rides && data.rides.length > 0) {
            toast.success(`Loaded ${data.rides.length} rides`);
          }
        } else {
          setRides([]);
        }
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        // Fallback to mock data if API not ready
        const mockRides = generateMockRides();
        setRides(mockRides);
        toast('Using demo ride data');
      }
    } catch (err: any) {
      console.error('Fetch rides error:', err);
      setError(err.message || 'Failed to fetch rides');
      // Fallback to mock data
      const mockRides = generateMockRides();
      setRides(mockRides);
      toast('Using demo ride data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const generateMockRides = (): Ride[] => {
    const now = new Date();
    const riders = [
      { name: 'Jean Paul', phone: '+250788123456' },
      { name: 'Marie Claire', phone: '+250788123457' },
      { name: 'Eric Muneza', phone: '+250788123458' },
      { name: 'Sarah Uwimana', phone: '+250788123459' },
      { name: 'Peter Nshuti', phone: '+250788123460' },
      { name: 'Grace Umutoni', phone: '+250788123461' },
    ];

    const pickupPlaces = [
      'Kigali Convention Centre',
      'Kacyiru, Sector 4',
      'Kimihurura, Roundabout',
      'Gishushu, Near MTN Center',
      'Remera, Near Kigali Heights',
      'Nyarutarama, Golf Course',
    ];

    const dropoffPlaces = [
      'Kimironko Market',
      'Norrsken House',
      'Kigali Airport',
      'Kicukiro, St. Famille',
      'Nyabugogo, Bus Terminal',
      'Kigali City Tower',
    ];

    const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'ACTIVE', 'COMPLETED'];
    const paymentMethods = ['MOBILE_MONEY', 'CASH', 'WALLET', 'MOBILE_MONEY', 'CASH', 'MOBILE_MONEY'];

    return riders.map((rider, index) => {
      const status = statuses[index % statuses.length];
      const isCompleted = status === 'COMPLETED';
      const hoursAgo = (index + 1) * 2;
      const createdAt = new Date(now);
      createdAt.setHours(createdAt.getHours() - hoursAgo);
      
      let completedAt = undefined;
      if (isCompleted) {
        completedAt = new Date(createdAt);
        completedAt.setMinutes(completedAt.getMinutes() + 15 + index * 5);
      }

      return {
        id: `RIDE-${String(100 + index).padStart(3, '0')}`,
        riderName: rider.name,
        riderPhone: rider.phone,
        pickupAddress: pickupPlaces[index % pickupPlaces.length],
        dropoffAddress: dropoffPlaces[index % dropoffPlaces.length],
        fare: Math.round((1500 + Math.random() * 3500) / 100) * 100,
        status: status,
        createdAt: createdAt.toISOString(),
        completedAt: completedAt?.toISOString(),
        distance: Number((2 + Math.random() * 8).toFixed(1)),
        duration: Math.round(5 + Math.random() * 25),
        paymentMethod: paymentMethods[index % paymentMethods.length],
        rating: isCompleted ? Number((4 + Math.random() * 1).toFixed(1)) : undefined,
      };
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      COMPLETED: { 
        color: 'bg-green-500/20 text-green-500 border-green-500/20', 
        label: 'Completed',
        icon: <CheckCircle size={14} className="text-green-500" />
      },
      CANCELLED: { 
        color: 'bg-red-500/20 text-red-500 border-red-500/20', 
        label: 'Cancelled',
        icon: <XCircle size={14} className="text-red-500" />
      },
      ACTIVE: { 
        color: 'bg-blue-500/20 text-blue-500 border-blue-500/20', 
        label: 'Active',
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      },
      ACCEPTED: { 
        color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20', 
        label: 'Accepted',
        icon: <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      },
      STARTED: { 
        color: 'bg-purple-500/20 text-purple-500 border-purple-500/20', 
        label: 'In Progress',
        icon: <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
      },
      PENDING: { 
        color: 'bg-orange-500/20 text-orange-500 border-orange-500/20', 
        label: 'Pending',
        icon: <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/20', label: status, icon: null };
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'completed' && ride.status !== 'COMPLETED') return false;
    if (filter === 'cancelled' && ride.status !== 'CANCELLED') return false;
    if (filter === 'active' && !['ACTIVE', 'ACCEPTED', 'STARTED', 'PENDING'].includes(ride.status)) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return ride.riderName?.toLowerCase().includes(search) ||
             ride.pickupAddress?.toLowerCase().includes(search) ||
             ride.dropoffAddress?.toLowerCase().includes(search) ||
             ride.id.toLowerCase().includes(search);
    }
    return true;
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const total = rides.length;
    const completed = rides.filter(r => r.status === 'COMPLETED').length;
    const cancelled = rides.filter(r => r.status === 'CANCELLED').length;
    const active = rides.filter(r => ['ACTIVE', 'ACCEPTED', 'STARTED', 'PENDING'].includes(r.status)).length;
    const totalEarnings = rides
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.fare, 0);
    
    return { total, completed, cancelled, active, totalEarnings };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading ride history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📋 Ride History</h1>
          <p className="text-sm text-gray-400">
            {rides.length} total rides • {stats.totalEarnings > 0 && `RWF ${stats.totalEarnings.toLocaleString()} earned`}
          </p>
        </div>
        <button
          onClick={fetchRides}
          disabled={refreshing}
          className="p-2 bg-[#111714] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : 'text-gray-400'} />
        </button>
      </div>

      {/* ─── STATS ROW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400">Total</p>
          <p className="text-lg font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400">Active</p>
          <p className="text-lg font-bold text-blue-400">{stats.active}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400">Completed</p>
          <p className="text-lg font-bold text-green-500">{stats.completed}</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-2 text-center">
          <p className="text-[10px] text-gray-400">Cancelled</p>
          <p className="text-lg font-bold text-red-400">{stats.cancelled}</p>
        </div>
      </div>

      {/* ─── FILTERS ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'all'
              ? 'bg-green-500/20 text-green-500 border border-green-500/20'
              : 'bg-[#111714] text-gray-400 border border-gray-800 hover:border-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'active'
              ? 'bg-blue-500/20 text-blue-500 border border-blue-500/20'
              : 'bg-[#111714] text-gray-400 border border-gray-800 hover:border-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'completed'
              ? 'bg-green-500/20 text-green-500 border border-green-500/20'
              : 'bg-[#111714] text-gray-400 border border-gray-800 hover:border-gray-700'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'cancelled'
              ? 'bg-red-500/20 text-red-500 border border-red-500/20'
              : 'bg-[#111714] text-gray-400 border border-gray-800 hover:border-gray-700'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* ─── SEARCH ────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by rider, location, or ride ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#111714] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30 transition placeholder-gray-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* ─── ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── RIDES LIST ───────────────────────────────────────────── */}
      {filteredRides.length === 0 ? (
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400 font-medium">No rides found</p>
          <p className="text-xs text-gray-500 mt-1">
            {searchTerm ? 'Try adjusting your search' : 'Your ride history will appear here'}
          </p>
          <button
            onClick={fetchRides}
            className="mt-4 px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-600 transition"
          >
            <RefreshCw size={12} className="inline mr-1" />
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => {
            const badge = getStatusBadge(ride.status);
            return (
              <Link
                key={ride.id}
                href={`/driver/rides/${ride.id}`}
                className="block bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-white flex items-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        {ride.riderName || 'Rider'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      {ride.rating && ride.status === 'COMPLETED' && (
                        <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                          <Star size={10} fill="currentColor" /> {ride.rating}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400 flex items-center gap-2 truncate">
                        <MapPin size={14} className="text-green-500 flex-shrink-0" />
                        {ride.pickupAddress}
                      </p>
                      <p className="text-gray-400 flex items-center gap-2 truncate">
                        <span className="text-orange-500 flex-shrink-0">🏁</span>
                        {ride.dropoffAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(ride.createdAt)}
                      </span>
                      {ride.distance && (
                        <span>📏 {ride.distance.toFixed(1)} km</span>
                      )}
                      {ride.duration && (
                        <span>⏱️ {ride.duration} min</span>
                      )}
                      {ride.paymentMethod && (
                        <span>💳 {ride.paymentMethod.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className="text-green-500 font-bold">
                      RWF {ride.fare.toLocaleString()}
                    </span>
                    {ride.status === 'COMPLETED' && (
                      <span className="text-[10px] text-green-400/60">✓ Paid</span>
                    )}
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-green-500 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── TIPS ─────────────────────────────────────────────────── */}
      <div className="mt-6 p-4 bg-[#111714] border border-gray-800 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Award size={14} />
          Ride Tips
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Higher ratings lead to more ride requests</li>
          <li>• Accept rides quickly to improve your acceptance rate</li>
          <li>• Completed rides with ratings help you build trust</li>
        </ul>
      </div>
    </div>
  );
}
