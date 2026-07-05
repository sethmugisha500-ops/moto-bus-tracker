// admin-dashboard/app/admin/drivers/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserPlus, Search, Filter, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Eye, Clock, AlertCircle, RefreshCw,
  Bike, Bus, Truck, Phone, Mail, MapPin, Star, Award,
  Calendar, DollarSign, TrendingUp, BarChart3,
  Download, Upload, MoreVertical, UserCheck, UserX
} from "lucide-react";
import toast from "react-hot-toast";
import authService from "../services/auth.service";

interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleType: "MOTO" | "BUS" | "MINIBUS";
  vehicleNumber: string;
  vehicleModel: string;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
  };
}

interface DriverStats {
  total: number;
  approved: number;
  pending: number;
  online: number;
  offline: number;
  totalEarnings: number;
  totalTrips: number;
  avgRating: number;
}

export default function AdminDriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "trips" | "earnings" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [stats, setStats] = useState<DriverStats>({
    total: 0,
    approved: 0,
    pending: 0,
    online: 0,
    offline: 0,
    totalEarnings: 0,
    totalTrips: 0,
    avgRating: 0,
  });
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://moto-bus-backend.onrender.com/api";

  // ── Authentication Check ──────────────────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      router.push("/login");
    }
  }, [router]);

  // ── Load Drivers ──────────────────────────────────────────────────
  useEffect(() => {
    fetchDrivers();
    fetchPendingDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();

      const res = await fetch(`${API_URL}/admin/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          authService.logout();
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch drivers");
      }

      const data = await res.json();
      const driversList = data.data || [];
      setDrivers(driversList);

      // Calculate stats
      const approved = driversList.filter((d: Driver) => d.isApproved);
      const pending = driversList.filter((d: Driver) => !d.isApproved);
      const online = driversList.filter((d: Driver) => d.isOnline);
      const offline = driversList.filter((d: Driver) => !d.isOnline);

      setStats({
        total: driversList.length,
        approved: approved.length,
        pending: pending.length,
        online: online.length,
        offline: offline.length,
        totalEarnings: driversList.reduce((sum: number, d: Driver) => sum + d.totalEarnings, 0),
        totalTrips: driversList.reduce((sum: number, d: Driver) => sum + d.totalTrips, 0),
        avgRating: driversList.length > 0
          ? driversList.reduce((sum: number, d: Driver) => sum + d.rating, 0) / driversList.length
          : 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load drivers");
      toast.error(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/admin/drivers/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPendingDrivers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending drivers:", error);
    }
  };

  // ── Approve Driver ──────────────────────────────────────────────────
  const handleApproveDriver = async (driverId: string) => {
    setProcessingId(driverId);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to approve driver");

      toast.success("Driver approved successfully!");
      await fetchDrivers();
      await fetchPendingDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve driver");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject Driver ──────────────────────────────────────────────────
  const handleRejectDriver = async (driverId: string) => {
    setProcessingId(driverId);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to reject driver");

      toast.success("Driver rejected");
      await fetchDrivers();
      await fetchPendingDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject driver");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Suspend Driver ──────────────────────────────────────────────────
  const handleSuspendDriver = async (driverId: string) => {
    setProcessingId(driverId);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/suspend`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to suspend driver");

      toast.success("Driver suspended");
      await fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend driver");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Refresh ──────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    await fetchPendingDrivers();
  };

  // ── Get Vehicle Icon ──────────────────────────────────────────────
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "MOTO": return <Bike size={16} className="text-orange-500" />;
      case "BUS": return <Bus size={16} className="text-blue-500" />;
      case "MINIBUS": return <Truck size={16} className="text-green-500" />;
      default: return <Bike size={16} className="text-gray-500" />;
    }
  };

  // ── Get Vehicle Label ──────────────────────────────────────────────
  const getVehicleLabel = (type: string) => {
    switch (type) {
      case "MOTO": return "Moto";
      case "BUS": return "Bus";
      case "MINIBUS": return "Mini-Bus";
      default: return type;
    }
  };

  // ── Filtered Drivers ──────────────────────────────────────────────
  const getFilteredDrivers = () => {
    let filtered = [...drivers];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.phone.includes(term) ||
        d.vehicleNumber.toLowerCase().includes(term) ||
        d.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus === "approved") {
      filtered = filtered.filter(d => d.isApproved);
    } else if (filterStatus === "pending") {
      filtered = filtered.filter(d => !d.isApproved);
    } else if (filterStatus === "online") {
      filtered = filtered.filter(d => d.isOnline);
    } else if (filterStatus === "offline") {
      filtered = filtered.filter(d => !d.isOnline);
    }

    // Vehicle filter
    if (filterVehicle !== "all") {
      filtered = filtered.filter(d => d.vehicleType === filterVehicle);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name": aVal = a.name; bVal = b.name; break;
        case "rating": aVal = a.rating; bVal = b.rating; break;
        case "trips": aVal = a.totalTrips; bVal = b.totalTrips; break;
        case "earnings": aVal = a.totalEarnings; bVal = b.totalEarnings; break;
        case "date": aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        default: aVal = a.name; bVal = b.name;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredDrivers = getFilteredDrivers();

  // ── Loading State ──────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C09]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white">
      <div className="max-w-7xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Drivers</h1>
              <span className="text-xs bg-[#141C15] px-3 py-1 rounded-full border border-gray-700">
                {stats.total} total
              </span>
            </div>
            <p className="text-gray-400 text-sm">Manage drivers and verify new applications</p>
          </div>
          <div className="flex gap-2">
            {pendingDrivers.length > 0 && (
              <button
                onClick={() => setShowPending(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 hover:bg-yellow-500/20 transition"
              >
                <Clock size={16} />
                <span>{pendingDrivers.length} Pending</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-[#141C15] border border-gray-700 rounded-xl hover:border-green-500/30 transition"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
            <Link
              href="/admin/drivers/add"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
            >
              <UserPlus size={18} />
              Add Driver
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Online", value: stats.online, icon: UserCheck, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Offline", value: stats.offline, icon: UserX, color: "text-gray-400", bg: "bg-gray-500/10" },
            { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Revenue", value: `RWF ${(stats.totalEarnings / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
          ].map((stat, index) => (
            <div key={index} className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition">
              <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-1`}>
                <stat.icon size={14} className={stat.color} />
              </div>
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-[10px] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers by name, phone, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 transition placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 transition"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-4 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 transition"
            >
              <option value="all">All Vehicles</option>
              <option value="MOTO">Moto</option>
              <option value="BUS">Bus</option>
              <option value="MINIBUS">Mini-Bus</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterVehicle("all");
              }}
              className="px-4 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white hover:border-green-500/30 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Driver List */}
        {filteredDrivers.length === 0 ? (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
            <Users size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No drivers found</h3>
            <p className="text-gray-400 text-sm">
              {searchTerm ? "Try adjusting your search or filters" : "Start adding drivers to your fleet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-lg font-bold text-green-500">
                        {driver.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111714] ${
                        driver.isOnline ? "bg-green-500" : "bg-gray-500"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{driver.name}</p>
                        {driver.isApproved ? (
                          <CheckCircle size={14} className="text-green-500" />
                        ) : (
                          <Clock size={14} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {driver.phone}
                        </span>
                        {driver.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {driver.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {getVehicleIcon(driver.vehicleType)}
                          {getVehicleLabel(driver.vehicleType)}
                        </span>
                        <span className="flex items-center gap-1">
                          {driver.vehicleNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-white font-semibold">{driver.totalTrips}</div>
                        <div className="text-[10px] text-gray-400">Trips</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-500 font-semibold">RWF {driver.totalEarnings.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400">Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-500 font-semibold">{driver.rating.toFixed(1)} ★</div>
                        <div className="text-[10px] text-gray-400">Rating</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDetails(true);
                        }}
                        className="p-2 bg-[#0A0E0B] border border-gray-700 rounded-lg hover:border-green-500/30 transition"
                      >
                        <Eye size={16} className="text-gray-400" />
                      </button>

                      {!driver.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveDriver(driver.id)}
                            disabled={processingId === driver.id}
                            className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition"
                          >
                            {processingId === driver.id ? (
                              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle size={16} className="text-green-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectDriver(driver.id)}
                            disabled={processingId === driver.id}
                            className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
                          >
                            <XCircle size={16} className="text-red-500" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSuspendDriver(driver.id)}
                          disabled={processingId === driver.id}
                          className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
                        >
                          {processingId === driver.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserX size={16} className="text-red-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Drivers Modal */}
      {showPending && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowPending(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Pending Approvals</h3>
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                    {pendingDrivers.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowPending(false)}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {pendingDrivers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <p className="text-gray-400">No pending drivers to review</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDrivers.map((driver) => (
                    <div key={driver.id} className="bg-[#0A0E0B] border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{driver.name}</p>
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{driver.phone}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>{getVehicleLabel(driver.vehicleType)}</span>
                            <span>{driver.vehicleNumber}</span>
                            <span>{driver.vehicleModel}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            License: {driver.licenseNumber}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveDriver(driver.id)}
                            disabled={processingId === driver.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition text-green-500 text-xs"
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
                            onClick={() => handleRejectDriver(driver.id)}
                            disabled={processingId === driver.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition text-red-500 text-xs"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Driver Details Modal */}
      {showDetails && selectedDriver && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowDetails(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Driver Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Profile */}
                <div className="flex items-center gap-4 p-4 bg-[#0A0E0B] rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-2xl font-bold text-green-500">
                    {selectedDriver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{selectedDriver.name}</p>
                    <p className="text-sm text-gray-400">{selectedDriver.phone}</p>
                    {selectedDriver.email && (
                      <p className="text-sm text-gray-400">{selectedDriver.email}</p>
                    )}
                  </div>
                  <div className="ml-auto text-right">
                    <div className={`text-sm font-semibold ${selectedDriver.isApproved ? 'text-green-500' : 'text-yellow-500'}`}>
                      {selectedDriver.isApproved ? '✅ Approved' : '⏳ Pending'}
                    </div>
                    <div className={`text-sm ${selectedDriver.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                      {selectedDriver.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0A0E0B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">{selectedDriver.totalTrips}</div>
                    <div className="text-xs text-gray-400">Total Trips</div>
                  </div>
                  <div className="bg-[#0A0E0B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-green-500">RWF {selectedDriver.totalEarnings.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Total Earnings</div>
                  </div>
                  <div className="bg-[#0A0E0B] rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-yellow-500">{selectedDriver.rating.toFixed(1)} ★</div>
                    <div className="text-xs text-gray-400">Rating</div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-[#0A0E0B] rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Vehicle Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-2 text-white flex items-center gap-1">
                        {getVehicleIcon(selectedDriver.vehicleType)}
                        {getVehicleLabel(selectedDriver.vehicleType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Number:</span>
                      <span className="ml-2 text-white">{selectedDriver.vehicleNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Model:</span>
                      <span className="ml-2 text-white">{selectedDriver.vehicleModel}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">License:</span>
                      <span className="ml-2 text-white">{selectedDriver.licenseNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!selectedDriver.isApproved ? (
                    <>
                      <button
                        onClick={() => {
                          handleApproveDriver(selectedDriver.id);
                          setShowDetails(false);
                        }}
                        className="flex-1 py-2.5 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
                      >
                        Approve Driver
                      </button>
                      <button
                        onClick={() => {
                          handleRejectDriver(selectedDriver.id);
                          setShowDetails(false);
                        }}
                        className="flex-1 py-2.5 bg-red-500/20 text-red-500 rounded-xl font-semibold hover:bg-red-500/30 transition"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleSuspendDriver(selectedDriver.id);
                        setShowDetails(false);
                      }}
                      className="flex-1 py-2.5 bg-red-500/20 text-red-500 rounded-xl font-semibold hover:bg-red-500/30 transition"
                    >
                      Suspend Driver
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 py-2.5 bg-[#141C15] border border-gray-700 rounded-xl font-semibold hover:border-green-500/30 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}