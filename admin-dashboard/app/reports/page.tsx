'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  Download, Filter, Calendar, TrendingUp, TrendingDown, 
  Loader2, Bike, Bus, RefreshCw 
} from 'lucide-react';
import { dashboardAPI, reportsAPI } from '@/lib/api';

type VehicleType = 'all' | 'moto' | 'minibus' | 'bus';
type DriverVehicleType = Exclude<VehicleType, 'all'>;
type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';
type ReportTab = 'overview' | 'trips' | 'revenue' | 'drivers' | 'vehicles';

interface StatsData {
  totalTrips: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  activeDrivers: number;
  totalVehicles: number;
  tripsGrowth: number;
  revenueGrowth: number;
}

interface ChartData {
  name: string;
  trips: number;
  revenue: number;
  drivers?: number;
  rating?: number;
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
  trips: number;
  rating: number;
  earnings: number;
  vehicleType: VehicleType;
}

const COLORS = {
  moto: '#FF6B35',
  minibus: '#43A047',
  bus: '#1E88E5',
  primary: '#00C26F',
};

const VEHICLE_ICONS = {
  moto: Bike,
  minibus: Bus,
  bus: Bus,
};

const VEHICLE_LABELS = {
  moto: 'Moto',
  minibus: 'Mini-Bus',
  bus: 'Bus',
};

