// admin-dashboard/app/live-map/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bike, Bus, Truck, Users, Activity, AlertTriangle, 
  RefreshCw, Eye, X, MapPin, Navigation, Loader2,
  Search, Filter, ChevronDown, Clock, User, Phone,
  Star, Shield, Zap, Wifi, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Vehicle {
  id: string;
  userId: string;
  name: string;
  phone: string;
  plate: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'offline';
  online: boolean;
  speed?: number;
  eta?: string;
  rating?: number;
  destination?: string;
  vehicleType: string;
  vehicleNumber: string;
  totalTrips: number;
  totalEarnings: number;
}

interface Bus extends Vehicle {
  route: string;
  capacity: number;
  passengers: number;
  nextStop: string;
}

interface Minibus extends Vehicle {
  route: string;
  capacity: number;
  passengers: number;
  nextStop: string;
}

interface VehicleData {
  motos: Vehicle[];
  buses: Bus[];
  minibuses: Minibus[];
  riders: number;
  sosAlerts: Array<{
    id: string;
    userId: string;
    lat: number;
    lng: number;
    time: string;
    status: string;
    rider: string;
    phone: string;
    message: string;
  }>;
}

interface Stats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalRevenue: number;
  motoCount: number;
  busCount: number;
  minibusCount: number;
  pendingDrivers: number;
  activeDrivers: number;
  onlineDrivers: number;
}

// ─── GENERATE MOCK DATA (Fallback) ─────────────────────────────────
const generateMockVehicles = (): VehicleData => ({
  motos: [
    { 
      id: '1', 
      userId: 'user1',
      lat: -1.9441, 
      lng: 30.0619, 
      name: 'John Mugabo', 
      plate: 'MT-001A', 
      status: 'active', 
      speed: 45, 
      eta: '2 min', 
      rating: 4.8, 
      online: true, 
      destination: 'Kimironko Market',
      vehicleType: 'MOTO',
      vehicleNumber: 'MT-001A',
      totalTrips: 45,
      totalEarnings: 36000,
      phone: '+250788123456'
    },
    { 
      id: '2', 
      userId: 'user2',
      lat: -1.9455, 
      lng: 30.0625, 
      name: 'Peter Nshuti', 
      plate: 'MT-002B', 
      status: 'active', 
      speed: 38, 
      eta: '3 min', 
      rating: 4.9, 
      online: true, 
      destination: 'Kigali City Tower',
      vehicleType: 'MOTO',
      vehicleNumber: 'MT-002B',
      totalTrips: 67,
      totalEarnings: 53600,
      phone: '+250788123457'
    },
    { 
      id: '3', 
      userId: 'user3',
      lat: -1.9430, 
      lng: 30.0605, 
      name: 'James Rukundo', 
      plate: 'MT-003C', 
      status: 'idle', 
      speed: 0, 
      eta: '-', 
      rating: 4.7, 
      online: false, 
      destination: '-',
      vehicleType: 'MOTO',
      vehicleNumber: 'MT-003C',
      totalTrips: 34,
      totalEarnings: 27200,
      phone: '+250788123458'
    },
  ],
  buses: [
    { 
      id: '101', 
      userId: 'user4',
      lat: -1.9420, 
      lng: 30.0580, 
      name: 'Downtown Express', 
      plate: 'BUS-101', 
      route: '101', 
      capacity: 30, 
      passengers: 18, 
      status: 'active', 
      speed: 30, 
      online: true, 
      nextStop: 'Kimironko',
      vehicleType: 'BUS',
      vehicleNumber: 'BUS-101',
      totalTrips: 128,
      totalEarnings: 102400,
      phone: '+250788123459',
      destination: 'Downtown'
    },
    { 
      id: '102', 
      userId: 'user5',
      lat: -1.9460, 
      lng: 30.0640, 
      name: 'Airport Link', 
      plate: 'BUS-102', 
      route: '102', 
      capacity: 30, 
      passengers: 24, 
      status: 'active', 
      speed: 28, 
      online: true, 
      nextStop: 'Airport',
      vehicleType: 'BUS',
      vehicleNumber: 'BUS-102',
      totalTrips: 89,
      totalEarnings: 71200,
      phone: '+250788123460',
      destination: 'Airport'
    },
  ],
  minibuses: [
    { 
      id: '201', 
      userId: 'user6',
      lat: -1.9445, 
      lng: 30.0630, 
      name: 'City Hopper', 
      plate: 'MB-023', 
      route: 'Downtown Loop', 
      capacity: 15, 
      passengers: 8, 
      status: 'active', 
      online: true, 
      nextStop: 'Kacyiru',
      vehicleType: 'MINIBUS',
      vehicleNumber: 'MB-023',
      totalTrips: 56,
      totalEarnings: 44800,
      phone: '+250788123461',
      destination: 'Kacyiru'
    },
    { 
      id: '202', 
      userId: 'user7',
      lat: -1.9415, 
      lng: 30.0595, 
      name: 'Express Shuttle', 
      plate: 'MB-024', 
      route: 'Express Route', 
      capacity: 15, 
      passengers: 12, 
      status: 'active', 
      online: true, 
      nextStop: 'Gisozi',
      vehicleType: 'MINIBUS',
      vehicleNumber: 'MB-024',
      totalTrips: 42,
      totalEarnings: 33600,
      phone: '+250788123462',
      destination: 'Gisozi'
    },
  ],
  riders: 234,
  sosAlerts: [
    { id: 'sos1', userId: 'user8', lat: -1.9441, lng: 30.0619, time: '2 min ago', status: 'active', rider: 'John Doe', phone: '+250788123463', message: 'Help needed!' },
  ],
});

