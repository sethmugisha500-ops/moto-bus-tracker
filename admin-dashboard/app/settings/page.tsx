'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [pricing, setPricing] = useState({
    motoBase: 500,
    motoPerKm: 300,
    busBase: 300,
    busPerKm: 100,
    minibusBase: 400,
    minibusPerKm: 200,
  });

  const [commission, setCommission] = useState({
    driver: 20,
    platform: 80,
  });

  const [languages, setLanguages] = useState(['English', 'French', 'Swahili', 'Kinyarwanda']);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted text-sm">Configure platform settings and preferences</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pricing Settings */}
        <div className="bg-darkCard border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Pricing Configuration</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted mb-2">Moto</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">Base Fare (RWF)</label>
                  <input
                    type="number"
                    value={pricing.motoBase}
                    onChange={(e) => setPricing({ ...pricing, motoBase: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Per KM (RWF)</label>
                  <input
                    type="number"
                    value={pricing.motoPerKm}
                    onChange={(e) => setPricing({ ...pricing, motoPerKm: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted mb-2">Bus</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">Base Fare (RWF)</label>
                  <input
                    type="number"
                    value={pricing.busBase}
                    onChange={(e) => setPricing({ ...pricing, busBase: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Per KM (RWF)</label>
                  <input
                    type="number"
                    value={pricing.busPerKm}
                    onChange={(e) => setPricing({ ...pricing, busPerKm: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted mb-2">Mini-Bus</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">Base Fare (RWF)</label>
                  <input
                    type="number"
                    value={pricing.minibusBase}
                    onChange={(e) => setPricing({ ...pricing, minibusBase: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">Per KM (RWF)</label>
                  <input
                    type="number"
                    value={pricing.minibusPerKm}
                    onChange={(e) => setPricing({ ...pricing, minibusPerKm: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <button className="w-full bg-primary text-dark py-2 rounded-lg mt-2">Save Pricing</button>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-darkCard border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Commission Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted">Driver Commission (%)</label>
              <input
                type="number"
                value={commission.driver}
                onChange={(e) => setCommission({ ...commission, driver: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg mt-1"
              />
              <p className="text-xs text-muted mt-1">Driver earns: {commission.driver}% of each ride</p>
            </div>
            <div>
              <label className="text-sm text-muted">Platform Commission (%)</label>
              <input
                type="number"
                value={commission.platform}
                onChange={(e) => setCommission({ ...commission, platform: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-darkInput border border-border rounded-lg mt-1"
              />
              <p className="text-xs text-muted mt-1">Platform earns: {commission.platform}% of each ride</p>
            </div>
            <button className="w-full bg-primary text-dark py-2 rounded-lg mt-2">Save Commission</button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-darkCard border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Language Settings</h3>
          <div className="space-y-2">
            {languages.map((lang, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-darkInput rounded-lg">
                <span>{lang}</span>
                <div className="flex gap-2">
                  <button className="text-primary">✓</button>
                  <button className="text-muted">✗</button>
                </div>
              </div>
            ))}
            <button className="w-full bg-darkInput text-white py-2 rounded-lg mt-2">+ Add Language</button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-darkCard border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">App Version</span>
              <span>2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Last Update</span>
              <span>2024-01-15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Database Status</span>
              <span className="text-green-500">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">API Status</span>
              <span className="text-green-500">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cache Size</span>
              <span>156 MB</span>
            </div>
            <button className="w-full bg-red-500/20 text-red-500 py-2 rounded-lg mt-2">Clear Cache</button>
          </div>
        </div>
      </div>
    </div>
  );
}