export default function ReportsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('all');
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [distribution, setDistribution] = useState<VehicleDistribution[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [exporting, setExporting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get date range
      const { start, end } = getDateRange(period);
      
      // Fetch stats
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes.data);

      // Fetch chart data
      const chartRes = await reportsAPI.getRevenue(start, end);
      setChartData(chartRes.data);

      // Fetch vehicle distribution
      const distRes = await dashboardAPI.getCharts();
      setDistribution(formatDistribution(distRes.data, vehicleType));

      // Fetch top drivers
      const driversRes = await reportsAPI.getDrivers(start, end);
      setTopDrivers(driversRes.data.slice(0, 5));

    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
      
      // Fallback to mock data
      if (err.response?.status === 404) {
        setStats(getMockStats());
        setChartData(getMockChartData(period));
        setDistribution(getMockDistribution(vehicleType));
        setTopDrivers(getMockTopDrivers());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vehicleType, period]);

  // Get date range
  const getDateRange = (period: ReportPeriod) => {
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
  };

  // Mock data fallbacks
  const getMockStats = (): StatsData => ({
    totalTrips: 8432,
    totalRevenue: 12500000,
    averageRating: 4.8,
    completionRate: 94,
    activeDrivers: 156,
    totalVehicles: 230,
    tripsGrowth: 12,
    revenueGrowth: 8,
  });

  const getMockChartData = (period: ReportPeriod): ChartData[] => {
    const baseData = [
      { name: 'Mon', trips: 120, revenue: 96000 },
      { name: 'Tue', trips: 145, revenue: 116000 },
      { name: 'Wed', trips: 135, revenue: 108000 },
      { name: 'Thu', trips: 160, revenue: 128000 },
      { name: 'Fri', trips: 210, revenue: 168000 },
      { name: 'Sat', trips: 280, revenue: 224000 },
      { name: 'Sun', trips: 250, revenue: 200000 },
    ];
    return period === 'month' ? baseData.map(d => ({ ...d, name: `Week ${d.name}` })) : baseData;
  };

  const getMockDistribution = (type: VehicleType): VehicleDistribution[] => {
    const all = [
      { name: 'Moto', value: 700, color: COLORS.moto, icon: Bike },
      { name: 'Mini-Bus', value: 200, color: COLORS.minibus, icon: Minibus },
      { name: 'Bus', value: 300, color: COLORS.bus, icon: Bus },
    ];
    if (type === 'all') return all;
    return all.filter(d => d.name.toLowerCase() === type);
  };

  const getMockTopDrivers = (): TopDriver[] => [
    { id: '1', name: 'John Mugabo', trips: 847, rating: 4.9, earnings: 487500, vehicleType: 'moto' },
    { id: '2', name: 'Peter Nshuti', trips: 567, rating: 4.8, earnings: 342000, vehicleType: 'minibus' },
    { id: '3', name: 'Sarah Uwimana', trips: 423, rating: 4.7, earnings: 289000, vehicleType: 'bus' },
    { id: '4', name: 'Alice Mukamana', trips: 389, rating: 4.9, earnings: 276000, vehicleType: 'moto' },
    { id: '5', name: 'Jean Pierre', trips: 356, rating: 4.6, earnings: 234000, vehicleType: 'minibus' },
  ];

  const formatDistribution = (data: any, type: VehicleType): VehicleDistribution[] => {
    if (!data) return getMockDistribution(type);
    // Transform API data to match format
    return data.map((item: any) => ({
      ...item,
      color: COLORS[item.name.toLowerCase() as keyof typeof COLORS] || COLORS.primary,
      icon: VEHICLE_ICONS[item.name.toLowerCase() as keyof typeof VEHICLE_ICONS] || Bike,
    }));
  };

  // Export CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const { start, end } = getDateRange(period);
      const response = await reportsAPI.exportCSV(activeTab, start, end);
      
      // Create download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${start}_to_${end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  // Stats Cards
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-darkCard border border-border rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted">Total Trips</p>
            <p className="text-2xl font-bold text-primary">{stats?.totalTrips.toLocaleString()}</p>
          </div>
          {stats?.tripsGrowth && (
            <span className={`text-xs ${stats.tripsGrowth > 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
              {stats.tripsGrowth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(stats.tripsGrowth)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-darkCard border border-border rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalRevenue || 0)}</p>
          </div>
          {stats?.revenueGrowth && (
            <span className={`text-xs ${stats.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
              {stats.revenueGrowth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(stats.revenueGrowth)}%
            </span>
          )}
        </div>
      </div>

      <div className="bg-darkCard border border-border rounded-xl p-4">
        <p className="text-xs text-muted">Avg Rating</p>
        <p className="text-2xl font-bold text-yellow-500">⭐ {stats?.averageRating || 0}</p>
      </div>

      <div className="bg-darkCard border border-border rounded-xl p-4">
        <p className="text-xs text-muted">Completion Rate</p>
        <p className="text-2xl font-bold text-green-500">{stats?.completionRate || 0}%</p>
      </div>
    </div>
  );

  // Render charts based on active tab
  const renderChart = () => {
    switch(activeTab) {
      case 'trips':
        return (
          <div className="bg-darkCard border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Trip Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }}
                  formatter={(value) => [`${value.toLocaleString()} trips`, '']}
                />
                <Area type="monotone" dataKey="trips" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'revenue':
        return (
          <div className="bg-darkCard border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }}
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
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-darkCard border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Vehicle Distribution</h3>
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
                    label
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-darkCard border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Vehicle Stats</h3>
              <div className="space-y-4">
                {distribution.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-darkInput rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon size={20} style={{ color: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{item.value}</span>
                        <span className="text-sm text-muted">
                          {Math.round((item.value / distribution.reduce((acc, d) => acc + d.value, 0)) * 100)}%
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
          <div className="bg-darkCard border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Top Performing Drivers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-darkInput rounded-lg">
                  <tr>
                    <th className="text-left p-3 text-muted text-sm">#</th>
                    <th className="text-left p-3 text-muted text-sm">Driver</th>
                    <th className="text-left p-3 text-muted text-sm">Vehicle</th>
                    <th className="text-left p-3 text-muted text-sm">Trips</th>
                    <th className="text-left p-3 text-muted text-sm">Rating</th>
                    <th className="text-right p-3 text-muted text-sm">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.map((driver, i) => {
                    const Icon = VEHICLE_ICONS[driver.vehicleType] || Bike;
                    return (
                      <tr key={driver.id} className="border-b border-border hover:bg-darkInput/50 transition">
                        <td className="p-3 font-medium text-muted">#{i + 1}</td>
                        <td className="p-3 font-medium">{driver.name}</td>
                        <td className="p-3">
                          <Icon size={16} className="text-muted inline mr-1" />
                          <span className="text-sm text-muted">{VEHICLE_LABELS[driver.vehicleType]}</span>
                        </td>
                        <td className="p-3">{driver.trips.toLocaleString()}</td>
                        <td className="p-3 text-yellow-500">⭐ {driver.rating}</td>
                        <td className="p-3 text-primary text-right font-semibold">
                          {formatCurrency(driver.earnings)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-darkCard border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Trips & Revenue Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E2C" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis yAxisId="left" stroke="#888" />
                  <YAxis yAxisId="right" orientation="right" stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1E1C', border: '1px solid #2A2E2C' }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value as number), name];
                      return [value, name];
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="trips" stroke={COLORS.primary} strokeWidth={2} name="Trips" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={COLORS.moto} strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-darkCard border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-darkInput p-4 rounded-lg">
                  <p className="text-xs text-muted">Active Drivers</p>
                  <p className="text-2xl font-bold">{stats?.activeDrivers || 0}</p>
                </div>
                <div className="bg-darkInput p-4 rounded-lg">
                  <p className="text-xs text-muted">Total Vehicles</p>
                  <p className="text-2xl font-bold">{stats?.totalVehicles || 0}</p>
                </div>
                <div className="bg-darkInput p-4 rounded-lg">
                  <p className="text-xs text-muted">Avg Trip Value</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats?.totalTrips ? formatCurrency(Math.round((stats.totalRevenue || 0) / stats.totalTrips)) : 'RWF 0'}
                  </p>
                </div>
                <div className="bg-darkInput p-4 rounded-lg">
                  <p className="text-xs text-muted">Top Rating</p>
                  <p className="text-2xl font-bold text-yellow-500">⭐ {Math.max(...topDrivers.map(d => d.rating), 0)}</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted text-sm">Generate and export business reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Vehicle Type Filter */}
          <div className="flex bg-darkInput rounded-lg p-1">
            {['all', 'moto', 'minibus', 'bus'].map((type) => {
              const Icon = VEHICLE_ICONS[type as keyof typeof VEHICLE_ICONS];
              return (
                <button
                  key={type}
                  onClick={() => setVehicleType(type as VehicleType)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    vehicleType === type 
                      ? 'bg-primary text-dark' 
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All' : (
                    <span className="flex items-center gap-1">
                      <Icon size={14} />
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
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
            <option value="year">This year</option>
          </select>

          {/* Refresh Button */}
          <button 
            onClick={fetchData}
            className="p-2 bg-darkInput border border-border rounded-lg hover:bg-darkInput/80 transition"
          >
            <RefreshCw size={18} className="text-muted" />
          </button>

          {/* Export Button */}
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-primary text-dark px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-500 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={fetchData} className="ml-auto text-primary hover:underline">Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards />

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
        {['overview', 'trips', 'revenue', 'drivers', 'vehicles'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ReportTab)}
            className={`px-4 py-2 font-medium transition-all capitalize ${
              activeTab === tab 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Charts */}
      {renderChart()}
    </div>
  );
}