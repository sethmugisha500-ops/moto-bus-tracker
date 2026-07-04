// app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Shield,
  Car,
  MapPin,
  ArrowLeft,
  WifiOff
} from "lucide-react";
import toast from "react-hot-toast";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda"   },
  { code: "+254", flag: "🇰🇪", name: "Kenya"    },
  { code: "+256", flag: "🇺🇬", name: "Uganda"   },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi"  },
];

const VEHICLE_TYPES = [
  { value: "MOTO", label: "Moto", icon: "🏍️", desc: "Fast & popular for quick commutes" },
  { value: "CAR", label: "Car", icon: "🚗", desc: "Comfortable rides with AC" },
  { value: "BUS", label: "Bus", icon: "🚌", desc: "Fixed route, affordable group travel" },
  { value: "MINIBUS", label: "Mini-Bus", icon: "🚐", desc: "Flexible group transport" },
];

type Step = "role" | "phone" | "otp" | "password" | "driver-details" | "complete";

interface FormData {
  role: "RIDER" | "DRIVER";
  phone: string;
  countryIdx: number;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  isApproved: boolean;
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const [formData, setFormData] = useState<FormData>({
    role: "RIDER",
    phone: "",
    countryIdx: 0,
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    vehicleType: "MOTO",
    vehicleNumber: "",
    vehicleModel: "",
    isApproved: false,
  });

