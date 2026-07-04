// app/driver/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Phone, Mail, MapPin, 
  Car, Settings, Edit, Save,
  X, Camera, Shield, CheckCircle,
  Star, DollarSign, Clock, Award,
  AlertCircle, Loader2, RefreshCw,
  Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DriverProfile {
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
  walletBalance: number;
  joinedAt: string;
}

export default function DriverProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Partial<DriverProfile>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/drivers/profile`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
        } else {
          // Try to get stats as fallback
          await fetchStatsAsFallback();
        }
      } else if (res.status === 404) {
        // Driver profile not found - try to get stats
        await fetchStatsAsFallback();
      } else {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to fetch profile');
      // Try to get stats as fallback
      await fetchStatsAsFallback();
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // ── Fallback: Get stats from driver stats endpoint ──────────────────
  const fetchStatsAsFallback = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/drivers/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const stats = data.stats;
          // Get user data from localStorage
          const userData = localStorage.getItem('user');
          let user = null;
          try {
            user = userData ? JSON.parse(userData) : null;
          } catch {}

          setProfile({
            id: 'local',
            userId: user?.id || '',
            name: stats.name || user?.name || 'Driver',
            phone: stats.phone || user?.phone || '',
            email: user?.email || '',
            licenseNumber: stats.vehicle?.number || 'N/A',
            vehicleType: stats.vehicle?.type || 'MOTO',
            vehicleNumber: stats.vehicle?.number || 'N/A',
            vehicleModel: stats.vehicle?.model || 'N/A',
            isApproved: stats.isApproved || false,
            isOnline: stats.isOnline || false,
            rating: stats.rating || 4.8,
            totalTrips: stats.totalTrips || 0,
            totalEarnings: stats.totalEarnings || 0,
            walletBalance: 0,
            joinedAt: new Date().toISOString(),
          });
          toast('Showing basic profile info');
        }
      }
    } catch (err) {
      console.error('Stats fallback error:', err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_URL}/drivers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...profile, ...editedFields }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setIsEditing(false);
          setEditedFields({});
          toast.success('Profile updated successfully!');
          // Also update localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              user.name = data.data.name || user.name;
              user.phone = data.data.phone || user.phone;
              user.email = data.data.email || user.email;
              localStorage.setItem('user', JSON.stringify(user));
            } catch {}
          }
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getVehicleEmoji = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'MOTO': return '🏍️';
      case 'CAR': return '🚗';
      case 'BUS': return '🚌';
      case 'MINIBUS': return '🚐';
      default: return '🚗';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-gray-400 font-medium">Profile not found</p>
          <p className="text-xs text-gray-500 mt-1">Please contact support</p>
          <button 
            onClick={fetchProfile} 
            className="mt-4 px-6 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User size={24} className="text-green-500" />
            Profile
          </h1>
          <p className="text-sm text-gray-400">
            Manage your driver account
          </p>
        </div>
        <button
          onClick={fetchProfile}
          disabled={refreshing}
          className="p-2 bg-[#111714] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── PROFILE CARD ──────────────────────────────────────────── */}
      <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-3xl font-bold text-green-500 border-2 border-green-500/30">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  profile.isApproved 
                    ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                    : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                }`}>
                  {profile.isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  profile.isOnline 
                    ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/20'
                }`}>
                  {profile.isOnline ? '🟢 Online' : '⚪ Offline'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone size={14} /> {profile.phone}
                </span>
                {profile.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {profile.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" /> {profile.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} /> {profile.totalTrips} trips
                </span>
                <span className="flex items-center gap-1 text-green-500">
                  <DollarSign size={14} /> RWF {profile.totalEarnings.toLocaleString()}
                </span>
                {profile.walletBalance > 0 && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Wallet size={14} /> RWF {profile.walletBalance.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-sm hover:border-green-500/30 transition flex items-center gap-2 flex-shrink-0"
          >
            <Edit size={16} />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* ─── VEHICLE INFO ──────────────────────────────────────────── */}
      <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
          <Car size={16} />
          Vehicle Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getVehicleEmoji(profile.vehicleType)}</span>
            <div>
              <p className="text-xs text-gray-500">Vehicle Type</p>
              <p className="font-medium">{profile.vehicleType || 'N/A'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vehicle Number</p>
            <p className="font-medium">{profile.vehicleNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vehicle Model</p>
            <p className="font-medium">{profile.vehicleModel || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">License Number</p>
            <p className="font-medium">{profile.licenseNumber || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className={`font-medium ${profile.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
              {profile.isOnline ? '🟢 Online' : '⚪ Offline'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="font-medium">
              {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── EDIT MODE ─────────────────────────────────────────────── */}
      {isEditing && (
        <div className="bg-[#111714] border border-green-500/20 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
            <Edit size={16} />
            Edit Profile
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                defaultValue={profile.name}
                onChange={(e) => setEditedFields({ ...editedFields, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Phone</label>
              <input
                type="text"
                defaultValue={profile.phone}
                onChange={(e) => setEditedFields({ ...editedFields, phone: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <input
                type="email"
                defaultValue={profile.email}
                onChange={(e) => setEditedFields({ ...editedFields, email: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Vehicle Number</label>
              <input
                type="text"
                defaultValue={profile.vehicleNumber}
                onChange={(e) => setEditedFields({ ...editedFields, vehicleNumber: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Vehicle Model</label>
              <input
                type="text"
                defaultValue={profile.vehicleModel}
                onChange={(e) => setEditedFields({ ...editedFields, vehicleModel: e.target.value })}
                className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500/30"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── QUICK ACTIONS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/driver/earnings"
          className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-green-500/30 transition group"
        >
          <DollarSign size={24} className="text-green-500 mx-auto mb-2 group-hover:scale-110 transition" />
          <p className="text-sm font-medium">View Earnings</p>
        </Link>
        <Link
          href="/driver/rides"
          className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center hover:border-green-500/30 transition group"
        >
          <Clock size={24} className="text-blue-500 mx-auto mb-2 group-hover:scale-110 transition" />
          <p className="text-sm font-medium">Ride History</p>
        </Link>
      </div>
    </div>
  );
}
