// app/passenger/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Phone, Mail, MapPin, Shield, Settings, LogOut, Edit3, 
  Award, Clock, Star, ChevronRight, Camera, Globe, Bell, Lock,
  CreditCard, HelpCircle, FileText, Users, Gift, TrendingUp,
  Calendar, CheckCircle, XCircle, AlertCircle, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinedDate: string;
  rating: number;
  totalRides: number;
  totalDistance: string;
  savedPlaces: { label: string; address: string; icon: string; lat?: number; lng?: number }[];
  referralCode?: string;
  referralCount?: number;
  savedAmount?: number;
}

interface RideHistory {
  id: string;
  date: string;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'ACCEPTED' | 'STARTED';
  rideType: string;
  distance: number;
  duration: number;
  driver?: {
    name: string;
    rating: number;
  };
}

interface PaymentMethod {
  id: string;
  type: 'momo' | 'airtel' | 'mpesa' | 'wallet' | 'card';
  label: string;
  icon: string;
  last4?: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rideHistory, setRideHistory] = useState<RideHistory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'rides' | 'payments'>('profile');
  const [stats, setStats] = useState({
    totalSpent: 0,
    avgRating: 0,
    favVehicle: '',
    mostActiveDay: '',
  });
  const [referralLink, setReferralLink] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userName, setUserName] = useState("");

  // ─── Get User from localStorage ──────────────────────────────────
  const getUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch {
      return null;
    }
  };

  // ─── Fetch Profile Data ──────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const user = getUserFromLocalStorage();
      
      if (!token) {
        router.push("/login");
        return;
      }

      // Try to get from API
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setEditName(data.data.name);
        setEditEmail(data.data.email || "");
        setEditPhone(data.data.phone || "");
        setUserName(data.data.name);
      } else {
        // Fallback to localStorage
        if (user) {
          setProfile({
            id: user.id || "1",
            name: user.name || "John Doe",
            email: user.email || "",
            phone: user.phone || "",
            joinedDate: new Date().toISOString(),
            rating: 4.8,
            totalRides: 0,
            totalDistance: "0 km",
            savedPlaces: [
              { label: "Home", address: "Kacyiru, Sector 4", icon: "🏠" },
              { label: "Office", address: "Norrsken House, Kimihurura", icon: "💼" },
            ],
          });
          setEditName(user.name || "John Doe");
          setEditEmail(user.email || "");
          setEditPhone(user.phone || "");
          setUserName(user.name || "User");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Use localStorage fallback
      const user = getUserFromLocalStorage();
      if (user) {
        setProfile({
          id: user.id || "1",
          name: user.name || "John Doe",
          email: user.email || "",
          phone: user.phone || "",
          joinedDate: new Date().toISOString(),
          rating: 4.8,
          totalRides: 0,
          totalDistance: "0 km",
          savedPlaces: [
            { label: "Home", address: "Kacyiru, Sector 4", icon: "🏠" },
            { label: "Office", address: "Norrsken House, Kimihurura", icon: "💼" },
          ],
        });
        setEditName(user.name || "John Doe");
        setEditEmail(user.email || "");
        setEditPhone(user.phone || "");
        setUserName(user.name || "User");
      }
    }
  }, [router]);

  // ─── Fetch Ride History ──────────────────────────────────────────
  const fetchRideHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) return;

      const response = await fetch(`${API_URL}/rides?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        const rides = data.data || [];
        setRideHistory(rides);
        calculateStats(rides);
      } else {
        // Mock data if API fails
        const mockRides: RideHistory[] = [
          {
            id: "1",
            date: new Date(Date.now() - 3600000 * 2).toISOString(),
            pickup: "Kigali Convention Centre",
            dropoff: "Kimironko Market",
            fare: 1200,
            status: "COMPLETED",
            rideType: "Moto",
            distance: 6.8,
            duration: 14,
            driver: { name: "Jean Paul", rating: 4.8 }
          },
          {
            id: "2",
            date: new Date(Date.now() - 86400000).toISOString(),
            pickup: "Home",
            dropoff: "Norrsken House",
            fare: 800,
            status: "COMPLETED",
            rideType: "Car",
            distance: 3.2,
            duration: 8,
            driver: { name: "Marie Claire", rating: 4.9 }
          },
          {
            id: "3",
            date: new Date(Date.now() - 172800000).toISOString(),
            pickup: "Kacyiru",
            dropoff: "Kigali Airport",
            fare: 2500,
            status: "CANCELLED",
            rideType: "Bus",
            distance: 12.5,
            duration: 25,
          },
        ];
        setRideHistory(mockRides);
        calculateStats(mockRides);
      }
    } catch (error) {
      console.error("Error fetching ride history:", error);
    }
  }, []);

  // ─── Fetch Payment Methods ──────────────────────────────────────
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) return;

      const response = await fetch(`${API_URL}/payments/methods`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      } else {
        // Mock payment methods
        setPaymentMethods([
          { id: "1", type: "momo", label: "MoMo", icon: "💛", isDefault: true },
          { id: "2", type: "wallet", label: "Wallet", icon: "💜", isDefault: false },
          { id: "3", type: "card", label: "Cash", icon: "💵", isDefault: false },
        ]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  }, []);

  // ─── Calculate Stats ─────────────────────────────────────────────
  const calculateStats = (rides: RideHistory[]) => {
    const completed = rides.filter(r => r.status === 'COMPLETED');
    const totalSpent = completed.reduce((sum, r) => sum + r.fare, 0);
    const avgRating = completed.length > 0 
      ? completed.reduce((sum, r) => sum + (r.driver?.rating || 0), 0) / completed.length
      : 0;
    
    const vehicleCount: Record<string, number> = {};
    completed.forEach(r => {
      vehicleCount[r.rideType] = (vehicleCount[r.rideType] || 0) + 1;
    });
    const favVehicle = Object.keys(vehicleCount).reduce((a, b) => 
      vehicleCount[a] > vehicleCount[b] ? a : b, ''
    );

    setStats({
      totalSpent,
      avgRating,
      favVehicle,
      mostActiveDay: 'Wednesday',
    });
  };

  // ─── Initial Load ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchRideHistory(),
        fetchPaymentMethods(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchRideHistory, fetchPaymentMethods, router]);

  // ─── Update Profile ──────────────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        // Update localStorage
        const user = getUserFromLocalStorage();
        if (user) {
          user.name = data.data.name;
          user.email = data.data.email;
          user.phone = data.data.phone;
          localStorage.setItem("user", JSON.stringify(user));
        }
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        // Update locally if API fails
        if (profile) {
          const updated = { ...profile, name: editName, email: editEmail, phone: editPhone };
          setProfile(updated);
          const user = getUserFromLocalStorage();
          if (user) {
            user.name = editName;
            user.email = editEmail;
            user.phone = editPhone;
            localStorage.setItem("user", JSON.stringify(user));
          }
          setIsEditing(false);
          toast.success("Profile updated locally!");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  // ─── Upload Avatar ──────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/users/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar: data.data.avatar } : prev);
        toast.success("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Generate Referral Link ──────────────────────────────────────
  const generateReferralLink = () => {
    const code = profile?.referralCode || "MOTOBUS2024";
    const link = `${window.location.origin}/signup?ref=${code}`;
    setReferralLink(link);
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied to clipboard!");
  };

  // ─── Handle Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
      router.push("/login");
      toast.success("Logged out successfully");
    }
  };

  // ─── Format Date ─────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Get Status Badge ────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: RideHistory['status'] }) => {
    const config = {
      COMPLETED: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
      PENDING: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
      ACCEPTED: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: AlertCircle },
      STARTED: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: AlertCircle },
    };

    const { color, icon: Icon } = config[status] || config.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
        <Icon size={10} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#080C09]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-green-500" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* ─── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">👤 Profile</h1>
            <p className="text-sm text-gray-400">Manage your account</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#141C15] border border-gray-700 rounded-xl text-sm hover:border-green-500/30 transition"
            >
              <Edit3 size={16} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-[#141C15] border border-gray-700 rounded-xl text-sm hover:border-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-green-500 text-black rounded-xl text-sm font-semibold hover:bg-green-400 transition"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* ─── Profile Card ── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-3xl border-2 border-green-500/30 overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-green-500">
                    {profile?.name?.charAt(0)?.toUpperCase() || "👤"}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center border-2 border-[#111714] hover:bg-green-400 transition cursor-pointer">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-green-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition"
                    placeholder="Full name"
                  />
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition"
                    placeholder="Email"
                  />
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition"
                    placeholder="Phone"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{profile?.name || "User"}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" /> {profile?.rating || 0}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {profile?.totalRides || 0} rides
                    </span>
                    <span>•</span>
                    <span>📅 Joined {new Date(profile?.joinedDate || "").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Mail size={12} /> {profile?.email || "No email"}</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {profile?.phone || "No phone"}</span>
                  </div>
                </>
              )}
            </div>
            {profile?.referralCode && (
              <button
                onClick={generateReferralLink}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-semibold hover:opacity-90 transition flex-shrink-0"
              >
                Refer & Earn 🎁
              </button>
            )}
          </div>

          {/* ── Quick Stats ── */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{stats.totalSpent.toLocaleString()} RWF</div>
              <div className="text-xs text-gray-400">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500">{stats.avgRating.toFixed(1)} ★</div>
              <div className="text-xs text-gray-400">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{stats.favVehicle || 'N/A'}</div>
              <div className="text-xs text-gray-400">Favorite Ride</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-500">{profile?.savedAmount || 0} RWF</div>
              <div className="text-xs text-gray-400">Saved</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['profile', 'rides', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                  : 'bg-[#111714] border border-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'profile' && (
          <>
            {/* ── Saved Places ── */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <MapPin size={14} /> Saved Places
              </h3>
              <div className="space-y-2">
                {profile?.savedPlaces?.map((place, index) => (
                  <div key={index} className="bg-[#111714] border border-gray-800 rounded-xl p-3 flex items-center justify-between hover:border-green-500/30 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm">
                        {place.icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{place.label}</p>
                        <p className="text-xs text-gray-400">{place.address}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Settings ── */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Settings size={14} /> Settings
              </h3>
              {[
                { icon: Bell, label: "Notifications", href: "/passenger/settings" },
                { icon: Lock, label: "Privacy & Security", href: "/passenger/settings" },
                { icon: Globe, label: "Language", href: "/passenger/settings" },
                { icon: CreditCard, label: "Payment Methods", href: "/passenger/settings" },
                { icon: HelpCircle, label: "Help & Support", href: "/support" },
                { icon: FileText, label: "Ride History", href: "/passenger/history" },
                { icon: Users, label: "Refer & Earn", href: "/passenger/refer" },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between p-3 bg-[#111714] border border-gray-800 rounded-xl hover:border-green-500/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className="text-gray-400" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── Rides Tab ── */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <Clock size={14} /> Recent Rides
              </h3>
              <Link href="/passenger/history" className="text-xs text-green-500 hover:text-green-400 transition">
                View All →
              </Link>
            </div>
            {rideHistory.length === 0 ? (
              <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-gray-400">No rides yet</p>
                <p className="text-xs text-gray-500">Book your first ride to start earning rewards</p>
                <Link href="/passenger" className="mt-3 inline-block px-4 py-2 bg-green-500 text-black rounded-xl text-sm font-semibold hover:bg-green-400 transition">
                  Book a Ride
                </Link>
              </div>
            ) : (
              rideHistory.map((ride) => (
                <div key={ride.id} className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">
                        {ride.rideType === 'Moto' ? '🏍️' : ride.rideType === 'Car' ? '🚗' : '🚌'}
                      </span>
                      <span className="text-sm font-medium">{ride.rideType}</span>
                      <StatusBadge status={ride.status} />
                    </div>
                    <span className="font-bold text-green-500">{ride.fare.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
                    <span>{formatDate(ride.date)}</span>
                    <span>•</span>
                    <span>{ride.distance.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{ride.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>📍 {ride.pickup}</span>
                      <span className="text-gray-500">→</span>
                      <span>📍 {ride.dropoff}</span>
                    </div>
                    {ride.driver && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Star size={10} className="text-yellow-500" /> {ride.driver.rating}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Payments Tab ── */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <CreditCard size={14} /> Payment Methods
            </h3>
            {paymentMethods.length === 0 ? (
              <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-gray-400">No payment methods</p>
                <p className="text-xs text-gray-500">Add a payment method to start booking rides</p>
              </div>
            ) : (
              paymentMethods.map((method) => (
                <div key={method.id} className="bg-[#111714] border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-green-500/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{method.label}</p>
                      {method.last4 && (
                        <p className="text-xs text-gray-400">•••• {method.last4}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {method.isDefault && (
                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">Default</span>
                    )}
                    <button className="text-xs text-gray-400 hover:text-white transition">
                      {method.isDefault ? 'Edit' : 'Set Default'}
                    </button>
                  </div>
                </div>
              ))
            )}
            <button className="w-full py-3 bg-[#141C15] border border-dashed border-gray-700 rounded-xl text-sm text-gray-400 hover:border-green-500/30 hover:text-white transition">
              + Add Payment Method
            </button>
          </div>
        )}

        {/* ── Logout Button ── */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
