// app/admin/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Building2,
  Users,
  Car,
  BarChart3
} from "lucide-react";
import toast from "react-hot-toast";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
];

// Admin demo credentials
const DEMO_CREDENTIALS = [
  { 
    role: "Admin", 
    phone: "+250788888888", 
    password: "Admin@2026",
    name: "System Administrator"
  },
];

export default function AdminLoginPage() {
  const router = useRouter();

  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const country = COUNTRIES[countryIdx];

  // Check if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role?.toUpperCase() === "ADMIN") {
          router.push("/admin/dashboard");
        }
      } catch {}
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!phone || phone.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!password || password.length < 6) {
      setError("Please enter your password (minimum 6 characters)");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fullPhone = `${country.code}${phone.replace(/^0/, "")}`;
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';
      
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          password,
          rememberMe,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned an invalid response. Please try again.");
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      // Extract data
      const token = data.data?.tokens?.accessToken;
      const user = data.data?.user;
      
      // Verify admin role
      const role = user?.role?.toUpperCase() || '';
      if (role !== "ADMIN") {
        throw new Error("Access denied. Admin privileges required.");
      }

      // Store token and user data
      if (token) {
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      setSuccess("✅ Login successful! Redirecting to admin dashboard...");
      toast.success("Welcome back, Admin!");

      // Redirect to admin dashboard
      setTimeout(() => {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/`;
      }, 1000);

    } catch (err: unknown) {
      console.error("Admin login error:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  // Demo login function
  const useDemoCredentials = (phoneNumber: string, password: string) => {
    setError("");
    setSuccess("");
    const stripped = phoneNumber.replace(/^\+250/, "");
    setCountryIdx(0);
    setPhone(stripped);
    setPassword(password);
    toast.success("✅ Demo credentials loaded");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C09] p-4">
      <div className="w-full max-w-md">
        {/* ─── LOGO ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Shield size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage your MotoBus platform</p>
        </div>

        {/* ─── CARD ──────────────────────────────────────────────────── */}
        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 shadow-xl">
          {/* ─── STATS BADGE ────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
              <Users size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Users</p>
            </div>
            <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
              <Car size={16} className="text-green-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Drivers</p>
            </div>
            <div className="bg-[#0A0E0B] rounded-xl p-3 text-center border border-gray-800/50">
              <BarChart3 size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Analytics</p>
            </div>
          </div>

          {/* ─── ERROR / SUCCESS ────────────────────────────────────── */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span className="flex-1">{success}</span>
            </div>
          )}

          {/* ─── FORM ────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Phone Number
              </label>
              <div className="flex">
                <select
                  value={countryIdx}
                  onChange={e => setCountryIdx(Number(e.target.value))}
                  className="px-3 py-2.5 bg-[#0A0E0B] border border-r-0 border-gray-700 rounded-l-xl text-sm text-gray-300 focus:outline-none focus:border-green-500/30 transition"
                >
                  {COUNTRIES.map((c, i) => (
                    <option key={c.code} value={i}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="7XX XXX XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2.5 bg-[#0A0E0B] border border-gray-700 rounded-r-xl text-white text-sm focus:outline-none focus:border-green-500/30 transition placeholder-gray-500"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter your phone number without the leading 0</p>
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-400">
                  Password
                </label>
                <Link 
                  href="/admin/forgot-password" 
                  className="text-xs text-green-500 hover:text-green-400 transition hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500/30 transition placeholder-gray-500 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-[#0A0E0B] text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-semibold rounded-xl hover:from-green-400 hover:to-emerald-400 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in as Admin
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* ─── DEMO CREDENTIALS ───────────────────────────────────── */}
          <div className="mt-6 p-4 bg-[#0A0E0B] border border-gray-800 rounded-xl">
            <p className="text-xs font-semibold text-green-500 mb-3 flex items-center gap-2">
              <span>🧪</span> Demo Admin Credentials
            </p>
            {DEMO_CREDENTIALS.map((d) => (
              <div key={d.role} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{d.role}</p>
                  <p className="text-xs text-gray-500">{d.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => useDemoCredentials(d.phone, d.password)}
                  className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs hover:bg-green-500/20 transition font-medium"
                >
                  Use
                </button>
              </div>
            ))}
            <p className="text-[10px] text-gray-500 mt-3 opacity-60">
              Click "Use" to auto-fill credentials
            </p>
          </div>

          {/* ─── FOOTER ─────────────────────────────────────────────── */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Not an admin?{" "}
              <Link href="/login" className="text-green-500 hover:underline font-medium">
                Sign in as user
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <Link href="/" className="hover:text-gray-300 transition">
                ← Back to home
              </Link>
            </p>
          </div>

          {/* ─── VERSION ────────────────────────────────────────────── */}
          <div className="mt-4 text-center text-[10px] text-gray-600">
            Admin Portal v2.0.0 • Secure • 🔒
          </div>
        </div>
      </div>
    </div>
  );
}
