'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, DollarSign, Clock } from 'lucide-react';
import { useTripStore } from '@/store/trip.store';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

interface BookingFormProps {
  onClose: () => void;
}

export const BookingForm = ({ onClose }: BookingFormProps) => {
  const { user } = useAuthStore();
  const { setCurrentRide, setIsSearching } = useTripStore();
  const [pickup, setPickup] = useState({ lat: -1.9441, lng: 30.0619, address: 'Kigali City Tower' });
  const [dropoff, setDropoff] = useState({ lat: -1.9536, lng: 30.0605, address: 'Kigali Heights' });
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'MOBILE_MONEY' | 'CASH'>('WALLET');
  const [isLoading, setIsLoading] = useState(false);

  const calculateFare = () => {
    // Simple fare calculation - in production, use Google Maps Distance Matrix
    const baseFare = 500;
    const perKm = 300;
    const distance = 2.5; // km
    return baseFare + distance * perKm;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.post('/rides', {
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupAddress: pickup.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffAddress: dropoff.address,
        distance: 2.5,
        duration: 10,
        fare: calculateFare(),
        paymentMethod,
      });

      setCurrentRide(response.data);
      setIsSearching(true);
      onClose();
    } catch (error) {
      console.error('Failed to create ride:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Book a Ride</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location
              </label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MapPin className="w-5 h-5 text-green-500" />
                <input
                  type="text"
                  value={pickup.address}
                  onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                  className="flex-1 outline-none"
                  placeholder="Enter pickup location"
                  required
                />
              </div>
            </div>

            {/* Dropoff Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dropoff Location
              </label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Navigation className="w-5 h-5 text-red-500" />
                <input
                  type="text"
                  value={dropoff.address}
                  onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                  className="flex-1 outline-none"
                  placeholder="Enter destination"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['WALLET', 'MOBILE_MONEY', 'CASH'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method as any)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                    }`}
                  >
                    {method.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Fare Estimate */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium">2.5 km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">10 min</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Fare</span>
                <span className="text-yellow-500">{calculateFare().toLocaleString()} RWF</span>
              </div>
            </div>

            {/* Wallet Balance Warning */}
            {paymentMethod === 'WALLET' && user?.wallet && user.wallet.balance < calculateFare() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                Insufficient wallet balance. Please choose another payment method or top up your wallet.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (paymentMethod === 'WALLET' && user?.wallet && user.wallet.balance < calculateFare())}
              className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Booking...' : 'Request Ride'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};