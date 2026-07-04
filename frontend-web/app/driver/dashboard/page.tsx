// app/driver/dashboard/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  RefreshCw,
  MapPin,
  DollarSign,
  Star,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  User,
  Clock,
  Navigation,
  Play,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");

interface RideRequest {
  id: string;
  riderName?: string;
  riderPhone?: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  distance: string;
  status?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  createdAt?: string;
}

interface Earnings {
  today: { amount: number; trips: number };
  week: { amount: number; trips: number };
  month?: { amount: number; trips: number };
}

export default function DriverDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [earnings, setEarnings] = useState<Earnings>({
    today: { amount: 0, trips: 0 },
    week: { amount: 0, trips: 0 },
    month: { amount: 0, trips: 0 }
  });
  const [totalTrips, setTotalTrips] = useState(0);
  const [rating, setRating] = useState(0);
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState({
    number: "",
    model: "",
    type: "",
  });
  const [acceptedRideId, setAcceptedRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState("");
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isCompletingTrip, setIsCompletingTrip] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Get Driver Info from localStorage ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    console.log('🔍 Driver Dashboard - User Data:', userData);
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('👤 Driver Dashboard - Parsed User:', user);
        
        if (user.role?.toUpperCase() !== "DRIVER") {
          console.error('❌ User is not a driver, role:', user.role);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push("/login");
          return;
        }
        
        setDriverName(user.name || "Driver");
        setUserId(user.id);
        
        if (user.driverId) {
          setDriverId(user.driverId);
          console.log('🚗 Driver ID:', user.driverId);
        }
        
        if (user.isApproved !== undefined) {
          setIsApproved(user.isApproved);
          console.log('✅ Is Approved:', user.isApproved);
        }
        
        if (user.vehicle) {
          setVehicleInfo({
            number: user.vehicle.number || "N/A",
            model: user.vehicle.model || "N/A",
            type: user.vehicle.type || "N/A",
          });
          console.log('🚗 Vehicle:', user.vehicle);
        }
        
        if (user.totalTrips !== undefined) {
          setTotalTrips(user.totalTrips);
        }
        if (user.rating !== undefined) {
          setRating(user.rating);
        }
        
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('user');
        router.push("/login");
        return;
      }
    } else {
      console.error('❌ No user data found');
      router.push("/login");
      return;
    }

    fetchDriverData();
    setupLocationTracking();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router]);

  // ─── Setup Socket Connection ───────────────────────────────────────
  const setupSocketConnection = useCallback(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    console.log('🔌 Setting up socket connection...');
    
    if (!token || !userData) {
      console.log('❌ No token or user data');
      return;
    }

    let userIdValue: string | null = null;
    let driverIdValue: string | null = null;
    let driverUserId: string | null = null;
    
    try {
      const user = JSON.parse(userData);
      userIdValue = user.id || null;
      driverIdValue = user.driverId || null;
      driverUserId = user.id || null;
      console.log('👤 User ID:', userIdValue);
      console.log('🚗 Driver ID:', driverIdValue);
    } catch {
      console.log('❌ Failed to parse user data');
      return;
    }

    if (!userIdValue) {
      console.log('❌ No user ID');
      return;
    }

    if (socketRef.current) {
      console.log('🔌 Disconnecting existing socket');
      socketRef.current.disconnect();
    }

    import('socket.io-client').then(({ io }) => {
      console.log('🔌 Connecting to socket:', SOCKET_URL);
      
      const socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🟢 Driver socket connected:", socket.id);
        console.log("👤 User ID:", userIdValue);
        console.log("🚗 Driver ID:", driverIdValue);
        setSocketConnected(true);
        
        // ─── JOIN ALL POSSIBLE ROOMS ───────────────────────────────
        // IMPORTANT: Join user room (this is where ride requests are sent)
        socket.emit("join", userIdValue);
        console.log("👤 Joined user room:", userIdValue);
        
        socket.emit("join", `user_${userIdValue}`);
        socket.emit("join", `user-${userIdValue}`);
        console.log("👤 Joined user rooms: user_${userIdValue}, user-${userIdValue}");
        
        // Also join driver rooms
        if (driverIdValue) {
          socket.emit("join", driverIdValue);
          socket.emit("join", `driver_${driverIdValue}`);
          socket.emit("join", `driver-${driverIdValue}`);
          console.log("🚗 Joined driver rooms:", driverIdValue, `driver_${driverIdValue}`, `driver-${driverIdValue}`);
          
          // Also emit join-driver event for compatibility
          socket.emit("join-driver", driverIdValue);
          console.log("🚗 Joined driver via join-driver:", driverIdValue);
          
          setDriverId(driverIdValue);
        }
        
        // ─── EMIT THAT DRIVER IS ONLINE ────────────────────────────
        if (isOnline) {
          socket.emit("driver-online", { 
            driverId: driverIdValue || userIdValue,
            userId: userIdValue,
            isOnline: true
          });
          console.log("📤 Emitted driver-online event");
        }
        
        // ─── REQUEST PENDING RIDE REQUESTS ──────────────────────────
        // Ask server for any pending ride requests
        socket.emit("get-pending-rides", { 
          driverId: driverIdValue || userIdValue 
        });
        console.log("📤 Requested pending rides");
      });

      // ─── Listen for pending rides response ──────────────────────────
      socket.on("pending-rides", (data: any) => {
        console.log("📋 Pending rides received:", data);
        if (data.rides && data.rides.length > 0) {
          const newRides = data.rides.map((ride: any) => ({
            id: ride.id,
            riderName: ride.riderName || ride.rider?.name || "Rider",
            riderPhone: ride.riderPhone || ride.rider?.phone || "",
            pickupAddress: ride.pickupAddress || "Unknown location",
            dropoffAddress: ride.dropoffAddress || "Unknown destination",
            fare: ride.fare || 0,
            distance: ride.distance ? `${ride.distance.toFixed(1)} km` : "0 km",
            status: ride.status || "PENDING",
            pickupLat: ride.pickupLat,
            pickupLng: ride.pickupLng,
            dropoffLat: ride.dropoffLat,
            dropoffLng: ride.dropoffLng,
            createdAt: ride.createdAt,
          }));
          setRideRequests(prev => {
            const existing = new Set(prev.map(r => r.id));
            const filtered = newRides.filter((r: any) => !existing.has(r.id));
            return [...prev, ...filtered];
          });
          if (newRides.length > 0) {
            toast.success(`📋 ${newRides.length} pending ride(s) available!`);
          }
        }
      });

      // ─── Listen for new ride requests ──────────────────────────────
      socket.on("new-ride-request", (data: any) => {
        console.log("🔔 New ride request received:", data);
        console.log("📊 Driver status - Online:", isOnline, "Approved:", isApproved);
        
        // Check if this ride is for this driver or all drivers
        if (isOnline && isApproved) {
          const newRide: RideRequest = {
            id: data.id,
            riderName: data.riderName || data.rider?.name || "Rider",
            riderPhone: data.riderPhone || data.rider?.phone || "",
            pickupAddress: data.pickupAddress || "Unknown location",
            dropoffAddress: data.dropoffAddress || "Unknown destination",
            fare: data.fare || 0,
            distance: data.distance || "0 km",
            status: data.status || "PENDING",
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            dropoffLat: data.dropoffLat,
            dropoffLng: data.dropoffLng,
            createdAt: data.createdAt,
          };
          
          setRideRequests(prev => {
            // Check if ride already exists
            const exists = prev.some(r => r.id === newRide.id);
            if (exists) return prev;
            return [newRide, ...prev];
          });
          
          // Play notification sound
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {});
          } catch {}
          
          toast.success(`🔔 New ride request from ${newRide.riderName}!`, {
            duration: 8000,
            icon: '🚗',
          });
        } else {
          console.log("⚠️ Driver not available to accept rides - Online:", isOnline, "Approved:", isApproved);
        }
      });

      // ─── Listen for ride accepted by other driver ──────────────────
      socket.on("ride-accepted-by-other", (data: any) => {
        console.log("📢 Ride accepted by other driver:", data);
        setRideRequests(prev => prev.filter(r => r.id !== data.rideId));
        toast(`Ride was accepted by another driver`, { icon: 'ℹ️' });
      });

      // ─── Listen for ride cancelled ──────────────────────────────────
      socket.on("ride-cancelled", (data: any) => {
        console.log("❌ Ride cancelled:", data);
        setRideRequests(prev => prev.filter(r => r.id !== data.rideId));
        if (activeRide?.id === data.rideId) {
          setActiveRide(null);
          setRideStatus('');
          toast("Ride was cancelled by the rider", { icon: 'ℹ️' });
        }
      });

      // ─── Listen for ride started confirmation ───────────────────────
      socket.on("ride-started-confirmation", (data: any) => {
        console.log("✅ Ride started confirmation:", data);
        setRideStatus('Trip in Progress');
        toast.success("🚗 Trip started!");
      });

      // ─── Listen for ride completed confirmation ────────────────────
      socket.on("ride-completed-confirmation", (data: any) => {
        console.log("✅ Ride completed confirmation:", data);
        setActiveRide(null);
        setRideStatus('');
        toast.success("🎉 Ride completed!");
        fetchDriverData();
      });

      // ─── Socket error handling ──────────────────────────────────────
      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err);
        setSocketConnected(false);
        toast.error("Connection error. Please refresh the page.");
      });

      socket.on("disconnect", () => {
        console.log("🔴 Driver socket disconnected");
        setSocketConnected(false);
      });

      socket.on("reconnect", (attempt) => {
        console.log("🟢 Driver socket reconnected after", attempt, "attempts");
        setSocketConnected(true);
        // Rejoin rooms on reconnect
        if (userIdValue) {
          socket.emit("join", userIdValue);
          socket.emit("join", `user_${userIdValue}`);
          socket.emit("join", `user-${userIdValue}`);
        }
        if (driverIdValue) {
          socket.emit("join", driverIdValue);
          socket.emit("join", `driver_${driverIdValue}`);
          socket.emit("join", `driver-${driverIdValue}`);
          socket.emit("join-driver", driverIdValue);
        }
        toast.success("Reconnected to server");
      });

      // ─── Debug: Log all events ──────────────────────────────────────
      socket.onAny((event, ...args) => {
        console.log(`📡 Socket event: ${event}`, args);
      });
    });
  }, [isOnline, isApproved]);

  // ─── Connect socket when approved ─────────────────────────────────
  useEffect(() => {
    if (isApproved) {
      console.log('✅ Driver approved, setting up socket...');
      setupSocketConnection();
    }
  }, [isApproved, setupSocketConnection]);

  // ─── GPS Location Tracking ─────────────────────────────────────────
  const setupLocationTracking = () => {
    if (!("geolocation" in navigator)) {
      setLocation({ lat: -1.9441, lng: 30.0619 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(newLocation);
        updateDriverLocation(newLocation);
      },
      () => {
        setLocation({ lat: -1.9441, lng: 30.0619 });
      },
      { enableHighAccuracy: true }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(newLocation);
        updateDriverLocation(newLocation);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  };

  const updateDriverLocation = async (loc: { lat: number; lng: number }) => {
    if (!isOnline) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/drivers/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lat: loc.lat,
          lng: loc.lng,
          isOnline: isOnline,
        }),
      });
    } catch (error) {
      // Silently fail
    }
  };

  // ── Fetch All Driver Data ─────────────────────────────────────────
  const fetchDriverData = async () => {
    try {
      setRefreshing(true);
      setError('');

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      const statsRes = await fetch(`${API_URL}/drivers/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) {
          const stats = data.stats;
          setIsOnline(stats.isOnline || false);
          setIsApproved(stats.isApproved || false);
          setRating(stats.rating || 0);
          setTotalTrips(stats.totalTrips || 0);
          
          if (stats.vehicle) {
            setVehicleInfo({
              number: stats.vehicle.number || "N/A",
              model: stats.vehicle.model || "N/A",
              type: stats.vehicle.type || "N/A",
            });
          }
          
          if (stats.driverId) {
            setDriverId(stats.driverId);
          }
        }
      }

      const earningsRes = await fetch(`${API_URL}/drivers/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        if (data.success && data.earnings) {
          setEarnings({
            today: data.earnings.today || { amount: 0, trips: 0 },
            week: data.earnings.week || { amount: 0, trips: 0 },
            month: data.earnings.month || { amount: 0, trips: 0 },
          });
        }
      }

      if (isApproved && isOnline) {
        const ridesRes = await fetch(`${API_URL}/drivers/nearby-rides`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ridesRes.ok) {
          const data = await ridesRes.json();
          if (data.success) {
            setRideRequests(data.rides || []);
          }
        }
      } else {
        setRideRequests([]);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch driver data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
    fetchIntervalRef.current = setInterval(fetchDriverData, 15000);
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [isOnline, isApproved]);

  // ── Toggle Online Status ──────────────────────────────────────────
  const toggleOnlineStatus = async () => {
    if (!isApproved) {
      toast.error('Your account is not approved yet. Please wait for admin approval.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const newStatus = !isOnline;

      console.log(`📡 Toggling online status to: ${newStatus}`);

      const res = await fetch(`${API_URL}/drivers/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnline: newStatus }),
      });

      console.log(`📡 Response status: ${res.status}`);

      if (res.ok) {
        const data = await res.json();
        console.log(`📡 Response data:`, data);
        
        if (data.success) {
          setIsOnline(newStatus);
          if (!newStatus) {
            setRideRequests([]);
          }
          toast.success(`You are now ${newStatus ? 'online' : 'offline'}`);
          if (location) {
            updateDriverLocation(location);
          }
          fetchDriverData();
        } else {
          throw new Error(data.message || "Failed to update status");
        }
      } else {
        const errorData = await res.json();
        console.error('❌ Status update error:', errorData);
        throw new Error(errorData.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error('❌ Toggle status error:', err);
      setError(err.message || "Failed to update status. Please try again.");
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // ─── Accept Ride ────────────────────────────────────────────────────
  const acceptRide = async (rideId: string) => {
    console.log(`📡 Accepting ride: ${rideId}`);
    setAcceptedRideId(rideId);
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        setAcceptedRideId(null);
        setLoading(false);
        return;
      }

      console.log(`📡 Sending request to: ${API_URL}/rides/${rideId}/accept`);

      const res = await fetch(`${API_URL}/rides/${rideId}/accept`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`📡 Response status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Accept ride error:', errorData);
        throw new Error(errorData.message || "Failed to accept ride");
      }

      const data = await res.json();
      console.log('✅ Ride accepted:', data);

      if (data.success) {
        const acceptedRide = rideRequests.find(r => r.id === rideId);
        if (acceptedRide) {
          setActiveRide({
            ...acceptedRide,
            status: 'ACCEPTED'
          });
          setRideRequests(prev => prev.filter(r => r.id !== rideId));
          toast.success('✅ Ride accepted! Navigate to pickup.');
          setRideStatus('Driver Assigned');
          
          // ─── EMIT SOCKET EVENT TO CONFIRM ──────────────────────────
          if (socketRef.current) {
            socketRef.current.emit('driver-accept-ride', {
              rideId: rideId,
              driverId: driverId || userId,
              userId: userId,
            });
            console.log('📤 Emitted driver-accept-ride event');
          }
        }
        setError("");
      } else {
        throw new Error(data.message || "Failed to accept ride");
      }
    } catch (err: any) {
      console.error('❌ Accept ride error:', err);
      setError(err.message || "Failed to accept ride. Please try again.");
      toast.error(err.message || "Failed to accept ride");
    } finally {
      setAcceptedRideId(null);
      setLoading(false);
    }
  };

  // ─── Start Ride ─────────────────────────────────────────────────────
  const startRide = async () => {
    if (!activeRide) {
      toast.error("No active ride to start");
      return;
    }
    
    setIsStartingTrip(true);
    try {
      const token = localStorage.getItem("token");
      
      console.log(`📡 Starting ride: ${activeRide.id}`);
      
      const res = await fetch(`${API_URL}/rides/${activeRide.id}/start`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Start ride error:', errorData);
        throw new Error(errorData.message || "Failed to start ride");
      }

      const data = await res.json();
      console.log('✅ Ride started:', data);

      if (data.success) {
        setActiveRide(prev => prev ? { ...prev, status: 'STARTED' } : null);
        setRideStatus('Trip in Progress');
        toast.success('🚗 Trip started! Navigating to destination.');
      } else {
        throw new Error(data.message || "Failed to start ride");
      }
    } catch (err: any) {
      console.error('❌ Start ride error:', err);
      setError(err.message || "Failed to start ride");
      toast.error(err.message || "Failed to start ride");
    } finally {
      setIsStartingTrip(false);
    }
  };

  // ─── Complete Ride ──────────────────────────────────────────────────
  const completeRide = async () => {
    if (!activeRide) {
      toast.error("No active ride to complete");
      return;
    }
    
    setIsCompletingTrip(true);
    try {
      const token = localStorage.getItem("token");
      
      console.log(`📡 Completing ride: ${activeRide.id}`);
      
      const res = await fetch(`${API_URL}/rides/${activeRide.id}/complete`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Complete ride error:', errorData);
        throw new Error(errorData.message || "Failed to complete ride");
      }

      const data = await res.json();
      console.log('✅ Ride completed:', data);

      if (data.success) {
        toast.success('🎉 Ride completed successfully!');
        setActiveRide(null);
        setRideStatus('');
        fetchDriverData();
      } else {
        throw new Error(data.message || "Failed to complete ride");
      }
    } catch (err: any) {
      console.error('❌ Complete ride error:', err);
      setError(err.message || "Failed to complete ride");
      toast.error(err.message || "Failed to complete ride");
    } finally {
      setIsCompletingTrip(false);
    }
  };

  // ─── Reject Ride ────────────────────────────────────────────────────
  const rejectRide = (rideId: string) => {
    setRideRequests(prev => prev.filter(r => r.id !== rideId));
    toast('Ride declined', { icon: '👋' });
  };

  // ─── Cancel Active Ride ────────────────────────────────────────────
  const cancelActiveRide = async () => {
    if (!activeRide) return;
    
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/rides/${activeRide.id}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Driver cancelled the ride" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveRide(null);
          setRideStatus('');
          toast('Ride cancelled', { icon: 'ℹ️' });
          fetchDriverData();
        } else {
          throw new Error(data.message || "Failed to cancel ride");
        }
      } else {
        throw new Error("Failed to cancel ride");
      }
    } catch (err: any) {
      console.error('Cancel ride error:', err);
      toast.error(err.message || "Failed to cancel ride");
    }
  };

  // ─── Call Rider ──────────────────────────────────────────────────
  const handleContactRider = () => {
    if (activeRide?.riderPhone) {
      window.location.href = `tel:${activeRide.riderPhone}`;
    } else {
      toast.error("No rider phone number available");
    }
  };

  if (!isApproved && !loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center p-4">
        <div className="bg-[#111714] border border-yellow-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-white mb-2">Account Pending Approval</h2>
          <p className="text-gray-400 text-sm mb-4">
            Your driver account is being reviewed by the admin team.
            You'll receive a notification once approved.
          </p>
          <div className="bg-[#0A0E0B] rounded-xl p-4 text-left text-xs text-gray-500">
            <p>📋 Vehicle: {vehicleInfo.type} • {vehicleInfo.number}</p>
            <p>👤 Name: {driverName}</p>
          </div>
          <button
            onClick={() => router.push('/driver/profile')}
            className="mt-4 px-6 py-2 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
          >
            View Profile
          </button>
        </div>
      </div>
    );
  }

  if (loading && !rideRequests.length && !activeRide) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🚗 Driver Dashboard</h1>
            <p className="text-gray-400 text-sm">Welcome back, <span className="text-white font-semibold">{driverName || 'Driver'}</span></p>
            {isApproved && vehicleInfo.number && (
              <p className="text-xs text-gray-500 mt-1">
                {vehicleInfo.type} • {vehicleInfo.number}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-gray-500">
                {socketConnected ? 'Socket Connected' : 'Socket Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isOnline && isApproved
                ? "bg-green-500/20 text-green-500 border border-green-500/20" 
                : "bg-gray-500/20 text-gray-400 border border-gray-700"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline && isApproved ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              {!isApproved ? "Pending" : isOnline ? "Online" : "Offline"}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/login');
              }}
              className="p-2 hover:bg-[#1A1E1C] rounded-lg transition"
            >
              <LogOut size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ONLINE TOGGLE */}
        <button
          onClick={toggleOnlineStatus}
          disabled={loading || !isApproved || !!activeRide}
          className={`w-full py-3 rounded-xl font-semibold transition mb-6 ${
            !isApproved
              ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
              : activeRide
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400 cursor-not-allowed"
                : isOnline 
                  ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20" 
                  : "bg-green-500 text-black hover:bg-green-400"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {isOnline ? "Going Offline..." : "Going Online..."}
            </div>
          ) : activeRide ? (
            "🔵 Trip in Progress"
          ) : (
            !isApproved ? "⏳ Pending Approval" :
            isOnline ? "🔴 Go Offline" : "🟢 Go Online"
          )}
        </button>

        {/* LOCATION STATUS */}
        {isOnline && isApproved && location && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
            Location sharing active
            <span className="text-[10px] text-gray-500 ml-auto">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </span>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Today's Earnings</div>
            <div className="text-2xl font-bold text-green-500">
              RWF {earnings.today.amount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">{earnings.today.trips} rides today</div>
          </div>
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider">This Week</div>
            <div className="text-2xl font-bold text-white">
              RWF {earnings.week.amount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">{earnings.week.trips} rides this week</div>
          </div>
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Total Trips</div>
            <div className="text-2xl font-bold text-white">{totalTrips}</div>
          </div>
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider">Rating</div>
            <div className="text-2xl font-bold text-yellow-500">{rating.toFixed(1)} ★</div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ACTIVE RIDE */}
        {activeRide && (
          <div className="bg-[#111714] border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-green-500 font-semibold uppercase tracking-wider">
                  {activeRide.status === 'STARTED' ? 'Trip in Progress' : 'Active Ride'}
                </p>
              </div>
              <span className="text-green-500 font-bold text-lg">RWF {activeRide.fare.toLocaleString()}</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-white text-lg">{activeRide.riderName || "Rider"}</p>
                <p className="text-xs text-gray-400">{activeRide.riderPhone || "Unknown"}</p>
              </div>
              <button
                onClick={handleContactRider}
                className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition"
                title="Call Rider"
              >
                <Phone size={18} />
              </button>
            </div>

            <div className="space-y-1 text-sm mt-2 mb-4">
              <p className="text-gray-400 flex items-center gap-2">
                <MapPin size={14} className="text-green-500" />
                From: {activeRide.pickupAddress}
              </p>
              <p className="text-gray-400 flex items-center gap-2">
                <span className="text-orange-500">🏁</span> 
                To: {activeRide.dropoffAddress}
              </p>
              {activeRide.distance && (
                <p className="text-xs text-gray-500">📏 {activeRide.distance}</p>
              )}
            </div>

            <div className="flex gap-3">
              {activeRide.status === 'ACCEPTED' && (
                <button
                  onClick={startRide}
                  disabled={isStartingTrip}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isStartingTrip ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Start Trip
                    </>
                  )}
                </button>
              )}
              {activeRide.status === 'STARTED' && (
                <button
                  onClick={completeRide}
                  disabled={isCompletingTrip}
                  className="flex-1 py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCompletingTrip ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Complete Ride
                    </>
                  )}
                </button>
              )}
              <button
                onClick={cancelActiveRide}
                className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
            </div>

            {activeRide.status === 'STARTED' && (
              <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <p className="text-xs text-blue-400">🟢 Trip in progress - Navigate to destination</p>
              </div>
            )}
          </div>
        )}

        {/* RIDE REQUESTS */}
        {isOnline && isApproved && rideRequests.length > 0 && !activeRide && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <span className="text-yellow-400">🔔</span>
              Nearby Ride Requests ({rideRequests.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {rideRequests.map((request) => (
                <div key={request.id} className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{request.riderName || "Rider"}</p>
                      <p className="text-xs text-gray-400">{request.riderPhone || "Unknown"}</p>
                    </div>
                    <span className="text-green-500 font-bold">RWF {request.fare.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-400 flex items-center gap-2">
                      <MapPin size={14} className="text-green-500" />
                      {request.pickupAddress}
                    </p>
                    <p className="text-gray-400 flex items-center gap-2">
                      <span className="text-orange-500">🏁</span> 
                      {request.dropoffAddress}
                    </p>
                    {request.distance && (
                      <p className="text-xs text-gray-500">📏 {request.distance}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRide(request.id)}
                      disabled={loading || acceptedRideId === request.id}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {acceptedRideId === request.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        '✅ Accept Ride'
                      )}
                    </button>
                    <button
                      onClick={() => rejectRide(request.id)}
                      className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold hover:bg-red-500/20 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NO RIDES */}
        {isOnline && isApproved && rideRequests.length === 0 && !activeRide && (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-5xl mb-3">🛵</div>
            <p className="text-gray-400 font-medium">No ride requests nearby</p>
            <p className="text-xs text-gray-500 mt-1">Waiting for riders in your area...</p>
            <button
              onClick={fetchDriverData}
              className="mt-4 px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-600 transition inline-flex items-center gap-2"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        )}

        {(!isOnline || !isApproved) && !activeRide && (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">{!isApproved ? "⏳" : "⏸️"}</div>
            <p className="text-gray-400 font-medium">
              {!isApproved ? "Account Pending Approval" : "You are offline"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {!isApproved 
                ? "Please wait for admin approval" 
                : "Go online to receive ride requests"}
            </p>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          <Link href="/driver/earnings" className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition group">
            <div className="text-xl mb-1 group-hover:scale-110 transition">💰</div>
            <p className="text-xs text-gray-400">Earnings</p>
          </Link>
          <Link href="/driver/history" className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition group">
            <div className="text-xl mb-1 group-hover:scale-110 transition">📋</div>
            <p className="text-xs text-gray-400">History</p>
          </Link>
          <Link href="/driver/profile" className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition group">
            <div className="text-xl mb-1 group-hover:scale-110 transition">⚙️</div>
            <p className="text-xs text-gray-400">Profile</p>
          </Link>
          <Link href="/driver/support" className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center hover:border-green-500/30 transition group">
            <div className="text-xl mb-1 group-hover:scale-110 transition">🆘</div>
            <p className="text-xs text-gray-400">Support</p>
          </Link>
        </div>

        {/* REFRESH */}
        <button
          onClick={fetchDriverData}
          disabled={refreshing}
          className="w-full mt-4 py-2 bg-[#0A0E0B] border border-gray-800 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}