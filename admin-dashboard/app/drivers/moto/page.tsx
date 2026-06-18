'use client';

import { useState } from 'react';
import { Bike, Search, Star, Eye, CheckCircle, XCircle } from 'lucide-react';

const drivers = [
  { 
    id: 1, name: 'John Mugabo', phone: '+250788123401', 
    vehicleNumber: 'MT-001A', rating: 4.8, trips: 847, 
    status: 'approved', online: true, earnings: 487500,
    license: 'DL001234', experience: 5
  },
  { 
    id: 2, name: 'Peter Nshuti', phone: '+250788123402', 
    vehicleNumber: 'MT-002B', rating: 4.9, trips: 567, 
    status: 'pending', online: false, earnings: 342000,
    license: 'DL002345', experience: 3
  },
];

export default function MotoDriversPage() {
  const [search, setSearch] = useState('');

  const approveDriver = (id: number) => {
    console.log('Approve driver:', id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bike className="text-orange-500" /> Moto Drivers
          </h1>
          <p className="text-muted text-sm">Manage motorcycle taxi drivers</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-darkInput border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {drivers.map((driver) => (
          <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-2xl">👨‍✈️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{driver.name}</h3>
                  <p className="text-muted text-sm">{driver.phone}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs bg-darkInput px-2 py-1 rounded">License: {driver.license}</span>
                    <span className="text-xs bg-darkInput px-2 py-1 rounded">{driver.experience} years exp</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{driver.rating}</span>
                </div>
                <p className="text-sm text-muted">{driver.trips} trips</p>
                <p className="text-primary font-semibold">RWF {driver.earnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted">Vehicle Number</p>
                <p className="font-mono">{driver.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Status</p>
                <div className="flex items-center gap-2">
                  {driver.online ? (
                    <span className="text-green-500 text-sm">● Online</span>
                  ) : (
                    <span className="text-gray-500 text-sm">● Offline</span>
                  )}
                  {driver.status === 'approved' ? (
                    <span className="text-green-500 text-sm">✓ Approved</span>
                  ) : (
                    <span className="text-yellow-500 text-sm">⏳ Pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30">
                <Eye size={16} /> View Details
              </button>
              {driver.status === 'pending' && (
                <button 
                  onClick={() => approveDriver(driver.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"
                >
                  <CheckCircle size={16} /> Approve
                </button>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">
                <XCircle size={16} /> Suspend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}