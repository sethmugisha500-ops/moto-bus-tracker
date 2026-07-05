// app/passenger/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleMap, Marker, DirectionsRenderer, useLoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: -1.9441,
  lng: 30.0619,
};

// ── Vehicle Types ──────────────────────────────────────────────────────
const RIDE_TYPES = [
  {
    id: "eco",
    label: "Eco",
    icon: "🛵",
    desc: "Budget-friendly for short trips",
    base: 500,
    perKm: 300,
    vehicleType: "MOTO",
    speed: "Fast",
    capacity: "1 passenger"
  },
  {
    id: "moto",
    label: "Moto",
    icon: "🏍️",
    desc: "Fast & popular for quick commutes",
    base: 400,
    perKm: 250,
    vehicleType: "MOTO",
    speed: "Very Fast",
    capacity: "1-2 passengers"
  },
  {
    id: "ride",
    label: "Ride",
    icon: "🚗",
    desc: "AC, comfortable car rides",
    base: 800,
    perKm: 450,
    vehicleType: "CAR",
    speed: "Fast",
    capacity: "1-4 passengers"
  },
  {
    id: "bus",
    label: "Mini-Bus",
    icon: "🚌",
    desc: "Fixed route, affordable group travel",
    base: 300,
    perKm: 150,
    vehicleType: "MINIBUS",
    speed: "Moderate",
    capacity: "8-15 passengers"
  },
];

const PAYMENT_METHODS = [
  { id: "MOBILE_MONEY", label: "MoMo", icon: "💛" },
  { id: "WALLET", label: "Wallet", icon: "💜" },
  { id: "CASH", label: "Cash", icon: "💵" },
];

const RECENT_PLACES = [
  { icon: "⭐", label: "Kigali Convention Centre", sub: "KG 2 Roundabout", lat: -1.9520, lng: 30.0619 },
  { icon: "🏠", label: "Home", sub: "Kacyiru, Sector 4", lat: -1.9350, lng: 30.0850 },
  { icon: "💼", label: "Office", sub: "Norrsken House, Kimihurura", lat: -1.9468, lng: 30.0806 },
  { icon: "🛒", label: "Kimironko Market", sub: "Kimironko", lat: -1.9580, lng: 30.0719 },
  { icon: "✈️", label: "Kigali Airport", sub: "Kanombe", lat: -1.9680, lng: 30.1390 },
];

type Step = "idle" | "form" | "searching" | "matched" | "active" | "completed" | "cancelled";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  distance: number;
  distanceText: string;
  eta: number;
  etaText: string;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  location?: { lat: number; lng: number };
  profilePhoto?: string | null;
}

interface RideRequest {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  rideType: string;
  fare: number;
  paymentMethod: string;
  pickupAddress: string;
  distance?: number;
  duration?: number;
}

interface RouteInfo {
  distance: number;
  distanceText: string;
  duration: number;
  durationText: string;
  polyline: string;
}

