'use client';

import { Bus, Search, Star, Eye, CheckCircle, XCircle, Loader2, Users, MapPin, Clock, Wifi, Coffee } from 'lucide-react';
import { useState, useEffect } from 'react';
import { driversAPI } from '@/lib/api';

interface BusDriver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  rating: number;
  trips: number;
  status: 'approved' | 'pending' | 'suspended';
  online: boolean;
  earnings: number;
  license: string;
  experience: number;
  // Bus specific fields
  capacity: number;
  route: string;
  departureTime: string;
  arrivalTime: string;
  amenities: string[];
  operator: string;
  busType: 'standard' | 'executive' | 'sleeper';
}

export default function BusDriversPage() {
  const [drivers, setDrivers] = useState<BusDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await driversAPI.getAll({ 
        type: 'bus',
        search: search || undefined
      });
      setDrivers(response.data);
    } catch (err: any) {
      console.error('Error fetching bus drivers:', err);
      setError(err.response?.data?.message || 'Failed to load bus drivers');
      if (err.response?.status === 404) {
        setDrivers(getMockBusDrivers());
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockBusDrivers = (): BusDriver[] => {
    return [
      { 
        id: '1', 
        name: 'Abdul Ruhinda', 
        phone: '+250788123501', 
        vehicleNumber: 'BUS-001A',
        rating: 4.7, 
        trips: 1890, 
        status: 'approved',
        online: true, 
        earnings: 1250000, 
        license: 'DL001234', 
        experience: 10,
        capacity: 45,
        route: 'Kigali - Kampala',
        departureTime: '08:00',
        arrivalTime: '16:00',
        amenities: ['AC', 'WiFi', 'TV', 'Restroom'],
        operator: 'MotoBus Express',
        busType: 'executive'
      },
      { 
        id: '2', 
        name: 'Grace Uwase', 
        phone: '+250788123502', 
        vehicleNumber: 'BUS-002B',
        rating: 4.9, 
        trips: 1567, 
        status: 'approved',
        online: false, 
        earnings: 980000, 
        license: 'DL002345', 
        experience: 8,
        capacity: 30,
        route: 'Kigali - Nairobi',
        departureTime: '07:00',
        arrivalTime: '18:00',
        amenities: ['AC', 'WiFi'],
        operator: 'MotoBus Express',
        busType: 'standard'
      },
    ];
  };

    function approveDriver(id: string): void {
        throw new Error('Function not implemented.');
    }

  // ... (rest of the functions similar to minibus)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bus className="text-purple-500" size={28} /> 
            Bus Drivers
          </h1>
          <p className="text-muted text-sm">Manage bus drivers and intercity routes</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-darkInput border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Bus specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-darkCard border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Total Buses</p>
          <p className="text-2xl font-bold">{drivers.length}</p>
        </div>
        <div className="bg-darkCard border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Active Routes</p>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="bg-darkCard border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Total Passengers</p>
          <p className="text-2xl font-bold">12,450</p>
        </div>
        <div className="bg-darkCard border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Revenue</p>
          <p className="text-2xl font-bold text-primary">RWF 4.5M</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {drivers.map((driver) => (
            <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">🚌</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{driver.name}</h3>
                    <p className="text-muted text-sm">{driver.phone}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-darkInput px-2 py-1 rounded">{driver.operator}</span>
                      <span className="text-xs bg-purple-500/20 px-2 py-1 rounded text-purple-500 uppercase">
                        {driver.busType}
                      </span>
                      <span className="text-xs bg-darkInput px-2 py-1 rounded">{driver.capacity} seats</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{driver.rating}</span>
                    </div>
                    <p className="text-sm text-muted">{driver.trips} trips</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">RWF {driver.earnings.toLocaleString()}</p>
                    <span className={`text-xs ${driver.online ? 'text-green-500' : 'text-gray-500'}`}>
                      {driver.online ? '● Online' : '● Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Route & Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <MapPin size={12} /> Route
                  </p>
                  <p className="font-medium">{driver.route}</p>
                </div>
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Clock size={12} /> Schedule
                  </p>
                  <p className="font-medium">Dep: {driver.departureTime} | Arr: {driver.arrivalTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Users size={12} /> Vehicle
                  </p>
                  <p className="font-mono font-medium">{driver.vehicleNumber}</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {driver.amenities.map((amenity) => (
                    <span key={amenity} className="text-xs bg-darkInput px-2 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30">
                  <Eye size={16} /> View Details
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30">
                  <MapPin size={16} /> Route Details
                </button>
                {driver.status === 'pending' && (
                  <button 
                    onClick={() => approveDriver(driver.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}