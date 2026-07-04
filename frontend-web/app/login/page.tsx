// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi" },
];

const DEMO_CREDENTIALS = [
  { 
    role: "Rider", 
    phone: "+250788888890", 
    pw: "Passenger@2026",
  },
  { 
    role: "Driver", 
    phone: "+250788888889", 
    pw: "Driver@2026",
  },
  { 
    role: "Admin", 
    phone: "+250788888888", 
    pw: "Admin@2026",
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

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const token = data.data?.tokens?.accessToken;
      const user = data.data?.user;
      
      console.log('👤 User data from backend:', user);
      console.log('🚗 Driver fields:', {
        driverId: user?.driverId,
        isApproved: user?.isApproved,
        vehicle: user?.vehicle,
      });

      // ✅ Clear ALL localStorage first
      localStorage.clear();
      
      // ✅ Store new data
      if (token) {
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        console.log('✅ User stored in localStorage');
      }
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      // ✅ Verify stored data
      const storedUser = localStorage.getItem('user');
      console.log('📦 Stored user:', storedUser ? JSON.parse(storedUser) : 'None');

      toast.success(`Welcome, ${user?.name || 'User'}!`);

      // Redirect based on role
      const role = user?.role?.toUpperCase() || '';
      
      // ✅ Small delay to ensure storage is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      if (role === "ADMIN") {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3001';
        window.location.href = `${adminUrl}/dashboard`;
      } else if (role === "DRIVER") {
        router.push("/driver/dashboard");
      } else {
        router.push("/passenger");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const useDemoCredentials = (phoneNumber: string, password: string) => {
    setError("");
    const stripped = phoneNumber.replace(/^\+250/, "");
    setCountryIdx(0);
    setPhone(stripped);
    setPassword(password);
    console.log(`🔑 Demo credentials loaded for: ${phoneNumber}`);
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
          <div className="form-group">
            <label className="form-label">Phone number</label>
            <div className="phone-wrap">
              <select
                className="phone-prefix"
                value={countryIdx}
                onChange={e => setCountryIdx(Number(e.target.value))}
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
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

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
        <div className="demo-credentials">
          <p className="demo-title">🧪 Demo Credentials</p>
          {DEMO_CREDENTIALS.map((d) => (
            <div key={d.role} className="demo-item">
              <span className="demo-role">{d.role}</span>
              <button
                type="button"
                className="demo-use-btn"
                onClick={() => useDemoCredentials(d.phone, d.pw)}
              >
                Use {d.phone} / {d.pw}
              </button>
            </div>
          ))}
          <p className="demo-hint">Click "Use" to auto-fill credentials</p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          background: var(--bg2);
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg3);
          border: 1px solid var(--b);
          border-radius: 16px;
          padding: 32px 28px;
        }

        .auth-card-head {
          margin-bottom: 28px;
        }

        .auth-card-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--t);
          margin: 0;
        }

        .auth-card-sub {
          font-size: 14px;
          color: var(--m);
          margin: 4px 0 0;
        }

        .err-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--err-bg);
          border: 1px solid rgba(255,100,100,0.18);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--err);
        }

        .err-icon {
          font-size: 15px;
          flex-shrink: 0;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--m);
          margin-bottom: 6px;
        }

        .phone-wrap {
          display: flex;
          align-items: stretch;
        }

        .phone-prefix {
          background: var(--bg4);
          border: 1px solid var(--b);
          border-right: none;
          border-radius: 10px 0 0 10px;
          padding: 12px 14px;
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
          padding: 12px 16px;
          background: var(--bg4);
          border: 1px solid var(--b);
          border-radius: 10px;
          color: var(--t);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: var(--g);
        }

        .form-input-wrap {
          position: relative;
        }

        .form-input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--m);
          cursor: pointer;
          background: none;
          border: none;
          font-size: 16px;
        }

        .forgot-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .forgot-link {
          font-size: 12px;
          color: var(--g);
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .custom-cb {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--b);
          background: var(--bg3);
          cursor: pointer;
          appearance: none;
          outline: none;
        }

        .custom-cb:checked {
          background: var(--g);
          border-color: var(--g);
        }

        .cb-label {
          font-size: 12px;
          color: var(--m);
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: var(--g);
          color: #080C09;
          border: none;
          border-radius: 10px;
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

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #080C09;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          font-size: 12px;
          color: var(--m);
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--b);
        }

        .social-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--bg4);
          border: 1px solid var(--b);
          border-radius: 10px;
          padding: 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--m);
          cursor: pointer;
          transition: all 0.15s;
        }

        .social-btn:hover {
          border-color: var(--bh);
          color: var(--t);
        }

        .auth-footer-link {
          text-align: center;
          margin-top: 20px;
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

        .demo-credentials {
          margin-top: 20px;
          padding: 14px;
          background: rgba(0,194,111,0.05);
          border: 1px dashed rgba(0,194,111,0.2);
          border-radius: 10px;
        }

        .demo-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--g);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .demo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid rgba(0,194,111,0.08);
        }

        .demo-role {
          font-size: 11px;
          color: var(--m);
        }

        .demo-use-btn {
          font-size: 11px;
          color: var(--g);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .demo-use-btn:hover {
          background: rgba(0,194,111,0.1);
        }

        .demo-hint {
          font-size: 10px;
          color: var(--muted);
          margin-top: 8px;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}