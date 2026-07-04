// app/passenger/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Phone, Mail, MapPin, Shield, Settings, LogOut, Edit3, 
  Award, Clock, Star, ChevronRight, Camera, Globe, Bell, Lock,
  CreditCard, HelpCircle, FileText, Users, Gift
} from "lucide-react";

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
  savedPlaces: { label: string; address: string; icon: string }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (userData) {
          const user = JSON.parse(userData);
          setProfile({
            id: user.id || "1",
            name: user.name || "John Doe",
            email: user.email || "john@example.com",
            phone: user.phone || "+250788123456",
            joinedDate: "2024-01-15",
            rating: 4.8,
            totalRides: 45,
            totalDistance: "127 km",
            savedPlaces: [
              { label: "Home", address: "Kacyiru, Sector 4", icon: "🏠" },
              { label: "Office", address: "Norrsken House, Kimihurura", icon: "💼" },
            ],
          });
          setEditName(user.name || "John Doe");
          setEditEmail(user.email || "john@example.com");
        }
      } catch {
        setProfile({
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          phone: "+250788123456",
          joinedDate: "2024-01-15",
          rating: 4.8,
          totalRides: 45,
          totalDistance: "127 km",
          savedPlaces: [
            { label: "Home", address: "Kacyiru, Sector 4", icon: "🏠" },
            { label: "Office", address: "Norrsken House, Kimihurura", icon: "💼" },
          ],
        });
        setEditName("John Doe");
        setEditEmail("john@example.com");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleSaveProfile = () => {
    if (profile) {
      const updated = { ...profile, name: editName, email: editEmail };
      setProfile(updated);
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), name: editName, email: editEmail }));
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
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

        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-3xl border-2 border-green-500/30">
                {profile?.name?.charAt(0) || "👤"}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center border-2 border-[#111714] hover:bg-green-400 transition">
                <Camera size={14} />
              </button>
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
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{profile?.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {profile?.rating}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {profile?.totalRides} rides</span>
                    <span>•</span>
                    <span>📅 Joined {new Date(profile?.joinedDate || "").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Phone</div>
              <div className="font-medium">{profile?.phone}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Award, label: "Total Rides", value: profile?.totalRides || 0 },
            { icon: MapPin, label: "Distance", value: profile?.totalDistance || "0 km" },
            { icon: Star, label: "Rating", value: `${profile?.rating || 0} ★` },
          ].map((stat, index) => (
            <div key={index} className="bg-[#111714] border border-gray-800 rounded-xl p-4 text-center">
              <stat.icon size={18} className="text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Saved Places</h3>
          <div className="space-y-2">
            {profile?.savedPlaces.map((place, index) => (
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Settings</h3>
          {[
            { icon: Bell, label: "Notifications", href: "/passenger/settings" },
            { icon: Lock, label: "Privacy & Security", href: "/passenger/settings" },
            { icon: Globe, label: "Language", href: "/passenger/settings" },
            { icon: HelpCircle, label: "Help & Support", href: "/support" },
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

        <button
          onClick={handleLogout}
          className="w-full mt-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}