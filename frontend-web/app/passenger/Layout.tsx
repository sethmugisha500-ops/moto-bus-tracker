// app/passenger/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// ── Navigation Icons ─────────────────────────────────────────────────────
function IconRide({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 8v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.05 11a9 9 0 1 0 .5-4" strokeLinecap="round" />
      <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWallet({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0" fill="currentColor" />
      <path d="M2 10h20" strokeLinecap="round" />
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

function IconSupport({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

// ── Navigation Items ─────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/passenger", label: "Ride", Icon: IconRide },
  { href: "/passenger/history", label: "History", Icon: IconHistory },
  { href: "/passenger/wallet", label: "Wallet", Icon: IconWallet },
  { href: "/passenger/profile", label: "Profile", Icon: IconProfile },
];

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userInitial, setUserInitial] = useState("U");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || "User");
        setUserInitial(user.name?.charAt(0) || "U");
      }
    } catch {
      setUserInitial("U");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080C09] text-white font-sans">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-50 bg-[#0A0E0B]/92 backdrop-blur-xl border-b border-[#1A1E1C]">
        <Link href="/passenger" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-bold text-lg">MotoBus</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/passenger/notifications">
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[#141C15] border border-[#1A1E1C] transition-all hover:border-green-500/30">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 border border-[#0A0E0B]" />
            </button>
          </Link>

          <Link href="/passenger/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all bg-green-500/10 border border-green-500/25 text-green-500 hover:bg-green-500/20">
              {userInitial}
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
                <span className={`absolute top-0 w-8 h-0.5 rounded-b-full transition-all duration-300 ${active ? "bg-green-500" : "bg-transparent"}`} />
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
