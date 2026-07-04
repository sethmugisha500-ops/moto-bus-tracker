// app/passenger/wallet/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Check, 
  Loader2, 
  Shield, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  QrCode,
  Phone,
  Mail,
  Building,
  User,
  Clock,
  X,
  FileCheck,
  Circle,
  Info
} from "lucide-react";
import { useWalletStore, useWalletBalance } from "@/store/wallet.store";
import walletService from "@/services/wallet.service";

// ── Payment Methods ──────────────────────────────────────────────
const PAYMENT_METHODS = [
  { 
    id: "momo", 
    label: "MTN MoMo", 
    icon: "💛", 
    description: "Pay with MTN Mobile Money", 
    popular: true,
    color: "bg-yellow-500/10 border-yellow-500/20"
  },
  { 
    id: "airtel", 
    label: "Airtel Money", 
    icon: "🔴", 
    description: "Pay with Airtel Money", 
    popular: false,
    color: "bg-red-500/10 border-red-500/20"
  },
  { 
    id: "mpesa", 
    label: "M-Pesa", 
    icon: "💚", 
    description: "Pay with M-Pesa", 
    popular: false,
    color: "bg-green-500/10 border-green-500/20"
  },
  { 
    id: "card", 
    label: "Credit/Debit Card", 
    icon: "💳", 
    description: "Pay with Visa, Mastercard", 
    popular: false,
    color: "bg-blue-500/10 border-blue-500/20"
  },
  { 
    id: "wallet", 
    label: "Wallet Balance", 
    icon: "💜", 
    description: "Use your MotoBus wallet", 
    popular: false,
    color: "bg-purple-500/10 border-purple-500/20"
  },
];

const AMOUNT_PRESETS = [1000, 2000, 5000, 10000, 20000, 50000];

