// admin-dashboard/app/drivers/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, MapPin,
  CheckCircle, XCircle, Clock, Award, DollarSign,
  Car, Truck, Bike, Star, Shield, AlertCircle,
  RefreshCw, Loader2, Edit, Save, X,
  UserCheck, UserX, Wifi, WifiOff,
  Bus, TrendingUp, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';

interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  driver: {
    id: string;
    licenseNumber: string;
    vehicleType: 'MOTO' | 'BUS' | 'MINIBUS';
    vehicleNumber: string;
    vehicleModel: string;
    isApproved: boolean;
    isOnline: boolean;
    rating: number;
    totalTrips: number;
    totalEarnings: number;
    currentLat?: number;
    currentLng?: number;
    joinedAt: string;
  } | null;
  wallet: {
    balance: number;
  } | null;
  stats: {
    totalRides: number;
    totalEarnings: number;
    averageRating: number;
  };
  recentRides: any[];
  ratings: any[];
  sosAlerts: any[];
  locations: any[];
}

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params.id as string;

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: '',
    licenseNumber: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Fetch Driver Profile ──────────────────────────────────────
  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/admin/drivers/profile/${driverId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch driver profile');
      }

      const data = await res.json();
      setProfile(data.data);
      
      // Initialize edit form with driver data
      if (data.data.driver) {
        setEditForm({
          vehicleType: data.data.driver.vehicleType || '',
          vehicleNumber: data.data.driver.vehicleNumber || '',
          vehicleModel: data.data.driver.vehicleModel || '',
          licenseNumber: data.data.driver.licenseNumber || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load driver profile');
      toast.error('Failed to load driver details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && driverId) {
      fetchDriverProfile();
    }
  }, [mounted, driverId]);

  // ─── Toggle Online Status ──────────────────────────────────────
  const handleToggleOnline = async () => {
    if (!profile?.driver) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/toggle-online`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to toggle status');

      const data = await res.json();
      setProfile(prev => prev ? {
        ...prev,
        driver: prev.driver ? {
          ...prev.driver,
          isOnline: data.data.isOnline,
        } : null,
      } : null);

      toast.success(`Driver is now ${data.data.isOnline ? 'Online' : 'Offline'}`);
      await fetchDriverProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Toggle Approval Status ────────────────────────────────────
  const handleToggleApproval = async () => {
    if (!profile?.driver) return;

    if (!confirm(`Are you sure you want to ${profile.driver.isApproved ? 'unapprove' : 'approve'} this driver?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: !profile.driver.isApproved,
        }),
      });

      if (!res.ok) throw new Error('Failed to update approval status');

      const data = await res.json();
      setProfile(prev => prev ? {
        ...prev,
        driver: prev.driver ? {
          ...prev.driver,
          isApproved: data.data.isApproved,
        } : null,
      } : null);

      toast.success(`Driver ${data.data.isApproved ? 'Approved' : 'Unapproved'}`);
      await fetchDriverProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update approval status');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Toggle Active Status (Suspend/Unsuspend) ─────────────────
  const handleToggleActive = async () => {
    if (!profile) return;
    
    const action = profile.isActive ? 'suspend' : 'unsuspend';
    if (!confirm(`Are you sure you want to ${action} this driver?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users/${driverId}/toggle-active`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !profile.isActive }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} driver`);

      toast.success(`Driver ${profile.isActive ? 'suspended' : 'unsuspended'}`);
      await fetchDriverProfile();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} driver`);
    } finally {
      setProcessing(false);
    }
  };

  // ─── Update Vehicle Information ────────────────────────────────
  const handleUpdateVehicle = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/vehicle`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update vehicle information');

      const data = await res.json();
      
      setProfile(prev => prev ? {
        ...prev,
        driver: prev.driver ? {
          ...prev.driver,
          vehicleType: data.data.vehicleType,
          vehicleNumber: data.data.vehicleNumber,
          vehicleModel: data.data.vehicleModel,
          licenseNumber: data.data.licenseNumber,
        } : null,
      } : null);

      setIsEditing(false);
      toast.success('Vehicle information updated successfully');
      await fetchDriverProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vehicle information');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Get Vehicle Icon ───────────────────────────────────────────
  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'MOTO': return <Bike size={24} className="text-orange-500" />;
      case 'BUS': return <Bus size={24} className="text-blue-500" />;
      case 'MINIBUS': return <Truck size={24} className="text-green-500" />;
      default: return <Car size={24} className="text-gray-500" />;
    }
  };

  // ─── Get Status Badge ───────────────────────────────────────────
  const getStatusBadge = (status: boolean, label: string, trueColor = 'green', falseColor = 'red') => {
    return status ? (
      <span className={`flex items-center gap-1 px-2 py-1 bg-${trueColor}-500/20 text-${trueColor}-500 rounded-full text-xs font-medium`}>
        <CheckCircle size={12} /> {label}
      </span>
    ) : (
      <span className={`flex items-center gap-1 px-2 py-1 bg-${falseColor}-500/20 text-${falseColor}-400 rounded-full text-xs font-medium`}>
        <XCircle size={12} /> {label}
      </span>
    );
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading driver profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center p-4">
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Driver Not Found</h2>
          <p className="text-gray-400 text-sm">{error || 'The driver you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/drivers')}
            className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/drivers')}
            className="p-2 bg-[#0A0E0B] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Driver Profile
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
              profile.driver?.isApproved 
                ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'
            }`}>
              {profile.driver?.isApproved ? '✅ Approved' : '⏳ Pending'}
            </span>
          </h1>
        </div>

        {/* ─── Main Profile Card ───────────────────────────────────── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Avatar & Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-yellow-500">
                  {profile.name?.charAt(0).toUpperCase() || 'D'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Phone size={14} /> {profile.phone}
                </p>
                {profile.email && (
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Mail size={14} /> {profile.email}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> Joined: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-RW', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-lg font-bold text-yellow-500">⭐ {profile.stats?.averageRating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Trips</p>
                <p className="text-lg font-bold text-white">{profile.stats?.totalRides || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Earnings</p>
                <p className="text-lg font-bold text-green-500">RWF {(profile.stats?.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
            {getStatusBadge(profile.isActive, 'Active Account')}
            {getStatusBadge(profile.isVerified, 'Verified')}
            {getStatusBadge(profile.driver?.isOnline || false, 'Online', 'green', 'gray')}
            {getStatusBadge(profile.driver?.isApproved || false, 'Approved', 'blue', 'yellow')}
          </div>
        </div>

        {/* ─── Action Buttons ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={handleToggleOnline}
            disabled={processing || !profile.driver?.isApproved}
            className={`py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm ${
              profile.driver?.isOnline 
                ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border border-yellow-500/20'
                : 'bg-green-500 text-black hover:bg-green-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : profile.driver?.isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {profile.driver?.isOnline ? 'Offline' : 'Online'}
          </button>

          <button
            onClick={handleToggleApproval}
            disabled={processing}
            className={`py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm ${
              profile.driver?.isApproved 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-blue-500 text-black hover:bg-blue-400'
            } disabled:opacity-50`}
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : profile.driver?.isApproved ? <UserX size={16} /> : <UserCheck size={16} />}
            {profile.driver?.isApproved ? 'Unapprove' : 'Approve'}
          </button>

          <button
            onClick={handleToggleActive}
            disabled={processing}
            className={`py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm ${
              profile.isActive 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
            } disabled:opacity-50`}
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : profile.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
            {profile.isActive ? 'Suspend' : 'Unsuspend'}
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="py-2.5 bg-blue-500/10 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/20 transition flex items-center justify-center gap-2 text-sm border border-blue-500/20"
          >
            <Edit size={16} />
            Edit Vehicle
          </button>
        </div>

        {/* ─── Vehicle Information ─────────────────────────────────── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {getVehicleIcon(profile.driver?.vehicleType || '')}
            Vehicle Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Vehicle Type</p>
              <p className="font-medium mt-1">{profile.driver?.vehicleType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vehicle Number</p>
              <p className="font-medium mt-1">{profile.driver?.vehicleNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vehicle Model</p>
              <p className="font-medium mt-1">{profile.driver?.vehicleModel || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">License Number</p>
              <p className="font-medium mt-1">{profile.driver?.licenseNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* ─── Recent Rides ─────────────────────────────────────────── */}
        {profile.recentRides && profile.recentRides.length > 0 && (
          <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-blue-500" />
              Recent Rides
            </h3>
            <div className="space-y-2">
              {profile.recentRides.slice(0, 5).map((ride) => (
                <div key={ride.id} className="flex items-center justify-between p-3 bg-[#0A0E0B] rounded-xl">
                  <div>
                    <p className="text-sm text-white">{ride.pickupAddress} → {ride.dropoffAddress}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(ride.createdAt).toLocaleDateString()} • {ride.distance || 0}km
                    </p>
                  </div>
                  <span className="text-green-500 font-semibold">RWF {ride.fare}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Edit Modal ───────────────────────────────────────────── */}
        {isEditing && (
          <>
            <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setIsEditing(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Vehicle Information</h2>
                  <p className="text-sm text-gray-400">Update driver's vehicle details</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Vehicle Type</label>
                    <select
                      value={editForm.vehicleType}
                      onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                    >
                      <option value="MOTO">Moto</option>
                      <option value="BUS">Bus</option>
                      <option value="MINIBUS">Mini-Bus</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Vehicle Number</label>
                    <input
                      type="text"
                      value={editForm.vehicleNumber}
                      onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g., RAB 123M"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Vehicle Model</label>
                    <input
                      type="text"
                      value={editForm.vehicleModel}
                      onChange={(e) => setEditForm({ ...editForm, vehicleModel: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g., Yamaha FZ-S"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">License Number</label>
                    <input
                      type="text"
                      value={editForm.licenseNumber}
                      onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition"
                      placeholder="e.g., DL-2024-001234"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={handleUpdateVehicle}
                    disabled={processing}
                    className="flex-1 bg-yellow-500 text-black py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
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
    </div>
  );
}