'use client';

import { useState } from 'react';

const admins = [
  { id: 1, name: 'Super Admin', email: 'admin@motobus.rw', role: 'super_admin', status: 'active', lastLogin: '2024-01-15 10:30' },
  { id: 2, name: 'Operations Admin', email: 'operations@motobus.rw', role: 'operations', status: 'active', lastLogin: '2024-01-15 09:15' },
  { id: 3, name: 'Support Admin', email: 'support@motobus.rw', role: 'support', status: 'active', lastLogin: '2024-01-14 16:45' },
  { id: 4, name: 'Finance Admin', email: 'finance@motobus.rw', role: 'finance', status: 'inactive', lastLogin: '2024-01-10 11:20' },
];

const roleColors = {
  super_admin: 'bg-purple-500/20 text-purple-500',
  operations: 'bg-blue-500/20 text-blue-500',
  support: 'bg-green-500/20 text-green-500',
  finance: 'bg-yellow-500/20 text-yellow-500',
};

const roleNames = {
  super_admin: 'Super Admin',
  operations: 'Operations',
  support: 'Support',
  finance: 'Finance',
};

export default function AdminsPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-muted text-sm">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-dark px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all"
        >
          + Add New Admin
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">🔍</span>
          <input
            type="text"
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-darkInput border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-darkCard border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-darkInput border-b border-border">
            <tr>
              <th className="text-left p-4 text-muted font-medium">Name</th>
              <th className="text-left p-4 text-muted font-medium">Email</th>
              <th className="text-left p-4 text-muted font-medium">Role</th>
              <th className="text-left p-4 text-muted font-medium">Status</th>
              <th className="text-left p-4 text-muted font-medium">Last Login</th>
              <th className="text-left p-4 text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="border-b border-border hover:bg-darkInput/50">
                <td className="p-4 font-medium">{admin.name}</td>
                <td className="p-4">{admin.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${roleColors[admin.role as keyof typeof roleColors]}`}>
                    {roleNames[admin.role as keyof typeof roleNames]}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    admin.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {admin.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-muted">{admin.lastLogin}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-darkInput rounded">✏️</button>
                    <button className="p-1 hover:bg-darkInput rounded">🔒</button>
                    <button className="p-1 hover:bg-darkInput rounded">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkCard border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Admin</h2>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3"
            />
            <select className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3">
              <option value="operations">Operations</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
            </select>
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