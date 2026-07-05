// admin-dashboard/app/reports/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  Download, Filter, Calendar, TrendingUp, TrendingDown, 
  Loader2, Bike, Bus, RefreshCw, Truck, Users,
  DollarSign, Star, Clock, AlertCircle, ArrowUpRight,
  ArrowDownRight, ChevronDown, FileText, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
type VehicleType = 'all' | 'moto' | 'minibus' | 'bus';
type DriverVehicleType = Exclude<VehicleType, 'all'>;
type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';
type ReportTab = 'overview' | 'trips' | 'revenue' | 'drivers' | 'vehicles' | 'ratings';

interface StatsData {
  totalTrips: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeDrivers: number;
  totalVehicles: number;
  tripsGrowth: number;
  revenueGrowth: number;
  pendingRides: number;
  totalUsers: number;
}

interface ChartData {
  name: string;
  trips: number;
  revenue: number;
  drivers?: number;
  rating?: number;
  completed?: number;
  cancelled?: number;
}

interface VehicleDistribution {
  name: string;
  value: number;
  color: string;
  icon: any;
}

interface TopDriver {
  id: string;
  name: string;
  phone: string;
  trips: number;
  rating: number;
  earnings: number;
  vehicleType: DriverVehicleType;
  vehicleNumber: string;
}

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getReports: async (params: {
    period: string;
    vehicleType: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    stats: StatsData;
    chartData: ChartData[];
    distribution: VehicleDistribution[];
    topDrivers: TopDriver[];
    ratings: RatingDistribution[];
  }> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    queryParams.append('period', params.period);
    if (params.vehicleType !== 'all') queryParams.append('vehicleType', params.vehicleType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const res = await fetch(`${API_URL}/admin/reports?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  exportReport: async (params: {
    type: string;
    period: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);
    queryParams.append('period', params.period);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const res = await fetch(`${API_URL}/admin/reports/export?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export report');
    return res.blob();
  },
};

// ─── CONSTANTS ─────────────────────────────────────────────────────
const COLORS = {
  moto: '#FF6B35',
  minibus: '#43A047',
  bus: '#1E88E5',
  primary: '#00C26F',
  purple: '#818CF8',
  pink: '#EC4899',
  yellow: '#F59E0B',
};

const VEHICLE_ICONS = {
  moto: Bike,
  minibus: Truck,
  bus: Bus,
};

const VEHICLE_LABELS = {
  moto: 'Moto',
  minibus: 'Mini-Bus',
  bus: 'Bus',
};

const PERIOD_LABELS = {
  today: 'Today',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  quarter: 'Last 90 Days',
  year: 'This Year',
};

// ─── STAT CARD ─────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, color, subtitle, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition-all cursor-pointer"
  >
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`text-${color}-500`} size={18} />
      </div>
      {change !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-1 ${
          change >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change >= 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{value?.toLocaleString() || 0}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
    {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function ReportsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('all');
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Data state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [distribution, setDistribution] = useState<VehicleDistribution[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [ratings, setRatings] = useState<RatingDistribution[]>([]);

  // ─── Get Date Range ─────────────────────────────────────────────
  const getDateRange = useCallback((period: ReportPeriod) => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = new Date();
    
    switch(period) {
      case 'today':
        start = now;
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString().split('T')[0], end };
  }, []);

  // ─── Fetch Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const range = getDateRange(period);
      
      const data = await api.getReports({
        period,
        vehicleType,
        startDate: dateRange.start || range.start,
        endDate: dateRange.end || range.end,
      });

      setStats(data.stats);
      setChartData(data.chartData || []);
      setDistribution(data.distribution || []);
      setTopDrivers(data.topDrivers || []);
      setRatings(data.ratings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
      toast.error('Failed to load reports data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [period, vehicleType, dateRange, getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Export Report ──────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const range = getDateRange(period);
      const blob = await api.exportReport({
        type: activeTab,
        period,
        startDate: dateRange.start || range.start,
        endDate: dateRange.end || range.end,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_report_${range.start}_to_${range.end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // ─── Format Helpers ─────────────────────────────────────────────
  const formatCurrency = (amount: number) => {
    return `RWF ${amount?.toLocaleString() || 0}`;
  };

  // ─── Render Stats Cards ─────────────────────────────────────────
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
      <StatCard 
        icon={TrendingUp} 
        label="Total Trips" 
        value={stats?.totalTrips} 
        change={stats?.tripsGrowth} 
        color="green"
        onClick={() => setActiveTab('trips')}
      />
      <StatCard 
        icon={DollarSign} 
        label="Total Revenue" 
        value={stats?.totalRevenue} 
        change={stats?.revenueGrowth} 
        color="green"
        onClick={() => setActiveTab('revenue')}
      />
      <StatCard 
        icon={Star} 
        label="Avg Rating" 
        value={stats?.averageRating?.toFixed(1)} 
        color="yellow"
        subtitle="⭐ 5.0 max"
        onClick={() => setActiveTab('ratings')}
      />
      <StatCard 
        icon={Clock} 
        label="Completion Rate" 
        value={`${stats?.completionRate || 0}%`} 
        color="blue"
        onClick={() => setActiveTab('trips')}
      />
      <StatCard 
        icon={Users} 
        label="Active Drivers" 
        value={stats?.activeDrivers} 
        color="purple"
        subtitle={`${stats?.totalVehicles || 0} vehicles`}
        onClick={() => setActiveTab('drivers')}
      />
    </div>
  );

  // ─── Render Chart ──────────────────────────────────────────────
  const renderChart = () => {
    switch(activeTab) {
      case 'trips':
        return (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Trip Trends</h3>
              <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C', color: '#fff' }}
                  formatter={(value) => [`${value.toLocaleString()} trips`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="trips" 
                  stroke={COLORS.primary} 
                  fill={COLORS.primary} 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'revenue':
        return (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Revenue Trends</h3>
              <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value as number), '']}
                />
                <Bar dataKey="revenue" fill={COLORS.moto}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.moto : COLORS.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'vehicles':
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Vehicle Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={distribution} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C', color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Vehicle Details</h3>
              <div className="space-y-3">
                {distribution.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-[#0A0E0B] rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <Icon size={20} style={{ color: item.color }} />
                        <span className="text-white">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-white">{item.value}</span>
                        <span className="text-xs text-gray-500">
                          {distribution.length > 0 
                            ? Math.round((item.value / distribution.reduce((acc, d) => acc + d.value, 0)) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      
      case 'drivers':
        return (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Top Performing Drivers</h3>
              <span className="text-xs text-gray-500">Based on trips & earnings</span>
            </div>
            {topDrivers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-2 text-gray-600" />
                <p>No driver data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A0E0B] rounded-lg">
                    <tr>
                      <th className="text-left p-3 text-gray-500 text-xs font-medium">#</th>
                      <th className="text-left p-3 text-gray-500 text-xs font-medium">Driver</th>
                      <th className="text-left p-3 text-gray-500 text-xs font-medium">Vehicle</th>
                      <th className="text-left p-3 text-gray-500 text-xs font-medium">Trips</th>
                      <th className="text-left p-3 text-gray-500 text-xs font-medium">Rating</th>
                      <th className="text-right p-3 text-gray-500 text-xs font-medium">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDrivers.map((driver, i) => {
                      const Icon = VEHICLE_ICONS[driver.vehicleType] || Bike;
                      return (
                        <tr key={driver.id} className="border-b border-gray-800 hover:bg-[#1A1E1C] transition">
                          <td className="p-3 font-medium text-gray-500">#{i + 1}</td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-white">{driver.name}</p>
                              <p className="text-xs text-gray-500">{driver.phone}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-300">{driver.vehicleNumber}</span>
                            </div>
                          </td>
                          <td className="p-3 text-white">{driver.trips.toLocaleString()}</td>
                          <td className="p-3 text-yellow-500">⭐ {driver.rating}</td>
                          <td className="p-3 text-green-500 text-right font-semibold">
                            {formatCurrency(driver.earnings)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      
      case 'ratings':
        return (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Rating Distribution</h3>
              <span className="text-xs text-gray-500">Overall: ⭐ {stats?.averageRating?.toFixed(1) || 0}</span>
            </div>
            {ratings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Star size={32} className="mx-auto mb-2 text-gray-600" />
                <p>No rating data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratings.map((item) => (
                  <div key={item.rating} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.rating} ★</span>
                      <span className="text-gray-500">{item.count} reviews ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#0A0E0B] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.rating >= 4 ? 'bg-green-500' :
                          item.rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Trips & Revenue</h3>
                <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#888" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C', color: '#fff' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                      return [`${value} trips`, 'Trips'];
                    }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="trips" 
                    stroke={COLORS.primary} 
                    strokeWidth={2} 
                    name="Trips" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={COLORS.moto} 
                    strokeWidth={2} 
                    name="Revenue" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0E0B] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Active Drivers</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeDrivers || 0}</p>
                </div>
                <div className="bg-[#0A0E0B] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Total Vehicles</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalVehicles || 0}</p>
                </div>
                <div className="bg-[#0A0E0B] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Avg Trip Value</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats?.totalTrips ? formatCurrency(Math.round((stats.totalRevenue || 0) / stats.totalTrips)) : 'RWF 0'}
                  </p>
                </div>
                <div className="bg-[#0A0E0B] p-4 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Pending Rides</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats?.pendingRides || 0}</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">📊 Reports & Analytics</h1>
            <p className="text-sm text-gray-400">Generate and export business reports</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Vehicle Filter */}
            <div className="flex bg-[#0A0E0B] rounded-lg p-1 border border-gray-800">
              {['all', 'moto', 'minibus', 'bus'].map((type) => {
                const Icon = VEHICLE_ICONS[type as keyof typeof VEHICLE_ICONS];
                return (
                  <button
                    key={type}
                    onClick={() => setVehicleType(type as VehicleType)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      vehicleType === type 
                        ? 'bg-green-500 text-black' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'All' : (
                      <span className="flex items-center gap-1">
                        <Icon size={12} />
                        {VEHICLE_LABELS[type as keyof typeof VEHICLE_LABELS]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Period Filter */}
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="px-3 py-1.5 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white text-xs focus:outline-none focus:border-green-500 transition"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>

            {/* Refresh */}
            <button 
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 bg-[#0A0E0B] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : 'text-gray-400'} />
            </button>

            {/* Export */}
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-green-500 text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-400 transition disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchData} className="ml-auto text-green-500 hover:underline">Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Report Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-800">
          {['overview', 'trips', 'revenue', 'drivers', 'vehicles', 'ratings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as ReportTab)}
              className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
                activeTab === tab 
                  ? 'text-green-500 border-b-2 border-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Charts */}
        {renderChart()}
      </div>
    </div>
  );
}