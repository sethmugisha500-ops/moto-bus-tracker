'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useTripStore } from '@/store/trip.store';

interface Location {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}

export const useRideTracking = (rideId: string | null) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const { setDriverLocation } = useTripStore();

  const { isConnected } = useSocket({
    driver_location_update: (data: any) => {
      if (data.rideId === rideId) {
        setCurrentLocation({
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed,
        });
        setDriverLocation({
          lat: data.lat,
          lng: data.lng,
          address: '',
        });
      }
    },
    eta_update: (data: any) => {
      if (data.rideId === rideId) {
        setEta(data.minutes);
      }
    },
  });

  return {
    currentLocation,
    eta,
    isConnected,
  };
};