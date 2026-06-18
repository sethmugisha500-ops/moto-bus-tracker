"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Map = dynamic(
  () => import("@/components/maps/Map").then((mod) => mod.Map),
  { ssr: false, loading: () => <div style={{ width: "100%", height: "100%", background: "#0D1510" }} /> }
);

// Mock data - use if API fails
const MOCK_DRIVERS = [
  { id: 1, name: "Jean Paul", vehicle: "RAB 123M", distance: "200m", eta: "2 min", rating: 4.8, isElectric: false },
  { id: 2, name: "Marie Claire", vehicle: "RAB 456M", distance: "350m", eta: "3 min", rating: 4.9, isElectric: true },
  { id: 3, name: "Eric Muneza", vehicle: "RAB 789M", distance: "500m", eta: "4 min", rating: 4.7, isElectric: false },
];

const RIDE_TYPES = [
  { id: "eco",      label: "Eco",      icon: "🌿", desc: "Budget friendly",  base: 500, perKm: 300 },
  { id: "standard", label: "Standard", icon: "🏍️", desc: "Fast & reliable",  base: 400, perKm: 250 },
  { id: "premium",  label: "Premium",  icon: "⚡", desc: "Top-rated drivers", base: 800, perKm: 450 },
];

const PAYMENT_METHODS = [
  { id: "momo",   label: "MoMo",   icon: "💛" },
  { id: "wallet", label: "Wallet", icon: "💜" },
  { id: "cash",   label: "Cash",   icon: "💵" },
];

const RECENT_PLACES = [
  { icon: "⭐", label: "Kigali Convention Centre", sub: "KG 2 Roundabout" },
  { icon: "🏠", label: "Home",   sub: "Kacyiru, Sector 4" },
  { icon: "💼", label: "Office", sub: "Norrsken House, Kimihurura" },
];

type Step = "idle" | "form" | "searching" | "matched";

