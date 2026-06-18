"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Nav icons (inline SVG — no external dep needed for layout) ────────────
function IconRide({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  );
}
function IconHistory({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 8v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.05 11a9 9 0 1 0 .5-4" strokeLinecap="round" />
      <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconWallet({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0" fill="currentColor" />
      <path d="M2 10h20" strokeLinecap="round" />
    </svg>
  );
}
function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/passenger",         label: "Ride",    Icon: IconRide    },
  { href: "/passenger/history", label: "History", Icon: IconHistory },
  { href: "/passenger/wallet",  label: "Wallet",  Icon: IconWallet  },
  { href: "/passenger/profile", label: "Profile", Icon: IconProfile },
];

// ─────────────────────────────────────────────────────────────────────────
export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)" }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4"
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 14px)`,
          paddingBottom: 14,
          background: "rgba(10,14,11,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--green)", boxShadow: "0 0 0 0 rgba(0,194,111,0.4)", animation: "pulse-anim 2s ease-in-out infinite" }}
          />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18 }}>
            MotoBus
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5">
          {/* Notifications bell */}
          <button
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--muted)" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
            </svg>
            {/* Unread badge */}
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "var(--green)", border: "1.5px solid var(--bg)" }}
            />
          </button>

          {/* Avatar */}
          <Link href="/passenger/profile">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
              style={{
                background: "rgba(0,194,111,0.12)",
                border: "1px solid rgba(0,194,111,0.25)",
                color: "var(--green)",
                fontFamily: "var(--font-head)",
              }}
            >
              JM
            </div>
          </Link>
        </div>
      </header>

      {/* ── PAGE CONTENT ────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
      >
        {children}
      </main>

      {/* ── BOTTOM NAVIGATION ───────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: "rgba(10,14,11,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
              style={{ color: active ? "var(--green)" : "var(--muted)", textDecoration: "none" }}
            >
              {/* Active top indicator */}
              <span
                className="absolute top-0 w-6 rounded-b-full transition-all"
                style={{
                  height: 2,
                  background: active ? "var(--green)" : "transparent",
                  marginTop: 0,
                }}
              />

              <Icon active={active} />

              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.03em",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}