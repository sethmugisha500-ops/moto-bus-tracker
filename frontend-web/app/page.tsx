// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';

// ─── Static Data ────────────────────────────────────────────────────
const STATIC_STATS = {
  dailyRides: 24800,
  activeDrivers: 680,
  avgRating: 4.9,
  onlineNow: 247,
  countries: 5,
  cities: 12,
};

const COUNTRIES = [
  { flag: "🇷🇼", name: "Rwanda",   cities: "Kigali · Butare",    active: true  },
  { flag: "🇰🇪", name: "Kenya",    cities: "Nairobi · Mombasa", active: true  },
  { flag: "🇺🇬", name: "Uganda",   cities: "Kampala · Jinja",   active: true  },
  { flag: "🇹🇿", name: "Tanzania", cities: "Dar es Salaam",     active: false },
  { flag: "🇧🇮", name: "Burundi",  cities: "Bujumbura",         active: false },
];

const FEATURES = [
  { icon: "⚡", title: "Sub-5s matching",         desc: "WebSocket-powered dispatch. No 50-minute waits on Saturday. Real availability, every second.",                   tag: "10× faster than YEGO",     color: "#FFD600" },
  { icon: "🗺️", title: "Real address search",    desc: "Type any address, landmark, or business. Not just a pin drop on a blank map.",                                   tag: "What YEGO should've built", color: "#00C26F" },
  { icon: "💛", title: "MoMo · Airtel · M-Pesa", desc: "Every payment method that works across East Africa. Wallet, cash, card. All in one tap.",                        tag: "5 payment methods",         color: "#FF6B35" },
  { icon: "🚨", title: "One-tap SOS",             desc: "Emergency alert sends your live GPS, driver info, and plate to your contacts instantly.",                        tag: "Always-on safety",          color: "#FF4444" },
  { icon: "📊", title: "Fleet intelligence",      desc: "Live fleet map, revenue charts, driver safety scores, SOS alerts — all in one dashboard.",                       tag: "Enterprise-grade ops",      color: "#818CF8" },
  { icon: "🌍", title: "4 languages",             desc: "Kinyarwanda, English, Swahili, French — switch in settings. YEGO is English-only with broken patches.",          tag: "Truly local",               color: "#34D399" },
];

const RIDE_TYPES = [
  { icon: "🛵", name: "Eco",   price: "From RWF 500",   desc: "Budget-friendly", color: "#34D399" },
  { icon: "🏍️", name: "Moto",  price: "From RWF 800",   desc: "Fast & popular",  color: "#00C26F" },
  { icon: "🚗", name: "Ride",  price: "From RWF 1,500", desc: "AC, comfortable", color: "#818CF8" },
  { icon: "🚌", name: "Bus",   price: "From RWF 300",   desc: "Fixed route",     color: "#F59E0B" },
];

const PAYMENTS = [
  { icon: "💛", name: "MTN MoMo",    sub: "Rwanda · Uganda",      popular: true  },
  { icon: "🔴", name: "Airtel Money", sub: "Rwanda · Uganda · TZ", popular: false },
  { icon: "📱", name: "M-Pesa",       sub: "Kenya · Tanzania",     popular: false },
  { icon: "💜", name: "Wallet",        sub: "Pre-load · Instant",   popular: false },
  { icon: "💵", name: "Cash",          sub: "Always available",     popular: false },
];

