// components/PaymentModal.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  amount: number;
  rideId: string;
  driverName: string;
  paymentMethod?: string;
}

const PAYMENT_METHODS = [
  { id: "MOBILE_MONEY", label: "Mobile Money", icon: "💛", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" },
  { id: "WALLET", label: "Wallet Balance", icon: "💜", color: "bg-purple-500/10 border-purple-500/30 text-purple-500" },
  { id: "CASH", label: "Cash", icon: "💵", color: "bg-green-500/10 border-green-500/30 text-green-500" },
  { id: "CARD", label: "Card", icon: "💳", color: "bg-blue-500/10 border-blue-500/30 text-blue-500" },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  amount, 
  rideId, 
  driverName,
  paymentMethod: initialMethod = "MOBILE_MONEY"
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const [customAmount, setCustomAmount] = useState(amount);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "success" | "error">("form");
  const [transactionId, setTransactionId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Simulate payment processing
  const processPayment = async () => {
    setIsProcessing(true);
    setStep("processing");
    setPaymentStatus("Initializing payment...");

    try {
      // Simulate different stages of payment
      const stages = [
        { msg: "Connecting to Flutterwave...", delay: 1000 },
        { msg: "Processing payment...", delay: 1500 },
        { msg: "Verifying transaction...", delay: 1000 },
      ];

      for (const stage of stages) {
        setPaymentStatus(stage.msg);
        await new Promise(resolve => setTimeout(resolve, stage.delay));
      }

      // Generate mock transaction ID
      const txId = `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setTransactionId(txId);
      
      // Success
      setStep("success");
      setPaymentStatus("Payment completed successfully!");
      
      toast.success(`✅ Payment of RWF ${customAmount.toLocaleString()} successful!`);
      
      // Call the success callback
      setTimeout(() => {
        onPaymentSuccess(txId);
      }, 1500);

    } catch (error) {
      setStep("error");
      setPaymentStatus("Payment failed. Please try again.");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Countdown for auto-close on success
  useEffect(() => {
    if (step === "success") {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111714] border border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#111714] border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h3 className="font-bold text-white">Payment</h3>
              <p className="text-xs text-gray-400">Ride #{rideId.slice(0, 8)}</p>
            </div>
          </div>
          {step === "form" && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "form" && (
            <>
              {/* Amount Display */}
              <div className="mb-6 p-4 bg-[#0A0E0B] rounded-xl border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Amount (RWF)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-bold text-white">
                        {customAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">RWF</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Driver</p>
                    <p className="text-sm font-medium text-green-400">{driverName}</p>
                  </div>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Quick Amounts</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCustomAmount(amt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        customAmount === amt
                          ? "bg-green-500/10 border border-green-500/30 text-green-500"
                          : "bg-[#141C15] border border-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      RWF {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Custom Amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">RWF</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
                    className="w-full pl-14 pr-4 py-3 bg-[#141C15] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 transition"
                    placeholder="Enter amount"
                    min={100}
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        selectedMethod === method.id
                          ? method.color
                          : "bg-[#141C15] border-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <span>{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Note (Optional)</p>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/50 transition placeholder-gray-500"
                  placeholder="What's this for?"
                />
              </div>

              {/* Pay Button */}
              <button
                onClick={processPayment}
                disabled={customAmount <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-400 text-black font-semibold hover:shadow-lg hover:shadow-green-500/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <span>💳</span>
                Pay RWF {customAmount.toLocaleString()}
              </button>

              {/* Transaction Fee */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  Transaction fee: 0 RWF • Instant transfer
                </p>
              </div>
            </>
          )}

          {/* Processing State */}
          {step === "processing" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="w-full h-full border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  💳
                </div>
              </div>
              <h4 className="font-semibold text-white mb-2">Processing Payment</h4>
              <p className="text-sm text-gray-400">{paymentStatus}</p>
              <div className="mt-4 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-progress" />
              </div>
            </div>
          )}

          {/* Success State */}
          {step === "success" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-5xl animate-bounce">
                ✅
              </div>
              <h4 className="font-bold text-green-500 text-xl mb-2">Payment Successful!</h4>
              <p className="text-sm text-gray-400 mb-1">
                RWF {customAmount.toLocaleString()} paid to {driverName}
              </p>
              <p className="text-xs text-gray-500 font-mono">Ref: {transactionId}</p>
              <div className="mt-4 p-3 bg-[#0A0E0B] rounded-xl border border-gray-800">
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-semibold text-green-400">Completed</p>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Closing in {countdown}s...
              </p>
            </div>
          )}

          {/* Error State */}
          {step === "error" && (
            <div className="py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-5xl">
                ❌
              </div>
              <h4 className="font-bold text-red-500 text-xl mb-2">Payment Failed</h4>
              <p className="text-sm text-gray-400 mb-4">{paymentStatus}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3 rounded-xl bg-[#141C15] border border-gray-800 text-white font-medium hover:border-green-500/30 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-orange-500/10 border border-orange-500/15 text-orange-500 font-medium hover:bg-orange-500/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}