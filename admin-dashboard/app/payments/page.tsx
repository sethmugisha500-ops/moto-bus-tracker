// admin-dashboard/app/payments/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock, 
  Download, Wallet, Smartphone, Banknote, TrendingUp, AlertCircle, 
  CreditCard, Loader2, Calendar, ChevronDown, Printer, FileText,
  Users, User, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── TYPES ──────────────────────────────────────────────────────────
interface Payment {
  id: string;
  rideId: string;
  amount: number;
  method: 'WALLET' | 'MOBILE_MONEY' | 'CASH' | 'CARD';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  rider: { id: string; name: string; phone: string };
  driver: { id: string; name: string; phone: string; vehicleNumber: string };
  createdAt: string;
  completedAt?: string;
  reference?: string;
}

interface Stats {
  totalRevenue: number;
  completedRevenue: number;
  totalCount: number;
  walletTotal: number;
  mobileMoneyTotal: number;
  cashTotal: number;
  cardTotal: number;
  pendingCount: number;
}

interface PayoutRequest {
  id: string;
  driverId: string;
  driver: { name: string; vehicleNumber: string; balance: number };
  amount: number;
  method: string;
  status: string;
  requestedAt: string;
}

// ─── API FUNCTIONS ──────────────────────────────────────────────────
const api = {
  getPayments: async (params: {
    search?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payment[]; stats: Stats; pagination: any }> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.method && params.method !== 'all') queryParams.append('method', params.method);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const res = await fetch(`${API_URL}/admin/payments?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  getPayoutRequests: async (): Promise<{ data: PayoutRequest[] }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payouts/requests`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch payout requests');
    return res.json();
  },

  processPayout: async (data: { driverId: string; amount: number; method: string }): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payouts/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to process payout');
    return res.json();
  },

  getPaymentStats: async (): Promise<{ stats: Stats }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payments/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  exportPayments: async (params: any): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/admin/payments/export?${queryParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to export payments');
    return res.blob();
  },

  getPaymentDetails: async (id: string): Promise<{ data: Payment }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/admin/payments/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch payment details');
    return res.json();
  },
};

// ─── ICONS ──────────────────────────────────────────────────────────
const methodIcons = {
  WALLET: <Wallet size={14} className="text-purple-500" />,
  MOBILE_MONEY: <Smartphone size={14} className="text-orange-500" />,
  CASH: <Banknote size={14} className="text-green-500" />,
  CARD: <CreditCard size={14} className="text-blue-500" />,
};

const methodColors = {
  WALLET: 'bg-purple-500/20 text-purple-500 border-purple-500/20',
  MOBILE_MONEY: 'bg-orange-500/20 text-orange-500 border-orange-500/20',
  CASH: 'bg-green-500/20 text-green-500 border-green-500/20',
  CARD: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
};

const statusColors = {
  completed: 'bg-green-500/20 text-green-500 border-green-500/20',
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20',
  failed: 'bg-red-500/20 text-red-500 border-red-500/20',
  refunded: 'bg-blue-500/20 text-blue-500 border-blue-500/20',
};

const statusIcons = {
  completed: <CheckCircle size={14} className="text-green-500" />,
  pending: <Clock size={14} className="text-yellow-500" />,
  failed: <XCircle size={14} className="text-red-500" />,
  refunded: <ArrowUpRight size={14} className="text-blue-500" />,
};

// ─── STAT CARD ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, color, subtitle }: any) => (
  <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
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