// ── Flutterwave Payment Modal ────────────────────────────────────
const FlutterwaveModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  method, 
  onSuccess, 
  onError 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  amount: number; 
  method: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}) => {
  const [step, setStep] = useState<"init" | "processing" | "confirming" | "done" | "error">("init");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("init");
      setPhoneNumber("");
      setOtp("");
      setShowOTP(false);
      setErrorMessage("");
      setCountdown(30);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOTP && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOTP, countdown]);

  const handleInitiatePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage("Please enter a valid phone number");
      return;
    }

    setStep("processing");
    setErrorMessage("");

    try {
      // Simulate Flutterwave payment initiation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep("confirming");
      setShowOTP(true);
      setCountdown(30);
    } catch (error) {
      setErrorMessage("Failed to initiate payment");
      setStep("init");
    }
  };

  const handleConfirmPayment = async () => {
    if (!otp || otp.length < 4) {
      setErrorMessage("Please enter the OTP sent to your phone");
      return;
    }

    setStep("processing");
    setErrorMessage("");

    try {
      // Simulate payment processing with Flutterwave
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 90% success rate
      const isSuccess = Math.random() < 0.9;

      if (isSuccess) {
        setStep("done");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error("Payment failed. Please try again.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Payment processing failed");
      setStep("error");
    }
  };

  const handleResendOTP = () => {
    setCountdown(30);
    // Simulate resending OTP
    console.log("📱 OTP resent to", phoneNumber);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111714] border border-gray-800 rounded-2xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Flutterwave Payment
            </h3>
            <p className="text-xs text-gray-400">Secure payment processing</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[#1a221b] rounded-lg transition text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Payment Flow */}
        {step === "init" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#0a0e0b] rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="font-bold text-green-500">RWF {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Method</span>
                <span className="text-gray-300">{method}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Fee</span>
                <span className="text-gray-300">RWF 0</span>
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Phone Number
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="0788888888"
                  className={`w-full pl-10 pr-4 py-3 bg-[#0a0e0b] border rounded-xl text-white focus:outline-none transition ${
                    errorMessage ? 'border-red-500' : 'border-gray-700 focus:border-green-500'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter your phone number to receive payment confirmation</p>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#0a0e0b] px-3 py-2 rounded-lg border border-gray-800">
              <Lock size={12} />
              <span>256-bit SSL encrypted</span>
              <span className="w-px h-3 bg-gray-700" />
              <span>Powered by Flutterwave</span>
            </div>

            <button
              onClick={handleInitiatePayment}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Continue to Payment</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2">Processing Payment</h4>
            <p className="text-sm text-gray-400">Please wait while we process your payment...</p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}

        {step === "confirming" && showOTP && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={32} className="text-green-500" />
              </div>
              <h4 className="text-lg font-bold">Confirm Payment</h4>
              <p className="text-sm text-gray-400">
                Enter the OTP sent to <span className="text-green-500">{phoneNumber}</span>
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setErrorMessage("");
                }}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className={`w-full px-4 py-3 bg-[#0a0e0b] border rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none transition ${
                  errorMessage ? 'border-red-500' : 'border-gray-700 focus:border-green-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Time remaining: {countdown}s</span>
              {countdown === 0 && (
                <button
                  onClick={handleResendOTP}
                  className="text-green-500 hover:text-green-400 transition"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Confirm Payment
            </button>

            <button
              onClick={() => {
                setStep("init");
                setShowOTP(false);
                setErrorMessage("");
              }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <FileCheck size={40} className="text-green-500 relative z-10" />
            </div>
            <h4 className="text-xl font-bold text-green-500 mb-2">Payment Successful!</h4>
            <p className="text-sm text-gray-400">RWF {amount.toLocaleString()} has been added to your wallet</p>
            <div className="mt-2 text-xs text-gray-500">Transaction ID: FLW-{Date.now().toString().slice(-8)}</div>
          </div>
        )}

        {step === "error" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Circle size={40} className="text-red-500" />
            </div>
            <h4 className="text-xl font-bold text-red-500 mb-2">Payment Failed</h4>
            <p className="text-sm text-gray-400">{errorMessage}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setStep("init");
                  setErrorMessage("");
                }}
                className="flex-1 py-2 bg-[#0a0e0b] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-green-500 text-black rounded-lg text-sm font-semibold hover:bg-green-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Lock size={12} />
            Secure
          </span>
          <span>Powered by Flutterwave</span>
          <span className="flex items-center gap-1">
            <Shield size={12} />
            Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
export default function PaymentPage() {
  const router = useRouter();
  const { wallet, updateBalance, initiatePayment, processPayment } = useWalletStore();
  const balance = useWalletBalance();
  
  const [selectedMethod, setSelectedMethod] = useState("momo");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFlutterwaveModal, setShowFlutterwaveModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"init" | "processing" | "confirming" | "done">("init");

  // ── Apply Promo Code ────────────────────────────────────────────
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setError("Please enter a promo code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await walletService.validatePromoCode(promoCode);
      if (result.valid) {
        setDiscount(result.discount);
        setError("");
      } else {
        setDiscount(0);
        setError(result.message || "Invalid promo code");
      }
    } catch (err) {
      setError("Failed to validate promo code");
      setDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  // ── Process Payment ─────────────────────────────────────────────
  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      setError("Please enter a valid amount (minimum 100 RWF)");
      return;
    }

    if (numAmount > 1000000) {
      setError("Maximum amount is 1,000,000 RWF");
      return;
    }

    setError("");
    setPaymentStep("processing");
    setIsProcessing(true);

    try {
      // Step 1: Initiate Payment with backend
      const finalAmount = getFinalAmount();
      const payment = await initiatePayment({
        amount: finalAmount,
        method: selectedMethod,
        promoCode: discount > 0 ? promoCode : undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "web",
          flutterwave: true
        }
      });

      setTransactionId(payment.transactionId);
      
      // Step 2: Show Flutterwave payment modal
      setShowFlutterwaveModal(true);
      setPaymentStep("confirming");

    } catch (err: any) {
      setError(err.message || "Payment initiation failed. Please try again.");
      setPaymentStep("init");
      setIsProcessing(false);
    }
  };

  // ── Handle Flutterwave Success ──────────────────────────────────
  const handleFlutterwaveSuccess = async () => {
    try {
      // Step 3: Process payment confirmation
      const result = await processPayment(transactionId);
      
      if (result.success) {
        // Update wallet balance
        const finalAmount = getFinalAmount();
        updateBalance(finalAmount);
        setSuccess(true);
        setPaymentStep("done");

        // Redirect after success
        setTimeout(() => {
          router.push('/passenger/wallet');
        }, 2500);
      } else {
        throw new Error(result.message || "Payment failed");
      }
    } catch (err: any) {
      setError(err.message || "Payment confirmation failed");
      setPaymentStep("init");
    } finally {
      setIsProcessing(false);
      setShowFlutterwaveModal(false);
    }
  };

  // ── Handle Flutterwave Error ────────────────────────────────────
  const handleFlutterwaveError = (error: string) => {
    setError(error || "Payment failed. Please try again.");
    setPaymentStep("init");
    setIsProcessing(false);
    setShowFlutterwaveModal(false);
  };

  // ── Get Final Amount ────────────────────────────────────────────
  const getFinalAmount = () => {
    const numAmount = parseFloat(amount) || 0;
    if (discount > 0) {
      return Math.round(numAmount - (numAmount * discount / 100));
    }
    return numAmount;
  };

  // ── Reset Payment ──────────────────────────────────────────────
  const resetPayment = () => {
    setError("");
    setSuccess(false);
    setPaymentStep("init");
    setTransactionId("");
    setAmount("");
    setDiscount(0);
    setPromoCode("");
    setIsProcessing(false);
  };

  // ── Success Screen ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#080C09] text-white p-4 flex items-center justify-center">
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 max-w-md text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-500/5 animate-pulse" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
              <FileCheck size={40} className="text-green-500 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-400 text-sm mb-1">
              RWF {getFinalAmount().toLocaleString()} has been added to your wallet
            </p>
            <p className="text-xs text-gray-500 font-mono mb-4">
              Transaction ID: {transactionId}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-500 mb-6">
              <Check size={16} />
              <span>Payment confirmed via Flutterwave</span>
            </div>
            <Link
              href="/passenger/wallet"
              className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition inline-block"
            >
              Go to Wallet
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold">Add Money</h1>
          <span className="ml-auto text-xs text-gray-500 bg-[#141C15] px-3 py-1 rounded-full border border-gray-700 flex items-center gap-1">
            <Sparkles size={12} className="text-green-500" />
            Powered by Flutterwave
          </span>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#141C15] px-4 py-2 rounded-xl border border-gray-700 mb-6">
          <Lock size={14} />
          <span>Secure payment • 256-bit SSL encryption</span>
          <span className="w-px h-3 bg-gray-700" />
          <span className="flex items-center gap-1">
            <Shield size={12} />
            PCI DSS Compliant
          </span>
        </div>

        {/* Current Balance */}
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-3 mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Current Balance</span>
          <span className="text-sm font-bold text-green-500">RWF {balance?.toLocaleString() || 0}</span>
        </div>

        {/* Amount Input */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Enter Amount (RWF)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">RWF</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="0"
              className={`w-full px-4 py-3 pl-16 bg-[#0A0E0B] border rounded-xl text-white text-2xl font-bold focus:outline-none transition ${
                error ? 'border-red-500' : 'border-gray-700 focus:border-green-500'
              }`}
            />
          </div>
          
          {/* Amount Presets */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setAmount(String(preset));
                  setError("");
                }}
                className={`py-2 bg-[#0A0E0B] border rounded-lg text-sm transition ${
                  parseFloat(amount) === preset 
                    ? 'border-green-500 text-green-500' 
                    : 'border-gray-700 hover:border-green-500/30'
                }`}
              >
                RWF {preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Promo Code */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Promo code"
              className="flex-1 px-4 py-2 bg-[#0A0E0B] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
            />
            <button
              onClick={handleApplyPromo}
              disabled={loading}
              className="px-4 py-2 bg-[#141C15] border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white hover:border-green-500/30 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
            </button>
          </div>
          
          {discount > 0 && (
            <div className="mt-2 text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 flex items-center gap-2">
              <Sparkles size={12} />
              🎉 {discount}% discount applied! You saved RWF {((parseFloat(amount) || 0) * discount / 100).toLocaleString()}
            </div>
          )}
          
          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-2">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <CreditCard size={16} />
          Select Payment Method
        </h3>
        <div className="space-y-2 mb-6">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                setSelectedMethod(method.id);
                setError("");
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition ${
                selectedMethod === method.id
                  ? `${method.color} border-green-500/30 shadow-lg shadow-green-500/5`
                  : "bg-[#111714] border-gray-800 hover:border-gray-700"
              }`}
            >
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{method.label}</p>
                <p className="text-xs text-gray-400">{method.description}</p>
              </div>
              {method.popular && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                  <Sparkles size={10} />
                  Popular
                </span>
              )}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === method.id
                  ? "border-green-500 bg-green-500"
                  : "border-gray-600"
              }`}>
                {selectedMethod === method.id && <Check size={12} className="text-black" />}
              </div>
            </button>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">Amount</span>
            <span className="font-medium">RWF {parseFloat(amount || "0").toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Discount ({discount}%)</span>
              <span className="text-green-500 font-medium">-RWF {((parseFloat(amount) || 0) * discount / 100).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Total</span>
            <span className="text-xl font-bold text-green-500">RWF {getFinalAmount().toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-800 mt-2 text-xs text-gray-500">
            <span>Transaction fee: RWF 0</span>
            <span>Processing time: Instant</span>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !amount || isProcessing}
          className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-400 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading || isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {paymentStep === "processing" && "Initiating payment..."}
              {paymentStep === "confirming" && "Confirming..."}
              {!paymentStep && "Processing..."}
            </>
          ) : (
            <>
              <span>Pay RWF {getFinalAmount().toLocaleString()}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
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
          <span className="flex items-center gap-1">
            <Check size={12} />
            Instant
          </span>
          <span className="w-px h-3 bg-gray-700" />
          <span className="flex items-center gap-1">
            <Clock size={12} />
            24/7 Support
          </span>
        </div>

        <p className="text-[10px] text-gray-600 text-center mt-4">
          🔒 Powered by Flutterwave • Your payment is secure and encrypted
        </p>
      </div>

      {/* Flutterwave Payment Modal */}
      <FlutterwaveModal
        isOpen={showFlutterwaveModal}
        onClose={() => {
          setShowFlutterwaveModal(false);
          setIsProcessing(false);
          setPaymentStep("init");
        }}
        amount={getFinalAmount()}
        method={PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || "Mobile Money"}
        onSuccess={handleFlutterwaveSuccess}
        onError={handleFlutterwaveError}
      />
    </div>
  );
}