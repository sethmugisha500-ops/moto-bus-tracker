"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "+250", flag: "🇷🇼", name: "Rwanda"   },
  { code: "+254", flag: "🇰🇪", name: "Kenya"    },
  { code: "+256", flag: "🇺🇬", name: "Uganda"   },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+257", flag: "🇧🇮", name: "Burundi"  },
];

type Role = "RIDER" | "DRIVER";
type Step = 1 | 2 | 3;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "",       color: "var(--b)"   },
    { label: "Weak",   color: "#FF4444"    },
    { label: "Fair",   color: "var(--o)"   },
    { label: "Good",   color: "#FFD600"    },
    { label: "Strong", color: "var(--g)"   },
    { label: "Great!", color: "#00E887"    },
  ];
  return { score, ...levels[score] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]             = useState<Step>(1);
  const [role, setRole]             = useState<Role>("RIDER");
  const [countryIdx, setCountryIdx] = useState(0);

  // Step 1
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  // Step 2
  const [phone, setPhone]   = useState("");
  const [password, setPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Step 3 (driver)
  const [license, setLicense]   = useState("");
  const [nationalId, setNatId]  = useState("");
  const [agree, setAgree]       = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const country = COUNTRIES[countryIdx];
  const pwStr   = passwordStrength(password);

  const TOTAL_STEPS = role === "DRIVER" ? 3 : 2;

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Enter your full name (min 2 chars)";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!phone || phone.length < 9) errs.phone = "Enter a valid phone number";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters";
    if (password !== confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Record<string, string> = {};
    if (!license.trim()) errs.license = "License number is required";
    if (!nationalId.trim()) errs.nationalId = "National ID is required";
    if (!agree) errs.agree = "You must accept the terms";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) {
      if (role === "DRIVER") setStep(3);
      else handleSubmit();
    } else if (step === 3 && validateStep3()) {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email || undefined,
          phone: `${country.code}${phone.replace(/^0/, "")}`,
          password,
          role,
          country: ["RW","KE","UG","TZ","BI"][countryIdx] ?? "RW",
          ...(role === "DRIVER" ? { licenseNumber: license, nationalId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      if (data.data?.tokens?.accessToken) {
        localStorage.setItem("token", data.data.tokens.accessToken);
      }
      if (role === "DRIVER") router.push("/driver/onboarding");
      else router.push("/passenger");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="auth-card-head">
        <h1 className="auth-card-title">
          {step === 1 ? "Create account"
           : step === 2 ? "Set credentials"
           : "Driver details"}
        </h1>
        <p className="auth-card-sub">
          {step === 1 ? "Join 24K+ riders and 680+ drivers across East Africa"
           : step === 2 ? "Secure your account with a strong password"
           : "We need a few more details to verify your driver account"}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{display:"flex",gap:6,marginBottom:28}}>
        {Array.from({length:TOTAL_STEPS}).map((_,i) => (
          <div
            key={i}
            style={{
              flex:1, height:3, borderRadius:2,
              background: i < step ? "var(--g)" : "var(--b)",
              transition:"background .3s",
            }}
          />
        ))}
      </div>

      {/* Role selector (step 1 only) */}
      {step === 1 && (
        <div className="role-tabs" style={{marginBottom:24}}>
          {(["RIDER","DRIVER"] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              className={`role-tab${role===r?" active":""}`}
              onClick={() => setRole(r)}
            >
              {r === "RIDER" ? "🏍️" : "🚗"}
              {r === "RIDER" ? "I need rides" : "I'm a driver"}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="err-banner">
          <span className="err-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* ── STEP 1: Personal info ── */}
      {step === 1 && (
        <div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input
                className={`form-input${fieldErrors.name ? " err" : ""}`}
                type="text"
                placeholder="Jean-Marie Nkurunziza"
                value={name}
                onChange={e => { setName(e.target.value); setFieldErrors(f => ({...f, name:""})); }}
                autoComplete="name"
              />
              {fieldErrors.name && <p className="form-err-msg">{fieldErrors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                className="country-select"
                value={countryIdx}
                onChange={e => setCountryIdx(Number(e.target.value))}
              >
                {COUNTRIES.map((c,i) => (
                  <option key={c.code} value={i}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address <span style={{color:"var(--m)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <input
              className={`form-input${fieldErrors.email ? " err" : ""}`}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({...f,email:""})); }}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="form-err-msg">{fieldErrors.email}</p>}
            <p className="form-hint">Used for receipts and account recovery</p>
          </div>
        </div>
      )}

      {/* ── STEP 2: Phone + Password ── */}
      {step === 2 && (
        <div>
          <div className="form-group">
            <label className="form-label">Phone number *</label>
            <div className="phone-wrap">
              <select
                value={countryIdx}
                onChange={e => setCountryIdx(Number(e.target.value))}
                style={{appearance:"none",border:"1px solid var(--b)",background:"var(--bg4)",borderRight:"none",borderRadius:"10px 0 0 10px",padding:"13px 14px",fontSize:14,color:"var(--m)",cursor:"pointer",outline:"none",fontFamily:"var(--body)"}}
              >
                {COUNTRIES.map((c,i) => (
                  <option key={c.code} value={i}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                className={`form-input phone-input${fieldErrors.phone ? " err":""}`}
                type="tel"
                placeholder="7XX XXX XXX"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g,"")); setFieldErrors(f => ({...f,phone:""})); }}
                inputMode="tel"
              />
            </div>
            {fieldErrors.phone && <p className="form-err-msg">{fieldErrors.phone}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div className="form-input-wrap">
              <input
                className={`form-input${fieldErrors.password ? " err":""}`}
                style={{paddingRight:44}}
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => { setPw(e.target.value); setFieldErrors(f => ({...f,password:""})); }}
                autoComplete="new-password"
              />
              <button type="button" className="form-input-icon" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {password && (
              <div className="pw-strength">
                <div className="pw-bars">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className="pw-bar"
                      style={{background: i <= pwStr.score ? pwStr.color : "var(--b)"}}
                    />
                  ))}
                </div>
                {pwStr.label && <p className="pw-label" style={{color:pwStr.color}}>{pwStr.label}</p>}
              </div>
            )}
            {fieldErrors.password && <p className="form-err-msg">{fieldErrors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password *</label>
            <div className="form-input-wrap">
              <input
                className={`form-input${fieldErrors.confirm ? " err":""}`}
                style={{paddingRight:44}}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setFieldErrors(f => ({...f,confirm:""})); }}
                autoComplete="new-password"
              />
              <button type="button" className="form-input-icon" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                {showConfirm ? "🙈" : "👁️"}
              </button>
              {confirm && password === confirm && (
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"var(--g)",fontSize:14}}>✓</span>
              )}
            </div>
            {fieldErrors.confirm && <p className="form-err-msg">{fieldErrors.confirm}</p>}
          </div>
        </div>
      )}

      {/* ── STEP 3: Driver details ── */}
      {step === 3 && (
        <div>
          <div
            style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"rgba(0,194,111,0.06)",border:"1px solid rgba(0,194,111,0.15)",borderRadius:10,marginBottom:20}}
          >
            <span style={{fontSize:18}}>🛡️</span>
            <p style={{fontSize:12,color:"var(--m)",lineHeight:1.5}}>
              Your documents are encrypted and only used for verification. We never share them.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Driver license number *</label>
            <input
              className={`form-input${fieldErrors.license ? " err" : ""}`}
              type="text"
              placeholder="e.g. DL-RW-2024-00123"
              value={license}
              onChange={e => { setLicense(e.target.value); setFieldErrors(f => ({...f,license:""})); }}
            />
            {fieldErrors.license && <p className="form-err-msg">{fieldErrors.license}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">National ID number *</label>
            <input
              className={`form-input${fieldErrors.nationalId ? " err" : ""}`}
              type="text"
              placeholder="e.g. 1198780012345678"
              value={nationalId}
              onChange={e => { setNatId(e.target.value); setFieldErrors(f => ({...f,nationalId:""})); }}
            />
            {fieldErrors.nationalId && <p className="form-err-msg">{fieldErrors.nationalId}</p>}
            <p className="form-hint">16-digit Rwandan national ID or equivalent</p>
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="agree"
              className="custom-cb"
              checked={agree}
              onChange={e => { setAgree(e.target.checked); setFieldErrors(f => ({...f,agree:""})); }}
            />
            <label htmlFor="agree" className="cb-label">
              I agree to the{" "}
              <a href="/terms" target="_blank">Terms of Service</a>,{" "}
              <a href="/privacy" target="_blank">Privacy Policy</a>, and{" "}
              Driver Code of Conduct
            </label>
          </div>
          {fieldErrors.agree && <p className="form-err-msg" style={{marginTop:-12,marginBottom:12}}>{fieldErrors.agree}</p>}
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        {step > 1 && (
          <button
            type="button"
            onClick={() => { setStep(s => (s - 1) as Step); setError(""); setFieldErrors({}); }}
            style={{flex:"0 0 auto",background:"var(--bg3)",border:"1px solid var(--b)",color:"var(--m)",borderRadius:10,padding:"14px 20px",fontSize:14,cursor:"pointer",fontFamily:"var(--body)",transition:"all .15s"}}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--bh)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--b)")}
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          className="submit-btn"
          style={{flex:1,marginTop:0}}
          onClick={nextStep}
          disabled={loading}
        >
          {loading ? (
            <><div className="spinner" /> Creating account…</>
          ) : step < TOTAL_STEPS ? (
            <>Continue →</>
          ) : (
            <>Create account ✓</>
          )}
        </button>
      </div>

      <p className="terms-note" style={{marginTop:16}}>
        By continuing you agree to our{" "}
        <a href="/terms">Terms</a> and{" "}
        <a href="/privacy">Privacy Policy</a>
      </p>

      <div className="auth-footer-link">
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </div>
    </>
  );
}