// app/passenger/wallet/request/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ArrowDownCircle, 
  User, 
  Phone, 
  Check,
  Loader2,
  AlertCircle,
  Copy,
  Share2
} from "lucide-react";
import { useWalletStore } from "@/store/wallet.store";

export default function RequestMoneyPage() {
  const { wallet } = useWalletStore();
  const [amount, setAmount] = useState("");
  const [requester, setRequester] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [requestLink, setRequestLink] = useState("");

  const handleRequest = async () => {
    const numAmount = parseFloat(amount);
    
    if (!requester) {
      setError("Please enter your name");
      return;
    }
    
    if (isNaN(numAmount) || numAmount < 100) {
      setError("Please enter a valid amount (minimum 100 RWF)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate creating request
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRequestLink(`https://motobus.com/request/${Date.now()}`);
      setSuccess(true);
    } catch (err) {
      setError("Failed to create request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(requestLink);
    // Show toast notification
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#080C09] text-white p-4 flex items-center justify-center">
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowDownCircle size={40} className="text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
          <p className="text-gray-400 text-sm mb-4">
            RWF {parseFloat(amount).toLocaleString()} requested from contacts
          </p>
          
          <div className="bg-[#0A0E0B] border border-gray-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Request Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-300 truncate">{requestLink}</code>
              <button 
                onClick={copyLink}
                className="p-2 hover:bg-[#141C15] rounded-lg transition"
              >
                <Copy size={16} className="text-gray-400" />
              </button>
              <button className="p-2 hover:bg-[#141C15] rounded-lg transition">
                <Share2 size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          <Link
            href="/passenger/wallet"
            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-400 transition inline-block"
          >
            Done
          </Link>
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
          <h1 className="text-2xl font-bold">Request Money</h1>
        </div>

        {/* Instructions */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ArrowDownCircle size={20} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-300">Share your request link with friends</p>
              <p className="text-xs text-gray-500">They can pay you directly to your wallet</p>
            </div>
          </div>
        </div>

        {/* Requester Name */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Your Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-10 pr-4 py-3 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Amount to Request (RWF)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">RWF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 pl-16 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Note */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="w-full px-4 py-3 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition placeholder-gray-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Request Button */}
        <button
          onClick={handleRequest}
          disabled={loading || !requester || !amount}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating Request...
            </>
          ) : (
            <>
              <ArrowDownCircle size={18} />
              Create Request
            </>
          )}
        </button>
      </div>
    </div>
  );
}
