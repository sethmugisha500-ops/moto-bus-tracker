"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda"   },
  { code: "+254", flag: "🇰🇪", name: "Kenya"    },
  { code: "+256", flag: "🇺🇬", name: "Uganda"   },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi"  },
];

export default function LoginPage() {
  const router = useRouter();

  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const country = COUNTRIES[countryIdx];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `${country.code}${phone.replace(/^0/, "")}`,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      // Store token
      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("token", data.data.tokens.accessToken);
      }
      const role = data.data?.user?.role;
      if (role === "ADMIN" || role === "OPERATOR") router.push("/admin");
      else if (role === "DRIVER") router.push("/driver");
      else router.push("/passenger");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="auth-card-head">
        <h1 className="auth-card-title">Welcome back</h1>
        <p className="auth-card-sub">Sign in to your MotoBus account to continue</p>
      </div>

      {error && (
        <div className="err-banner">
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
              style={{appearance:"none",border:"1px solid var(--b)",background:"var(--bg4)",borderRight:"none",borderRadius:"10px 0 0 10px",padding:"13px 14px",fontSize:14,color:"var(--m)",cursor:"pointer",outline:"none",fontFamily:"var(--body)"}}
            >
              {COUNTRIES.map((c, i) => (
                <option key={c.code} value={i}>{c.flag} {c.code}</option>
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
            <label className="form-label" style={{marginBottom:0}}>Password</label>
            <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>
          <div className="form-input-wrap">
            <input
              className="form-input"
              style={{paddingRight:44}}
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
            <><div className="spinner" /> Signing in…</>
          ) : (
            <>Sign in →</>
          )}
        </button>
      </form>

      <div className="divider">or continue with</div>

      <div className="social-btns">
        <button className="social-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button className="social-btn">
          <span style={{fontSize:16}}>📱</span>
          Phone OTP
        </button>
      </div>

      <div className="auth-footer-link">
        Don&apos;t have an account?{" "}
        <Link href="/register">Create one free</Link>
      </div>

      {/* Demo credentials */}
      <div style={{marginTop:20,padding:"12px 14px",background:"rgba(0,194,111,0.05)",border:"1px dashed rgba(0,194,111,0.2)",borderRadius:10}}>
        <p style={{fontSize:11,fontWeight:600,color:"var(--g)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Demo credentials</p>
        {[
          {role:"Rider",   phone:"+250781234567", pw:"demo1234"},
          {role:"Driver",  phone:"+250782345678", pw:"demo1234"},
          {role:"Admin",   phone:"+250783456789", pw:"admin1234"},
        ].map(d => (
          <div key={d.role} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(0,194,111,0.1)"}}>
            <span style={{fontSize:11,color:"var(--m)"}}>{d.role}</span>
            <button
              type="button"
              style={{fontSize:11,color:"var(--g)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--body)"}}
              onClick={() => {
                const stripped = d.phone.replace("+250", "");
                setCountryIdx(0);
                setPhone(stripped);
                setPassword(d.pw);
              }}
            >
              Use {d.phone} / {d.pw}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}