  const [otp, setOtp] = useState("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const country = COUNTRIES[formData.countryIdx];

  // ─── Check API Status on Mount ──────────────────────────────────
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        setApiStatus("online");
        console.log("✅ API is online:", apiUrl);
      } else {
        setApiStatus("offline");
        console.warn("⚠️ API returned error:", response.status);
      }
    } catch (error) {
      setApiStatus("offline");
      console.error("❌ API is offline:", error);
    }
  };

  // ─── Countdown timer for OTP resend ─────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  // ─── Get API URL - FORCE LOCALHOST ──────────────────────────────
  const getApiUrl = () => {
    // Always use localhost for development
    return 'http://localhost:5000/api';
  };

  // ─── Update Form Data ─────────────────────────────────────────────
  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ─── Validate Phone ──────────────────────────────────────────────
  const validatePhone = (phone: string) => {
    return phone && phone.length >= 9;
  };

  // ─── Validate Password ────────────────────────────────────────────
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // ─── Validate Email ──────────────────────────────────────────────
  const validateEmail = (email: string) => {
    return email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ─── Request OTP ──────────────────────────────────────────────────
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validatePhone(formData.phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (!formData.name || formData.name.length < 2) {
      setError("Please enter your full name");
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (apiStatus === "offline") {
      setError("Server is offline. Please check your connection.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullPhone = `${country.code}${formData.phone.replace(/^0/, "")}`;
      const apiUrl = getApiUrl();
      
      console.log("📡 Sending OTP request to:", `${apiUrl}/otp/send`);
      console.log("📱 Phone:", fullPhone);

      // Check if user already exists
      const checkRes = await fetch(`${apiUrl}/auth/check-phone`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          setError("This phone number is already registered. Please login instead.");
          setLoading(false);
          return;
        }
      }

      // Send OTP
      const res = await fetch(`${apiUrl}/otp/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          type: "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setStep("otp");
      setCountdown(60);
      setResendDisabled(true);
      setSuccess("OTP sent successfully! Check your phone.");
      toast.success("📱 OTP sent!");

      if (data.otp) {
        toast.success(`📱 OTP: ${data.otp}`);
      }

      setTimeout(() => setSuccess(""), 5000);

    } catch (err: any) {
      console.error("❌ OTP send error:", err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError("Cannot connect to server. Please ensure the backend is running on port 5000.");
        toast.error("Server connection failed. Is the backend running?");
      } else {
        setError(err.message || "Failed to send OTP");
        toast.error(err.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Verify OTP ──────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullPhone = `${country.code}${formData.phone.replace(/^0/, "")}`;
      const apiUrl = getApiUrl();

      const verifyRes = await fetch(`${apiUrl}/otp/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          otp: otp,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Invalid OTP");
      }

      setSuccess("✅ Phone verified successfully!");
      
      if (verifyData.userId) {
        setTempUserId(verifyData.userId);
      }

      setTimeout(() => {
        setSuccess("");
        setStep("password");
      }, 1000);

    } catch (err: any) {
      console.error("OTP verification error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check your connection.");
        toast.error("Server connection failed");
      } else {
        setError(err.message || "Verification failed");
        toast.error(err.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Resend OTP ──────────────────────────────────────────────────
  async function handleResendOTP() {
    if (resendDisabled) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullPhone = `${country.code}${formData.phone.replace(/^0/, "")}`;
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/otp/resend`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setCountdown(60);
      setResendDisabled(true);
      setSuccess("OTP resent successfully!");
      toast.success("📱 New OTP sent!");

      setTimeout(() => setSuccess(""), 5000);

    } catch (err: any) {
      console.error("OTP resend error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check your connection.");
        toast.error("Server connection failed");
      } else {
        setError(err.message || "Failed to resend OTP");
        toast.error(err.message || "Failed to resend OTP");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Complete Registration ──────────────────────────────────────
  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions");
      return;
    }

    if (formData.role === "DRIVER") {
      if (!formData.licenseNumber || formData.licenseNumber.length < 5) {
        setError("Please enter a valid license number");
        return;
      }
      if (!formData.vehicleNumber) {
        setError("Please enter vehicle number");
        return;
      }
      if (!formData.vehicleModel) {
        setError("Please enter vehicle model");
        return;
      }
    }

    setLoading(true);

    try {
      const fullPhone = `${country.code}${formData.phone.replace(/^0/, "")}`;
      const apiUrl = getApiUrl();

      const registerData = {
        phone: fullPhone,
        name: formData.name,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "DRIVER" && {
          licenseNumber: formData.licenseNumber,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          vehicleModel: formData.vehicleModel,
        }),
      };

      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setStep("complete");
      setSuccess("🎉 Account created successfully!");

      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("token", data.data.tokens.accessToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        setTimeout(() => {
          const role = data.data.user?.role?.toUpperCase();
          if (role === "DRIVER") {
            router.push("/driver/dashboard");
          } else {
            router.push("/passenger");
          }
        }, 2000);
      } else {
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }

    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check your connection.");
        toast.error("Server connection failed");
      } else {
        setError(err.message || "Registration failed");
        toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Go Back ─────────────────────────────────────────────────────
  const goBack = () => {
    setError("");
    setSuccess("");
    if (step === "otp") setStep("phone");
    else if (step === "password") setStep("otp");
    else if (step === "driver-details") setStep("password");
    else if (step === "phone") setStep("role");
  };

  // ─── API Status Banner ─────────────────────────────────────────
  const renderApiStatus = () => {
    if (apiStatus === "checking") {
      return (
        <div className="mb-4 p-2 bg-gray-500/10 border border-gray-500/20 rounded-lg text-center">
          <span className="text-xs text-gray-400">🔍 Checking server connection...</span>
        </div>
      );
    }
    
    if (apiStatus === "offline") {
      return (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center gap-2">
          <WifiOff size={16} className="text-red-400" />
          <span className="text-xs text-red-400">Server offline. Please start the backend server.</span>
        </div>
      );
    }
    
    return (
      <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
        <span className="text-xs text-green-400">✅ Server connected</span>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="auth-container">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="auth-card-head">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚐</span>
          <h1 className="auth-card-title">
            {step === "role" ? "Join MotoBus" :
             step === "complete" ? "Welcome!" :
             step === "otp" ? "Verify Phone" :
             step === "driver-details" ? "Vehicle Info" :
             "Create Account"}
          </h1>
        </div>
        <p className="auth-card-sub">
          {step === "role" && "Choose how you want to use MotoBus"}
          {step === "phone" && "Start by verifying your phone number"}
          {step === "otp" && "Enter the code sent to your phone"}
          {step === "password" && "Create a secure password"}
          {step === "driver-details" && "Tell us about your vehicle"}
          {step === "complete" && "Your account is ready!"}
        </p>
      </div>

      {/* ─── API STATUS ───────────────────────────────────────────── */}
      {renderApiStatus()}

      {/* ─── ERROR / SUCCESS ────────────────────────────────────── */}
      {error && (
        <div className="err-banner">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{success}</span>
        </div>
      )}

      {/* ─── STEP CONTENT ────────────────────────────────────────── */}
      <div className="w-full max-w-md">
        {step === "role" && renderRoleStep()}
        {step === "phone" && renderPhoneStep()}
        {step === "otp" && renderOtpStep()}
        {step === "password" && renderPasswordStep()}
        {step === "driver-details" && renderDriverDetailsStep()}
        {step === "complete" && renderCompleteStep()}
      </div>

      {/* ─── STEPS INDICATOR ─────────────────────────────────────── */}
      {step !== "role" && step !== "complete" && (
        <div className="steps-indicator">
          <div className={`step-dot ${step === "phone" ? "active" : step === "otp" ? "completed" : ""}`} />
          <div className={`step-line ${step === "otp" || step === "password" || step === "driver-details" ? "completed" : ""}`} />
          <div className={`step-dot ${step === "otp" ? "active" : step === "password" || step === "driver-details" ? "completed" : ""}`} />
          <div className={`step-line ${step === "password" || step === "driver-details" ? "completed" : ""}`} />
          <div className={`step-dot ${step === "password" ? "active" : step === "driver-details" ? "active" : ""}`} />
          {step === "driver-details" && (
            <>
              <div className={`step-line ${step === "driver-details" ? "completed" : ""}`} />
              <div className={`step-dot ${step === "driver-details" ? "active" : ""}`} />
            </>
          )}
        </div>
      )}

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      {step !== "complete" && (
        <div className="auth-footer-link mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-500 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      )}

      {/* ─── STYLES ────────────────────────────────────────────────── */}
      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          background: var(--bg2);
        }

        .auth-card-head {
          width: 100%;
          max-width: 400px;
          margin-bottom: 24px;
        }

        .auth-card-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--w);
          margin: 0;
        }

        .auth-card-sub {
          font-size: 14px;
          color: var(--m);
          margin: 4px 0 0;
        }

        .err-banner {
          width: 100%;
          max-width: 400px;
          background: rgba(255,0,0,0.08);
          border: 1px solid rgba(255,0,0,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-size: 14px;
        }

        .success-banner {
          width: 100%;
          max-width: 400px;
          background: rgba(0,194,111,0.08);
          border: 1px solid rgba(0,194,111,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #00C26F;
          font-size: 14px;
        }

        .form-group {
          width: 100%;
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--m);
          margin-bottom: 6px;
        }

        .phone-wrap {
          display: flex;
          align-items: stretch;
        }

        .phone-prefix {
          border: 1px solid var(--b);
          background: var(--bg4);
          border-right: none;
          border-radius: 10px 0 0 10px;
          padding: 13px 14px;
          font-size: 14px;
          color: var(--m);
          cursor: pointer;
          outline: none;
          min-width: 100px;
        }

        .phone-input {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          flex: 1;
        }

        .form-input {
          width: 100%;
          padding: 13px 16px;
          background: var(--bg4);
          border: 1px solid var(--b);
          border-radius: 10px;
          color: var(--w);
          font-size: 14px;
          transition: border-color 0.2s;
          outline: none;
        }

        .form-input:focus {
          border-color: var(--g);
        }

        .form-input.pl-10 {
          padding-left: 40px;
        }

        .form-hint {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: var(--g);
          color: #000;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(1.01);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-footer-link {
          width: 100%;
          max-width: 400px;
          text-align: center;
          font-size: 13px;
          color: var(--m);
        }

        .auth-footer-link a {
          color: var(--g);
          text-decoration: none;
          font-weight: 600;
        }

        .auth-footer-link a:hover {
          text-decoration: underline;
        }

        .relative {
          position: relative;
        }

        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
          max-width: 400px;
          width: 100%;
        }

        .step-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--b);
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .step-dot.active {
          background: var(--g);
          box-shadow: 0 0 12px rgba(0,194,111,0.3);
          width: 14px;
          height: 14px;
        }

        .step-dot.completed {
          background: var(--g);
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: var(--b);
          transition: all 0.3s;
          max-width: 60px;
        }

        .step-line.completed {
          background: var(--g);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 0.8s linear infinite;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
    </div>
  );

  // ─── Render Functions ──────────────────────────────────────────
  function renderRoleStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">Choose Your Account Type</h2>
          <p className="text-sm text-gray-400 mt-1">Select how you'll use MotoBus</p>
        </div>

        <div className="grid gap-4">
          <button
            type="button"
            onClick={() => {
              updateForm("role", "RIDER");
              setStep("phone");
            }}
            className="p-6 bg-[#111714] border-2 border-gray-700 rounded-2xl hover:border-green-500/50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                👤
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white group-hover:text-green-500 transition">
                  Rider / Passenger
                </h3>
                <p className="text-sm text-gray-400">Book rides, track trips, and enjoy convenient transport</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>📍 Live tracking</span>
                  <span>•</span>
                  <span>💳 Multiple payments</span>
                  <span>•</span>
                  <span>🆘 SOS button</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600 group-hover:text-green-500 transition" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              updateForm("role", "DRIVER");
              setStep("phone");
            }}
            className="p-6 bg-[#111714] border-2 border-gray-700 rounded-2xl hover:border-green-500/50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                🚗
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white group-hover:text-green-500 transition">
                  Driver
                </h3>
                <p className="text-sm text-gray-400">Earn money by providing rides to passengers</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>💰 Earn daily</span>
                  <span>•</span>
                  <span>📊 Track earnings</span>
                  <span>•</span>
                  <span>⭐ Get rated</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-600 group-hover:text-green-500 transition" />
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-green-500 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  function renderPhoneStep() {
    return (
      <form onSubmit={handleRequestOTP} className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">Verify Your Phone</h2>
          <p className="text-sm text-gray-400 mt-1">
            {formData.role === "DRIVER" ? "🚗 Driver" : "👤 Rider"} registration
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email (optional)</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
          </div>
          <p className="form-hint">We'll send ride updates and receipts here</p>
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <div className="phone-wrap">
            <select
              className="phone-prefix"
              value={formData.countryIdx}
              onChange={(e) => updateForm("countryIdx", Number(e.target.value))}
            >
              {COUNTRIES.map((c, i) => (
                <option key={c.code} value={i}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <input
              className="form-input phone-input"
              type="tel"
              placeholder="7XX XXX XXX"
              value={formData.phone}
              onChange={(e) => updateForm("phone", e.target.value.replace(/\D/g, ""))}
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>
          <p className="form-hint">Enter your phone number without the leading 0</p>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" /> Sending OTP...
            </>
          ) : (
            <>Verify Phone →</>
          )}
        </button>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <button type="button" onClick={goBack} className="flex items-center gap-1 hover:text-white transition">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="text-[10px] text-gray-600">
            {formData.role === "DRIVER" ? "Driver" : "Rider"} registration
          </span>
        </div>
      </form>
    );
  }

  function renderOtpStep() {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">Enter OTP</h2>
          <p className="text-sm text-gray-400 mt-1">
            We sent a 6-digit code to {country.code}{formData.phone.replace(/^0/, "")}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">One-Time Password</label>
          <input
            className="form-input text-center text-2xl font-bold tracking-widest"
            type="text"
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            autoFocus
          />
          <p className="form-hint">Enter the 6-digit code sent to your phone</p>
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendDisabled}
            className="text-sm text-gray-400 hover:text-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Change number
          </button>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" /> Verifying...
            </>
          ) : (
            <>Verify OTP →</>
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          💡 Demo OTP: 111111 (Admin) • 222222 (Driver) • 333333 (Rider)
        </p>
      </form>
    );
  }

  function renderPasswordStep() {
    return (
      <form onSubmit={handleCompleteRegistration} className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">Set Your Password</h2>
          <p className="text-sm text-gray-400 mt-1">
            Create a secure password for your account
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={(e) => updateForm("password", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="form-hint">Password must be at least 6 characters</p>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => updateForm("confirmPassword", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {formData.role === "DRIVER" && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <p className="text-xs text-green-400 flex items-center gap-2">
              <Shield size={14} />
              Driver verification required
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You'll need to provide vehicle details in the next step
            </p>
          </div>
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-700 bg-[#0A0E0B] text-green-500 focus:ring-green-500 focus:ring-offset-0"
          />
          <label htmlFor="terms" className="text-xs text-gray-400">
            I agree to the{" "}
            <Link href="/terms" className="text-green-500 hover:underline">Terms & Conditions</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-green-500 hover:underline">Privacy Policy</Link>
          </label>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" />
              Creating account...
            </>
          ) : (
            formData.role === "DRIVER" ? <>Continue to Vehicle Details →</> : <>Create Account →</>
          )}
        </button>

        <button type="button" onClick={goBack} className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1 justify-center">
          <ArrowLeft size={14} /> Back
        </button>
      </form>
    );
  }

  function renderDriverDetailsStep() {
    return (
      <form onSubmit={handleCompleteRegistration} className="space-y-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white">🚗 Vehicle Details</h2>
          <p className="text-sm text-gray-400 mt-1">
            Provide your vehicle information
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">License Number</label>
          <div className="relative">
            <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type="text"
              placeholder="e.g. DL-2024-001234"
              value={formData.licenseNumber}
              onChange={(e) => updateForm("licenseNumber", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Type</label>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_TYPES.map((vt) => (
              <button
                key={vt.value}
                type="button"
                onClick={() => updateForm("vehicleType", vt.value)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  formData.vehicleType === vt.value
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="text-2xl mb-1">{vt.icon}</div>
                <div className="text-xs font-medium">{vt.label}</div>
                <div className="text-[10px] text-gray-500">{vt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Number</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type="text"
              placeholder="e.g. RAB 123M"
              value={formData.vehicleNumber}
              onChange={(e) => updateForm("vehicleNumber", e.target.value.toUpperCase())}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Vehicle Model</label>
          <div className="relative">
            <Car size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="form-input pl-10"
              type="text"
              placeholder="e.g. Yamaha FZ-S"
              value={formData.vehicleModel}
              onChange={(e) => updateForm("vehicleModel", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-400 flex items-center gap-2">
            <AlertCircle size={14} />
            Account will be pending approval
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Our team will review your application within 24-48 hours
          </p>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <div className="spinner" /> Creating Account...
            </>
          ) : (
            <>Complete Registration →</>
          )}
        </button>

        <button type="button" onClick={goBack} className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1 justify-center">
          <ArrowLeft size={14} /> Back
        </button>
      </form>
    );
  }

  function renderCompleteStep() {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white">Account Created!</h2>
        <p className="text-gray-400">
          {formData.role === "DRIVER" 
            ? "Your driver application has been submitted for approval."
            : "Your account has been created successfully."}
        </p>
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400">
            {formData.role === "DRIVER"
              ? "📋 Please wait for admin approval (24-48 hours)"
              : "✅ You can now start booking rides"}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="spinner" />
          <span className="text-sm text-gray-400">Redirecting...</span>
        </div>
      </div>
    );
  }
}
