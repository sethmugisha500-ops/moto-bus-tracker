// app/passenger/wallet/history/page.tsx
"use client";

import { useState, useEffect, useCallback, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ArrowDownLeft, ArrowUpRight, Search, 
  Calendar, Filter, RefreshCw, AlertCircle, Loader2 
} from "lucide-react";
import { useWalletStore } from "@/store/wallet.store";

export default function WalletHistoryPage() {
  const router = useRouter();
  const { transactions, isLoading, error, fetchTransactions } = useWalletStore();
  
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ── Load Transactions ─────────────────────────────────────────────
  const loadTransactions = useCallback(async () => {
    try {
      const filterParams: any = { limit, offset };
      if (filter !== "all") filterParams.status = filter;
      if (searchTerm) filterParams.search = searchTerm;
      
      const result = await fetchTransactions(filterParams);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  }, [filter, limit, offset, searchTerm, fetchTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // ── Refresh ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // ── Load More ──────────────────────────────────────────────────
  const handleLoadMore = () => {
    setOffset(offset + limit);
  };

  // ── Get Status Styles ──────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "failed": return "bg-red-500/20 text-red-500 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "pending": return "Pending";
      case "failed": return "Failed";
      default: return status;
    }
  };

  // ── Filtered Transactions ──────────────────────────────────────
  const filteredTransactions = transactions.filter((tx: { description: string; method: string; reference?: string; }) => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.reference && tx.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading && transactions.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading transactions...</p>
        </div>
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
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto p-2 hover:bg-[#141C15] rounded-xl transition"
          >
            <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={handleRefresh} className="ml-auto text-green-500 hover:text-green-400 text-xs">
              Retry
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "completed", "pending", "failed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-green-500 text-black"
                  : "bg-[#141C15] text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx: { id: Key | null | undefined; type: string; description: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; method: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; date: string | number | Date; amount: { toLocaleString: () => string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }; status: string; }) => (
              <button
                key={tx.id}
                onClick={() => {
                  setSelectedTransaction(tx);
                  setShowDetails(true);
                }}
                className="w-full bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-green-500/30 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "credit" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {tx.type === "credit" ? (
                        <ArrowDownLeft size={16} className="text-green-500" />
                      ) : (
                        <ArrowUpRight size={16} className="text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{tx.method}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-green-500" : "text-red-500"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}RWF {tx.amount.toLocaleString()}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredTransactions.length >= limit && (
          <button
            onClick={handleLoadMore}
            className="w-full mt-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white hover:border-green-500/30 transition"
          >
            Load More
          </button>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowDetails(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-[#111714] rounded-t-2xl z-50 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Transaction Details</h3>
              <button onClick={() => setShowDetails(false)} className="p-2 text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#0A0E0B] rounded-xl">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedTransaction.type === "credit" ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {selectedTransaction.type === "credit" ? (
                    <ArrowDownLeft size={20} className="text-green-500" />
                  ) : (
                    <ArrowUpRight size={20} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedTransaction.description}</p>
                  <p className="text-xs text-gray-400">{selectedTransaction.method}</p>
                </div>
                <div className={`text-xl font-bold ${
                  selectedTransaction.type === "credit" ? "text-green-500" : "text-red-500"
                }`}>
                  {selectedTransaction.type === "credit" ? "+" : "-"}RWF {selectedTransaction.amount.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Transaction ID</span>
                  <span className="text-sm font-mono">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Reference</span>
                  <span className="text-sm font-mono">{selectedTransaction.reference || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Date</span>
                  <span className="text-sm">{new Date(selectedTransaction.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Status</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full border ${getStatusColor(selectedTransaction.status)}`}>
                    {getStatusLabel(selectedTransaction.status)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-sm">{selectedTransaction.method}</span>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
