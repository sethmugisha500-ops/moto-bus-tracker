// app/driver/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// ── Navigation Icons ─────────────────────────────────────────────────────
function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconRides({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 8v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.05 11a9 9 0 1 0 .5-4" strokeLinecap="round" />
      <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEarnings({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 2v20" strokeLinecap="round" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

// ── Navigation Items ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/driver", label: "Home", Icon: IconDashboard },
  { href: "/driver/rides", label: "Rides", Icon: IconRides },
  { href: "/driver/earnings", label: "Earnings", Icon: IconEarnings },
  { href: "/driver/profile", label: "Profile", Icon: IconProfile },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [driverName, setDriverName] = useState("D");

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name?.charAt(0) || "D");
      }
    } catch {
      setDriverName("D");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080C09] text-white font-sans">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-50 bg-[#0A0E0B]/92 backdrop-blur-xl border-b border-[#1A1E1C]">
        <Link href="/driver" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-bold text-lg">MotoBus</span>
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Driver</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/driver/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all bg-green-500/10 border border-green-500/25 text-green-500 hover:bg-green-500/20">
              {driverName}
            </div>
          </Link>
        </div>
      </header>

      {/* ── PAGE CONTENT ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* ── BOTTOM NAVIGATION ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E0B]/97 backdrop-blur-xl border-t border-[#1A1E1C] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative ${
                  active ? "text-green-500" : "text-gray-400 hover:text-white"
                }`}
              >
                <span
                  className={`absolute top-0 w-8 h-0.5 rounded-b-full transition-all duration-300 ${
                    active ? "bg-green-500" : "bg-transparent"
                  }`}
                />
                <Icon active={active} />
                <span className={`text-[10px] tracking-wider ${active ? "font-semibold" : "font-normal"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}