// app/passenger/wallet/transactions/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ChevronLeft, 
  CheckCircle, 
  Clock, 
  XCircle,
  Copy,
  Share2,
  Receipt,
  Calendar,
  CreditCard,
  User,
  Mail,
  Phone
} from "lucide-react";
import { useWalletStore } from "@/store/wallet.store";

export default function TransactionDetailPage() {
  const params = useParams();
  const { transactions } = useWalletStore();
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    const tx = transactions.find(t => t.id === params.id);
    setTransaction(tx);
  }, [params.id, transactions]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-[#080C09] text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <Receipt size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Transaction not found</p>
          <Link href="/passenger/wallet/transactions" className="text-green-500 text-sm mt-2 inline-block">
            ← Back to transactions
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={24} className="text-green-500" />;
      case "pending":
        return <Clock size={24} className="text-yellow-500" />;
      case "failed":
        return <XCircle size={24} className="text-red-500" />;
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

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger/wallet/transactions" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>

        {/* Status Card */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6 text-center">
          <div className="flex justify-center mb-3">
            {getStatusIcon(transaction.status)}
          </div>
          <h2 className={`text-xl font-bold ${getStatusColor(transaction.status)}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {transaction.type === "credit" ? "Money received" : "Money sent"}
          </p>
        </div>

        {/* Amount Card */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Amount</p>
          <div className={`text-3xl font-bold ${
            transaction.type === "credit" ? "text-green-500" : "text-red-500"
          }`}>
            {transaction.type === "credit" ? "+" : "-"}RWF {transaction.amount.toLocaleString()}
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Transaction Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Description</span>
              <span className="text-sm font-medium">{transaction.description}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Reference</span>
              <span className="text-sm font-mono text-gray-300">{transaction.reference}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Date</span>
              <span className="text-sm">{new Date(transaction.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Time</span>
              <span className="text-sm">{new Date(transaction.date).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Method</span>
              <span className="text-sm">{transaction.method || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-400">Status</span>
              <span className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-[#111714] border border-gray-800 rounded-xl hover:border-gray-700 transition flex items-center justify-center gap-2 text-sm">
            <Copy size={16} />
            Copy Reference
          </button>
          <button className="flex-1 py-3 bg-[#111714] border border-gray-800 rounded-xl hover:border-gray-700 transition flex items-center justify-center gap-2 text-sm">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}