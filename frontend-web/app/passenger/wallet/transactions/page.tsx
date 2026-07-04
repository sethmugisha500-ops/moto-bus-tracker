// app/passenger/wallet/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useWalletStore } from "@/store/wallet.store";

export default function TransactionsPage() {
  const { transactions, fetchTransactions, isLoading } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  useEffect(() => {
    fetchTransactions({ limit: 50 });
  }, []);

  useEffect(() => {
    let filtered = transactions;
    
    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType, filterStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger/wallet" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <span className="ml-auto text-xs text-gray-500 bg-[#141C15] px-3 py-1 rounded-full border border-gray-700">
            {filteredTransactions.length} records
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-3 bg-[#111714] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Type Filters */}
          <div className="flex gap-1 bg-[#111714] border border-gray-800 rounded-xl p-1">
            {["all", "credit", "debit"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                  filterType === type
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 bg-[#111714] border border-gray-800 rounded-xl p-1">
            {["all", "completed", "pending", "failed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                  filterStatus === status
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
              <Search size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No transactions found</p>
              <p className="text-xs text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <span className="flex items-center gap-1 text-xs">
                      {getStatusIcon(tx.status)}
                      <span className={getStatusColor(tx.status)}>
                        {tx.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                    <span className="w-px h-3 bg-gray-700" />
                    <span>{new Date(tx.date).toLocaleTimeString()}</span>
                    <span className="w-px h-3 bg-gray-700" />
                    <span className="font-mono text-[10px]">{tx.reference}</span>
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

        {/* Load More */}
        {filteredTransactions.length >= 10 && (
          <button className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-white transition bg-[#111714] border border-gray-800 rounded-xl">
            Load More
          </button>
        )}
      </div>
    </div>
  );
}