'use client';

import { useState } from 'react';

const routes = [
  { id: 1, name: 'Downtown Express', number: '101', stops: ['Kigali City Center', 'Kimironko', 'Kacyiru', 'Gisozi'], vehicles: ['BUS-101', 'BUS-102'], schedule: '6:00 AM - 8:00 PM', status: 'active' },
  { id: 2, name: 'Airport Link', number: '102', stops: ['Airport', 'Downtown', 'Kacyiru'], vehicles: ['BUS-103'], schedule: '5:00 AM - 10:00 PM', status: 'active' },
  { id: 3, name: 'East-West Express', number: '103', stops: ['Kacyiru', 'Kimironko', 'Gisozi'], vehicles: ['MB-023', 'MB-024'], schedule: '6:30 AM - 7:30 PM', status: 'inactive' },
];

export default function RoutesPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(search.toLowerCase()) ||
    route.number.includes(search)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-muted text-sm">Manage bus and mini-bus routes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-dark px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all"
        >
          + Add Route
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">🔍</span>
          <input
            type="text"
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-darkInput border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRoutes.map((route) => (
          <div key={route.id} className="bg-darkCard border border-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{route.name}</h3>
                <p className="text-muted text-sm">Route #{route.number}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                route.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {route.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted mb-2">Stops</p>
              <div className="flex flex-wrap gap-2">
                {route.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="text-sm bg-darkInput px-3 py-1 rounded-full">{stop}</span>
                    {idx < route.stops.length - 1 && <span className="mx-2 text-muted">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-xs text-muted">Assigned Vehicles</p>
                <p>{route.vehicles.join(', ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Schedule</p>
                <p>{route.schedule}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button className="px-3 py-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30">Edit Route</button>
              <button className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30">View Stops</button>
              <button className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30">Deactivate</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkCard border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Route</h2>
            <input type="text" placeholder="Route Name" className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3" />
            <input type="text" placeholder="Route Number" className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3" />
            <input type="text" placeholder="Stops (comma separated)" className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3" />
            <input type="text" placeholder="Schedule" className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3" />
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-primary text-dark py-2 rounded-lg">Create</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-darkInput text-white py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}