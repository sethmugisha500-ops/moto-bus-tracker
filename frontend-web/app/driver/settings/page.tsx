// app/driver/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, Bell, Lock, Globe, Moon, Smartphone, 
  Shield, Database, HelpCircle, FileText, Users, 
  ChevronRight, BellRing, MapPin, DollarSign, Mail,
  LogOut, AlertCircle, Loader2, CheckCircle,
  User, Phone, Car, Clock
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DriverSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  rideAlerts: boolean;
  autoAccept: boolean;
  darkMode: boolean;
  shareLocation: boolean;
}

interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
}

export default function DriverSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [settings, setSettings] = useState({
    push: true,
    email: true,
    sms: false,
    rideAlerts: true,
    autoAccept: false,
    darkMode: true,
    shareLocation: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfileAndSettings();
  }, [router]);

  const fetchProfileAndSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Fetch driver profile
      const profileRes = await fetch(`${API_URL}/drivers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.success && data.data) {
          setProfile(data.data);
        }
      }

      // Fetch saved settings from localStorage or backend
      const savedSettings = localStorage.getItem('driverSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }

      // Also try to get settings from backend if available
      try {
        const settingsRes = await fetch(`${API_URL}/drivers/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
          }
        }
      } catch {
        // Backend might not have settings endpoint yet
      }

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    // Save to localStorage
    const updatedSettings = { ...settings, [key]: newValue };
    localStorage.setItem('driverSettings', JSON.stringify(updatedSettings));

    // Try to save to backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/drivers/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ settings: updatedSettings }),
        });
      }
    } catch (err) {
      // Silently fail - settings saved locally
    }

    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('driverSettings');
      router.push('/login');
      toast.success('Logged out successfully');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion is not available yet. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* ─── HEADER ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/driver/profile" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">⚙️ Settings</h1>
        </div>

        {/* ─── ERROR ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ─── DRIVER INFO ──────────────────────────────────────────── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-lg font-bold text-green-500 border border-green-500/20">
              {profile?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile?.name || 'Driver'}</p>
              <p className="text-xs text-gray-400">{profile?.email || 'No email'}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Car size={10} /> {profile?.vehicleType || 'N/A'}
                </span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Phone size={10} /> {profile?.phone || 'N/A'}
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-medium px-3 py-1 rounded-full ${
              profile?.isApproved 
                ? 'bg-green-500/20 text-green-500 border border-green-500/20' 
                : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20'
            }`}>
              {profile?.isApproved ? '✅ Active' : '⏳ Pending'}
            </span>
          </div>
        </div>

        {/* ─── PREFERENCES ──────────────────────────────────────────── */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Preferences</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-gray-400" />
                <span className="text-sm">Dark Mode</span>
              </div>
              <button
                onClick={() => toggleSetting("darkMode")}
                className={`w-12 h-7 rounded-full transition ${
                  settings.darkMode ? "bg-green-500" : "bg-gray-700"
                } relative`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.darkMode ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400" />
                <span className="text-sm">Auto-Accept Rides</span>
              </div>
              <button
                onClick={() => toggleSetting("autoAccept")}
                className={`w-12 h-7 rounded-full transition ${
                  settings.autoAccept ? "bg-green-500" : "bg-gray-700"
                } relative`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.autoAccept ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-gray-400" />
                <span className="text-sm">Share Location</span>
              </div>
              <button
                onClick={() => toggleSetting("shareLocation")}
                className={`w-12 h-7 rounded-full transition ${
                  settings.shareLocation ? "bg-green-500" : "bg-gray-700"
                } relative`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.shareLocation ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── NOTIFICATIONS ────────────────────────────────────────── */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🔔 Notifications</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            {[
              { key: "push", icon: Bell, label: "Push Notifications" },
              { key: "email", icon: Mail, label: "Email Notifications" },
              { key: "sms", icon: Smartphone, label: "SMS Notifications" },
              { key: "rideAlerts", icon: BellRing, label: "Ride Alerts" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-400" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <button
                  onClick={() => toggleSetting(item.key as keyof typeof settings)}
                  className={`w-11 h-6 rounded-full transition ${
                    settings[item.key as keyof typeof settings] ? "bg-green-500" : "bg-gray-700"
                  } relative`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── DRIVER SETTINGS ──────────────────────────────────────── */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🚗 Driver Settings</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            <Link
              href="/driver/settings/pricing"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-gray-400" />
                <span className="text-sm">Pricing & Rates</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/driver/settings/privacy"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-gray-400" />
                <span className="text-sm">Safety & Privacy</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/driver/settings/data"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Database size={18} className="text-gray-400" />
                <span className="text-sm">Data & Analytics</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/driver/settings/vehicle"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Car size={18} className="text-gray-400" />
                <span className="text-sm">Vehicle Details</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>

        {/* ─── SUPPORT ──────────────────────────────────────────────── */}
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">🆘 Support</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            <Link
              href="/driver/support"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-gray-400" />
                <span className="text-sm">Help Center</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/driver/terms"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <span className="text-sm">Driver Terms</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/about"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="text-gray-400" />
                <span className="text-sm">About MotoBus</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/driver/feedback"
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <span className="text-sm">Send Feedback</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>
        </div>

        {/* ─── ACCOUNT ACTIONS ──────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-[#111714] border border-gray-800 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition group"
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} className="text-red-400 group-hover:text-red-500 transition" />
              <span className="text-sm text-red-400 group-hover:text-red-500 transition">Logout</span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500 transition" />
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-between p-4 bg-[#111714] border border-gray-800 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition group"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-gray-400 group-hover:text-red-500 transition" />
              <span className="text-sm text-gray-400 group-hover:text-red-500 transition">Delete Account</span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500 transition" />
          </button>
        </div>

        {/* ─── VERSION ──────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-600 mt-6">
          Version 2.0.0 • Driver App
          <div className="mt-1 flex items-center justify-center gap-4">
            <span className="text-[10px] text-gray-700">Privacy Policy</span>
            <span className="w-px h-3 bg-gray-800" />
            <span className="text-[10px] text-gray-700">Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}