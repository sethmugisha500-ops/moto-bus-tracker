// app/passenger/wallet/send/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Send,
  User,
  Phone,
  Mail,
  Check,
  Loader2,
  AlertCircle,
  ArrowRight,
  Users,
  QrCode
} from "lucide-react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useWalletStore } from "@/store/wallet.store";

const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "";

const RECENT_CONTACTS = [
  { id: 1, name: "John Doe", phone: "0788123456", avatar: "JD" },
  { id: 2, name: "Jane Smith", phone: "0788234567", avatar: "JS" },
  { id: 3, name: "Alice Johnson", phone: "0788345678", avatar: "AJ" },
];

export default function SendMoneyPage() {
  const router = useRouter();
  const { wallet, fetchWallet, fetchTransactions } = useWalletStore();
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState("");
  const [selectedContact, setSelectedContact] = useState<typeof RECENT_CONTACTS[0] | null>(null);

  const validate = (): string | null => {
    if (!recipient.trim()) return "Please enter recipient phone number";

    const phoneDigits = recipient.replace(/\D/g, "");
    if (phoneDigits.length < 9) return "Please enter a valid phone number";

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) return "Please enter a valid amount (minimum 100 RWF)";

    if (numAmount > (wallet?.balance || 0)) return "Insufficient balance";

    return null;
  };

  const numAmount = parseFloat(amount) || 0;

  // ── Flutterwave Config (test mode) ──────────────────────────────
  const flutterwaveConfig = {
    public_key: FLW_PUBLIC_KEY,
    tx_ref: `motobus-send-${Date.now()}`,
    amount: numAmount,
    currency: "RWF",
    payment_options: "mobilemoneyrwanda,card",
    customer: {
      email: "sethmugisha500@gmaial.com",
      phone_number: recipient || "0798750913",
      name: recipientName || "MotoBus Wallet Transfer",
    },
    customizations: {
      title: "MotoBus Wallet Transfer",
      description: `Send RWF ${numAmount.toLocaleString()} to ${recipientName || recipient}`,
      logo: "https://your-logo-url.com/logo.png",
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const handleSend = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!FLW_PUBLIC_KEY) {
      setError("Payment system not configured. Please contact support.");
      return;
    }

    setError("");
    setLoading(true);

    // Real Flutterwave test-mode checkout — this is the "simulation":
    // Flutterwave's own test environment handles the realistic delay,
    // success/failure states, and provider UI. No fake setTimeout needed.
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        setLoading(false);

        if (response.status === "successful" || response.status === "completed") {
          setTxId(String(response.transaction_id));

          // Refresh wallet + transactions from the store after a
          // confirmed transfer. Wrapped defensively in case the
          // backend wallet endpoints aren't wired up yet.
          try {
            await fetchWallet();
            await fetchTransactions({ limit: 10 });
          } catch {
            // Non-fatal — Flutterwave already confirmed the transfer.
          }

          setSuccess(true);
          setTimeout(() => {
            router.push("/passenger/wallet");
          }, 2200);
        } else {
          setError("Payment was not completed. Please try again.");
        }
      },
      onClose: () => {
        setLoading(false);
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#080C09] text-white p-4 flex items-center justify-center">
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Money Sent!</h2>
          <p className="text-gray-400 text-sm mb-1">
            RWF {parseFloat(amount).toLocaleString()} sent to {recipientName || recipient}
          </p>
          <p className="text-xs text-gray-500 font-mono">Transaction ID: {txId}</p>
          <p className="text-[10px] text-yellow-500/70 mt-3">
            ⚠️ Flutterwave test mode — no real funds moved
          </p>
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
          <h1 className="text-2xl font-bold">Send Money</h1>
          <span className="ml-auto text-xs text-gray-500 bg-[#141C15] px-3 py-1 rounded-full border border-gray-700">
            Balance: RWF {wallet?.balance?.toLocaleString() || 0}
          </span>
        </div>

        {/* Flutterwave test mode notice */}
        <div className="mb-4 px-3 py-2 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-xs text-yellow-500/80 flex items-center gap-2">
          <AlertCircle size={14} />
          Test mode — powered by Flutterwave sandbox, no real money moves
        </div>

        {/* Recent Contacts */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-400 mb-3">Recent Contacts</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {RECENT_CONTACTS.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setRecipient(contact.phone);
                  setRecipientName(contact.name);
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border transition ${
                  selectedContact?.id === contact.id
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-[#111714] border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {contact.avatar}
                </div>
                <span className="text-xs text-gray-400">{contact.name}</span>
              </button>
            ))}
            <button className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-[#111714] border border-gray-800 rounded-xl hover:border-gray-700 transition">
              <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                <Users size={20} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">Add</span>
            </button>
          </div>
        </div>

        {/* Recipient Input */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Recipient</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="tel"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setSelectedContact(null);
                setRecipientName("");
              }}
              placeholder="Enter phone number"
              className="w-full pl-10 pr-4 py-3 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              <QrCode size={14} />
              Scan QR
            </button>
            <span className="w-px h-3 bg-gray-700" />
            <button className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
              <Users size={14} />
              From Contacts
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Amount (RWF)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">RWF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 pl-16 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="mt-2 flex gap-2">
            {[1000, 2000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                className="px-3 py-1 bg-[#0A0E0B] border border-gray-700 rounded-lg text-xs hover:border-green-500/30 transition"
              >
                RWF {preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Note Input */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="w-full px-4 py-3 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={loading || !recipient || !amount}
          className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Money
            </>
          )}
        </button>

        {/* Fee Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          💰 Transaction fee: 0 RWF • Instant transfer
        </p>
      </div>
    </div>
  );
}