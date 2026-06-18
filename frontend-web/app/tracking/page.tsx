'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Bus, Navigation, Clock, MapPin, Users, WifiOff } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';

const MapComponent = dynamic(() => import('@/components/maps/Map'), { ssr: false });

interface Bus {
  id: string;
  plateNumber: string;
  route: string;
  currentLat: number;
  currentLng: number;
  capacity: number;
  occupancy: number;
  eta: number;
  driver: {
    user: {
      fullName: string;
    };
  };
}

export default function TrackingPage() {
  const { token } = useAuthStore();
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  const { data: initialBuses } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await apiClient.get('/tracking/buses');
      return response.data;
    },
  });

  useEffect(() => {
    if (initialBuses) {
      setBuses(initialBuses);
    }
  }, [initialBuses]);

  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect(token);
    
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('bus_location_update', (data: Bus) => {
      setBuses(prev => 
        prev.map(bus => 
          bus.id === data.id ? { ...bus, ...data } : bus
        )
      );
    });

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const markers = buses.map(bus => ({
    lat: bus.currentLat,
    lng: bus.currentLng,
    title: `${bus.route} - ${bus.plateNumber}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Live Bus Tracking</h1>
          <p className="text-gray-600 mt-2">Track buses in real-time across Kigali</p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-700">Reconnecting to live updates...</span>
          </div>
        )}

        {/* Map and Info Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-[600px]">
              <MapComponent markers={markers} center={[-1.9441, 30.0619]} />
            </div>
          </div>

          {/* Bus List Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Active Buses</h2>
              <div className="space-y-3 max-h-[550px] overflow-y-auto">
                {buses.map((bus) => (
                  <motion.div
                    key={bus.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedBus(bus)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedBus?.id === bus.id
                        ? 'bg-yellow-50 border-2 border-yellow-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Bus className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-gray-800">{bus.plateNumber}</span>
                      </div>
                      <span className="text-xs text-gray-500">{bus.route}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {bus.occupancy}/{bus.capacity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{bus.eta} min ETA</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Driver: {bus.driver.user.fullName}
                    </div>
                  </motion.div>
                ))}

                {buses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No active buses at the moment
                  </div>
                )}
              </div>
            </div>

            {/* Selected Bus Info */}
            {selectedBus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-4"
              >
                <h3 className="font-semibold text-gray-800 mb-3">Selected Bus Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium">{selectedBus.route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plate Number:</span>
                    <span className="font-medium">{selectedBus.plateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span>{selectedBus.capacity} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Seats:</span>
                    <span className="text-green-600">
                      {selectedBus.capacity - selectedBus.occupancy} seats
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Arrival:</span>
                    <span>{selectedBus.eta} minutes</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}