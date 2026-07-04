"use client";

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --g:#00C26F; --g2:#00A05C; --o:#FF6B35;
          --bg:#080C09; --bg2:#0E1410; --bg3:#141C15; --bg4:#1A2318;
          --b:rgba(255,255,255,0.07); --bh:rgba(0,194,111,0.28);
          --t:#EFF4F0; --m:rgba(239,244,240,0.45);
          --err:#FF6464; --err-bg:rgba(255,100,100,0.08);
          --head:'Bricolage Grotesque',system-ui,sans-serif;
          --body:'DM Sans',system-ui,sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--bg); color: var(--t);
          font-family: var(--body); -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,194,111,0.3); border-radius: 2px; }
        ::selection { background: rgba(0,194,111,0.2); color: var(--t); }

        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,194,111,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(0,194,111,0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* AUTH SHELL */
        .auth-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }

        /* LEFT PANEL */
        .auth-left {
          background: var(--bg);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          position: relative; overflow: hidden;
        }
        .auth-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,194,111,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,194,111,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }
        .al-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px); pointer-events: none;
        }
        .al-brand {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          font-family: var(--head); font-weight: 800; font-size: 22px;
          text-decoration: none; color: var(--t);
        }
        .ldot {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--g);
          animation: pulse-ring 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .al-hero { position: relative; z-index: 2; }
        .al-tag {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 100px;
          background: rgba(0,194,111,0.08);
          border: 1px solid rgba(0,194,111,0.2);
          color: var(--g); font-size: 12px; font-weight: 500;
          margin-bottom: 24px;
        }
        .al-title {
          font-family: var(--head);
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -.04em; margin-bottom: 16px;
        }
        .al-title span {
          background: linear-gradient(135deg, var(--g), #00E887 50%, var(--g));
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .al-sub {
          font-size: 16px; color: var(--m); font-weight: 300;
          line-height: 1.7; max-width: 380px; margin-bottom: 40px;
        }
        .al-stats {
          display: flex; gap: 28px;
          padding-top: 28px; border-top: 1px solid var(--b);
        }
        .al-stat-val {
          font-family: var(--head); font-size: 28px; font-weight: 800;
          letter-spacing: -.03em; margin-bottom: 2px;
        }
        .al-stat-val em { color: var(--g); font-style: normal; }
        .al-stat-lbl { font-size: 11px; color: var(--m); }
        .al-footer {
          position: relative; z-index: 2;
          display: flex; flex-wrap: wrap; gap: 16px;
        }
        .al-trust {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: var(--m);
        }
        .al-trust-icon {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(0,194,111,0.08);
          border: 1px solid rgba(0,194,111,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }

        /* RIGHT PANEL */
        .auth-right {
          background: var(--bg2);
          border-left: 1px solid var(--b);
          display: flex; align-items: center; justify-content: center;
          padding: 48px 56px;
          animation: fade-up .5s ease both;
        }
        .auth-card { width: 100%; max-width: 440px; }
        .auth-card-head { margin-bottom: 36px; }
        .auth-card-title {
          font-family: var(--head);
          font-size: 28px; font-weight: 800;
          letter-spacing: -.03em; margin-bottom: 6px;
        }
        .auth-card-sub { font-size: 14px; color: var(--m); font-weight: 300; }

        /* FORM ELEMENTS */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { margin-bottom: 18px; }
        .form-label {
          display: block; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .08em;
          color: var(--m); margin-bottom: 7px;
        }
        .form-input-wrap { position: relative; }
        .form-input {
          width: 100%;
          background: var(--bg3);
          border: 1px solid var(--b);
          border-radius: 10px;
          padding: 13px 16px;
          font-size: 14px; color: var(--t);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          font-family: var(--body);
        }
        .form-input::placeholder { color: var(--m); }
        .form-input:focus {
          border-color: var(--g);
          box-shadow: 0 0 0 3px rgba(0,194,111,0.1);
        }
        .form-input.err { border-color: var(--err); }
        .form-input.err:focus { box-shadow: 0 0 0 3px rgba(255,100,100,0.1); }
        .form-input-icon {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--m); cursor: pointer;
          font-size: 16px; user-select: none;
          background: none; border: none; padding: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .form-input-icon:hover { color: var(--t); }
        .form-hint { font-size: 11px; color: var(--m); margin-top: 5px; }
        .form-err-msg { font-size: 11px; color: var(--err); margin-top: 5px; }

        /* PHONE INPUT */
        .phone-wrap { display: flex; gap: 0; }
        .phone-prefix {
          background: var(--bg4); border: 1px solid var(--b);
          border-right: none; border-radius: 10px 0 0 10px;
          padding: 13px 14px; font-size: 14px; color: var(--m);
          white-space: nowrap; flex-shrink: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .phone-input {
          flex: 1; border-radius: 0 10px 10px 0;
        }

        /* COUNTRY SELECT */
        .country-select {
          width: 100%; appearance: none;
          background: var(--bg3); border: 1px solid var(--b);
          border-radius: 10px; padding: 13px 40px 13px 16px;
          font-size: 14px; color: var(--t);
          outline: none; cursor: pointer;
          font-family: var(--body);
          transition: border-color .15s;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(239,244,240,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .country-select:focus { border-color: var(--g); box-shadow: 0 0 0 3px rgba(0,194,111,0.1); }
        .country-select option { background: var(--bg2); }

        /* ROLE TABS */
        .role-tabs {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px; margin-bottom: 24px;
          background: var(--bg3); border: 1px solid var(--b);
          border-radius: 12px; padding: 5px;
        }
        .role-tab {
          padding: 10px; border-radius: 8px; border: none;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all .15s; font-family: var(--body);
          display: flex; align-items: center; justify-content: center;
          gap: 7px; color: var(--m); background: transparent;
        }
        .role-tab.active {
          background: var(--bg2); color: var(--t);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        /* ERROR BANNER */
        .err-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: var(--err-bg);
          border: 1px solid rgba(255,100,100,0.18);
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 20px; font-size: 13px;
          color: var(--err); line-height: 1.5;
          animation: fade-up .2s ease;
        }
        .err-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

        /* SUCCESS BANNER */
        .ok-banner {
          display: flex; align-items: center; gap: 10px;
          background: rgba(0,194,111,0.08);
          border: 1px solid rgba(0,194,111,0.2);
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 20px; font-size: 13px;
          color: var(--g);
        }

        /* PASSWORD STRENGTH */
        .pw-strength { margin-top: 7px; }
        .pw-bars { display: flex; gap: 4px; margin-bottom: 4px; }
        .pw-bar { flex: 1; height: 3px; border-radius: 2px; background: var(--b); transition: background .3s; }
        .pw-label { font-size: 10px; color: var(--m); }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%; background: var(--g); color: #080C09;
          border: none; border-radius: 10px;
          padding: 14px; font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: var(--body);
          transition: background .15s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { background: var(--g2); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #080C09;
          animation: spin .7s linear infinite;
        }

        /* DIVIDER */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0; font-size: 12px; color: var(--m);
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--b);
        }

        /* SOCIAL BTNS */
        .social-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .social-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--bg3); border: 1px solid var(--b);
          border-radius: 10px; padding: 12px; font-size: 13px;
          font-weight: 500; color: var(--m); cursor: pointer;
          transition: all .15s; font-family: var(--body);
        }
        .social-btn:hover { border-color: var(--bh); color: var(--t); }

        /* FOOTER LINK */
        .auth-footer-link {
          text-align: center; margin-top: 24px;
          font-size: 13px; color: var(--m);
        }
        .auth-footer-link a { color: var(--g); text-decoration: none; font-weight: 500; }
        .auth-footer-link a:hover { text-decoration: underline; }

        /* TERMS */
        .terms-note {
          font-size: 11px; color: var(--m); text-align: center;
          margin-top: 16px; line-height: 1.6;
        }
        .terms-note a { color: var(--g); text-decoration: none; }

        /* CHECKBOX */
        .checkbox-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .custom-cb {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid var(--b); background: var(--bg3);
          cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; appearance: none; outline: none;
        }
        .custom-cb:checked {
          background: var(--g); border-color: var(--g);
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='8' viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4l3 3 5-6' stroke='%23080C09' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: center;
        }
        .cb-label { font-size: 12px; color: var(--m); line-height: 1.5; }
        .cb-label a { color: var(--g); text-decoration: none; }

        /* FORGOT LINK */
        .forgot-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 7px;
        }
        .forgot-link {
          font-size: 12px; color: var(--g); text-decoration: none;
        }
        .forgot-link:hover { text-decoration: underline; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .auth-shell { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right {
            border-left: none; padding: 32px 24px;
            min-height: 100vh; align-items: flex-start;
            padding-top: 64px;
          }
          .form-row { grid-template-columns: 1fr; }
          .auth-mobile-logo {
            position: fixed; top: 0; left: 0; right: 0;
            padding: 16px 24px;
            background: rgba(8,12,9,0.92);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--b);
            display: flex; align-items: center; gap: 8px;
            font-family: var(--head); font-weight: 800; font-size: 18px;
            z-index: 50; text-decoration: none; color: var(--t);
          }
        }
        @media (min-width: 901px) {
          .auth-mobile-logo { display: none; }
        }
      `}</style>

      <Link href="/" className="auth-mobile-logo">
        <div className="ldot" />
        MotoBus
      </Link>

      <div className="auth-shell">
        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="al-orb" style={{width:500,height:500,top:-150,right:-150,background:"rgba(0,194,111,0.08)"}} />
          <div className="al-orb" style={{width:300,height:300,bottom:-80,left:-80,background:"rgba(255,107,53,0.06)"}} />

          <Link href="/" className="al-brand">
            <div className="ldot" />
            MotoBus
          </Link>

          <div className="al-hero">
            <div className="al-tag">
              <div className="ldot" style={{width:6,height:6}} />
              East Africa&apos;s #1 ride platform
            </div>
            <h1 className="al-title">
              Move smarter.<br />
              <span>Ride faster.</span>
            </h1>
            <p className="al-sub">
              Real-time moto &amp; bus tracking, MoMo payments, and fleet intelligence — built for Rwanda and beyond.
            </p>
            <div className="al-stats">
              <div>
                <div className="al-stat-val">24<em>K+</em></div>
                <div className="al-stat-lbl">Daily rides</div>
              </div>
              <div>
                <div className="al-stat-val">680<em>+</em></div>
                <div className="al-stat-lbl">Active drivers</div>
              </div>
              <div>
                <div className="al-stat-val">4.9<em>★</em></div>
                <div className="al-stat-lbl">Avg rating</div>
              </div>
            </div>
          </div>

          <div className="al-footer">
            {[
              { icon: "🔒", text: "End-to-end secure" },
              { icon: "⚡", text: "Sub-5s matching"   },
              { icon: "🌍", text: "5 countries"       },
            ].map(t => (
              <div className="al-trust" key={t.text}>
                <div className="al-trust-icon">{t.icon}</div>
                {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-card">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
