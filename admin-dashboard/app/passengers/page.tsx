// admin-dashboard/app/passengers/page.tsx
"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../../lib/api";
import { 
  Search, Eye, UserCheck, UserX, Users, RefreshCw, 
  Plus, X, Mail, Phone, User, Key, Shield, 
  UserPlus
} from "lucide-react";
import toast from "react-hot-toast";

interface Passenger {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  isVerified: boolean;
}

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "RIDER", // Default to RIDER
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      const users = data.data || [];
      // Filter only RIDER and DRIVER roles
      const filteredUsers = users.filter((u: any) => 
        u.role === "RIDER" || u.role === "Rider" || 
        u.role === "DRIVER" || u.role === "Driver"
      );
      setPassengers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Ensure phone has country code
      let phone = formData.phone;
      if (!phone.startsWith('+')) {
        phone = `+250${phone.replace(/^0/, '')}`;
      }
      
      const data = await adminAPI.createUser({
        ...formData,
        phone: phone,
      });
      toast.success(`${formData.role} created successfully!`);
      setShowModal(false);
      setFormData({ name: "", phone: "", email: "", password: "", role: "RIDER" });
      fetchPassengers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === "DRIVER") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">Driver</span>;
    } else if (roleUpper === "RIDER") {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">Rider</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">{role}</span>;
  };

  const filteredPassengers = passengers.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400 text-sm">
            Manage all drivers and riders on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPassengers}
            className="flex items-center gap-2 px-4 py-2 bg-[#141C15] border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white hover:border-green-500/30 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-xl text-sm font-semibold hover:bg-green-400 transition"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-10 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition placeholder-gray-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{passengers.length}</p>
          <p className="text-xs text-gray-400">Total Users</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-500">
            {passengers.filter(p => p.role?.toUpperCase() === "DRIVER").length}
          </p>
          <p className="text-xs text-gray-400">Drivers</p>
        </div>
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-500">
            {passengers.filter(p => p.role?.toUpperCase() === "RIDER").length}
          </p>
          <p className="text-xs text-gray-400">Riders</p>
        </div>
      </div>

      {/* Table */}
      {filteredPassengers.length === 0 ? (
        <div className="bg-[#111714] border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm ? "Try adjusting your search" : "Drivers and riders will appear here"}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-green-500 text-black rounded-xl text-sm font-semibold hover:bg-green-400 transition"
          >
            Add your first user
          </button>
        </div>
      ) : (
        <div className="bg-[#111714] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0A0E0B] border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPassengers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0A0E0B] transition">
                  <td className="px-4 py-3 text-sm text-white">{user.name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.email || "N/A"}</td>
                  <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isVerified 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-yellow-500/20 text-yellow-500"
                    }`}>
                      {user.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-2 hover:bg-[#141C15] rounded-lg transition">
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add User Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111714] border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add New User</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#141C15] rounded-lg transition">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="788123456"
                />
                <p className="text-xs text-gray-500 mt-1">Enter without country code (e.g., 788123456)</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-[#141C15] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition"
                >
                  <option value="RIDER">Rider (Passenger)</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create {formData.role === "DRIVER" ? "Driver" : "Rider"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}