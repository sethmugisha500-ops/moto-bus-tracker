// app/passenger/wallet/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  Plus, 
  Send, 
  ArrowDownCircle, 
  CreditCard,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  QrCode,
  MoreVertical,
  ChevronRight,
  Phone,
  Mail,
  Building,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2
} from "lucide-react";
import { useWalletStore, useWalletBalance, useWalletStats } from "@/store/wallet.store";

export default function WalletPage() {
  const router = useRouter();
  const { wallet, fetchWallet, fetchTransactions, isLoading, error } = useWalletStore();
  const balance = useWalletBalance();
  const stats = useWalletStats();
  const [activeTab, setActiveTab] = useState<"all" | "credit" | "debit">("all");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions({ limit: 10 });
  }, []);

  // Filter transactions based on active tab
  useEffect(() => {
    if (wallet?.transactions) {
      let filtered = wallet.transactions;
      if (activeTab === "credit") {
        filtered = filtered.filter(tx => tx.type === "credit");
      } else if (activeTab === "debit") {
        filtered = filtered.filter(tx => tx.type === "debit");
      }
      setTransactions(filtered.slice(0, 10));
    }
  }, [wallet?.transactions, activeTab]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={14} className="text-green-500" />;
      case "pending":
        return <Clock size={14} className="text-yellow-500" />;
      case "failed":
        return <XCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C09] text-white flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">💳 Wallet</h1>
            <p className="text-sm text-gray-400">Manage your finances</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-[#111714] border border-gray-800 rounded-xl hover:border-gray-700 transition">
              <QrCode size={20} className="text-gray-400" />
            </button>
            <button className="p-2 bg-[#111714] border border-gray-800 rounded-xl hover:border-gray-700 transition">
              <MoreVertical size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Available Balance</span>
              <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                RWF
              </span>
            </div>
            <div className="text-4xl font-bold mb-1">
              RWF {balance.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Wallet ID: {wallet?.id?.slice(0, 8) || 'N/A'}</span>
              <span className="w-px h-3 bg-gray-700" />
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${wallet ? 'bg-green-500' : 'bg-gray-500'}`} />
                {wallet ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2 mt-6 relative z-10">
            <Link
              href="/passenger/wallet/payment"
              className="flex flex-col items-center gap-2 p-3 bg-[#0A0E0B] rounded-xl border border-gray-800 hover:border-green-500/30 transition group"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition">
                <Plus size={18} className="text-green-500" />
              </div>
              <span className="text-xs text-gray-400">Add Money</span>
            </Link>

            <button
              onClick={() => router.push('/passenger/wallet/send')}
              className="flex flex-col items-center gap-2 p-3 bg-[#0A0E0B] rounded-xl border border-gray-800 hover:border-green-500/30 transition group"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition">
                <Send size={18} className="text-blue-500" />
              </div>
              <span className="text-xs text-gray-400">Send</span>
            </button>

            <button
              onClick={() => router.push('/passenger/wallet/request')}
              className="flex flex-col items-center gap-2 p-3 bg-[#0A0E0B] rounded-xl border border-gray-800 hover:border-green-500/30 transition group"
            >
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition">
                <ArrowDownCircle size={18} className="text-purple-500" />
              </div>
              <span className="text-xs text-gray-400">Request</span>
            </button>

            <button
              onClick={() => router.push('/passenger/wallet/methods')}
              className="flex flex-col items-center gap-2 p-3 bg-[#0A0E0B] rounded-xl border border-gray-800 hover:border-green-500/30 transition group"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition">
                <CreditCard size={18} className="text-orange-500" />
              </div>
              <span className="text-xs text-gray-400">Methods</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total Spent</span>
              <TrendingDown size={14} className="text-red-400" />
            </div>
            <div className="text-lg font-bold mt-1">RWF {stats.totalSpent.toLocaleString()}</div>
          </div>
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total Received</span>
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <div className="text-lg font-bold mt-1">RWF {stats.totalReceived.toLocaleString()}</div>
          </div>
        </div>

        {/* Transactions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            Transactions
          </h2>
          <Link 
            href="/passenger/wallet/transactions"
            className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            View All
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {["all", "credit", "debit"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === tab
                  ? "bg-green-500 text-black"
                  : "bg-[#111714] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
              <History size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No transactions yet</p>
              <p className="text-xs text-gray-600">Start using your wallet to see transactions here</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <Link
                key={tx.id}
                href={`/passenger/wallet/transactions/${tx.id}`}
                className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "credit" 
                    ? "bg-green-500/10" 
                    : "bg-red-500/10"
                }`}>
                  {tx.type === "credit" 
                    ? <ArrowDownLeft size={18} className="text-green-500" />
                    : <ArrowUpRight size={18} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                    <span className="w-px h-3 bg-gray-700" />
                    <span className="flex items-center gap-1">
                      {getStatusIcon(tx.status)}
                      <span className={getStatusColor(tx.status)}>
                        {tx.status}
                      </span>
                    </span>
                  </div>
                </div>
                <div className={`font-bold ${
                  tx.type === "credit" ? "text-green-500" : "text-red-500"
                }`}>
                  {tx.type === "credit" ? "+" : "-"}RWF {tx.amount.toLocaleString()}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Payment Methods Quick Link */}
        <Link
          href="/passenger/wallet/methods"
          className="mt-6 bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800/30 rounded-full flex items-center justify-center">
              <CreditCard size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Payment Methods</p>
              <p className="text-xs text-gray-400">Manage your payment options</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      </div>
    </div>
  );
}