'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Navigation, AlertTriangle, Star, X } from 'lucide-react';
import { useTripStore } from '@/store/trip.store';
import { socketService } from '@/lib/socket';
import apiClient from '@/lib/api';

interface ActiveRideProps {
  onClose: () => void;
}

export const ActiveRide = ({ onClose }: ActiveRideProps) => {
  const { currentRide, driverLocation } = useTripStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [distanceLeft, setDistanceLeft] = useState(0);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  useEffect(() => {
    if (!currentRide) return;

    // Simulate ETA updates
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setDistanceLeft(prev => Math.max(0, prev - 0.1));
    }, 60000);

    return () => clearInterval(interval);
  }, [currentRide]);

  const handleSOS = async () => {
    try {
      await apiClient.post('/sos/trigger', {
        rideId: currentRide?.id,
        lat: currentRide?.pickupLat,
        lng: currentRide?.pickupLng,
      });
      
      socketService.emit('sos_alert', {
        rideId: currentRide?.id,
        lat: currentRide?.pickupLat,
        lng: currentRide?.pickupLng,
      });
      
      setShowSOSConfirm(false);
      alert('SOS alert sent! Help is on the way.');
    } catch (error) {
      console.error('Failed to send SOS:', error);
    }
  };

  const getStatusMessage = () => {
    switch (currentRide?.status) {
      case 'ACCEPTED':
        return 'Driver is on the way';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      default:
        return 'Finding driver...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg"
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Active Ride</h2>
              <p className="text-sm text-gray-500">{getStatusMessage()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Driver Info */}
          {currentRide?.driver && (
            <div className="p-4 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {currentRide.driver.user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{currentRide.driver.user.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>4.8</span>
                    </div>
                    <span>•</span>
                    <span>{currentRide.driver.vehicle.plateNumber}</span>
                    <span>•</span>
                    <span>{currentRide.driver.vehicle.model}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ride Progress */}
          <div className="p-4">
            <div className="space-y-4">
              {/* Pickup */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-12 bg-gray-300 mt-1"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">PICKUP</p>
                  <p className="font-medium">{currentRide?.pickupAddress}</p>
                  {currentRide?.status === 'ACCEPTED' && (
                    <p className="text-sm text-yellow-600 mt-1">
                      Driver arriving in {Math.ceil(timeLeft)} min
                    </p>
                  )}
                </div>
              </div>

              {/* Dropoff */}
              <div className="flex gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">DROPOFF</p>
                  <p className="font-medium">{currentRide?.dropoffAddress}</p>
                  {currentRide?.status === 'IN_PROGRESS' && (
                    <p className="text-sm text-gray-600 mt-1">
                      {distanceLeft.toFixed(1)} km remaining • {Math.ceil(timeLeft)} min
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: currentRide?.status === 'IN_PROGRESS' ? '50%' : '25%' }}
                  className="bg-yellow-500 h-full rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Driver assigned</span>
                <span>Pickup</span>
                <span>Dropoff</span>
              </div>
            </div>
          </div>

          {/* Ride Details */}
          <div className="p-4 border-t border-b bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-semibold">{currentRide?.distance.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-semibold">{currentRide?.duration} min</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fare</p>
                <p className="font-semibold text-yellow-600">
                  {currentRide?.fare.toLocaleString()} RWF
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-3">
            <button
              onClick={() => setShowSOSConfirm(true)}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              SOS
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Share Trip
            </button>
          </div>

          {/* SOS Confirmation Modal */}
          {showSOSConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-xl max-w-sm w-full p-6"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Trigger SOS Alert?</h3>
                  <p className="text-gray-600 text-sm">
                    This will notify emergency contacts and our support team immediately.
                    Only use in genuine emergencies.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSOSConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSOS}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600"
                  >
                    Confirm SOS
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};