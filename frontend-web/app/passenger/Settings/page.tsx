// app/passenger/settings/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronRight, Bell, Lock, Globe, Moon, 
  Smartphone, CreditCard, Shield, Database, 
  HelpCircle, FileText, Users, ChevronLeft,
  Volume2, Vibrate, MapPin, Languages, Palette,
  Gift,
  Mail
} from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    rideUpdates: true,
    promotions: false,
  });

  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState("English");

  const toggleSetting = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger/profile" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-lg font-bold text-green-500">
              JD
            </div>
            <div>
              <p className="font-semibold">John Doe</p>
              <p className="text-xs text-gray-400">john@example.com</p>
            </div>
            <button className="ml-auto text-sm text-green-500 hover:text-green-400 transition">
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Preferences</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Languages size={18} className="text-gray-400" />
                <span className="text-sm">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{language}</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>

            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Moon size={18} className="text-gray-400" />
                <span className="text-sm">Dark Mode</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition ${
                  darkMode ? "bg-green-500" : "bg-gray-700"
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <button className="w-full flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition">
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-400" />
                <span className="text-sm">Map Style</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Dark</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Notifications</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            {[
              { key: "push", icon: Bell, label: "Push Notifications" },
              { key: "email", icon: Mail, label: "Email Notifications" },
              { key: "sms", icon: Smartphone, label: "SMS Notifications" },
              { key: "rideUpdates", icon: MapPin, label: "Ride Updates" },
              { key: "promotions", icon: Gift, label: "Promotions & Offers" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-400" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <button
                  onClick={() => toggleSetting(item.key as keyof typeof notifications)}
                  className={`w-11 h-6 rounded-full transition ${
                    notifications[item.key as keyof typeof notifications] ? "bg-green-500" : "bg-gray-700"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition transform ${
                    notifications[item.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Security</h3>
          
          <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
            {[
              { icon: Lock, label: "Change Password", href: "/passenger/settings/password" },
              { icon: Shield, label: "Two-Factor Authentication", href: "/passenger/settings/2fa" },
              { icon: Database, label: "Privacy & Data", href: "/passenger/settings/privacy" },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-400" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
          {[
            { icon: HelpCircle, label: "Help Center", href: "/support" },
            { icon: FileText, label: "Terms & Conditions", href: "/terms" },
            { icon: Users, label: "About MotoBus", href: "/about" },
          ].map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-[#0A0E0B] transition border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-gray-400" />
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>

        <div className="text-center text-xs text-gray-600 mt-6">
          Version 1.0.0 • Built with ❤️ in Rwanda
        </div>
      </div>
    </div>
  );
}