// app/passenger/tracking/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Navigation, Clock, Phone, MessageCircle, AlertTriangle } from "lucide-react";

interface DriverLocation {
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
}

export default function PassengerTracking() {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [eta, setEta] = useState("5 min");
  const [status, setStatus] = useState<"en-route" | "arrived" | "completed">("en-route");

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocation({
        lat: -1.9441 + (Math.random() - 0.5) * 0.01,
        lng: 30.0619 + (Math.random() - 0.5) * 0.01,
        bearing: Math.random() * 360,
        speed: 20 + Math.random() * 30,
      });
      setEta(`${Math.floor(2 + Math.random() * 5)} min`);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Live Tracking</h1>
        </div>

        {/* Map Placeholder */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-4 mb-4 relative h-64">
          <div className="w-full h-full bg-[#0A0E0B] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-400 text-sm">Live driver location</p>
              {driverLocation && (
                <p className="text-xs text-green-500 mt-2">
                  ● Driver is moving • {eta} away
                </p>
              )}
            </div>
          </div>
          
          {/* Driver Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#0A0E0B]/90 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-lg">
                  🏍️
                </div>
                <div>
                  <p className="font-semibold text-sm">Jean Paul</p>
                  <p className="text-xs text-gray-400">RAB 123M • ⭐ 4.8</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-500 font-bold text-sm">{eta}</p>
                <p className="text-xs text-gray-400">ETA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Info */}
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <MapPin size={16} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Pickup</p>
              <p className="text-sm font-medium">Kigali City Tower</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <MapPin size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Destination</p>
              <p className="text-sm font-medium">Kimironko Market</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">{status === "en-route" ? "Driver en route" : status === "arrived" ? "Driver arrived" : "Ride completed"}</span>
            </div>
            <span className="text-sm text-gray-400">
              {status === "en-route" ? "🟢 On the way" : status === "arrived" ? "📍 Arrived" : "✅ Completed"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition">
            <Phone size={20} className="text-green-500 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Call</span>
          </button>
          <button className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition">
            <MessageCircle size={20} className="text-blue-500 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Chat</span>
          </button>
          <button className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-red-500/30 transition">
            <AlertTriangle size={20} className="text-red-500 mx-auto mb-1" />
            <span className="text-xs text-gray-400">SOS</span>
          </button>
        </div>

        {/* Share Trip */}
        <button className="w-full mt-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-sm text-gray-400 hover:border-green-500/30 hover:text-white transition">
          Share Trip Status
        </button>
      </div>
    </div>
  );
}