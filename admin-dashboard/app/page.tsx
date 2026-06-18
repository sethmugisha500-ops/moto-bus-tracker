'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, driversAPI, ridesAPI } from '@/lib/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, Users2, Bike, Bus, Truck, TrendingUp, 
  DollarSign, Eye, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#FF6B35', '#1E88E5', '#43A047', '#818CF8'];

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const { data: statsData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats().then(res => res.data),
    refetchInterval: 30000,
  });

  const { data: driversData } = useQuery({
    queryKey: ['dashboard-drivers'],
    queryFn: () => driversAPI.getAll({ limit: 5 }).then(res => res.data),
  });

  const { data: recentRides } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => ridesAPI.getAll({ limit: 5 }).then(res => res.data),
  });

  const stats = statsData?.stats;
  const charts = statsData?.charts;

  const dailyData = [
    { name: 'Mon', rides: 120, revenue: 96000 },
    { name: 'Tue', rides: 145, revenue: 116000 },
    { name: 'Wed', rides: 135, revenue: 108000 },
    { name: 'Thu', rides: 160, revenue: 128000 },
    { name: 'Fri', rides: 210, revenue: 168000 },
    { name: 'Sat', rides: 280, revenue: 224000 },
    { name: 'Sun', rides: 250, revenue: 200000 },
  ];

  const vehicleData = [
    { name: 'Moto', value: stats?.motoCount || 700, color: '#FF6B35' },
    { name: 'Bus', value: stats?.busCount || 300, color: '#1E88E5' },
    { name: 'Mini-Bus', value: stats?.minibusCount || 200, color: '#43A047' },
  ];

  const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
    <div className="bg-darkCard border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon className={`text-${color}-500`} size={20} />
        </div>
        <span className={`text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-2xl font-bold text-primary">{value?.toLocaleString() || 0}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-muted text-xs">Real-time platform analytics</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                selectedPeriod === period
                  ? 'bg-primary text-dark'
                  : 'bg-darkInput text-muted hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Users} label="Total Riders" value={stats?.totalUsers} change={12} color="blue" />
          <StatCard icon={Users2} label="Active Drivers" value={stats?.totalDrivers} change={8} color="green" />
          <StatCard icon={TrendingUp} label="Total Trips" value={stats?.totalRides} change={15} color="purple" />
          <StatCard icon={DollarSign} label="Revenue" value={stats?.totalRevenue} change={10} color="yellow" />
        </div>

        {/* Vehicle Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Bike className="text-orange-500 mx-auto mb-2" size={24} />
            <p className="text-xl font-bold text-primary">{vehicleData[0].value}</p>
            <p className="text-xs text-muted">Moto Drivers</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Bus className="text-blue-500 mx-auto mb-2" size={24} />
            <p className="text-xl font-bold text-primary">{vehicleData[1].value}</p>
            <p className="text-xs text-muted">Bus Drivers</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Truck className="text-green-500 mx-auto mb-2" size={24} />
            <p className="text-xl font-bold text-primary">{vehicleData[2].value}</p>
            <p className="text-xs text-muted">Mini-Bus</p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Daily Trips</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
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
                  data={vehicleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {vehicleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Drivers */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users size={14} /> Recent Drivers
          </h3>
          <div className="space-y-2">
            {driversData?.drivers?.slice(0, 3).map((driver: any) => (
              <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-xs text-muted">{driver.vehicleNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      driver.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {driver.status}
                    </span>
                    <Eye size={14} className="text-primary cursor-pointer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Rides */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock size={14} /> Recent Rides
          </h3>
          <div className="space-y-2">
            {recentRides?.rides?.slice(0, 3).map((ride: any) => (
              <div key={ride.id} className="bg-darkCard border border-border rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">{ride.pickup?.address} → {ride.destination?.address}</p>
                    <p className="text-xs text-muted">RWF {ride.fare} • {ride.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      ride.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {ride.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}