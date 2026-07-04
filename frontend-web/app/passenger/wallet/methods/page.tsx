// app/passenger/wallet/methods/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Wallet,
  Check,
  Plus,
  Trash2,
  Star,
  Shield,
  Lock
} from "lucide-react";

const PAYMENT_METHODS = [
  {
    id: "momo",
    name: "MTN MoMo",
    icon: "💛",
    type: "mobile",
    last4: "8888",
    expiry: "N/A",
    isDefault: true
  },
  {
    id: "airtel",
    name: "Airtel Money",
    icon: "🔴",
    type: "mobile",
    last4: "1234",
    expiry: "N/A",
    isDefault: false
  },
  {
    id: "card",
    name: "Visa •••• 4242",
    icon: "💳",
    type: "card",
    last4: "4242",
    expiry: "12/26",
    isDefault: false
  }
];

const AVAILABLE_METHODS = [
  { id: "mpesa", name: "M-Pesa", icon: "💚", type: "mobile" },
  { id: "bank", name: "Bank Transfer", icon: "🏦", type: "bank" },
  { id: "paypal", name: "PayPal", icon: "💙", type: "digital" },
];

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState(PAYMENT_METHODS);
  const [showAddMethod, setShowAddMethod] = useState(false);

  const setDefaultMethod = (id: string) => {
    setMethods(methods.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
  };

  const removeMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger/wallet" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <span className="ml-auto text-xs text-gray-500 bg-[#141C15] px-3 py-1 rounded-full border border-gray-700">
            <Shield size={12} className="inline mr-1" />
            Secure
          </span>
        </div>

        {/* Security Notice */}
        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 mb-6 flex items-center gap-3">
          <Lock size={16} className="text-green-500" />
          <p className="text-xs text-gray-300">
            Your payment methods are encrypted and secure
          </p>
        </div>

        {/* Active Methods */}
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Active Methods</h3>
        <div className="space-y-3 mb-6">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`bg-[#111714] border rounded-xl p-4 transition ${
                method.isDefault 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{method.name}</p>
                    {method.isDefault && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                        <Star size={10} />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {method.type === "mobile" && "Mobile Money"}
                    {method.type === "card" && `Expires ${method.expiry}`}
                    {method.type === "digital" && "Digital Wallet"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefaultMethod(method.id)}
                      className="text-xs text-gray-400 hover:text-green-500 transition px-2 py-1 rounded-lg hover:bg-green-500/10"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => removeMethod(method.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available Methods */}
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Add Payment Method</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {AVAILABLE_METHODS.map((method) => (
            <button
              key={method.id}
              className="bg-[#111714] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition text-center group"
            >
              <span className="text-3xl block mb-2">{method.icon}</span>
              <p className="text-sm font-medium">{method.name}</p>
              <p className="text-xs text-gray-400 capitalize">{method.type}</p>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition">
                <span className="text-xs text-green-500">+ Add</span>
              </div>
            </button>
          ))}
        </div>

        {/* Add New Method Button */}
        <button
          onClick={() => setShowAddMethod(true)}
          className="w-full py-3 bg-[#111714] border border-dashed border-gray-700 rounded-xl hover:border-green-500/30 transition flex items-center justify-center gap-2 text-gray-400 hover:text-white"
        >
          <Plus size={18} />
          <span>Add New Payment Method</span>
        </button>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Shield size={12} />
            Secure
          </span>
          <span className="w-px h-3 bg-gray-700" />
          <span className="flex items-center gap-1">
            <Lock size={12} />
            Encrypted
          </span>
          <span className="w-px h-3 bg-gray-700" />
          <span>Powered by Flutterwave</span>
        </div>
      </div>
    </div>
  );
}