// ── Trip Progress Component ──────────────────────────────────────────
const TripProgress = ({ 
  percentage, 
  status, 
  driverName, 
  vehicleNumber, 
  etaText 
}: { 
  percentage: number; 
  status: string;
  driverName?: string;
  vehicleNumber?: string;
  etaText?: string;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'Driver Found': return '✅';
      case 'Driver Arriving': return '🚗';
      case 'Trip in Progress': return '🟢';
      case 'Trip Completed': return '🎉';
      default: return '📍';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Driver Found': return 'text-blue-400';
      case 'Driver Arriving': return 'text-yellow-400';
      case 'Trip in Progress': return 'text-green-500';
      case 'Trip Completed': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <p className={`font-semibold ${getStatusColor()}`}>{status}</p>
            {driverName && (
              <p className="text-xs text-gray-400">Driver: {driverName} • {vehicleNumber}</p>
            )}
          </div>
        </div>
        {etaText && (
          <div className="text-right">
            <p className="text-xs text-gray-400">ETA</p>
            <p className="text-sm font-semibold text-blue-400">{etaText}</p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Pickup</span>
          <span>{Math.round(percentage)}% Complete</span>
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
};

// ── Live Stats Component ─────────────────────────────────────────────
const LiveStats = ({ 
  distanceTravelled, 
  remainingDistance, 
  remainingTime, 
  fare,
  elapsedTime,
  totalDistance
}: { 
  distanceTravelled: number;
  remainingDistance: number;
  remainingTime: number;
  fare: number;
  elapsedTime: number;
  totalDistance: number;
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
        <p className="text-xs text-gray-400">Distance Travelled</p>
        <p className="text-sm font-semibold text-green-400">{distanceTravelled.toFixed(1)} km</p>
        <p className="text-[10px] text-gray-500">of {totalDistance.toFixed(1)} km</p>
      </div>
      <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
        <p className="text-xs text-gray-400">Remaining</p>
        <p className="text-sm font-semibold text-orange-400">{remainingDistance.toFixed(1)} km</p>
        <p className="text-[10px] text-gray-500">ETA: {Math.ceil(remainingTime / 60)} min</p>
      </div>
      <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
        <p className="text-xs text-gray-400">Trip Fare</p>
        <p className="text-sm font-semibold text-yellow-400">RWF {fare.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500">Elapsed: {formatTime(elapsedTime)}</p>
      </div>
    </div>
  );
};

// ── Driver Info Card ──────────────────────────────────────────────────
const DriverInfoCard = ({ 
  driver, 
  onCall, 
  onSOS, 
  onShare 
}: { 
  driver: Driver; 
  onCall: () => void;
  onSOS: () => void;
  onShare: () => void;
}) => {
  return (
    <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-2xl border-2 border-green-500/30">
          {driver.profilePhoto ? (
            <img src={driver.profilePhoto} alt={driver.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            driver.name?.charAt(0)?.toUpperCase() || "🚗"
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{driver.name || "Driver"}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">⭐ {driver.rating || 0}</span>
            <span>•</span>
            <span>{driver.vehicleType}</span>
            <span>•</span>
            <span>{driver.vehicleNumber}</span>
          </div>
          <p className="text-xs text-gray-500">{driver.phone || "No phone"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCall}
            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition"
          >
            📞
          </button>
          <button
            onClick={onSOS}
            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition animate-pulse"
          >
            🆘
          </button>
          <button
            onClick={onShare}
            className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition"
          >
            🔗
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────
export default function PassengerHome() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickup, setPickup] = useState("Current location");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [rideType, setRideType] = useState("moto");
  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [matchedDriver, setMatchedDriver] = useState<Driver | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [error, setError] = useState("");
  const [currentRide, setCurrentRide] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [directions, setDirections] = useState<any>(null);
  const [showSOS, setShowSOS] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(0);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rideRequested, setRideRequested] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [tripStatus, setTripStatus] = useState<string>("");
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [tripProgress, setTripProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [trafficUpdate, setTrafficUpdate] = useState<string>("");
  const [arrivalNotified, setArrivalNotified] = useState(false);

  // ─── Polling states ──────────────────────────────────────────────
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const mapRef = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sosContacts = [
    { name: "Emergency Services", phone: "112", icon: "🚨" },
    { name: "Rwanda National Police", phone: "999", icon: "👮" },
    { name: "Ambulance", phone: "911", icon: "🚑" },
  ];

  // ─── Check Authentication ──────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || "Rider");
        console.log("👤 Passenger authenticated:", user.name);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    setIsAuthenticated(true);
  }, [router]);

  // ─── Load Google Maps ──────────────────────────────────────────────
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    id: "google-maps-script",
  });

  useEffect(() => {
    if (loadError) {
      console.error("Google Maps Load Error:", loadError);
      setMapLoadError(loadError.message);
      toast.error("Failed to load Google Maps. Please check your API key.");
    }
  }, [loadError]);

  // ─── Places Autocomplete ──────────────────────────────────────────
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
location: location && typeof window !== 'undefined' && (window as any).google ? new (window as any).google.maps.LatLng(location.lat, location.lng) : undefined,    },
    debounce: 300,
  });
// ─── GPS Location ──────────────────────────────────────────────────
useEffect(() => {
  if (!isAuthenticated) return;

  if ("geolocation" in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setLocation(newLocation);
        setPickupCoords(newLocation);

        if (typeof window !== 'undefined' && (window as any).google && directionsService.current) {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode(
            { location: newLocation },
            (results: { formatted_address: SetStateAction<string>; }[], status: any) => {
              if (status === (window as any).google.maps.GeocoderStatus.OK && results && results[0]) {
                setPickup(results[0].formatted_address);
              }
            }
          );
        }

        fetchNearbyDrivers(newLocation);
      },
      () => {
        setLocation(defaultCenter);
        setPickupCoords(defaultCenter);
        fetchNearbyDrivers(defaultCenter);
        toast.error("Unable to get your location. Using default location.");
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  } else {
    setLocation(defaultCenter);
    setPickupCoords(defaultCenter);
    fetchNearbyDrivers(defaultCenter);
    toast.error("Geolocation is not supported by your browser.");
  }
}, [isAuthenticated]);

  // ─── Fetch Nearby Drivers ─────────────────────────────────────────
  const fetchNearbyDrivers = async (userLocation: { lat: number; lng: number }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/rides/drivers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data?.length) {
          const formattedDrivers = data.data.map((d: any) => {
            const distance = calculateDistance(
              userLocation,
              { lat: d.currentLat || userLocation.lat, lng: d.currentLng || userLocation.lng }
            );
            const eta = calculateETA(
              d.currentLat || userLocation.lat,
              d.currentLng || userLocation.lng,
              userLocation
            );

            return {
              id: d.id,
              name: d.user?.name || "Driver",
              phone: d.user?.phone || "",
              vehicleNumber: d.vehicleNumber || "N/A",
              vehicleType: d.vehicleType || "MOTO",
              rating: d.rating || 0,
              distance: distance,
              distanceText: `${(distance / 1000).toFixed(1)} km`,
              eta: eta,
              etaText: `${Math.ceil(eta / 60)} min`,
              isOnline: d.isOnline || false,
              currentLat: d.currentLat || userLocation.lat + (Math.random() - 0.5) * 0.01,
              currentLng: d.currentLng || userLocation.lng + (Math.random() - 0.5) * 0.01,
              location: { lat: d.currentLat || userLocation.lat, lng: d.currentLng || userLocation.lng },
              profilePhoto: d.user?.profilePhoto || null
            };
          });
          setDrivers(formattedDrivers);
          setNearbyDrivers(formattedDrivers);
        }
      } else {
        const mockDrivers = generateMockDrivers(userLocation);
        setDrivers(mockDrivers);
        setNearbyDrivers(mockDrivers);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      const mockDrivers = generateMockDrivers(userLocation);
      setDrivers(mockDrivers);
      setNearbyDrivers(mockDrivers);
    }
  };

  // ── Helper Functions ─────────────────────────────────────────────
  const calculateDistance = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const R = 6371000;
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateETA = (driverLat: number, driverLng: number, userLocation: { lat: number; lng: number }) => {
    const distance = calculateDistance(
      { lat: driverLat, lng: driverLng },
      userLocation
    );
    const avgSpeed = 8.33;
    return Math.max(60, distance / avgSpeed);
  };

  const generateMockDrivers = (userLocation: { lat: number; lng: number }) => {
    const mockNames = [
      "Jean Paul", "Marie Claire", "Eric Muneza",
      "Sarah Uwimana", "Peter Nshuti", "Grace Umutoni"
    ];
    const vehicleTypes = ["MOTO", "MOTO", "CAR", "MOTO", "MINIBUS", "CAR"];
    const vehicleNumbers = ["RAB 123M", "RAB 456M", "RAB 789C", "RAB 321M", "BUS-101", "RAB 654C"];
    const ratings = [4.8, 4.9, 4.7, 4.6, 4.5, 4.8];

    return mockNames.map((name, index) => {
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;
      const driverLat = userLocation.lat + latOffset;
      const driverLng = userLocation.lng + lngOffset;
      const distance = calculateDistance(userLocation, { lat: driverLat, lng: driverLng });
      const eta = calculateETA(driverLat, driverLng, userLocation);

      return {
        id: `driver-${index + 1}`,
        name,
        phone: `+250788${String(100000 + Math.floor(Math.random() * 900000))}`,
        vehicleNumber: vehicleNumbers[index % vehicleNumbers.length],
        vehicleType: vehicleTypes[index % vehicleTypes.length],
        rating: ratings[index % ratings.length],
        distance: distance,
        distanceText: `${(distance / 1000).toFixed(1)} km`,
        eta: eta,
        etaText: `${Math.ceil(eta / 60)} min`,
        isOnline: true,
        currentLat: driverLat,
        currentLng: driverLng,
        location: { lat: driverLat, lng: driverLng },
        profilePhoto: null
      };
    });
  };

  // ── Calculate Route ──────────────────────────────────────────────
  const calculateRoute = useCallback(async () => {
    if (!pickupCoords || !destinationCoords || !directionsService.current || !location) return;

    try {
      const result = await new Promise((resolve, reject) => {
        directionsService.current.route(
          {
            origin: new (window as any).google.maps.LatLng(location.lat, location.lng)
,
            destination: new (window as any).google.maps.LatLng(pickupCoords.lat, pickupCoords.lng),
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
          },
          (result: any, status: any) => {
if (status === (window as any).google.maps.DirectionsStatus.OK) {              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      const route = result as any;
      const leg = route.routes?.[0]?.legs?.[0];

      if (leg) {
        const info: RouteInfo = {
          distance: leg.distance.value,
          distanceText: leg.distance.text,
          duration: leg.duration.value,
          durationText: leg.duration.text,
          polyline: route.routes[0].overview_polyline,
        };
        setRouteInfo(info);
        setDirections(route);
        setTotalDistance(leg.distance.value / 1000);
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      setError("Could not calculate route. Please try again.");
      toast.error("Route calculation failed");
    }
  }, [pickupCoords, destinationCoords]);

  useEffect(() => {
    if (destinationCoords && pickupCoords) {
      calculateRoute();
    }
  }, [destinationCoords, pickupCoords, calculateRoute]);

  // ─── Real-time Driver Tracking ──────────────────────────────────
  const startDriverTracking = useCallback((driverId: string) => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }

    trackingInterval.current = setInterval(() => {
      setMatchedDriver(prev => {
        if (!prev || !prev.currentLat || !prev.currentLng || !pickupCoords) return prev;
        
        const latDelta = pickupCoords.lat - prev.currentLat;
        const lngDelta = pickupCoords.lng - prev.currentLng;
        const stepSize = 0.0005;

        const newLat = prev.currentLat + Math.sign(latDelta) * stepSize;
        const newLng = prev.currentLng + Math.sign(lngDelta) * stepSize;
        const newDistance = calculateDistance(
          { lat: newLat, lng: newLng },
          pickupCoords
        );
        const newEta = calculateETA(newLat, newLng, pickupCoords);

        setRemainingDistance(newDistance);
        setRemainingTime(newEta);

        if (totalDistance > 0) {
          const travelled = totalDistance - (newDistance / 1000);
          setDistanceTravelled(travelled);
          const progress = (travelled / totalDistance) * 100;
          setTripProgress(Math.min(progress, 100));
        }

        if (newDistance < 200 && !arrivalNotified && step === "active") {
          setArrivalNotified(true);
          toast.success("📍 Almost there! Please prepare to exit safely.");
        }

        if (Math.random() < 0.01 && step === "active") {
          const updates = [
            "Heavy traffic ahead. New ETA: 14 minutes",
            "Driver found a faster route. ETA reduced by 3 minutes",
            "Traffic is clear. Arriving on time",
            "Road construction ahead. Slight delay expected"
          ];
          setTrafficUpdate(updates[Math.floor(Math.random() * updates.length)]);
          setTimeout(() => setTrafficUpdate(""), 10000);
        }

        return {
          ...prev,
          currentLat: newLat,
          currentLng: newLng,
          distance: newDistance,
          distanceText: `${(newDistance / 1000).toFixed(1)} km`,
          eta: newEta,
          etaText: `${Math.ceil(newEta / 60)} min`
        };
      });
    }, 2000);
  }, [pickupCoords, totalDistance, arrivalNotified, step]);

  // ─── Elapsed Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (step === "active" && tripStartTime) {
      elapsedTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - tripStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [step, tripStartTime]);

  // ─── POLLING FALLBACK FOR DRIVER INFO ──────────────────────────────
  useEffect(() => {
    if (step !== "searching" || !currentRide?.id) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        setIsPolling(false);
        setPollingAttempts(0);
      }
      return;
    }

    console.log('🔄 Starting polling for driver...');
    setIsPolling(true);
    setPollingAttempts(0);
    
    const maxAttempts = 45;

    const interval = setInterval(async () => {
      setPollingAttempts(prev => prev + 1);
      const currentAttempts = pollingAttempts + 1;
      console.log(`📊 Poll attempt ${currentAttempts}/${maxAttempts}`);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/rides/${currentRide.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          const ride = data.data || data;
          
          console.log(`📊 Ride status: ${ride.status}`);
          
          if (ride.status === 'ACCEPTED' && ride.driver) {
            console.log('✅ Driver found via polling!');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            setPollingAttempts(0);
            
            const driver = ride.driver;
            const driverInfo: Driver = {
              id: driver.id || driver.driverId,
              name: driver.user?.name || driver.name || "Driver",
              phone: driver.user?.phone || driver.phone || "",
              vehicleNumber: driver.vehicleNumber || "N/A",
              vehicleType: driver.vehicleType || "MOTO",
              rating: driver.rating || 0,
              currentLat: driver.currentLat || pickupCoords?.lat || 0,
              currentLng: driver.currentLng || pickupCoords?.lng || 0,
              distance: 0,
              distanceText: "",
              eta: 0,
              etaText: "",
              isOnline: true,
              profilePhoto: driver.user?.profilePhoto || null,
            };
            
            if (pickupCoords) {
              const dist = calculateDistance(
                { lat: driverInfo.currentLat || 0, lng: driverInfo.currentLng || 0 },
                pickupCoords
              );
              driverInfo.distance = dist;
              driverInfo.distanceText = `${(dist / 1000).toFixed(1)} km`;
              driverInfo.eta = calculateETA(
                driverInfo.currentLat || 0,
                driverInfo.currentLng || 0,
                pickupCoords
              );
              driverInfo.etaText = `${Math.ceil(driverInfo.eta / 60)} min`;
            }
            
            setMatchedDriver(driverInfo);
            setStep("matched");
            setTripStatus("Driver Found");
            setIsSearching(false);
            startDriverTracking(driverInfo.id);
            
            toast.success(`✅ Driver ${driverInfo.name} accepted your ride!`);
          }
          
          if (ride.status === 'CANCELLED') {
            console.log('❌ Ride cancelled via polling');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            setPollingAttempts(0);
            handleCancelRide();
            toast.error("Ride was cancelled");
          }
          
          if (ride.status === 'STARTED') {
            console.log('🚗 Ride started via polling');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            setPollingAttempts(0);
            setStep("active");
            setTripStatus("Trip in Progress");
            setTripStartTime(new Date());
            setTripProgress(10);
            setArrivalNotified(false);
            toast.success("🟢 Trip started! Have a safe journey!");
          }
          
          if (ride.status === 'COMPLETED') {
            console.log('🎉 Ride completed via polling');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            setPollingAttempts(0);
            setStep("completed");
            setTripStatus("Trip Completed");
            setTripProgress(100);
            if (trackingInterval.current) clearInterval(trackingInterval.current);
            if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
            toast.success("🎉 Ride completed!");
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (currentAttempts >= maxAttempts) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsPolling(false);
        setPollingAttempts(0);
        if (step === "searching") {
          toast.error("No driver found. Please try again.");
          setStep("idle");
          setIsSearching(false);
        }
      }
    }, 2000);

    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsPolling(false);
        setPollingAttempts(0);
      }
    };
  }, [step, currentRide, pickupCoords]);

  // ─── Socket.IO Connection ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) return;

    let userId: string | null = null;
    let riderId: string | null = null;
    try {
      const user = JSON.parse(userStr);
      userId = user.id || null;
      riderId = user.riderId || user.id || null;
    } catch {
      userId = null;
    }
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Passenger Socket.IO connected:", socket.id);
      
      const rooms = [userId, `user_${userId}`, `user-${userId}`];
      if (riderId) {
        rooms.push(riderId, `rider_${riderId}`, `rider-${riderId}`);
      }
      
      for (const room of rooms) {
        if (room) {
          socket.emit("join", room);
        }
      }
      
      if (riderId) {
        socket.emit("join-rider", riderId);
      }
      
      // Request any pending ride updates
      if (currentRide?.id) {
        socket.emit("get-ride-status", { rideId: currentRide.id });
      }
    });

    // ─── Listen for ride accepted by driver ──────────────────────────
    socket.on("ride-accepted", (data: any) => {
      console.log("✅ Ride accepted by driver (socket):", data);
      
      // Stop polling if active
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        setIsPolling(false);
        setPollingAttempts(0);
      }
      
      const incomingDriver = data.driver || data;
      const matched: Driver = {
        id: incomingDriver.id || incomingDriver.driverId,
        name: incomingDriver.user?.name || incomingDriver.name || "Driver",
        phone: incomingDriver.user?.phone || incomingDriver.phone || "",
        vehicleNumber: incomingDriver.vehicleNumber || "N/A",
        vehicleType: incomingDriver.vehicleType || "MOTO",
        rating: incomingDriver.rating || 4.8,
        distance: incomingDriver.distance || 1500,
        distanceText: incomingDriver.distanceText || "1.5 km",
        eta: incomingDriver.eta || 300,
        etaText: incomingDriver.etaText || "5 min",
        isOnline: true,
        currentLat: incomingDriver.currentLat || pickupCoords?.lat,
        currentLng: incomingDriver.currentLng || pickupCoords?.lng,
      };
      setMatchedDriver(matched);
      setTripStatus("Driver Found");
      setStep("matched");
      toast.success(`🎉 Ride accepted by ${matched.name}!`);
      if (matched.id) {
        startDriverTracking(matched.id);
      }
    });

    socket.on("ride-started", (data: any) => {
      console.log("🚗 Ride started event received:", data);
      setStep("active");
      if (data.ride) setCurrentRide(data.ride);
      setTripStatus("Trip in Progress");
      setTripStartTime(new Date());
      setTripProgress(10);
      setArrivalNotified(false);
      toast.success("🟢 Trip Started! Have a safe journey!");
    });

    socket.on("ride-completed", (data: any) => {
      console.log("🎉 Ride completed event received:", data);
      setStep("completed");
      if (data.ride) setCurrentRide(data.ride);
      setTripStatus("Trip Completed");
      setTripProgress(100);
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      toast.success("🎉 Ride completed!");
    });

    socket.on("ride-cancelled", (data: any) => {
      console.log("❌ Ride cancelled event received:", data);
      handleCancelRide();
      toast.error("Ride was cancelled by the driver");
    });

    socket.on("driver-location-update", (data: any) => {
      console.log("📍 Driver location update:", data);
      if (matchedDriver && matchedDriver.id === data.driverId) {
        setMatchedDriver(prev => {
          if (!prev) return prev;
          const newDistance = calculateDistance(
            { lat: data.lat, lng: data.lng },
            pickupCoords || { lat: data.lat, lng: data.lng }
          );
          const newEta = calculateETA(data.lat, data.lng, pickupCoords || { lat: data.lat, lng: data.lng });
          return {
            ...prev,
            currentLat: data.lat,
            currentLng: data.lng,
            distance: newDistance,
            distanceText: `${(newDistance / 1000).toFixed(1)} km`,
            eta: newEta,
            etaText: `${Math.ceil(newEta / 60)} min`
          };
        });
      }
    });

    // ─── Listen for ride status updates ──────────────────────────────
    socket.on("ride-status-update", (data: any) => {
      console.log("📊 Ride status update:", data);
      if (data.status === 'ACCEPTED' && data.driver) {
        // Handle driver acceptance via status update
        const incomingDriver = data.driver;
        const matched: Driver = {
          id: incomingDriver.id || incomingDriver.driverId,
          name: incomingDriver.name || "Driver",
          phone: incomingDriver.phone || "",
          vehicleNumber: incomingDriver.vehicleNumber || "N/A",
          vehicleType: incomingDriver.vehicleType || "MOTO",
          rating: incomingDriver.rating || 4.8,
          distance: 1500,
          distanceText: "1.5 km",
          eta: 300,
          etaText: "5 min",
          isOnline: true,
          currentLat: incomingDriver.currentLat || pickupCoords?.lat,
          currentLng: incomingDriver.currentLng || pickupCoords?.lng,
        };
        setMatchedDriver(matched);
        setTripStatus("Driver Found");
        setStep("matched");
        toast.success(`✅ Driver ${matched.name} accepted your ride!`);
        if (matched.id) {
          startDriverTracking(matched.id);
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket.IO disconnected");
    });

    socket.on("reconnect", () => {
      console.log("🟢 Socket.IO reconnected");
      if (userId) {
        socket.emit("join", userId);
        socket.emit("join", `user_${userId}`);
        if (riderId) {
          socket.emit("join-rider", riderId);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [isAuthenticated, pickupCoords, matchedDriver, startDriverTracking, currentRide]);

  // ─── Searching Timeout (90 seconds) ──────────────────────────────
  useEffect(() => {
    if (step !== "searching") return;
    
    setSearchSeconds(0);
    
    const timer = setInterval(() => {
      setSearchSeconds((prev) => {
        const current = prev + 1;
        
        // Show notifications at intervals
        if (current === 15) {
          toast('Still looking for drivers nearby...', { 
            duration: 3000,
            icon: '⏳'
          });
        }
        if (current === 30) {
          toast('Expanding search radius...', { 
            duration: 3000,
            icon: '🔍'
          });
        }
        if (current === 45) {
          toast('⚠️ Taking longer than usual. Drivers may be busy.', { 
            duration: 4000,
            icon: '⚠️'
          });
        }
        if (current === 60) {
          toast('⏳ Still searching... Drivers are being notified.', { 
            duration: 4000,
            icon: '🚗'
          });
        }
        
        return current;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      if (step === "searching") {
        const onlineCount = nearbyDrivers.filter(d => d.isOnline).length;
        
        if (onlineCount === 0) {
          setError("No drivers are currently online in your area. Please try again later.");
          toast.error("No drivers available nearby");
        } else {
          setError(`We found ${onlineCount} drivers nearby, but none could accept your ride. Please try again.`);
          toast.error(`No drivers accepted your request`);
        }
        
        setStep("idle");
        clearInterval(timer);
        setIsSearching(false);
      }
    }, 90000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [step, nearbyDrivers]);

  // ─── SOS Countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (sosCountdown > 0) {
      const timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sosCountdown === 0 && sosTriggered) {
      window.location.href = "tel:112";
      setShowSOS(false);
      setSosTriggered(false);
    }
  }, [sosCountdown, sosTriggered]);

  // ─── Fare Calculation ─────────────────────────────────────────────
  const calculateFare = () => {
    const rt = RIDE_TYPES.find((r) => r.id === rideType)!;
    const distance = routeInfo?.distance || 2500;
    const distanceKm = distance / 1000;
    return Math.round(rt.base + distanceKm * rt.perKm);
  };

  // ─── Handle Place Select ──────────────────────────────────────────
  const handleSelectPlace = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setDestination(address);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setDestinationCoords({ lat, lng });
      setStep("form");
    } catch (error) {
      console.error("Error getting coordinates:", error);
      setError("Could not find location. Please try again.");
      toast.error("Location not found");
    }
  };

  // ─── Request Ride ──────────────────────────────────────────────────
  const handleRequestRide = async () => {
    if (!destination.trim()) {
      setError("Please enter a destination");
      toast.error("Destination required");
      return;
    }

    if (!pickupCoords) {
      setError("Unable to get your location. Please enable GPS.");
      toast.error("Location unavailable");
      return;
    }

    setLoading(true);
    setError("");
    setIsSearching(true);

    try {
      const token = localStorage.getItem("token");
      const selectedRide = RIDE_TYPES.find(r => r.id === rideType);
      
      const rideData: RideRequest = {
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        dropoffLat: destinationCoords?.lat || -1.9876,
        dropoffLng: destinationCoords?.lng || 30.1011,
        dropoffAddress: destination,
        rideType: selectedRide?.vehicleType || "MOTO",
        fare: calculateFare(),
        paymentMethod: paymentMethod,
        pickupAddress: pickup,
        distance: routeInfo ? routeInfo.distance / 1000 : undefined,
        duration: routeInfo ? Math.round(routeInfo.duration / 60) : undefined,
      };

      console.log("📤 Sending ride request:", rideData);

      const response = await fetch(`${API_URL}/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(rideData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request ride");
      }

      const data = await response.json();
      console.log("📥 Ride response:", data);
      
      setCurrentRide(data.data);
      setStep("searching");
      setSearchSeconds(0);
      setRideRequested(true);
      setTripStatus("Searching for Driver");
      toast.success("🔍 Searching for a driver...");
    } catch (err) {
      console.error("❌ Ride request error:", err);
      setError(err instanceof Error ? err.message : "Failed to request ride");
      toast.error(err instanceof Error ? err.message : "Failed to request ride");
      setIsSearching(false);
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel Ride ──────────────────────────────────────────────────
  const handleCancelRide = async () => {
    if (currentRide?.id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/rides/${currentRide.id}/cancel`, {
          method: "PUT",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (err) {
        console.error("Failed to cancel ride:", err);
      }
    }

    setStep("idle");
    setMatchedDriver(null);
    setCurrentRide(null);
    setDestination("");
    setDirections(null);
    setIsSearching(false);
    setRideRequested(false);
    setTripStatus("");
    setRemainingDistance(0);
    setRemainingTime(0);
    setTripProgress(0);
    setDistanceTravelled(0);
    setElapsedTime(0);
    setTripStartTime(null);
    setArrivalNotified(false);
    setTrafficUpdate("");

    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setIsPolling(false);
      setPollingAttempts(0);
    }
    toast.success("Ride cancelled");
  };

  // ── Contact Driver ───────────────────────────────────────────────
  const handleCallDriver = () => {
    if (matchedDriver?.phone) {
      window.location.href = `tel:${matchedDriver.phone}`;
    }
  };

  // ── Share Trip ───────────────────────────────────────────────────
  const handleShareTrip = () => {
    if (navigator.share && currentRide) {
      navigator.share({
        title: 'MotoBus Trip',
        text: `${userName} is travelling.\nPickup: ${pickup}\nDestination: ${destination}\nETA: ${Math.ceil(remainingTime / 60)} min\nTrip ID: ${currentRide.id}\nDriver: ${matchedDriver?.name}\nVehicle: ${matchedDriver?.vehicleNumber}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      const tripDetails = `MotoBus Trip Details:\nPassenger: ${userName}\nDriver: ${matchedDriver?.name}\nVehicle: ${matchedDriver?.vehicleNumber}\nFrom: ${pickup}\nTo: ${destination}\nETA: ${Math.ceil(remainingTime / 60)} min\nTrip ID: ${currentRide?.id}`;
      navigator.clipboard.writeText(tripDetails).then(() => {
        toast.success("Trip details copied to clipboard!");
      }).catch(console.error);
    }
  };

  // ── SOS Functions ─────────────────────────────────────────────────
  const handleSOSTrigger = () => {
    if (sosTriggered) return;
    setShowSOS(true);
    setSosCountdown(5);
    setSosTriggered(true);

    try {
      const token = localStorage.getItem("token");
      const currentLocation = location || defaultCenter;
      fetch(`${API_URL}/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          rideId: currentRide?.id || null,
          message: "Emergency SOS triggered from MotoBus app",
          driverId: matchedDriver?.id || null,
          driverName: matchedDriver?.name || null,
          vehicleNumber: matchedDriver?.vehicleNumber || null,
        }),
      }).catch(console.error);
      toast.success("🚨 SOS alert sent! Emergency services notified.");
    } catch (error) {
      console.error("Failed to send SOS:", error);
      toast.error("Failed to send SOS alert");
    }
  };

  const handleSOSCancel = () => {
    setShowSOS(false);
    setSosTriggered(false);
    setSosCountdown(0);
  };

  const handleContactCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
    setShowSOS(false);
  };

  const useGoogleMaps = isLoaded && !loadError && !mapLoadError && GOOGLE_MAPS_API_KEY;
  const selectedRide = RIDE_TYPES.find(r => r.id === rideType);

  // ─── Error: Map Loading ──────────────────────────────────────────
  if (loadError || mapLoadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C09] p-4">
        <div className="bg-[#111714] border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2">Map Loading Error</h2>
          <p className="text-gray-400 text-sm mb-4">
            {loadError?.message || mapLoadError || "Failed to load Google Maps"}
          </p>
          <div className="bg-[#0A0E0B] rounded-xl p-4 text-left text-xs text-gray-500 font-mono">
            <p>API Key: {GOOGLE_MAPS_API_KEY ? "✅ Set" : "❌ Missing"}</p>
            <p>Status: {isLoaded ? "✅ Loaded" : "⏳ Loading"}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C09]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#080C09] text-white pb-20">
      {/* ── MAP ── */}
      <div className="relative flex-1 min-h-0">
        {useGoogleMaps && location ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={pickupCoords || location}
            zoom={14}
            onLoad={(map) => {
              mapRef.current = map;
              directionsService.current = new (window as any).google.maps.DirectionsService();
            }}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#1A2E1A" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2A3E2A" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#0D1B2A" }] },
              ],
            }}
          >
            {/* Pickup Marker */}
            {pickupCoords && (
              <Marker
                position={pickupCoords}
                icon={{
                  path: (window as any).google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: "#00C26F",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Destination Marker */}
            {destinationCoords && (
              <Marker
                position={destinationCoords}
                icon={{
                  path: (window as any).google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: "#FF6B35",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Nearby Drivers */}
            {drivers.map((driver) => (
              driver.currentLat && driver.currentLng && (
                <Marker
                  key={driver.id}
                  position={{ lat: driver.currentLat, lng: driver.currentLng }}
                  onClick={() => {
                    setSelectedDriver(driver);
                    setShowDriverInfo(true);
                  }}
                  icon={{
                    url: driver.vehicleType === "MINIBUS" || driver.vehicleType === "BUS"
                      ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%234280F5' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='18' y='22' text-anchor='middle' font-size='16' fill='%23000000'%3E🚌%3C/text%3E%3C/svg%3E"
                      : driver.vehicleType === "CAR"
                      ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%238184F8' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='18' y='22' text-anchor='middle' font-size='16' fill='%23000000'%3E🚗%3C/text%3E%3C/svg%3E"
                      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%2300C26F' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='18' y='22' text-anchor='middle' font-size='16' fill='%23000000'%3E🏍️%3C/text%3E%3C/svg%3E",
                    scaledSize: new (window as any). google.maps.Size(36, 36),
                  }}
                />
              )
            ))}

            {/* Matched Driver */}
            {matchedDriver && matchedDriver.currentLat && matchedDriver.currentLng && (
              <Marker
                position={{ lat: matchedDriver.currentLat, lng: matchedDriver.currentLng }}
                icon={{
                  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Ccircle cx='28' cy='28' r='26' fill='%23FF6B35' stroke='%23FFFFFF' stroke-width='3'/%3E%3Ctext x='28' y='33' text-anchor='middle' font-size='22' fill='%23000000'%3E⭐%3C/text%3E%3C/svg%3E",
                  scaledSize: new google.maps.Size(56, 56),
                }}
              />
            )}

            {/* Directions */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: "#00C26F", strokeWeight: 5, strokeOpacity: 0.8 },
                  suppressMarkers: true,
                }}
              />
            )}

            {/* Driver Info Window */}
            {showDriverInfo && selectedDriver && (
              <InfoWindow
                position={{
                  lat: selectedDriver.currentLat || 0,
                  lng: selectedDriver.currentLng || 0
                }}
                onCloseClick={() => {
                  setShowDriverInfo(false);
                  setSelectedDriver(null);
                }}
              >
                <div className="bg-[#0A0E0B] text-white p-3 rounded-lg max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
                      {selectedDriver.vehicleType === "MINIBUS" || selectedDriver.vehicleType === "BUS" ? "🚌" :
                       selectedDriver.vehicleType === "CAR" ? "🚗" : "🏍️"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedDriver.name}</p>
                      <p className="text-xs text-gray-400">{selectedDriver.vehicleNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div><p className="text-gray-400">Rating</p><p className="font-medium text-yellow-400">{selectedDriver.rating} ★</p></div>
                    <div><p className="text-gray-400">Distance</p><p className="font-medium text-green-400">{selectedDriver.distanceText}</p></div>
                    <div><p className="text-gray-400">ETA</p><p className="font-medium text-blue-400">{selectedDriver.etaText}</p></div>
                    <div><p className="text-gray-400">Status</p><p className={`font-medium ${selectedDriver.isOnline ? 'text-green-400' : 'text-red-400'}`}>{selectedDriver.isOnline ? 'Online' : 'Offline'}</p></div>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Search Radius */}
            {pickupCoords && (
              <Circle
                center={pickupCoords}
                radius={3000}
                options={{
                  fillColor: "#00C26F",
                  fillOpacity: 0.05,
                  strokeColor: "#00C26F",
                  strokeOpacity: 0.2,
                  strokeWeight: 1,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-[#0D1510] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-400 text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* ─── SOS BUTTON ────────────────────────────────────────────── */}
        {!showSOS ? (
          <button
            onClick={handleSOSTrigger}
            className="absolute top-4 right-4 z-20 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 bg-red-600 text-white border-2 border-red-400 animate-pulse"
          >
            <span className="text-lg">🆘</span>
            <span className="text-[8px] font-bold uppercase tracking-wider">SOS</span>
          </button>
        ) : (
          <div className="absolute top-4 right-4 z-20 w-72 bg-[#111714] border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🆘</span>
                <span className="font-bold text-white">Emergency SOS</span>
              </div>
              <button onClick={handleSOSCancel} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Calling emergency in...</span>
                <span className="text-2xl font-bold text-red-500">{sosCountdown}s</span>
              </div>
              <div className="w-full h-1.5 bg-red-500/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${(sosCountdown / 5) * 100}%` }} />
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">Emergency Contacts</p>
              {sosContacts.map((contact, index) => (
                <button
                  key={index}
                  onClick={() => handleContactCall(contact.phone)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0A0E0B] transition group"
                >
                  <span className="text-xl">{contact.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white group-hover:text-green-500 transition">{contact.name}</p>
                    <p className="text-xs text-gray-400">{contact.phone}</p>
                  </div>
                  <span className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition">Call →</span>
                </button>
              ))}
            </div>
            <div className="px-3 pb-3">
              <button onClick={handleSOSCancel} className="w-full py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-semibold text-sm hover:bg-red-500/20 transition">Cancel SOS</button>
            </div>
          </div>
        )}

        {/* ─── DRIVERS NEARBY ───────────────────────────────────────── */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#0A0E0B]/85 backdrop-blur-sm text-green-500 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
          {drivers.filter(d => d.isOnline).length} drivers nearby
        </div>

        {/* ─── SEARCHING OVERLAY ────────────────────────────────────── */}
        {step === "searching" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 bg-green-500/10 border border-green-500/20 animate-pulse-dot">
                  {RIDE_TYPES.find(r => r.id === rideType)?.icon || "🚗"}
                </div>
                <p className="font-semibold text-lg mb-1">Finding your {RIDE_TYPES.find(r => r.id === rideType)?.label} driver…</p>
                <p className="text-sm mb-2 text-gray-400">Searching nearby • {searchSeconds}s</p>
                
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="text-gray-400">👤 Drivers nearby:</span>
                  <span className="text-green-400 font-semibold">{nearbyDrivers.filter(d => d.isOnline).length} online</span>
                  {nearbyDrivers.filter(d => d.isOnline).length > 0 && (
                    <span className="text-gray-500 text-[10px]">(waiting for one to accept)</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPolling ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-gray-400">{isPolling ? '🔍 Checking for drivers...' : '⏳ Waiting...'}</span>
                  {isPolling && (
                    <span className="text-gray-500 text-[10px]">({pollingAttempts}/45)</span>
                  )}
                </div>
                
                <div className="flex gap-1.5 mb-4">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-green-500" style={{ animation: `pulse-dot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
                
                <div className="w-full space-y-2 mb-4">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl text-sm bg-[#141C15] border border-[#1A1E1C]">
                    <span className="text-gray-400">To: {destination}</span>
                    <span className="text-green-500 font-semibold">RWF {calculateFare().toLocaleString()}</span>
                  </div>
                  
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Searching</span>
                      <span>{searchSeconds}s / 90s</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((searchSeconds / 90) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full">
                  <button
                    className="flex-1 text-sm px-4 py-2 rounded-xl transition-all bg-orange-500/10 border border-orange-500/15 text-orange-500 hover:bg-orange-500/20"
                    onClick={handleCancelRide}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 text-sm px-4 py-2 rounded-xl transition-all bg-blue-500/10 border border-blue-500/15 text-blue-500 hover:bg-blue-500/20"
                    onClick={() => {
                      if (location) {
                        fetchNearbyDrivers(location);
                        toast('🔄 Refreshing nearby drivers...', { icon: '🔄' });
                      }
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MATCHED DRIVER OVERLAY ────────────────────────────────── */}
        {step === "matched" && matchedDriver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-[#111714] border border-green-500/30 rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl border-2 border-green-500/30">
                  {matchedDriver.name?.charAt(0)?.toUpperCase() || "🚗"}
                </div>
                <div>
                  <p className="font-bold text-lg text-green-500">Driver Found! ✅</p>
                  <p className="font-semibold text-white">{matchedDriver.name}</p>
                  <p className="text-xs text-gray-400">{matchedDriver.vehicleType} • {matchedDriver.vehicleNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-[#0A0E0B] rounded-lg">
                  <p className="text-xs text-gray-400">ETA</p>
                  <p className="font-bold text-blue-400">{matchedDriver.etaText}</p>
                </div>
                <div className="text-center p-2 bg-[#0A0E0B] rounded-lg">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="font-bold text-yellow-400">{matchedDriver.rating} ★</p>
                </div>
                <div className="text-center p-2 bg-[#0A0E0B] rounded-lg">
                  <p className="text-xs text-gray-400">Distance</p>
                  <p className="font-bold text-green-400">{matchedDriver.distanceText}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleCallDriver} className="flex-1 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition text-sm">📞 Call</button>
                <button onClick={handleShareTrip} className="flex-1 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition text-sm">🔗 Share</button>
                <button onClick={handleCancelRide} className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TRIP STATUS ──────────────────────────────────────────── */}
        {tripStatus && step !== "searching" && step !== "matched" && (
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 rounded-full text-xs font-medium animate-pulse-dot ${
            tripStatus === "Trip in Progress" ? "bg-green-500/20 border border-green-500/30 text-green-500" :
            tripStatus === "Trip Completed" ? "bg-green-500/20 border border-green-500/30 text-green-500" :
            "bg-gray-500/20 border border-gray-500/30 text-gray-400"
          }`}>
            {tripStatus === "Trip in Progress" && "🟢 "}
            {tripStatus === "Trip Completed" && "🎉 "}
            {tripStatus}
          </div>
        )}

        {/* ─── REMAINING TRIP INFO ──────────────────────────────────── */}
        {(step === "active" || step === "matched") && (
          <div className="absolute bottom-16 left-4 z-10 bg-[#0A0E0B]/90 backdrop-blur-sm rounded-xl p-3 border border-gray-700 max-w-[200px]">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-gray-400">Remaining:</span>
            </div>
            <div className="flex justify-between text-sm font-medium mt-1">
              <span>{(remainingDistance / 1000).toFixed(1)} km</span>
              <span>{Math.ceil(remainingTime / 60)} min</span>
            </div>
          </div>
        )}

        {/* ─── TRIP PROGRESS ON MAP ─────────────────────────────────── */}
        {(step === "active" || step === "matched") && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <TripProgress 
              percentage={tripProgress}
              status={tripStatus}
              driverName={matchedDriver?.name}
              vehicleNumber={matchedDriver?.vehicleNumber}
              etaText={matchedDriver?.etaText}
            />
          </div>
        )}

        {/* ─── TRAFFIC UPDATE ───────────────────────────────────────── */}
        {trafficUpdate && (
          <div className="absolute top-20 left-4 right-4 z-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-xs animate-slide-up">
            <p className="flex items-center gap-2">🚦 {trafficUpdate}</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 animate-slide-up overflow-y-auto rounded-t-2xl bg-[#0A0E0B]/97 backdrop-blur-md border border-[#1A1E1C] border-b-0 max-h-[62vh] p-4 pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
        {step === "idle" && (
          <>
            <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-xl text-center">
              <p className="text-xs text-green-400 font-medium">🚀 Book any ride in seconds — <span className="text-white">Moto</span>, <span className="text-white">Car</span>, or <span className="text-white">Bus</span></p>
            </div>

            <div className="relative mb-5">
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#141C15] border border-[#1A1E1C] focus-within:border-green-500/50 transition">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#00C26F" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-400"
                  placeholder="Where are you going?"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (e.target.value.trim()) setStep("form");
                  }}
                  onFocus={() => setStep("form")}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">⚠️ {error}</div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#141C15] rounded-xl p-2 text-center border border-gray-800">
                <div className="text-green-500 font-bold text-lg">{drivers.filter(d => d.isOnline).length}</div>
                <div className="text-[10px] text-gray-400">Drivers Near</div>
              </div>
              <div className="bg-[#141C15] rounded-xl p-2 text-center border border-gray-800">
                <div className="text-green-500 font-bold text-lg">4</div>
                <div className="text-[10px] text-gray-400">Vehicle Types</div>
              </div>
              <div className="bg-[#141C15] rounded-xl p-2 text-center border border-gray-800">
                <div className="text-green-500 font-bold text-lg">4</div>
                <div className="text-[10px] text-gray-400">Payment Methods</div>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Choose your ride</p>
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {RIDE_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => { setRideType(rt.id); setStep("form"); }}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${
                    rideType === rt.id ? "bg-green-500/10 border border-green-500/30" : "bg-[#141C15] border border-[#1A1E1C]"
                  }`}
                >
                  <span className="text-xl">{rt.icon}</span>
                  <span className="text-[10px] font-semibold">{rt.label}</span>
                  <span className="text-[8px] text-gray-400">{rt.capacity}</span>
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Quick destinations</p>
            {RECENT_PLACES.map((p) => (
              <button
                key={p.label}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl mb-1 transition-all text-left border border-transparent hover:bg-[#141C15]"
                onClick={() => {
                  setDestination(p.label);
                  setDestinationCoords({ lat: p.lat, lng: p.lng });
                  setValue(p.label, false);
                  setStep("form");
                }}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-[#141C15]">{p.icon}</span>
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.sub}</p>
                </div>
                <span className="ml-auto text-xs text-green-500 opacity-50">→</span>
              </button>
            ))}
          </>
        )}

        {step === "form" && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => { setStep("idle"); setError(""); }} className="text-gray-400 hover:text-white">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h3 className="font-semibold">Confirm your ride</h3>
              <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                {RIDE_TYPES.find(r => r.id === rideType)?.speed}
              </span>
            </div>

            {status === "OK" && (
              <div className="mb-3 bg-[#141C15] border border-[#1A1E1C] rounded-xl z-20 max-h-40 overflow-y-auto">
                {data.map(({ place_id, description }) => (
                  <button
                    key={place_id}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-green-500/10 transition"
                    onClick={() => handleSelectPlace(description)}
                  >
                    {description}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">⚠️ {error}</div>
            )}

            <div className="space-y-2 mb-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-500" />
                <input
                  className="w-full px-4 py-3 pl-9 bg-[#141C15] border border-[#1A1E1C] rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
                  placeholder="Pickup location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-500" />
                <input
                  className="w-full px-4 py-3 pl-9 bg-[#141C15] border border-[#1A1E1C] rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
                  placeholder="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {routeInfo && (
              <div className="flex items-center justify-between px-4 py-2 mb-4 bg-[#141C15] rounded-xl border border-gray-800">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">Distance: <span className="text-white font-medium">{routeInfo.distanceText}</span></span>
                  <span className="text-gray-400">Time: <span className="text-white font-medium">{routeInfo.durationText}</span></span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 p-2.5 bg-[#141C15] rounded-xl border border-gray-800">
              <span className="text-2xl">{selectedRide?.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedRide?.label}</p>
                <p className="text-xs text-gray-400">{selectedRide?.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-500">{selectedRide?.speed}</p>
                <p className="text-[10px] text-gray-400">{selectedRide?.capacity}</p>
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment</p>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    paymentMethod === pm.id ? "bg-green-500/10 border border-green-500/30 text-green-500" : "bg-[#141C15] border border-[#1A1E1C] text-gray-400"
                  }`}
                >
                  <span>{pm.icon}</span> {pm.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 bg-green-500/5 border border-green-500/15">
              <div>
                <span className="text-sm text-gray-400">Estimated fare</span>
                <p className="text-xs text-gray-500">{routeInfo ? routeInfo.distanceText : `${2500 / 1000} km`} • {routeInfo ? ` ${routeInfo.durationText}` : ` ~${Math.ceil(2500 / 1000 / 15 * 60)} min`}</p>
              </div>
              <span className="font-bold text-xl text-green-500">RWF {calculateFare().toLocaleString()}</span>
            </div>

            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-400 text-black font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              disabled={loading || !destination.trim()}
              onClick={handleRequestRide}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Finding nearest driver...
                </>
              ) : (
                <>
                  <span>{selectedRide?.icon}</span>
                  Book {selectedRide?.label} — RWF {calculateFare().toLocaleString()}
                </>
              )}
            </button>
          </>
        )}

        {/* ─── ACTIVE RIDE ────────────────────────────────────────────── */}
        {step === "active" && currentRide && matchedDriver && (
          <div className="space-y-4">
            <DriverInfoCard driver={matchedDriver} onCall={handleCallDriver} onSOS={handleSOSTrigger} onShare={handleShareTrip} />
            <TripProgress percentage={tripProgress} status={tripStatus} driverName={matchedDriver?.name} vehicleNumber={matchedDriver?.vehicleNumber} etaText={matchedDriver?.etaText} />
            <LiveStats distanceTravelled={distanceTravelled} remainingDistance={remainingDistance / 1000} remainingTime={remainingTime} fare={calculateFare()} elapsedTime={elapsedTime} totalDistance={totalDistance} />
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#141C15] border border-[#1A1E1C]">
                <p className="text-xs text-gray-400">From</p>
                <p className="text-sm font-medium text-green-400">📍 {pickup}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141C15] border border-[#1A1E1C]">
                <p className="text-xs text-gray-400">To</p>
                <p className="text-sm font-medium text-orange-400">📍 {destination}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCallDriver} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#141C15] border border-[#1A1E1C] text-gray-400 hover:border-green-500/30 hover:text-white">📞 Contact Driver</button>
              <button onClick={handleShareTrip} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-[#141C15] border border-[#1A1E1C] text-gray-400 hover:border-blue-500/30 hover:text-white">🔗 Share Trip</button>
              <button onClick={handleCancelRide} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-orange-500/10 border border-orange-500/15 text-orange-500 hover:bg-orange-500/20">Cancel</button>
            </div>

            {remainingDistance < 200 && remainingDistance > 0 && !arrivalNotified && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center animate-pulse">
                <p className="text-lg">📍 Almost there!</p>
                <p className="text-sm text-green-400">{Math.round(remainingDistance)} meters remaining</p>
              </div>
            )}
          </div>
        )}

        {/* ─── COMPLETED RIDE ──────────────────────────────────────────── */}
        {step === "completed" && currentRide && (
          <div className="space-y-4 text-center py-4">
            <div className="text-6xl mb-2">🎉</div>
            <h3 className="text-2xl font-bold">Trip Completed!</h3>
            <p className="text-gray-400 text-sm">Thank you for riding with Moto-Bus Tracker</p>
            
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/15">
              <span className="text-gray-400">Total Fare</span>
              <span className="font-bold text-green-500 text-lg">RWF {currentRide.fare?.toLocaleString() || calculateFare().toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 transition">Rate Driver ⭐</button>
              <button
                onClick={() => { 
                  setStep("idle"); 
                  setCurrentRide(null); 
                  setDestination(""); 
                  setDestinationCoords(null); 
                  setDirections(null); 
                  setRouteInfo(null);
                  setTripProgress(0);
                  setDistanceTravelled(0);
                  setElapsedTime(0);
                  setTripStartTime(null);
                  setArrivalNotified(false);
                  setTrafficUpdate("");
                }}
                className="py-3 rounded-xl bg-[#141C15] border border-gray-700 text-gray-300 hover:border-green-500/30 transition"
              >
                Book Another →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E0B]/97 backdrop-blur-xl border-t border-[#1A1E1C] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <Link href="/passenger" className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative text-green-500">
            <span className="absolute top-0 w-8 h-0.5 rounded-b-full bg-green-500" />
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] tracking-wider font-semibold">Ride</span>
          </Link>
          <Link href="/passenger/history" className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative text-gray-400 hover:text-white">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 8v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.05 11a9 9 0 1 0 .5-4" strokeLinecap="round" />
              <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] tracking-wider font-normal">History</span>
          </Link>
          <Link href="/passenger/wallet" className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative text-gray-400 hover:text-white">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="2" y="6" width="20" height="14" rx="3" />
              <path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0" fill="currentColor" />
              <path d="M2 10h20" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] tracking-wider font-normal">Wallet</span>
          </Link>
          <Link href="/passenger/profile" className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative text-gray-400 hover:text-white">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] tracking-wider font-normal">Profile</span>
          </Link>
        </div>
      </nav>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}
