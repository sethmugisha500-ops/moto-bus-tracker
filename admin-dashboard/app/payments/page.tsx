'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsAPI } from '@/lib/api';
import { Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock, Download, Wallet, Smartphone, Banknote, TrendingUp, AlertCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const methodIcons = {
  WALLET: <Wallet size={14} className="text-purple-500" />,
  MOBILE_MONEY: <Smartphone size={14} className="text-orange-500" />,
  CASH: <Banknote size={14} className="text-green-500" />,
  CARD: <CreditCard size={14} className="text-blue-500" />,
};

const methodColors = {
  WALLET: 'bg-purple-500/20 text-purple-500',
  MOBILE_MONEY: 'bg-orange-500/20 text-orange-500',
  CASH: 'bg-green-500/20 text-green-500',
  CARD: 'bg-blue-500/20 text-blue-500',
};

const statusColors = {
  completed: 'bg-green-500/20 text-green-500',
  pending: 'bg-yellow-500/20 text-yellow-500',
  failed: 'bg-red-500/20 text-red-500',
  refunded: 'bg-blue-500/20 text-blue-500',
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('mobile_money');

  // Fetch payments
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['payments', search, statusFilter, methodFilter, dateRange],
    queryFn: () => paymentsAPI.getAll({ 
      search, 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      method: methodFilter !== 'all' ? methodFilter : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
    }).then(res => res.data),
    refetchInterval: 30000,
  });

  // Fetch payout requests
  const { data: payoutData, refetch: refetchPayouts } = useQuery({
    queryKey: ['payout-requests'],
    queryFn: () => paymentsAPI.getPayoutRequests().then(res => res.data),
    refetchInterval: 30000,
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: ({ driverId, amount, method }: { driverId: string; amount: number; method: string }) =>
      paymentsAPI.processPayout(driverId, amount, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payout processed successfully');
      setShowPayoutModal(false);
      setPayoutAmount('');
    },
    onError: () => {
      toast.error('Failed to process payout');
    },
  });

  const payments = data?.payments || [];
  const stats = data?.stats || {
    totalRevenue: 0,
    completedRevenue: 0,
    totalCount: 0,
    walletTotal: 0,
    mobileMoneyTotal: 0,
    cashTotal: 0,
  };
  const payoutRequests = payoutData?.requests || [];

  const handleProcessPayout = () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    processPayoutMutation.mutate({
      driverId: selectedDriver.id,
      amount: parseFloat(payoutAmount),
      method: payoutMethod,
    });
  };

  const formatCurrency = (amount: number) => `RWF ${amount?.toLocaleString() || 0}`;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Payment Management</h1>
            <p className="text-muted text-xs">Monitor all financial transactions</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <TrendingUp size={18} className="text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-muted">Total Revenue</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <CheckCircle size={18} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{formatCurrency(stats.completedRevenue)}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Clock size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-500">{stats.totalCount}</p>
            <p className="text-xs text-muted">Transactions</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Wallet size={18} className="text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-500">{formatCurrency(stats.walletTotal)}</p>
            <p className="text-xs text-muted">Wallet</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Smartphone size={18} className="text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-500">{formatCurrency(stats.mobileMoneyTotal)}</p>
            <p className="text-xs text-muted">Mobile Money</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <Banknote size={18} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{formatCurrency(stats.cashTotal)}</p>
            <p className="text-xs text-muted">Cash</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by ride ID, rider, or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Methods</option>
            <option value="WALLET">Wallet</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Payments Table - Desktop */}
        <div className="hidden md:block bg-darkCard border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-darkInput border-b border-border">
                <tr>
                  <th className="text-left p-4 text-muted font-medium text-sm">Ride ID</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Rider</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Driver</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Amount</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Method</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Status</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Date</th>
                  <th className="text-left p-4 text-muted font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-darkInput/50 transition-all">
                    <td className="p-4 font-mono text-sm">#{payment.rideId?.slice(-8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium">{payment.rider?.name}</p>
                        <p className="text-xs text-muted">{payment.rider?.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm">{payment.driver?.name || 'N/A'}</p>
                        <p className="text-xs text-muted">{payment.driver?.vehicleNumber}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary font-semibold">RWF {payment.amount?.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {methodIcons[payment.method as keyof typeof methodIcons]}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${methodColors[payment.method as keyof typeof methodColors]}`}>
                          {payment.method?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[payment.status as keyof typeof statusColors]}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 rounded-lg hover:bg-darkInput transition-all"
                      >
                        <Eye size={16} className="text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {payments.map((payment: any) => (
            <div
              key={payment.id}
              onClick={() => setSelectedPayment(payment)}
              className="bg-darkCard border border-border rounded-xl p-4 cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-muted">#{payment.rideId?.slice(-8)}</p>
                  <p className="font-semibold mt-1">{payment.rider?.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusColors[payment.status as keyof typeof statusColors]}`}>
                  {payment.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  {methodIcons[payment.method as keyof typeof methodIcons]}
                  <span className="text-xs text-muted">{payment.method}</span>
                </div>
                <span className="text-primary font-semibold">RWF {payment.amount?.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted mt-2">
                {new Date(payment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {payments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-muted" />
            </div>
            <p className="text-muted">No payments found</p>
            <p className="text-xs text-muted mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Payout Requests Section */}
        {payoutRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone size={16} className="text-primary" />
              Driver Payout Requests ({payoutRequests.length})
            </h3>
            <div className="space-y-3">
              {payoutRequests.map((request: any) => (
                <div key={request.id} className="bg-darkCard border border-border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg">👨‍✈️</span>
                      </div>
                      <div>
                        <p className="font-semibold">{request.driver?.name}</p>
                        <p className="text-xs text-muted">{request.driver?.vehicleNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted">Requested Amount</p>
                        <p className="text-lg font-bold text-primary">RWF {request.amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">Available Balance</p>
                        <p className="text-sm font-semibold text-green-500">RWF {request.driver?.balance?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDriver(request.driver);
                          setPayoutAmount(request.amount.toString());
                          setShowPayoutModal(true);
                        }}
                        className="bg-primary text-dark px-4 py-2 rounded-lg text-sm font-semibold"
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
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-darkInput rounded-full">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Transaction ID</p>
                  <p className="font-mono text-sm mt-1">{selectedPayment.id?.slice(-12)}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Ride ID</p>
                  <p className="font-mono text-sm mt-1">#{selectedPayment.rideId?.slice(-8)}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Amount</p>
                  <p className="text-xl font-bold text-primary mt-1">RWF {selectedPayment.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    {methodIcons[selectedPayment.method as keyof typeof methodIcons]}
                    <span>{selectedPayment.method}</span>
                  </div>
                </div>
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${statusColors[selectedPayment.status as keyof typeof statusColors]}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Date</p>
                  <p className="text-sm mt-1">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button className="w-full bg-primary/10 text-primary py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
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
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Process Payout</h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-darkInput rounded-full">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-darkInput rounded-lg p-3">
                <p className="text-muted text-xs">Driver</p>
                <p className="font-semibold mt-1">{selectedDriver.name}</p>
                <p className="text-xs text-muted">{selectedDriver.vehicleNumber}</p>
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-muted text-xs mb-2">Amount (RWF)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleProcessPayout}
                  disabled={processPayoutMutation.isPending}
                  className="flex-1 bg-primary text-dark py-3 rounded-lg font-semibold"
                >
                  {processPayoutMutation.isPending ? 'Processing...' : 'Process Payout'}
                </button>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-darkInput text-white py-3 rounded-lg font-semibold"
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