const generateMockStats = (): Stats => ({
  totalUsers: 1234,
  totalDrivers: 45,
  totalRides: 567,
  totalRevenue: 1250000,
  motoCount: 25,
  busCount: 10,
  minibusCount: 10,
  pendingDrivers: 3,
  activeDrivers: 35,
  onlineDrivers: 20,
});

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getLiveVehicles: async (): Promise<{ data: VehicleData }> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/vehicles/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      
      if (!res.ok) {
        console.warn('Failed to fetch live vehicles, using fallback data');
        return { data: generateMockVehicles() };
      }
      
      const data = await res.json();
      if (!data.data || Object.keys(data.data).length === 0) {
        return { data: generateMockVehicles() };
      }
      return data;
    } catch (error) {
      console.error('Error fetching live vehicles:', error);
      return { data: generateMockVehicles() };
    }
  },

  getStats: async (): Promise<{ stats: Stats }> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      
      if (!res.ok) {
        console.warn('Failed to fetch stats, using fallback');
        return { stats: generateMockStats() };
      }
      
      const data = await res.json();
      if (!data.stats) {
        return { stats: generateMockStats() };
      }
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { stats: generateMockStats() };
    }
  },

  getSOSAlerts: async (): Promise<{ data: any[] }> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/sos/alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      
      if (!res.ok) return { data: [] };
      const data = await res.json();
      return { data: data.data || [] };
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
      return { data: [] };
    }
  },

  updateDriverStatus: async (driverId: string, isOnline: boolean): Promise<any> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isOnline }),
      });
      if (!res.ok) throw new Error('Failed to update driver status');
      return res.json();
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  },

  getDriverDetails: async (driverId: string): Promise<any> => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/drivers/${driverId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch driver details');
      return res.json();
    } catch (error) {
      console.error('Error fetching driver details:', error);
      throw error;
    }
  },
};

// ─── KIGALI CENTER ─────────────────────────────────────────────────
const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