// ─── PAYMENT ROW ────────────────────────────────────────────────────
const PaymentRow = ({ payment, onView }: { payment: Payment; onView: (payment: Payment) => void }) => (
  <tr className="border-b border-gray-800 hover:bg-[#1A1E1C] transition">
    <td className="p-4">
      <p className="font-mono text-xs text-gray-400">#{payment.rideId?.slice(-8) || 'N/A'}</p>
      <p className="text-xs text-gray-500">{payment.reference?.slice(0, 8) || 'N/A'}</p>
    </td>
    <td className="p-4">
      <div>
        <p className="text-sm font-medium text-white">{payment.rider?.name || 'N/A'}</p>
        <p className="text-xs text-gray-500">{payment.rider?.phone || 'N/A'}</p>
      </div>
    </td>
    <td className="p-4">
      <div>
        <p className="text-sm text-white">{payment.driver?.name || 'N/A'}</p>
        <p className="text-xs text-gray-500">{payment.driver?.vehicleNumber || 'N/A'}</p>
      </div>
    </td>
    <td className="p-4">
      <span className="text-green-500 font-bold">RWF {payment.amount?.toLocaleString() || 0}</span>
    </td>
    <td className="p-4">
      <div className="flex items-center gap-2">
        {methodIcons[payment.method as keyof typeof methodIcons]}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${methodColors[payment.method as keyof typeof methodColors]}`}>
          {payment.method?.replace('_', ' ')}
        </span>
      </div>
    </td>
    <td className="p-4">
      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 w-fit ${statusColors[payment.status as keyof typeof statusColors]}`}>
        {statusIcons[payment.status as keyof typeof statusIcons]}
        {payment.status}
      </span>
    </td>
    <td className="p-4 text-xs text-gray-500">
      {new Date(payment.createdAt).toLocaleDateString()}
      <br />
      <span className="text-[10px]">{new Date(payment.createdAt).toLocaleTimeString()}</span>
    </td>
    <td className="p-4">
      <button
        onClick={() => onView(payment)}
        className="p-2 rounded-lg hover:bg-[#1A1E1C] transition"
      >
        <Eye size={16} className="text-gray-400 hover:text-green-500" />
      </button>
    </td>
  </tr>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    completedRevenue: 0,
    totalCount: 0,
    walletTotal: 0,
    mobileMoneyTotal: 0,
    cashTotal: 0,
    cardTotal: 0,
    pendingCount: 0,
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  // ─── Filters ──────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // ─── Payout State ─────────────────────────────────────────────────
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('mobile_money');
  const [processingPayout, setProcessingPayout] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');

      const [paymentsData, statsData, payoutsData] = await Promise.all([
        api.getPayments({
          search,
          status: statusFilter,
          method: methodFilter,
          startDate: dateRange.start,
          endDate: dateRange.end,
          page: pagination.page,
          limit: 20,
        }),
        api.getPaymentStats(),
        api.getPayoutRequests().catch(() => ({ data: [] })),
      ]);

      setPayments(paymentsData.data || []);
      setStats(paymentsData.stats || statsData.stats);
      setPayoutRequests(payoutsData.data || []);
      setPagination(paymentsData.pagination || { page: 1, total: 0, limit: 20 });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      toast.error('Failed to load payment data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter, dateRange.start, dateRange.end, pagination.page]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Process Payout ──────────────────────────────────────────────
  const handleProcessPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessingPayout(true);
    try {
      await api.processPayout({
        driverId: selectedDriver.id,
        amount: parseFloat(payoutAmount),
        method: payoutMethod,
      });
      toast.success('Payout processed successfully');
      setShowPayoutModal(false);
      setPayoutAmount('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  // ─── Export Payments ─────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const blob = await api.exportPayments({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    }
  };

  const formatCurrency = (amount: number) => `RWF ${amount?.toLocaleString() || 0}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading payments...</p>
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign size={24} className="text-green-500" />
              Payment Management
            </h1>
            <p className="text-sm text-gray-400">Monitor all financial transactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 bg-[#0A0E0B] hover:bg-[#1A1E1C] rounded-lg border border-gray-800 transition"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
          <StatCard icon={TrendingUp} label="Total Revenue" value={stats.totalRevenue} change={12} color="green" />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completedRevenue} change={8} color="green" />
          <StatCard icon={Clock} label="Transactions" value={stats.totalCount} change={5} color="blue" />
          <StatCard icon={Wallet} label="Wallet" value={stats.walletTotal} change={3} color="purple" />
          <StatCard icon={Smartphone} label="Mobile Money" value={stats.mobileMoneyTotal} change={10} color="orange" />
          <StatCard icon={Banknote} label="Cash" value={stats.cashTotal} change={-2} color="green" />
          <StatCard icon={CreditCard} label="Card" value={stats.cardTotal || 0} change={15} color="blue" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ride ID, rider, or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          >
            <option value="all">All Status</option>
            <option value="completed">✅ Completed</option>
            <option value="pending">⏳ Pending</option>
            <option value="failed">❌ Failed</option>
            <option value="refunded">↩️ Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          >
            <option value="all">All Methods</option>
            <option value="WALLET">💳 Wallet</option>
            <option value="MOBILE_MONEY">📱 Mobile Money</option>
            <option value="CASH">💵 Cash</option>
            <option value="CARD">💳 Card</option>
          </select>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 bg-[#0A0E0B] border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-green-500 transition"
          />

          <div className="text-sm text-gray-500 flex items-center">
            {payments.length} payments
          </div>
        </div>

        {/* Payments Table - Desktop */}
        <div className="hidden lg:block bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0E0B] border-b border-gray-800">
                <tr>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Ride ID</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Rider</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Driver</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Method</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
                      <p>No payments found</p>
                      <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} onView={setSelectedPayment} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Cards - Mobile */}
        <div className="lg:hidden space-y-3">
          {payments.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No payments found</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setSelectedPayment(payment)}
                className="bg-[#111714] border border-gray-800 rounded-xl p-4 cursor-pointer active:scale-98 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono text-xs text-gray-500">#{payment.rideId?.slice(-8) || 'N/A'}</p>
                    <p className="font-semibold text-white mt-1">{payment.rider?.name || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 ${statusColors[payment.status as keyof typeof statusColors]}`}>
                    {statusIcons[payment.status as keyof typeof statusIcons]}
                    {payment.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    {methodIcons[payment.method as keyof typeof methodIcons]}
                    <span className="text-xs text-gray-400">{payment.method?.replace('_', ' ')}</span>
                  </div>
                  <span className="text-green-500 font-bold">RWF {payment.amount?.toLocaleString() || 0}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <span>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 bg-[#0A0E0B] border border-gray-800 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 bg-[#0A0E0B] border border-gray-800 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Payout Requests Section */}
        {payoutRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <Users size={18} className="text-green-500" />
              Driver Payout Requests ({payoutRequests.length})
            </h3>
            <div className="space-y-3">
              {payoutRequests.map((request) => (
                <div key={request.id} className="bg-[#111714] border border-gray-800 rounded-xl p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <User size={20} className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{request.driver?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{request.driver?.vehicleNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Requested</p>
                        <p className="text-lg font-bold text-yellow-500">RWF {request.amount?.toLocaleString() || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Available Balance</p>
                        <p className="text-sm font-semibold text-green-500">RWF {request.driver?.balance?.toLocaleString() || 0}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDriver(request.driver);
                          setPayoutAmount(request.amount.toString());
                          setShowPayoutModal(true);
                        }}
                        className="px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-semibold hover:bg-green-400 transition"
                      >
                        Process Payout
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedPayment(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Transaction ID</p>
                  <p className="font-mono text-sm text-white mt-1">{selectedPayment.id?.slice(-12)}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Ride ID</p>
                  <p className="font-mono text-sm text-white mt-1">#{selectedPayment.rideId?.slice(-8)}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Amount</p>
                  <p className="text-xl font-bold text-green-500 mt-1">RWF {selectedPayment.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    {methodIcons[selectedPayment.method as keyof typeof methodIcons]}
                    <span className="text-white">{selectedPayment.method?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[selectedPayment.status as keyof typeof statusColors]}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                  <p className="text-gray-500 text-xs">Date</p>
                  <p className="text-sm text-white mt-1">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
                {selectedPayment.rider && (
                  <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800 col-span-2">
                    <p className="text-gray-500 text-xs">Rider</p>
                    <p className="text-sm text-white mt-1">{selectedPayment.rider.name}</p>
                    <p className="text-xs text-gray-500">{selectedPayment.rider.phone}</p>
                  </div>
                )}
                {selectedPayment.driver && (
                  <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800 col-span-2">
                    <p className="text-gray-500 text-xs">Driver</p>
                    <p className="text-sm text-white mt-1">{selectedPayment.driver.name}</p>
                    <p className="text-xs text-gray-500">{selectedPayment.driver.vehicleNumber} • {selectedPayment.driver.phone}</p>
                  </div>
                )}
              </div>
              <button className="w-full bg-green-500/10 text-green-500 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-500/20 transition">
                <Download size={16} /> Download Receipt
              </button>
            </div>
          </div>
        </>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedDriver && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowPayoutModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Process Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-[#1A1E1C] rounded-lg">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0A0E0B] rounded-lg p-3 border border-gray-800">
                <p className="text-gray-500 text-xs">Driver</p>
                <p className="font-semibold text-white mt-1">{selectedDriver.name}</p>
                <p className="text-xs text-gray-500">{selectedDriver.vehicleNumber}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-2">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition"
                >
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="wallet">💳 Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 text-xs mb-2">Amount (RWF)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-[#0A0E0B] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleProcessPayout}
                  disabled={processingPayout}
                  className="flex-1 bg-green-500 text-black py-3 rounded-lg font-semibold hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayout ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Payout'
                  )}
                </button>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-[#0A0E0B] text-gray-400 py-3 rounded-lg hover:text-white transition border border-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

