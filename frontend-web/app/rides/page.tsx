'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, ArrowUp, ArrowDown, Plus, CreditCard, History } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function WalletPage() {
  const { user, updateWalletBalance } = useAuthStore();
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/transactions');
      return response.data;
    },
  });

  const handleTopUp = async () => {
    setIsProcessing(true);
    try {
      // Implement MTN Mobile Money integration
      const response = await apiClient.post('/wallet/topup', {
        amount: parseFloat(amount),
        method: 'MOBILE_MONEY',
      });
      
      updateWalletBalance(user?.wallet?.balance || 0 + parseFloat(amount));
      setShowTopUp(false);
      setAmount('');
    } catch (error) {
      console.error('Top up failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 mb-8 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium opacity-90">Total Balance</h2>
            <Wallet className="w-8 h-8 opacity-90" />
          </div>
          <div className="text-4xl font-bold mb-6">
            {user?.wallet?.balance?.toLocaleString() || 0} RWF
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex-1 bg-white text-yellow-500 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Top Up
            </button>
            <button className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors">
              Withdraw
            </button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <CreditCard className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="font-semibold text-gray-800">Mobile Money</div>
            <div className="text-sm text-gray-500">Quick top up</div>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <History className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="font-semibold text-gray-800">Transaction History</div>
            <div className="text-sm text-gray-500">View all</div>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions?.slice(0, 5).map((transaction: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'CREDIT' ? (
                      <ArrowDown className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'CREDIT' ? '+' : '-'}
                  {transaction.amount.toLocaleString()} RWF
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Up Modal */}
        {showTopUp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Top Up Wallet</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (RWF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select className="input-field">
                  <option>MTN Mobile Money</option>
                  <option>Airtel Money</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTopUp(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={isProcessing || !amount}
                  className="flex-1 btn-primary"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}