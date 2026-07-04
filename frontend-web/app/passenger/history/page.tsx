// app/passenger/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, DollarSign, ChevronRight, Filter, Search, Star } from "lucide-react";

interface Ride {
  id: string;
  date: string;
  time: string;
  pickup: string;
  destination: string;
  driver: string;
  fare: number;
  status: "completed" | "cancelled" | "in-progress" | "scheduled";
  rating?: number;
  vehicle: string;
  distance: string;
}

export default function HistoryPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://moto-bus-backend.onrender.com/api";
        const res = await fetch(`${API_URL}/rides/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (res.ok) {
          const data = await res.json();
          setRides(data.data || []);
        } else {
          setRides([
            {
              id: "1",
              date: "2024-06-23",
              time: "14:30",
              pickup: "Kigali City Tower",
              destination: "Kimironko Market",
              driver: "Jean Paul",
              fare: 1200,
              status: "completed",
              rating: 4.8,
              vehicle: "RAB 123M",
              distance: "3.5 km",
            },
            {
              id: "2",
              date: "2024-06-22",
              time: "09:15",
              pickup: "Norrsken House",
              destination: "Kigali Convention Centre",
              driver: "Marie Claire",
              fare: 800,
              status: "completed",
              rating: 4.9,
              vehicle: "RAB 456M",
              distance: "2.1 km",
            },
            {
              id: "3",
              date: "2024-06-21",
              time: "18:45",
              pickup: "Kacyiru",
              destination: "Downtown",
              driver: "Eric Muneza",
              fare: 1500,
              status: "cancelled",
              vehicle: "RAB 789M",
              distance: "4.2 km",
            },
          ]);
        }
      } catch {
        setRides([
          {
            id: "1",
            date: "2024-06-23",
            time: "14:30",
            pickup: "Kigali City Tower",
            destination: "Kimironko Market",
            driver: "Jean Paul",
            fare: 1200,
            status: "completed",
            rating: 4.8,
            vehicle: "RAB 123M",
            distance: "3.5 km",
          },
          {
            id: "2",
            date: "2024-06-22",
            time: "09:15",
            pickup: "Norrsken House",
            destination: "Kigali Convention Centre",
            driver: "Marie Claire",
            fare: 800,
            status: "completed",
            rating: 4.9,
            vehicle: "RAB 456M",
            distance: "2.1 km",
          },
          {
            id: "3",
            date: "2024-06-21",
            time: "18:45",
            pickup: "Kacyiru",
            destination: "Downtown",
            driver: "Eric Muneza",
            fare: 1500,
            status: "cancelled",
            vehicle: "RAB 789M",
            distance: "4.2 km",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-500";
      case "cancelled": return "bg-red-500/20 text-red-500";
      case "in-progress": return "bg-blue-500/20 text-blue-500";
      case "scheduled": return "bg-yellow-500/20 text-yellow-500";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "in-progress": return "In Progress";
      case "scheduled": return "Scheduled";
      default: return status;
    }
  };

  const filteredRides = rides
    .filter(ride => filter === "all" || ride.status === filter)
    .filter(ride => 
      ride.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driver.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Rides</h1>
          <div className="text-sm text-gray-400">{filteredRides.length} rides</div>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search rides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "completed", "in-progress", "scheduled", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-green-500 text-black"
                  : "bg-[#141C15] text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {filteredRides.length === 0 ? (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold mb-2">No rides found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRides.map((ride) => (
              <Link
                key={ride.id}
                href={`/passenger/rides/${ride.id}`}
                className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition block"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {ride.pickup} → {ride.destination}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar size={12} />
                      <span>{new Date(ride.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Clock size={12} />
                      <span>{ride.time}</span>
                      <span>•</span>
                      <span>{ride.distance}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                    {getStatusLabel(ride.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-semibold text-green-500">
                      {ride.driver.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{ride.driver}</p>
                      <p className="text-xs text-gray-400">{ride.vehicle}</p>
                    </div>
                    {ride.rating && (
                      <span className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star size={12} /> {ride.rating}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-green-500 font-semibold">RWF {ride.fare.toLocaleString()}</p>
                    <ChevronRight size={16} className="text-gray-400 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}