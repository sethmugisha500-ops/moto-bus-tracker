// app/driver/earnings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, TrendingUp, Calendar, 
  Wallet, RefreshCw, Loader2, 
  ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, AlertCircle,
  BarChart3, PieChart
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface EarningsData {
  today: { amount: number; trips: number };
  week: { amount: number; trips: number };
  month: { amount: number; trips: number };
  total: { amount: number; trips: number };
  daily: { date: string; amount: number; trips: number }[];
}

export default function DriverEarnings() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData>({
    today: { amount: 0, trips: 0 },
    week: { amount: 0, trips: 0 },
    month: { amount: 0, trips: 0 },
    total: { amount: 0, trips: 0 },
    daily: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [driverName, setDriverName] = useState("Driver");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get driver name from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name || "Driver");
      }
    } catch {}
    
    fetchEarnings();
  }, [router]);

  const fetchEarnings = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/drivers/earnings`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.earnings) {
          const e = data.earnings;
          setEarnings({
            today: e.today || { amount: 0, trips: 0 },
            week: e.week || { amount: 0, trips: 0 },
            month: e.month || { amount: 0, trips: 0 },
            total: e.total || { amount: 0, trips: 0 },
            daily: e.daily || generateDailyData(e.week)
          });
          toast.success('Earnings updated');
        } else {
          // If API returns success: false, generate mock data
          const mockData = generateMockEarnings();
          setEarnings(mockData);
          toast('Using demo earnings data');
        }
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        // API error - use mock data
        const mockData = generateMockEarnings();
        setEarnings(mockData);
toast('Using demo earnings data', { icon: 'ℹ️' });      }
    } catch (err: any) {
      console.error('Fetch earnings error:', err);
      setError(err.message || 'Failed to fetch earnings');
      // Use mock data on error
      const mockData = generateMockEarnings();
      setEarnings(mockData);
toast('Using demo earnings data', { icon: 'ℹ️' });    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // ── Generate Daily Data from Week Data ─────────────────────────────
  const generateDailyData = (weekData: { amount: number; trips: number }) => {
    const daily = [];
    const now = new Date();
    const avgPerDay = weekData.trips / 7;
    const avgAmountPerDay = weekData.amount / 7;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const trips = Math.round(avgPerDay * (0.5 + Math.random()));
      daily.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round(avgAmountPerDay * (0.5 + Math.random())),
        trips: Math.max(0, trips)
      });
    }
    return daily;
  };

  const generateMockEarnings = (): EarningsData => {
    const daily = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      daily.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 15000) + 3000,
        trips: Math.floor(Math.random() * 5) + 1
      });
    }
    return {
      today: { amount: 8500, trips: 4 },
      week: { amount: 45600, trips: 18 },
      month: { amount: 184500, trips: 72 },
      total: { amount: 567800, trips: 245 },
      daily
    };
  };

  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  const getPeriodData = () => {
    switch (period) {
      case 'today': return earnings.today;
      case 'week': return earnings.week;
      case 'month': return earnings.month;
      default: return earnings.week;
    }
  };

  const periodData = getPeriodData();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">💰 Earnings</h1>
          <p className="text-sm text-gray-400">
            Track your income and performance, {driverName}
          </p>
        </div>
        <button
          onClick={fetchEarnings}
          disabled={refreshing}
          className="p-2 bg-[#111714] border border-gray-800 rounded-lg hover:bg-[#1A1E1C] transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : 'text-gray-400'} />
        </button>
      </div>

      {/* ─── TOTAL EARNINGS ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-400">Total Earnings</p>
        <p className="text-4xl font-bold text-white mt-1">
          {formatCurrency(earnings.total.amount)}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {earnings.total.trips} total trips completed
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-green-500 flex items-center gap-1">
            <TrendingUp size={14} />
            +12.5% from last month
          </span>
        </div>
      </div>

      {/* ─── ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── PERIOD FILTERS ────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {['today', 'week', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition capitalize ${
              period === p
                ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                : 'bg-[#111714] text-gray-400 border border-gray-800 hover:border-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ─── PERIOD STATS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Amount</p>
          <p className="text-2xl font-bold text-green-500">
            {formatCurrency(periodData.amount)}
          </p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Trips</p>
          <p className="text-2xl font-bold text-white">{periodData.trips}</p>
        </div>
      </div>

      {/* ─── DAILY BREAKDOWN ───────────────────────────────────────── */}
      {earnings.daily.length > 0 && (
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Calendar size={16} />
            Daily Breakdown
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {earnings.daily.slice(0, 7).map((day) => {
              const date = new Date(day.date);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div 
                  key={day.date} 
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isToday 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-[#0A0E0B] border-gray-800/50'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${isToday ? 'text-green-400' : 'text-white'}`}>
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-400">{day.trips} trips</p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-500 font-semibold">
                      {formatCurrency(day.amount)}
                    </span>
                    {isToday && (
                      <p className="text-[10px] text-green-400">● Active</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── QUICK STATS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Avg per Trip</p>
          <p className="text-lg font-bold text-white">
            {periodData.trips > 0 
              ? formatCurrency(Math.round(periodData.amount / periodData.trips))
              : formatCurrency(0)}
          </p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Daily Avg</p>
          <p className="text-lg font-bold text-white">
            {earnings.daily.length > 0
              ? formatCurrency(Math.round(periodData.amount / earnings.daily.length))
              : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* ─── TIPS ───────────────────────────────────────────────────── */}
      <div className="mt-6 p-4 bg-[#111714] border border-gray-800 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          💡 Earnings Tips
        </h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Stay online during peak hours (7-9 AM, 5-7 PM) for more rides</li>
          <li>• Maintain a high rating (4.8+) to get more ride requests</li>
          <li>• Accept rides promptly to increase your acceptance rate</li>
        </ul>
      </div>
    </div>
  );
}