// ─── Counter Component ──────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / 1800, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(STATIC_STATS);
  const [activeCountry, setActiveCountry] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // ── Fetch stats from API ──
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/landing/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep using static stats
      }
    };
    fetchStats();

    // ── Check login status ──
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserRole(user.role?.toUpperCase() || null);
        }
      } catch {}
    }

    // ── Scroll handler ──
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Handle Logout ─────────────────────────────────────────────────
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserRole(null);
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  // ─── Get Dashboard Link ────────────────────────────────────────────
  const getDashboardLink = () => {
    if (userRole === 'ADMIN') return '/admin/dashboard';
    if (userRole === 'DRIVER') return '/driver/dashboard';
    return '/passenger';
  };

  // ─── Get Dashboard Label ──────────────────────────────────────────
  const getDashboardLabel = () => {
    if (userRole === 'ADMIN') return 'Admin Dashboard';
    if (userRole === 'DRIVER') return 'Driver Dashboard';
    return 'My Dashboard';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        :root{--g:#00C26F;--g2:#00A05C;--o:#FF6B35;--bg:#080C09;--bg2:#0E1410;--bg3:#141C15;--b:rgba(255,255,255,0.07);--bh:rgba(0,194,111,0.25);--t:#EFF4F0;--m:rgba(239,244,240,0.45);--head:'Bricolage Grotesque',system-ui,sans-serif;--body:'DM Sans',system-ui,sans-serif}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--t);font-family:var(--body);overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(0,194,111,0.3);border-radius:2px}
        @keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(0,194,111,0.4)}50%{box-shadow:0 0 0 8px rgba(0,194,111,0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drive{0%{top:58%;left:14%}25%{top:38%;left:46%}50%{top:52%;left:70%}75%{top:32%;left:54%}100%{top:58%;left:14%}}
        .fu{animation:fade-up .6s ease both}
        .fu1{animation:fade-up .6s .12s ease both}
        .fu2{animation:fade-up .6s .22s ease both}
        .fu3{animation:fade-up .6s .32s ease both}
        .fu4{animation:fade-up .6s .42s ease both}
        .ldot{width:8px;height:8px;border-radius:50%;background:var(--g);animation:pulse-ring 2s ease-in-out infinite;flex-shrink:0}

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:64px;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}
        .nav.sc{background:rgba(8,12,9,0.93);backdrop-filter:blur(24px);border-bottom-color:var(--b)}
        .nav-logo{display:flex;align-items:center;gap:10px;font-family:var(--head);font-weight:800;font-size:20px;letter-spacing:-.02em;text-decoration:none;color:var(--t)}
        .nav-links{display:flex;align-items:center;gap:4px;list-style:none}
        .nav-links a{color:var(--m);text-decoration:none;font-size:14px;padding:7px 14px;border-radius:8px;transition:all .15s}
        .nav-links a:hover{color:var(--t);background:rgba(255,255,255,0.05)}
        .nav-r{display:flex;align-items:center;gap:10px}

        /* BTNS */
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;transition:all .15s;font-family:var(--body);font-weight:500;white-space:nowrap;text-decoration:none;border-radius:10px}
        .btn-g{background:var(--g);color:#080C09;padding:11px 22px;font-size:14px}
        .btn-g:hover{background:var(--g2);transform:translateY(-1px)}
        .btn-g.lg{padding:15px 32px;font-size:16px;border-radius:12px}
        .btn-o{background:transparent;color:var(--m);border:1px solid var(--b);padding:11px 22px;font-size:14px}
        .btn-o:hover{color:var(--t);border-color:var(--bh)}
        .btn-o.lg{padding:15px 28px;font-size:16px;border-radius:12px}

        /* HERO */
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px 60px;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(0,194,111,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,194,111,0.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent)}
        .orb{position:absolute;border-radius:50%;filter:blur(120px);pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:100px;background:rgba(0,194,111,0.08);border:1px solid rgba(0,194,111,0.2);color:var(--g);font-size:13px;font-weight:500;margin-bottom:28px;letter-spacing:.02em}
        .hero-title{font-family:var(--head);font-size:clamp(52px,8vw,96px);font-weight:800;line-height:.98;letter-spacing:-.04em;margin-bottom:24px}
        .ht-gr{display:block;background:linear-gradient(135deg,var(--g) 0%,#00E887 50%,var(--g) 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
        .ht-st{display:block;color:rgba(239,244,240,0.18);text-decoration:line-through;text-decoration-color:var(--o);text-decoration-thickness:3px}
        .hero-sub{font-size:clamp(16px,2.5vw,20px);color:var(--m);font-weight:300;line-height:1.7;max-width:560px;margin:0 auto 44px}
        .hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:72px}

        /* STATS BAR */
        .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--b);border:1px solid var(--b);border-radius:18px;overflow:hidden;width:100%;max-width:720px}
        .stat-cell{background:var(--bg2);padding:24px 20px;display:flex;flex-direction:column;align-items:center;transition:background .2s;cursor:default}
        .stat-cell:hover{background:var(--bg3)}
        .stat-num{font-family:var(--head);font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1;margin-bottom:4px}
        .stat-lbl{font-size:12px;color:var(--m)}

        /* PHONE MOCKUP */
        .phone-float{position:absolute;right:6%;top:50%;transform:translateY(-50%);animation:float 4s ease-in-out infinite;z-index:2}
        .phone-shell{width:240px;background:#0E1410;border-radius:36px;border:1.5px solid rgba(255,255,255,0.1);overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(0,194,111,0.06) inset}
        .phone-bar{display:flex;justify-content:space-between;align-items:center;padding:12px 18px 6px;font-size:10px;font-weight:500}
        .pmap{width:100%;height:180px;background:#0B110D;position:relative;overflow:hidden}
        .pm-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(0,194,111,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,194,111,0.05) 1px,transparent 1px);background-size:16px 16px}
        .pm-road-h{position:absolute;background:rgba(0,194,111,0.12);border-radius:3px;height:4px;left:0;right:0}
        .pm-road-v{position:absolute;background:rgba(0,194,111,0.12);border-radius:3px;width:4px;top:0;bottom:0}
        .pm-blk{position:absolute;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:2px}
        .pm-pin{position:absolute;width:22px;height:22px;background:var(--g);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,194,111,0.5)}
        .pm-pin-dot{width:7px;height:7px;border-radius:50%;background:#080C09;transform:rotate(45deg)}
        .pm-moto{position:absolute;width:22px;height:22px;background:var(--o);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 0 12px rgba(255,107,53,0.5);animation:drive 4s ease-in-out infinite}
        .pm-sos{position:absolute;top:8px;right:8px;background:#FF4444;color:white;font-size:9px;font-weight:700;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:none}
        .pm-near{position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:100px;background:rgba(8,12,9,0.9);color:var(--g);border:1px solid rgba(0,194,111,0.2);font-size:9px;font-weight:500}
        .pm-ldot{width:5px;height:5px;border-radius:50%;background:var(--g);animation:pulse-ring 1.5s infinite}
        .pbot{background:#0E1410;padding:12px}
        .pb-where{background:rgba(255,255,255,0.04);border:1px solid var(--b);border-radius:9px;padding:9px 12px;display:flex;align-items:center;gap:8px;margin-bottom:9px}
        .pb-s{width:13px;height:13px;border-radius:50%;border:1.5px solid var(--g);flex-shrink:0}
        .pb-t{font-size:10px;color:var(--m)}
        .rpills{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:9px}
        .rp{background:rgba(255,255,255,0.03);border:1px solid var(--b);border-radius:7px;padding:6px 3px;text-align:center}
        .rp.s{background:rgba(0,194,111,0.1);border-color:rgba(0,194,111,0.3)}
        .rp-e{font-size:15px;margin-bottom:2px}
        .rp-l{font-size:7px;font-weight:600}
        .rp-p{font-size:7px;color:var(--m)}
        .pb-fare{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:rgba(0,194,111,0.06);border:1px solid rgba(0,194,111,0.15);margin-bottom:9px}
        .pb-fl{font-size:9px;color:var(--m)}
        .pb-fv{font-size:13px;font-weight:700;color:var(--g)}
        .pb-bk{width:100%;background:var(--g);color:#080C09;border:none;padding:9px;border-radius:9px;font-size:10px;font-weight:600;cursor:pointer;font-family:var(--body)}
        .pnav{display:flex;background:#080C09;border-top:1px solid var(--b);padding:7px 0 9px}
        .pni{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--m)}
        .pni.on{color:var(--g)}
        .pni-i{font-size:16px;line-height:1}
        .pni-l{font-size:7px;font-weight:500}

        /* SECTION */
        .sec{padding:100px 24px;max-width:1200px;margin:0 auto}
        .sec-lbl{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--g);margin-bottom:12px}
        .sec-title{font-family:var(--head);font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-.03em;line-height:1.05;margin-bottom:16px}
        .sec-sub{font-size:17px;color:var(--m);font-weight:300;line-height:1.7;max-width:520px}

        /* COUNTRIES */
        .cc-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:40px}
        .cc{background:var(--bg2);border:1px solid var(--b);border-radius:14px;padding:20px 12px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
        .cc::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,194,111,0.08),transparent);opacity:0;transition:opacity .2s}
        .cc:hover::before,.cc.on::before{opacity:1}
        .cc.on{border-color:rgba(0,194,111,0.35)}
        .cc-flag{font-size:32px;margin-bottom:8px}
        .cc-name{font-family:var(--head);font-size:14px;font-weight:700;margin-bottom:3px}
        .cc-city{font-size:10px;color:var(--m);margin-bottom:8px}
        .cc-bdg{display:inline-block;font-size:9px;font-weight:600;padding:2px 8px;border-radius:100px}
        .cc-live{background:rgba(0,194,111,0.12);color:var(--g)}
        .cc-soon{background:rgba(255,255,255,0.06);color:var(--m)}

        /* FEATURES */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--b);border-radius:20px;overflow:hidden;border:1px solid var(--b);margin-top:48px}
        .fc{background:var(--bg2);padding:36px 28px;transition:background .2s;position:relative;overflow:hidden}
        .fc::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--fc,var(--g)),transparent);opacity:0;transition:opacity .25s}
        .fc:hover{background:var(--bg3)}
        .fc:hover::after{opacity:1}
        .fc-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:18px;border:1px solid}
        .fc-title{font-family:var(--head);font-size:17px;font-weight:700;margin-bottom:9px}
        .fc-desc{font-size:13px;color:var(--m);line-height:1.65;font-weight:300}
        .fc-tag{font-size:11px;font-weight:500;margin-top:14px;letter-spacing:.03em;opacity:.8}

        /* RIDES */
        .ride-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:48px}
        .rc{background:var(--bg2);border:1px solid var(--b);border-radius:16px;padding:28px 20px;text-align:center;transition:all .2s;cursor:default;position:relative;overflow:hidden}
        .rc::before{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--rcc,var(--g));opacity:0;transition:opacity .2s}
        .rc:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-3px)}
        .rc:hover::before{opacity:1}
        .rc-icon{font-size:40px;margin-bottom:14px}
        .rc-name{font-family:var(--head);font-size:18px;font-weight:700;margin-bottom:5px}
        .rc-price{font-size:13px;color:var(--m);margin-bottom:8px}
        .rc-tag{font-size:11px;font-weight:500;padding:3px 10px;border-radius:100px}

        /* PAYMENTS STRIP */
        .pay-strip{padding:60px 24px;border-top:1px solid var(--b);border-bottom:1px solid var(--b);background:var(--bg2)}
        .pay-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:32px}
        .pay-cards{display:flex;gap:10px;flex-wrap:wrap}
        .pm-card{display:flex;align-items:center;gap:10px;background:var(--bg3);border:1px solid var(--b);border-radius:12px;padding:10px 14px;transition:border-color .15s;cursor:default}
        .pm-card:hover{border-color:var(--bh)}
        .pm-icon{font-size:20px}
        .pm-name{font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px}
        .pm-sub{font-size:10px;color:var(--m)}
        .pm-pop{font-size:9px;background:rgba(0,194,111,0.1);color:var(--g);padding:1px 6px;border-radius:100px;font-weight:600}

        /* CTA */
        .cta-wrap{max-width:1248px;margin:80px auto 0;padding:0 24px}
        .cta-inner{background:var(--bg2);border:1px solid var(--b);border-radius:24px;padding:64px;display:flex;align-items:center;justify-content:space-between;gap:40px;position:relative;overflow:hidden}
        .cta-inner::before{content:'';position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;background:rgba(0,194,111,0.07)}
        .cta-inner::after{content:'';position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,107,53,0.05)}
        .cta-title{font-family:var(--head);font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:12px}
        .cta-sub{font-size:15px;color:var(--m);max-width:440px;line-height:1.6}
        .cta-acts{display:flex;gap:12px;flex-shrink:0;position:relative;z-index:1}

        /* FOOTER */
        .footer{border-top:1px solid var(--b);padding:56px 40px 32px;max-width:1280px;margin:0 auto}
        .footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px}
        .ft-brand p{font-size:14px;color:var(--m);line-height:1.7;margin-top:12px;font-weight:300;max-width:280px}
        .ft-col h4{font-family:var(--head);font-size:13px;font-weight:700;margin-bottom:16px;letter-spacing:.03em}
        .ft-col ul{list-style:none;display:flex;flex-direction:column;gap:10px}
        .ft-col a{font-size:13px;color:var(--m);text-decoration:none;font-weight:300;transition:color .15s}
        .ft-col a:hover{color:var(--t)}
        .footer-bot{display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:1px solid var(--b);font-size:12px;color:var(--m)}
        .socials{display:flex;gap:10px}
        .soc{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--b);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--m);text-decoration:none;transition:all .15s}
        .soc:hover{border-color:rgba(0,194,111,0.3);color:var(--g)}

        @media(max-width:1100px){.phone-float{display:none}}
        @media(max-width:900px){.feat-grid{grid-template-columns:1fr 1fr}.ride-grid{grid-template-columns:repeat(2,1fr)}.cc-grid{grid-template-columns:repeat(3,1fr)}.footer-top{grid-template-columns:1fr 1fr}.cta-inner{flex-direction:column;text-align:center}.cta-sub{max-width:100%}.cta-acts{justify-content:center}}
        @media(max-width:600px){.nav{padding:0 20px}.nav-links{display:none}.stats-bar{grid-template-columns:1fr 1fr}.feat-grid{grid-template-columns:1fr}.ride-grid{grid-template-columns:1fr 1fr}.cc-grid{grid-template-columns:repeat(2,1fr)}.footer-top{grid-template-columns:1fr}.cta-inner{padding:36px 24px}.cta-wrap{padding:0 16px;margin-top:60px}}
      `}</style>

      {/* ─── NAV ────────────────────────────────────────────────────── */}
      <nav className={`nav${scrollY > 20 ? " sc" : ""}`}>
        <Link href="/" className="nav-logo">
          <div className="ldot" />
          MotoBus
        </Link>
        <ul className="nav-links">
          {["Features","Coverage","Rides"].map(l => (
            <li key={l}><a href={`#${l.toLowerCase()}`}>{l}</a></li>
          ))}
        </ul>
        <div className="nav-r">
          {isLoggedIn ? (
            <>
              <Link href={getDashboardLink()}>
                <button className="btn btn-g">{getDashboardLabel()}</button>
              </Link>
              <button onClick={handleLogout} className="btn btn-o" style={{padding: "11px 16px"}}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login"><button className="btn btn-o">Sign in</button></Link>
              <Link href="/register"><button className="btn btn-g">Sign up</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="orb" style={{width:700,height:700,top:-200,right:-200,background:"rgba(0,194,111,0.07)"}} />
        <div className="orb" style={{width:500,height:500,bottom:-100,left:-100,background:"rgba(255,107,53,0.05)"}} />
        <div className="orb" style={{width:300,height:300,top:"40%",left:"10%",background:"rgba(0,194,111,0.04)"}} />

        {/* Phone Mockup */}
        <div className="phone-float">
          <div className="phone-shell">
            <div className="phone-bar"><span>9:41</span><span style={{fontSize:9}}>▪▪▪</span></div>
            <div className="pmap">
              <div className="pm-bg" />
              <div className="pm-road-h" style={{top:"44%"}} />
              <div className="pm-road-h" style={{top:"68%"}} />
              <div className="pm-road-v" style={{left:"38%"}} />
              <div className="pm-road-v" style={{left:"64%"}} />
              <div className="pm-blk" style={{left:"8%",top:"12%",width:"24%",height:"26%"}} />
              <div className="pm-blk" style={{left:"42%",top:"10%",width:"18%",height:"28%"}} />
              <div className="pm-blk" style={{left:"68%",top:"12%",width:"22%",height:"24%"}} />
              <div className="pm-blk" style={{left:"8%",top:"52%",width:"26%",height:"14%"}} />
              <div className="pm-blk" style={{left:"68%",top:"52%",width:"20%",height:"16%"}} />
              <div className="pm-pin" style={{left:"43%",top:"28%"}}><div className="pm-pin-dot" /></div>
              <div className="pm-moto">🏍</div>
              <div className="pm-sos">SOS</div>
              <div className="pm-near"><div className="pm-ldot" />6 nearby</div>
            </div>
            <div className="pbot">
              <div className="pb-where"><div className="pb-s" /><span className="pb-t">Where are you going?</span></div>
              <div className="rpills">
                <div className="rp s"><div className="rp-e">🛵</div><div className="rp-l">Eco</div><div className="rp-p">500+</div></div>
                <div className="rp"><div className="rp-e">🏍️</div><div className="rp-l">Moto</div><div className="rp-p">800+</div></div>
                <div className="rp"><div className="rp-e">🚗</div><div className="rp-l">Ride</div><div className="rp-p">1500+</div></div>
                <div className="rp"><div className="rp-e">🚌</div><div className="rp-l">Bus</div><div className="rp-p">300+</div></div>
              </div>
              <div className="pb-fare"><span className="pb-fl">Estimated fare</span><span className="pb-fv">RWF 1,800</span></div>
              <Link href="/passenger"><button className="pb-bk">Book now →</button></Link>
            </div>
            <div className="pnav">
              <div className="pni on"><div className="pni-i">⏱</div><div className="pni-l">Ride</div></div>
              <div className="pni"><div className="pni-i">📋</div><div className="pni-l">History</div></div>
              <div className="pni"><div className="pni-i">💳</div><div className="pni-l">Wallet</div></div>
              <div className="pni"><div className="pni-i">👤</div><div className="pni-l">Profile</div></div>
            </div>
          </div>
        </div>

        <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div className="hero-badge fu">
            <div className="ldot" />
            <strong>{stats.onlineNow}</strong>&nbsp;drivers live across East Africa right now
          </div>

          <h1 className="hero-title fu1">
            Move smarter.
            <span className="ht-gr">Ride faster.</span>
            <span className="ht-st">Wait longer.</span>
          </h1>

          <p className="hero-sub fu2">
            Real-time moto &amp; bus tracking, MoMo payments, and fleet intelligence.
            Built for Rwanda — scaled across East Africa.
          </p>

          <div className="hero-btns fu3">
            <Link href="/passenger"><button className="btn btn-g lg">Book a ride 🏍️</button></Link>
            <Link href="/admin"><button className="btn btn-o lg">Operator dashboard →</button></Link>
          </div>

          <div className="stats-bar fu4">
            {[
              {label:"Daily rides",    n:Math.round(stats.dailyRides/1000), sx:"K+"},
              {label:"Active drivers", n:stats.activeDrivers,               sx:"+" },
              {label:"Avg rating",     n:stats.avgRating,                   sx:" ★"},
              {label:"Countries",      n:stats.countries,                   sx:"" },
            ].map(s => (
              <div className="stat-cell" key={s.label}>
                <div className="stat-num"><Counter end={s.n} suffix={s.sx} /></div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COVERAGE ────────────────────────────────────────────────── */}
      <section className="sec" id="coverage" style={{paddingTop:60}}>
        <div className="sec-lbl">Coverage</div>
        <h2 className="sec-title">Built for East Africa</h2>
        <p className="sec-sub">One platform, {stats.countries} countries, {stats.cities} cities — and growing.</p>
        <div className="cc-grid">
          {COUNTRIES.map((c,i) => (
            <div key={c.name} className={`cc${activeCountry===i?" on":""}`} onClick={()=>setActiveCountry(i)}>
              <div className="cc-flag">{c.flag}</div>
              <div className="cc-name">{c.name}</div>
              <div className="cc-city">{c.cities}</div>
              <span className={`cc-bdg ${c.active?"cc-live":"cc-soon"}`}>{c.active?"● Live":"Coming soon"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────── */}
      <section className="sec" id="features" style={{paddingTop:40}}>
        <div className="sec-lbl">Why MotoBus wins</div>
        <h2 className="sec-title">Every YEGO weakness,<br/>fixed.</h2>
        <p className="sec-sub">Based on 3,000+ real reviews from YEGO&apos;s App Store and Play Store pages.</p>
        <div className="feat-grid">
          {FEATURES.map(f => (
            <div className="fc" key={f.title} style={{"--fc":f.color} as React.CSSProperties}>
              <div className="fc-icon" style={{background:`${f.color}14`,borderColor:`${f.color}30`}}>{f.icon}</div>
              <div className="fc-title">{f.title}</div>
              <p className="fc-desc">{f.desc}</p>
              <div className="fc-tag" style={{color:f.color}}>← {f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RIDE TYPES ──────────────────────────────────────────────── */}
      <section className="sec" id="rides" style={{paddingTop:40}}>
        <div className="sec-lbl">Services</div>
        <h2 className="sec-title">Every way to move</h2>
        <p className="sec-sub">From budget eco rides to premium cars — one app covers it all.</p>
        <div className="ride-grid">
          {RIDE_TYPES.map(r => (
            <div className="rc" key={r.name} style={{"--rcc":r.color} as React.CSSProperties}>
              <div className="rc-icon">{r.icon}</div>
              <div className="rc-name">{r.name}</div>
              <div className="rc-price">{r.price}</div>
              <span className="rc-tag" style={{background:`${r.color}14`,color:r.color}}>{r.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAYMENTS STRIP ──────────────────────────────────────────── */}
      <div className="pay-strip">
        <div className="pay-inner">
          <div>
            <div className="sec-lbl" style={{marginBottom:8}}>Payments</div>
            <h3 style={{fontFamily:"var(--head)",fontSize:28,fontWeight:800,letterSpacing:"-.02em",marginBottom:4}}>Every method that matters</h3>
            <p style={{fontSize:14,color:"var(--m)",fontWeight:300}}>Across Rwanda, Kenya, Uganda &amp; Tanzania</p>
          </div>
          <div className="pay-cards">
            {PAYMENTS.map(p => (
              <div className="pm-card" key={p.name}>
                <div className="pm-icon">{p.icon}</div>
                <div>
                  <div className="pm-name">{p.name}{p.popular&&<span className="pm-pop">Popular</span>}</div>
                  <div className="pm-sub">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <div className="cta-wrap">
        <div className="cta-inner">
          <div style={{position:"relative",zIndex:1}}>
            <h2 className="cta-title">Ready to leave YEGO<br/>behind for good?</h2>
            <p className="cta-sub">Get your account in 60 seconds. Operators get a full fleet dashboard — free for the first 30 days.</p>
          </div>
          <div className="cta-acts">
            <Link href={isLoggedIn ? getDashboardLink() : "/register"}>
              <button className="btn btn-g lg">
                {isLoggedIn ? "Go to Dashboard" : "Create free account"}
              </button>
            </Link>
            <Link href="/admin"><button className="btn btn-o lg">Operator demo →</button></Link>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-top">
          <div className="ft-brand">
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div className="ldot" />
              <span style={{fontFamily:"var(--head)",fontWeight:800,fontSize:18}}>MotoBus</span>
            </div>
            <p>East Africa&apos;s smartest ride-hailing platform. Real-time tracking, instant payments, fleet intelligence — from Kigali to Nairobi.</p>
          </div>
          {[
            {title:"Riders",    links:[{label:"Book a ride", href:"/passenger"},{label:"Track my ride", href:"/passenger"},{label:"Wallet", href:"/wallet"},{label:"Safety center", href:"/support"}]},
            {title:"Operators", links:[{label:"Fleet dashboard", href:"/admin"},{label:"Driver management", href:"/admin/drivers"},{label:"Analytics", href:"/admin/analytics"},{label:"Support", href:"/support"}]},
            {title:"Company",   links:[{label:"About", href:"/about"},{label:"Careers", href:"/careers"},{label:"Privacy", href:"/privacy"},{label:"Contact", href:"/support/contact"}]},
          ].map(col => (
            <div className="ft-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>{col.links.map(l => <li key={l.label}><Link href={l.href}>{l.label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bot">
          <span>© 2026 MotoBus Ltd. · Kigali, Rwanda 🇷🇼</span>
          <div className="socials">
            <a href="#" className="soc">𝕏</a>
            <a href="#" className="soc">in</a>
            <a href="#" className="soc">fb</a>
            <a href="#" className="soc">ig</a>
          </div>
        </div>
      </footer>
    </>
  );
}
