'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminStats from './AdminStats';
import AdminChart from './AdminChart';
import AdminDriversList from './AdminDriversList';
import AdminRidesList from './AdminRidesList';

export default function AdminPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-20 py-24" id="admin">
      <div className="max-w-6xl mx-auto">
        <div className="text-green-500 text-xs font-semibold tracking-[0.12em] uppercase mb-4">
          For operators
        </div>
        <h2 className="font-head text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4">
          Your fleet, fully visible
        </h2>
        <p className="text-lg text-muted font-light leading-relaxed mb-12">
          Real-time dashboards, driver management, revenue tracking, and emergency alerts in one place.
        </p>

        <div className="bg-bg border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center px-6 py-4 bg-bg2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold">MotoBus Admin — Live</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-transparent text-muted hover:border-border-hover transition-all">
                Export
              </button>
              <button className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-transparent text-muted hover:border-border-hover transition-all">
                Filters
              </button>
              <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-500 text-bg border border-green-500">
                + Add driver
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="p-6">
              <AdminStats />
              <AdminChart />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                <AdminDriversList />
                <AdminRidesList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}