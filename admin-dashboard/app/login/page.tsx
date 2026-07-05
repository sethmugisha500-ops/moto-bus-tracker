"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
];

// Demo credentials for testing
const DEMO_CREDENTIALS = [
  { 
    role: "Rider", 
    phone: "+250788888890", 
    pw: "Passenger@2026",
    fullPhone: "+250788888890"
  },
  { 
    role: "Driver", 
    phone: "+250788888889", 
    pw: "Driver@2026",
    fullPhone: "+250788888889"
  },
  { 
    role: "Admin", 
    phone: "+250788888888", 
    pw: "Admin@2026",
    fullPhone: "+250788888888"
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const country = COUNTRIES[countryIdx];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!phone || phone.length < 9) {
      setError("Please enter a valid phone number (minimum 9 digits)");
      return;
    }
    if (!password || password.length < 6) {
      setError("Please enter your password (minimum 6 characters)");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const fullPhone = `${country.code}${phone.replace(/^0/, "")}`;
      
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log('🔐 Attempting login to:', `${API_URL}/auth/login`);
      console.log('📱 Phone:', fullPhone);
      
      const res = await fetch(`${API_URL}/auth/login`, {
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

      console.log('📡 Response status:', res.status);

      // Handle non-JSON responses
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned an invalid response. Please try again.");
      }

      const data = await res.json();
      console.log('📦 Full response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      // ✅ Extract data
      const token = data.data?.tokens?.accessToken;
      const user = data.data?.user;
      
      console.log('👤 User data:', user);
      console.log('🔑 Role from backend:', user?.role);
      console.log('🎯 Role type:', typeof user?.role);

      // Store token
      if (token) {
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
      }

      // Store user data
      if (user) {
  localStorage.setItem("user", JSON.stringify(user));
}
      // ✅ FIX: Check role with proper case handling
      const role = user?.role || '';
      const roleUpper = role.toUpperCase();
      
      console.log('🔄 Role uppercase:', roleUpper);

      // Redirect based on role
      if (roleUpper === "ADMIN") {
        console.log('👑 Redirecting to Admin Dashboard');
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/dashboard?token=${token}`;
      } else if (roleUpper === "DRIVER") {
        console.log('🚗 Redirecting to Driver Dashboard');
        router.push("/driver/dashboard");
      } else {
        console.log('👤 Redirecting to Passenger (default)');
        router.push("/passenger");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  // Demo login function - auto-fill credentials
  const useDemoCredentials = (phoneNumber: string, password: string, role: string) => {
    setError("");
    const stripped = phoneNumber.replace(/^\+250/, "");
    setCountryIdx(0);
    setPhone(stripped);
    setPassword(password);
    
    // For demo purposes, store the role
    localStorage.setItem("demoUser", JSON.stringify({
      phone: phoneNumber,
      role: role.toUpperCase(),
      name: role === "Admin" ? "System Administrator" : 
            role === "Driver" ? "Jean Pierre Niyonzima" : 
            "Marie Claire Umutoni"
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-card-head">
          <h1 className="auth-card-title">Welcome back</h1>
          <p className="auth-card-sub">Sign in to your MotoBus account to continue</p>
        </div>

        {error && (
          <div className="err-banner" style={{ whiteSpace: "pre-line" }}>
            <span className="err-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone number</label>
            <div className="phone-wrap">
              <select
                className="phone-prefix"
                value={countryIdx}
                onChange={e => setCountryIdx(Number(e.target.value))}
                style={{
                  appearance: "none",
                  border: "1px solid var(--b)",
                  background: "var(--bg4)",
                  borderRight: "none",
                  borderRadius: "10px 0 0 10px",
                  padding: "13px 14px",
                  fontSize: 14,
                  color: "var(--m)",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "var(--body)",
                }}
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
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                autoComplete="tel"
                inputMode="tel"
                required
              />
            </div>
            <p className="form-hint">e.g. 078 123 4567 → enter 781234567</p>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="forgot-row">
              <label className="form-label" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="form-input-wrap">
              <input
                className="form-input"
                style={{ paddingRight: 44 }}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="form-input-icon"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="remember"
              className="custom-cb"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember" className="cb-label">
              Keep me signed in for 30 days
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" /> Signing in…
              </>
            ) : (
              <>Sign in →</>
            )}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="social-btns">
          <button className="social-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button className="social-btn" type="button">
            <span style={{ fontSize: 16 }}>📱</span>
            Phone OTP
          </button>
        </div>

        <div className="auth-footer-link">
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one free</Link>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 20,
          padding: "12px 14px",
          background: "rgba(0,194,111,0.05)",
          border: "1px dashed rgba(0,194,111,0.2)",
          borderRadius: 10,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--g)",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}>
            🧪 Demo Credentials
          </p>
          {DEMO_CREDENTIALS.map((d) => (
            <div key={d.role} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              borderBottom: "1px solid rgba(0,194,111,0.1)",
            }}>
              <span style={{ fontSize: 11, color: "var(--m)" }}>
                {d.role}
              </span>
              <button
                type="button"
                style={{
                  fontSize: 11,
                  color: "var(--g)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--body)",
                  padding: "4px 8px",
                  borderRadius: 4,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,194,111,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => useDemoCredentials(d.fullPhone, d.pw, d.role)}
              >
                Use {d.fullPhone} / {d.pw}
              </button>
            </div>
          ))}
          <p style={{
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 8,
            opacity: 0.6,
          }}>
            Click "Use" to auto-fill credentials
          </p>
        </div>
      </div>
    </div>
  );
}