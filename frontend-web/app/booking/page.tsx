// frontend-web/app/booking/page.tsx
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#080C09] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/passenger" className="p-2 hover:bg-[#141C15] rounded-xl transition">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold">Book a Ride</h1>
        </div>

        <div className="bg-[#111714] border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-gray-400 text-sm">
            The booking page is under construction.
          </p>
          <Link
            href="/passenger"
            className="mt-6 inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