// ─── VEHICLE CARD ──────────────────────────────────────────────────
const VehicleCard = ({ vehicle, type, onSelect, onToggleStatus }: any) => (
  <div className="bg-[#0A0E0B] rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          type === 'moto' ? 'bg-orange-500/20' : type === 'bus' ? 'bg-blue-500/20' : 'bg-green-500/20'
        }`}>
          <span className="text-xl">{type === 'moto' ? '🏍️' : type === 'bus' ? '🚌' : '🚐'}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{vehicle.name}</p>
            <span className="text-[10px] text-gray-500">{vehicle.plate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">{vehicle.vehicleType}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">{vehicle.totalTrips || 0} trips</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleStatus(vehicle.id, !vehicle.online)}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
            vehicle.online 
              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
        >
          {vehicle.online ? (
            <>
              <Wifi size={12} /> Online
            </>
          ) : (
            <>
              <WifiOff size={12} /> Offline
            </>
          )}
        </button>
        <button
          onClick={() => onSelect({ ...vehicle, type })}
          className="p-1.5 hover:bg-[#1A1E1C] rounded-lg transition"
        >
          <Eye size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      {type === 'moto' && (
        <>
          <div>
            <span className="text-gray-500">Speed</span>
            <p className="text-white font-medium">{vehicle.speed || 0} km/h</p>
          </div>
          <div>
            <span className="text-gray-500">Rating</span>
            <p className="text-yellow-500 font-medium">⭐ {vehicle.rating || 4.8}</p>
          </div>
          <div>
            <span className="text-gray-500">Location</span>
            <p className="text-white font-medium truncate">{vehicle.destination || 'N/A'}</p>
          </div>
        </>
      )}
      {(type === 'bus' || type === 'minibus') && (
        <>
          <div>
            <span className="text-gray-500">Route</span>
            <p className="text-white font-medium">{vehicle.route || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Capacity</span>
            <p className="text-white font-medium">{vehicle.passengers || 0}/{vehicle.capacity || 0}</p>
          </div>
          <div>
            <span className="text-gray-500">Next Stop</span>
            <p className="text-white font-medium truncate">{vehicle.nextStop || 'N/A'}</p>
          </div>
        </>
      )}
    </div>
  </div>
);

// ─── OPENSTREETMAP COMPONENT ───────────────────────────────────────
const OpenStreetMapComponent = ({ 
  center, 
  vehicles, 
  onVehicleClick 
}: {
  center: { lat: number; lng: number };
  vehicles: { motos: Vehicle[]; buses: Bus[]; minibuses: Minibus[] };
  onVehicleClick?: (vehicle: any) => void;
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const allVehicles = [...vehicles.motos, ...vehicles.buses, ...vehicles.minibuses];
    if (allVehicles.length === 0) {
      // If no vehicles, show default Kigali map
      setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik`);
      return;
    }
    const markers = allVehicles.map(v => `marker=${v.lat},${v.lng}`).join('&');
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik&${markers}`;
    setMapUrl(url);
  }, [center, vehicles]);

  return (
    <div className="h-[500px] w-full rounded-b-xl bg-[#0A0E0B] relative">
      <iframe
        ref={iframeRef}
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        title="Live Vehicle Map"
        className="rounded-b-xl"
      />
      <div className="absolute bottom-4 right-4 bg-[#111714]/90 backdrop-blur-sm rounded-lg p-2 text-xs border border-gray-800">
        <span className="text-gray-400">📍 OpenStreetMap</span>
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            const allVehicles = [...vehicles.motos, ...vehicles.buses, ...vehicles.minibuses];
            if (allVehicles.length === 0) {
              if (iframeRef.current) {
                iframeRef.current.src = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik`;
              }
              return;
            }
            const markers = allVehicles.map(v => `marker=${v.lat},${v.lng}`).join('&');
            const url = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik&${markers}`;
            if (iframeRef.current) {
              iframeRef.current.src = url;
            }
          }}
          className="bg-[#111714]/90 backdrop-blur-sm rounded-lg p-2 text-xs border border-gray-800 text-white hover:bg-[#1A1E1C] transition"
        >
          <Navigation size={14} />
        </button>
      </div>
      {/* Legend Overlay */}
      <div className="absolute bottom-20 right-2 bg-[#111714]/90 backdrop-blur-sm rounded-lg p-1.5 text-[10px] border border-gray-800 z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /><span className="text-gray-300">Moto</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-gray-300">Bus</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-gray-300">Mini-Bus</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-gray-300">SOS</span></div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function LiveMapPage() {
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState<VehicleData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSOSPanel, setShowSOSPanel] = useState(false);
  const [mapCenter, setMapCenter] = useState(KIGALI_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');

  // ─── FETCH DATA WITH FALLBACK ──────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const [vehiclesData, statsData, sosData] = await Promise.all([
        api.getLiveVehicles(),
        api.getStats(),
        api.getSOSAlerts(),
      ]);

      // Ensure we have data with fallbacks
      const vehicleData = vehiclesData.data || generateMockVehicles();
      const stats = statsData.stats || generateMockStats();

      setVehicles({
        ...vehicleData,
        sosAlerts: sosData.data || [],
      });
      setStats(stats);
    } catch (err: any) {
      // Use fallback data on error
      setVehicles(generateMockVehicles());
      setStats(generateMockStats());
      setError(err.message || 'Failed to fetch data, using fallback data');
      toast.error('Failed to load live data, using fallback data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // ─── INITIAL LOAD ──────────────────────────────────────────────
  useEffect(() => {
    fetchData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── TOGGLE DRIVER STATUS ──────────────────────────────────────
  const handleToggleStatus = async (driverId: string, isOnline: boolean) => {
    try {
      await api.updateDriverStatus(driverId, isOnline);
      toast.success(`Driver ${isOnline ? 'online' : 'offline'} status updated`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // ─── VIEW DRIVER DETAILS ──────────────────────────────────────
  const handleViewDriver = async (driver: any) => {
    try {
      const data = await api.getDriverDetails(driver.id);
      setSelectedVehicle({ ...driver, ...data.data });
    } catch (err: any) {
      toast.error('Failed to load driver details');
    }
  };

  // ─── FILTER VEHICLES ──────────────────────────────────────────
  const getFilteredVehicles = () => {
    if (!vehicles) return { motos: [], buses: [], minibuses: [] };

    let motos = vehicles.motos;
    let buses = vehicles.buses;
    let minibuses = vehicles.minibuses;

    if (selectedLayer === 'moto') {
      buses = [];
      minibuses = [];
    } else if (selectedLayer === 'bus') {
      motos = [];
      minibuses = [];
    } else if (selectedLayer === 'minibus') {
      motos = [];
      buses = [];
    }

    if (filterStatus === 'online') {
      motos = motos.filter(v => v.online);
      buses = buses.filter(v => v.online);
      minibuses = minibuses.filter(v => v.online);
    } else if (filterStatus === 'offline') {
      motos = motos.filter(v => !v.online);
      buses = buses.filter(v => !v.online);
      minibuses = minibuses.filter(v => !v.online);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      motos = motos.filter(v => 
        v.name.toLowerCase().includes(term) ||
        v.plate.toLowerCase().includes(term) ||
        v.phone?.includes(term)
      );
      buses = buses.filter(v => 
        v.name.toLowerCase().includes(term) ||
        v.plate.toLowerCase().includes(term) ||
        v.phone?.includes(term)
      );
      minibuses = minibuses.filter(v => 
        v.name.toLowerCase().includes(term) ||
        v.plate.toLowerCase().includes(term) ||
        v.phone?.includes(term)
      );
    }

    return { motos, buses, minibuses };
  };

  const filtered = getFilteredVehicles();
  const totalVehicles = filtered.motos.length + filtered.buses.length + filtered.minibuses.length;

  // ─── STATS ──────────────────────────────────────────────────────
  const onlineStats = {
    riders: stats?.totalUsers || 234,
    motos: vehicles?.motos.filter(v => v.online).length || 0,
    buses: vehicles?.buses.filter(v => v.online).length || 0,
    minibuses: vehicles?.minibuses.filter(v => v.online).length || 0,
    online: stats?.onlineDrivers || 0,
    totalDrivers: stats?.totalDrivers || 0,
    pendingDrivers: stats?.pendingDrivers || 0,
    totalTrips: stats?.totalRides || 0,
    totalRevenue: stats?.totalRevenue || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white">
      {/* Header */}
      <div className="bg-[#111714] border-b border-gray-800 p-4 sticky top-0 z-20">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">🚗 Command Center</h1>
            <p className="text-gray-500 text-xs">Real-time vehicle and passenger tracking</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSOSPanel(true)}
              className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm hover:bg-red-500/30 transition"
            >
              <AlertTriangle size={16} />
              SOS: {vehicles?.sosAlerts.length || 0}
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 rounded-lg bg-[#0A0E0B] hover:bg-[#1A1E1C] transition-all border border-gray-800"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Cards - Dynamic */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Users size={16} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{onlineStats.riders}</p>
            <p className="text-[10px] text-gray-500">Riders</p>
          </div>
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Bike size={16} className="text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-500">{onlineStats.motos}</p>
            <p className="text-[10px] text-gray-500">Moto</p>
          </div>
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Bus size={16} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-500">{onlineStats.buses}</p>
            <p className="text-[10px] text-gray-500">Bus</p>
          </div>
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Truck size={16} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{onlineStats.minibuses}</p>
            <p className="text-[10px] text-gray-500">Mini-Bus</p>
          </div>
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Activity size={16} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{onlineStats.online}</p>
            <p className="text-[10px] text-gray-500">Online</p>
          </div>
          <div className="bg-[#0A0E0B] rounded-xl p-2 text-center border border-gray-800">
            <Clock size={16} className="text-yellow-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-yellow-500">{onlineStats.totalTrips}</p>
            <p className="text-[10px] text-gray-500">Trips</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {/* Layer Controls */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All', icon: '🗺️' },
              { id: 'moto', label: 'Moto', icon: '🏍️' },
              { id: 'bus', label: 'Bus', icon: '🚌' },
              { id: 'minibus', label: 'Mini-Bus', icon: '🚐' },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`px-2 py-1 rounded-lg text-xs transition whitespace-nowrap flex items-center gap-1 ${
                  selectedLayer === layer.id
                    ? 'bg-green-500 text-black'
                    : 'bg-[#0A0E0B] text-gray-500 hover:text-white border border-gray-800'
                }`}
              >
                <span>{layer.icon}</span> {layer.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1">
            {['all', 'online', 'offline'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-2 py-1 rounded-lg text-xs transition capitalize ${
                  filterStatus === status
                    ? 'bg-green-500 text-black'
                    : 'bg-[#0A0E0B] text-gray-500 hover:text-white border border-gray-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[120px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-[#0A0E0B] border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="p-4">
        <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden relative">
          <div className="bg-[#0A0E0B] p-2 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-green-500" />
              <span className="text-xs font-medium">Live Vehicle Map</span>
              <span className="text-[10px] text-gray-500">({totalVehicles} vehicles)</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setMapCenter(KIGALI_CENTER)}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#111714] rounded-lg hover:bg-[#1A1E1C] border border-gray-800 text-xs"
              >
                <Navigation size={10} /> Center
              </button>
            </div>
          </div>

          <OpenStreetMapComponent
            center={mapCenter}
            vehicles={filtered}
            onVehicleClick={handleViewDriver}
          />

          {/* Live Status Overlay */}
          <div className="absolute bottom-4 left-2 bg-[#111714]/90 backdrop-blur-sm rounded-lg p-1.5 text-[10px] border border-gray-800 z-10">
            <div className="flex gap-2">
              <span className="text-green-500">🟢 {onlineStats.online} Online</span>
              <span className="text-gray-500">⚪ {onlineStats.totalDrivers - onlineStats.online} Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="p-4 pb-20">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Eye size={14} />
            Live Vehicles ({totalVehicles})
          </h3>
        </div>
        <div className="space-y-2">
          {totalVehicles === 0 ? (
            <div className="bg-[#0A0E0B] rounded-xl p-8 text-center border border-gray-800">
              <p className="text-gray-400">No vehicles found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {filtered.motos.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  type="moto"
                  onSelect={handleViewDriver}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
              {filtered.buses.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  type="bus"
                  onSelect={handleViewDriver}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
              {filtered.minibuses.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  type="minibus"
                  onSelect={handleViewDriver}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedVehicle(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedVehicle.type === 'moto' ? 'bg-orange-500/20' :
                  selectedVehicle.type === 'bus' ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  <span className="text-2xl">
                    {selectedVehicle.type === 'moto' ? '🏍️' : selectedVehicle.type === 'bus' ? '🚌' : '🚐'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedVehicle.name}</h3>
                  <p className="text-xs text-gray-500">{selectedVehicle.plate} • {selectedVehicle.vehicleType}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800">
                <p className="text-gray-500 text-[10px]">Status</p>
                <p className="text-sm font-semibold">{selectedVehicle.online ? '🟢 Online' : '⚪ Offline'}</p>
              </div>
              {selectedVehicle.speed !== undefined && (
                <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800">
                  <p className="text-gray-500 text-[10px]">Speed</p>
                  <p className="text-sm font-semibold">{selectedVehicle.speed} km/h</p>
                </div>
              )}
              {selectedVehicle.rating && (
                <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800">
                  <p className="text-gray-500 text-[10px]">Rating</p>
                  <p className="text-sm font-semibold text-yellow-500">⭐ {selectedVehicle.rating}</p>
                </div>
              )}
              {selectedVehicle.totalTrips !== undefined && (
                <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800">
                  <p className="text-gray-500 text-[10px]">Trips</p>
                  <p className="text-sm font-semibold">{selectedVehicle.totalTrips}</p>
                </div>
              )}
              {selectedVehicle.totalEarnings !== undefined && (
                <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800">
                  <p className="text-gray-500 text-[10px]">Earnings</p>
                  <p className="text-sm font-semibold text-green-500">RWF {selectedVehicle.totalEarnings?.toLocaleString()}</p>
                </div>
              )}
              {selectedVehicle.phone && (
                <div className="bg-[#0A0E0B] rounded-lg p-2 border border-gray-800 col-span-2">
                  <p className="text-gray-500 text-[10px]">Phone</p>
                  <p className="text-sm font-semibold">{selectedVehicle.phone}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-green-500 text-black py-2 rounded-lg text-sm font-semibold hover:bg-green-400 transition">
                Track Live
              </button>
              <button className="flex-1 bg-red-500/20 text-red-500 py-2 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition">
                Send Alert
              </button>
            </div>
          </div>
        </>
      )}

      {/* SOS Panel */}
      {showSOSPanel && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowSOSPanel(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                SOS Alerts
              </h3>
              <button onClick={() => setShowSOSPanel(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {!vehicles?.sosAlerts?.length ? (
                <div className="bg-[#0A0E0B] rounded-xl p-6 text-center border border-gray-800">
                  <p className="text-gray-400">No active SOS alerts</p>
                  <p className="text-xs text-gray-500 mt-1">All clear!</p>
                </div>
              ) : (
                vehicles.sosAlerts.map((alert) => (
                  <div key={alert.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-red-500 text-sm">🚨 Emergency Alert</p>
                        <p className="text-xs text-gray-400 mt-1">Rider: {alert.rider}</p>
                        <p className="text-xs text-gray-400">📱 {alert.phone || 'N/A'}</p>
                        <p className="text-xs text-gray-400">📍 {alert.lat}, {alert.lng}</p>
                        <p className="text-xs text-gray-400">🕐 {alert.time}</p>
                        {alert.message && (
                          <p className="text-xs text-red-400 mt-1">💬 {alert.message}</p>
                        )}
                      </div>
                      <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition">
                        Respond
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}