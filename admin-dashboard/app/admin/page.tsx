'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import adminAPI from '@/lib/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, Users2, Bike, Bus, Truck, TrendingUp, 
  DollarSign, Calendar, Activity, Star, AlertTriangle,
  Eye, CheckCircle, XCircle, Clock, UserCheck, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.get('/stats').then((res: { data: any; }) => res.data),
    refetchInterval: 30000,
  });

  // Fetch drivers list
  const { data: driversData, refetch: refetchDrivers } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => adminAPI.get('/drivers').then((res: { data: any; }) => res.data),
    enabled: activeTab === 'drivers',
  });

  // Fetch rides list
  const { data: ridesData } = useQuery({
    queryKey: ['admin-rides'],
    queryFn: () => adminAPI.get('/rides').then((res: { data: any; }) => res.data),
    enabled: activeTab === 'rides',
  });

  // Fetch users list
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.get('/users').then((res: { data: any; }) => res.data),
    enabled: activeTab === 'users',
  });

  const stats = statsData?.stats;

  const dailyRidesData = [
    { name: 'Mon', rides: 120, earnings: 96000 },
    { name: 'Tue', rides: 145, earnings: 116000 },
    { name: 'Wed', rides: 135, earnings: 108000 },
    { name: 'Thu', rides: 160, earnings: 128000 },
    { name: 'Fri', rides: 210, earnings: 168000 },
    { name: 'Sat', rides: 280, earnings: 224000 },
    { name: 'Sun', rides: 250, earnings: 200000 },
  ];

  const vehicleDistribution = [
    { name: 'Moto', value: 700, color: '#FF6B35' },
    { name: 'Bus', value: 300, color: '#1E88E5' },
    { name: 'Mini-Bus', value: 200, color: '#43A047' },
  ];

  const StatCard = ({ icon: Icon, label, value, subtext, colorClass, iconBgClass }: any) => (
    <div className="bg-darkCard border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgClass}`}>
          <Icon className={colorClass} size={20} />
        </div>
        <span className="text-xl font-bold text-primary">{value.toLocaleString()}</span>
      </div>
      <h3 className="text-muted text-xs mb-1">{label}</h3>
      <p className="text-xs text-muted">{subtext}</p>
    </div>
  );

  const approveDriver = async (driverId: string) => {
    try {
      await adminAPI.put(`/drivers/${driverId}/approve`);
      toast.success('Driver approved successfully');
      refetchDrivers();
    } catch (error) {
      toast.error('Failed to approve driver');
    }
  };

  const suspendDriver = async (driverId: string) => {
    try {
      await adminAPI.put(`/drivers/${driverId}/suspend`);
      toast.success('Driver suspended');
      refetchDrivers();
    } catch (error) {
      toast.error('Failed to suspend driver');
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-darkCard border-b border-border px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-muted text-xs">Manage drivers, rides, and view analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-border px-4 gap-2 sticky top-14 bg-dark z-10">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'drivers', label: 'Drivers', icon: '👨‍✈️' },
          { id: 'rides', label: 'Rides', icon: '🚗' },
          { id: 'users', label: 'Users', icon: '👤' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 pb-20">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard 
                icon={Users} 
                label="Total Riders" 
                value={stats?.totalUsers || 45000} 
                subtext="+12% this month"
                colorClass="text-blue-500"
                iconBgClass="bg-blue-500/10"
              />
              <StatCard 
                icon={Users2} 
                label="Active Drivers" 
                value={stats?.totalDrivers || 3500} 
                subtext="1,200 online now"
                colorClass="text-green-500"
                iconBgClass="bg-green-500/10"
              />
              <StatCard 
                icon={TrendingUp} 
                label="Trips Today" 
                value={stats?.totalRides || 8400} 
                subtext="+8% vs yesterday"
                colorClass="text-purple-500"
                iconBgClass="bg-purple-500/10"
              />
              <StatCard 
                icon={DollarSign} 
                label="Revenue Today" 
                value={stats?.totalRevenue || 12500000} 
                subtext="RWF"
                colorClass="text-yellow-500"
                iconBgClass="bg-yellow-500/10"
              />
            </div>

            {/* Driver Breakdown */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-3">Drivers by Vehicle Type</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Bike className="text-orange-500" size={16} />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary mb-1">700</div>
                  <div className="text-xs text-muted">Moto</div>
                </div>
                
                <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Bus className="text-blue-500" size={16} />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary mb-1">300</div>
                  <div className="text-xs text-muted">Bus</div>
                </div>
                
                <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Truck className="text-green-500" size={16} />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary mb-1">200</div>
                  <div className="text-xs text-muted">Mini-Bus</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-6 mb-6">
              <div className="bg-darkCard border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Daily Trips</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyRidesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                    <XAxis dataKey="name" stroke="#888" fontSize={10} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }} />
                    <Line type="monotone" dataKey="rides" stroke="#00C26F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-darkCard border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Vehicle Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vehicleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {vehicleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {driversData?.drivers?.map((driver: any) => (
              <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl">👨‍✈️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <p className="text-xs text-muted">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDriverModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-darkInput"
                    >
                      <Eye size={16} className="text-primary" />
                    </button>
                    {!driver.isApproved ? (
                      <button
                        onClick={() => approveDriver(driver.id)}
                        className="p-2 rounded-lg hover:bg-darkInput"
                      >
                        <CheckCircle size={16} className="text-green-500" />
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendDriver(driver.id)}
                        className="p-2 rounded-lg hover:bg-darkInput"
                      >
                        <XCircle size={16} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-darkInput rounded-lg p-2">
                    <p className="text-muted">Vehicle</p>
                    <p className="font-semibold">{driver.vehicleNumber}</p>
                  </div>
                  <div className="bg-darkInput rounded-lg p-2">
                    <p className="text-muted">Rating</p>
                    <p className="font-semibold">⭐ {driver.rating}</p>
                  </div>
                  <div className="bg-darkInput rounded-lg p-2">
                    <p className="text-muted">Trips</p>
                    <p className="font-semibold">{driver.totalTrips}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    driver.isOnline ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {driver.isOnline ? '● Online' : '● Offline'}
                  </span>
                  <span className="text-xs text-primary">RWF {driver.totalEarnings?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            {ridesData?.rides?.slice(0, 20).map((ride: any) => (
              <div key={ride.id} className="bg-darkCard border border-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-muted">Ride #{ride.id?.slice(-8)}</p>
                    <p className="text-sm font-medium mt-1">{ride.pickup?.address} → {ride.destination?.address}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ride.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                    ride.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {ride.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span>👤 {ride.rider?.name}</span>
                    <span>👨‍✈️ {ride.driver?.name || 'Pending'}</span>
                  </div>
                  <span className="text-primary font-semibold">RWF {ride.fare}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {usersData?.users?.map((user: any) => (
              <div key={user.id} className="bg-darkCard border border-border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-xs text-muted">{user.phone}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-center text-xs text-muted">
                  <span>📧 {user.email}</span>
                  <span>📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowDriverModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedDriver.name}</h3>
              <button onClick={() => setShowDriverModal(false)} className="p-2">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Phone</span>
                <span>{selectedDriver.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Vehicle</span>
                <span>{selectedDriver.vehicleNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Rating</span>
                <span>⭐ {selectedDriver.rating}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Total Trips</span>
                <span>{selectedDriver.totalTrips}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Total Earnings</span>
                <span className="text-primary">RWF {selectedDriver.totalEarnings?.toLocaleString()}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-primary text-dark py-2 rounded-lg">View Documents</button>
                <button className="flex-1 bg-red-500/20 text-red-500 py-2 rounded-lg">Suspend</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}