export default function PassengerHome() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState("");
  const [pickup, setPickup] = useState("Current location");
  const [rideType, setRideType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [matchedDriver, setMatchedDriver] = useState<typeof MOCK_DRIVERS[0] | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);

  // ── GPS ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: -1.9441, lng: 30.0619 }) // Kigali fallback
      );
    }
  }, []);

  // ── Fetch nearby drivers ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch("/api/vehicles");
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        if (data.vehicles?.length) {
          setDrivers(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.vehicles.map((v: any) => ({
              id: v.id,
              name: v.driver || "Driver",
              vehicle: v.registration,
              distance: `${Math.floor(Math.random() * 500 + 100)}m`,
              eta: `${Math.floor(Math.random() * 5 + 2)} min`,
              rating: v.rating || 4.5,
              isElectric: v.isElectric || false,
            }))
          );
        }
      } catch {
        // keep mock
      }
    };
    fetchDrivers();
  }, []);

  // ── Searching countdown mock ─────────────────────────────────────────────
  useEffect(() => {
    if (step !== "searching") return;
    const t = setInterval(() => setSearchSeconds((s) => s + 1), 1000);
    const match = setTimeout(() => {
      setMatchedDriver(drivers[0]);
      setStep("matched");
      clearInterval(t);
    }, 4000);
    return () => { clearInterval(t); clearTimeout(match); };
  }, [step, drivers]);

  // ── Fare calculation ─────────────────────────────────────────────────────
  const DIST_KM = 2.5;
  const fare = () => {
    const rt = RIDE_TYPES.find((r) => r.id === rideType)!;
    return Math.round(rt.base + DIST_KM * rt.perKm);
  };

  // ── Request ride ─────────────────────────────────────────────────────────
  const handleRequestRide = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupLat: location?.lat ?? -1.9441,
          pickupLng: location?.lng ?? 30.0619,
          dropoffLat: -1.9876, dropoffLng: 30.1011,
          dropoffAddress: destination,
          rideType, fare: fare(),
        }),
      });
      if (!res.ok) throw new Error("API failed");
    } catch {
      // demo mode — continue anyway
    } finally {
      setLoading(false);
      setStep("searching");
      setSearchSeconds(0);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>

      {/* ── MAP ────────────────────────────────────────────────────────── */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <Map
          center={location ? [location.lat, location.lng] : [-1.9441, 30.0619]}
          zoom={14}
        />

        {/* Floating SOS button */}
        <button
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-transform hover:scale-105"
          style={{ background: "#FF4444", color: "white", fontSize: 11 }}
        >
          SOS
        </button>

        {/* Live indicator */}
        <div
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(10,14,11,0.85)", backdropFilter: "blur(12px)", color: "var(--green)", border: "1px solid rgba(0,194,111,0.2)" }}
        >
          <span className="pulse-dot w-1.5 h-1.5" />
          {drivers.length} drivers nearby
        </div>
      </div>

      {/* ── BOTTOM SHEET ───────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 animate-slide-up overflow-y-auto"
        style={{
          borderRadius: "24px 24px 0 0",
          background: "rgba(10,14,11,0.97)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          maxHeight: "62vh",
          padding: "20px 16px",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* ── IDLE: where to ── */}
        {step === "idle" && (
          <>
            {/* Search bar */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-5 text-left transition-all"
              style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
              onClick={() => setStep("form")}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--green)" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span className="text-sm" style={{ color: "var(--muted)" }}>Where are you going?</span>
            </button>

            {/* Ride type selector */}
            <p className="label mb-2">Select ride type</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {RIDE_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => { setRideType(rt.id); setStep("form"); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all"
                  style={{
                    background: rideType === rt.id ? "rgba(0,194,111,0.1)" : "var(--bg3)",
                    border: `1px solid ${rideType === rt.id ? "rgba(0,194,111,0.3)" : "var(--border)"}`,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{rt.icon}</span>
                  <span className="text-xs font-semibold">{rt.label}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {rt.base}+{rt.perKm}/km
                  </span>
                </button>
              ))}
            </div>

            {/* Recent places */}
            <p className="label mb-2">Recent places</p>
            {RECENT_PLACES.map((p) => (
              <button
                key={p.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all text-left"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => { setDestination(p.label); setStep("form"); }}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--bg3)" }}
                >
                  {p.icon}
                </span>
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{p.sub}</p>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ── FORM: destination + options ── */}
        {step === "form" && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep("idle")} style={{ color: "var(--muted)" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h3 className="font-semibold">Where to?</h3>
            </div>

            {/* Location inputs */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--green)" }} />
                <input
                  className="input pl-9"
                  placeholder="Pickup"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--orange)" }} />
                <input
                  className="input pl-9"
                  placeholder="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Ride type */}
            <p className="label mb-2">Ride type</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {RIDE_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setRideType(rt.id)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all"
                  style={{
                    background: rideType === rt.id ? "rgba(0,194,111,0.1)" : "var(--bg3)",
                    border: `1px solid ${rideType === rt.id ? "rgba(0,194,111,0.3)" : "var(--border)"}`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{rt.icon}</span>
                  <span className="text-xs font-semibold">{rt.label}</span>
                </button>
              ))}
            </div>

            {/* Payment */}
            <p className="label mb-2">Payment</p>
            <div className="flex gap-2 mb-4">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: paymentMethod === pm.id ? "rgba(0,194,111,0.1)" : "var(--bg3)",
                    border: `1px solid ${paymentMethod === pm.id ? "rgba(0,194,111,0.3)" : "var(--border)"}`,
                    color: paymentMethod === pm.id ? "var(--green)" : "var(--muted)",
                  }}
                >
                  {pm.icon} {pm.label}
                </button>
              ))}
            </div>

            {/* Fare estimate */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ background: "rgba(0,194,111,0.06)", border: "1px solid rgba(0,194,111,0.15)" }}
            >
              <span className="text-sm" style={{ color: "var(--muted)" }}>Estimated fare</span>
              <span className="font-bold text-lg" style={{ color: "var(--green)" }}>
                RWF {fare().toLocaleString()}
              </span>
            </div>

            <button
              className="btn-primary w-full text-sm"
              disabled={loading || !destination.trim()}
              onClick={handleRequestRide}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "transparent", borderTopColor: "#0A0E0B" }} />
                  Requesting…
                </span>
              ) : "Request ride →"}
            </button>
          </>
        )}

        {/* ── SEARCHING ── */}
        {step === "searching" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
              style={{ background: "rgba(0,194,111,0.1)", border: "1px solid rgba(0,194,111,0.2)" }}
            >
              🏍️
            </div>
            <p className="font-semibold text-lg mb-1">Finding your driver…</p>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Searching nearby • {searchSeconds}s
            </p>

            {/* Animated dots */}
            <div className="flex gap-1.5 mb-6">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--green)", animation: `pulse-anim 1.2s ${i * 0.2}s ease-in-out infinite` }}
                />
              ))}
            </div>

            <div
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-4 text-sm"
              style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--muted)" }}>To: {destination}</span>
              <span style={{ color: "var(--green)", fontWeight: 600 }}>RWF {fare().toLocaleString()}</span>
            </div>

            <button
              className="text-sm px-4 py-2 rounded-xl transition-all"
              style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", color: "var(--orange)" }}
              onClick={() => setStep("idle")}
            >
              Cancel search
            </button>
          </div>
        )}

        {/* ── MATCHED ── */}
        {step === "matched" && matchedDriver && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--green)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Driver matched!
                </p>
                <p className="font-bold text-lg" style={{ fontFamily: "var(--font-head)" }}>{matchedDriver.name}</p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(0,194,111,0.1)", border: "1px solid rgba(0,194,111,0.2)" }}
              >
                {matchedDriver.isElectric ? "⚡" : "🏍️"}
              </div>
            </div>

            {/* Driver info row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "ETA",    value: matchedDriver.eta },
                { label: "Rating", value: `${matchedDriver.rating} ★` },
                { label: "Away",   value: matchedDriver.distance },
              ].map((s) => (
                <div key={s.label} className="card-sm p-3 text-center">
                  <p className="font-bold text-sm">{s.value}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Plate */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
            >
              <span className="text-sm" style={{ color: "var(--muted)" }}>Plate number</span>
              <span className="font-mono font-bold text-sm">{matchedDriver.vehicle}</span>
            </div>

            {/* Fare */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ background: "rgba(0,194,111,0.06)", border: "1px solid rgba(0,194,111,0.15)" }}
            >
              <span className="text-sm" style={{ color: "var(--muted)" }}>Fare · {paymentMethod.toUpperCase()}</span>
              <span className="font-bold" style={{ color: "var(--green)" }}>RWF {fare().toLocaleString()}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                📞 Call driver
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", color: "var(--orange)" }}
                onClick={() => setStep("idle")}
              >
                Cancel ride
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}