import { create } from 'zustand';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  distance: number;
  duration: number;
  fare: number;
  paymentMethod: 'WALLET' | 'MOBILE_MONEY' | 'CASH';
  driver?: {
    id: string;
    user: { fullName: string; phone: string };
    vehicle: { plateNumber: string; model: string; color: string };
  };
  currentLocation?: Location;
}

interface TripState {
  currentRide: Ride | null;
  isSearching: boolean;
  nearbyDrivers: any[];
  driverLocation: Location | null;
  setCurrentRide: (ride: Ride | null) => void;
  setIsSearching: (searching: boolean) => void;
  setNearbyDrivers: (drivers: any[]) => void;
  setDriverLocation: (location: Location | null) => void;
  updateRideStatus: (status: Ride['status']) => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentRide: null,
  isSearching: false,
  nearbyDrivers: [],
  driverLocation: null,
  setCurrentRide: (ride) => set({ currentRide: ride }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),
  setDriverLocation: (location) => set({ driverLocation: location }),
  updateRideStatus: (status) =>
    set((state) => ({
      currentRide: state.currentRide ? { ...state.currentRide, status } : null,
    })),
  clearTrip: () =>
    set({
      currentRide: null,
      isSearching: false,
      nearbyDrivers: [],
      driverLocation: null,
    }),
}));