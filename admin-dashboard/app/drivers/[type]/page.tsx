'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { driversAPI } from '@/lib/api';
import { Search, Eye, CheckCircle, XCircle, Star, Phone, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const vehicleConfig = {
  moto: { icon: '🏍️', title: 'Moto Drivers', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500' },
  bus: { icon: '🚌', title: 'Bus Drivers', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
  minibus: { icon: '🚐', title: 'Mini-Bus Drivers', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-500' },
};

export default function DriversPage() {
  const params = useParams();
  const type = params.type as string;
  const config = vehicleConfig[type as keyof typeof vehicleConfig] || vehicleConfig.moto;
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['drivers', type, search, statusFilter],
    queryFn: () => driversAPI.getAll({ type, search, status: statusFilter }).then(res => res.data),
  });

  const drivers = data?.drivers || [];

  const handleApprove = async (id: string) => {
    try {
      await driversAPI.approve(id);
      toast.success('Driver approved');
      refetch();
    } catch (error) {
      toast.error('Failed to approve driver');
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await driversAPI.suspend(id);
      toast.success('Driver suspended');
      refetch();
    } catch (error) {
      toast.error('Failed to suspend driver');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{config.icon}</span>
            <h1 className="text-xl font-bold">{config.title}</h1>
          </div>
          <p className="text-muted text-xs">Manage {config.title.toLowerCase()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${config.bgColor} rounded-xl p-3 text-center`}>
            <p className="text-xl font-bold">{drivers.length}</p>
            <p className="text-xs text-muted">Total Drivers</p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-500">{drivers.filter((d: any) => d.online).length}</p>
            <p className="text-xs text-muted">Online</p>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-500">{drivers.filter((d: any) => d.isApproved).length}</p>
            <p className="text-xs text-muted">Approved</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Drivers List */}
        <div className="space-y-3">
          {drivers.map((driver: any) => (
            <div key={driver.id} className="bg-darkCard border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <span className="text-xl">{config.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                    <p className="text-xs text-muted">{driver.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!driver.isApproved ? (
                    <button onClick={() => handleApprove(driver.id)} className="p-1.5 rounded-lg hover:bg-darkInput">
                      <CheckCircle size={16} className="text-green-500" />
                    </button>
                  ) : (
                    <button onClick={() => handleSuspend(driver.id)} className="p-1.5 rounded-lg hover:bg-darkInput">
                      <XCircle size={16} className="text-red-500" />
                    </button>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-darkInput">
                    <Eye size={16} className="text-primary" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Vehicle</span>
                  <p className="font-semibold mt-1">{driver.vehicleNumber}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Rating</span>
                  <p className="font-semibold mt-1 flex items-center justify-center gap-0.5">
                    <Star size={10} className="text-yellow-500" /> {driver.rating}
                  </p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Trips</span>
                  <p className="font-semibold mt-1">{driver.totalTrips}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Earnings</span>
                  <p className="font-semibold mt-1 text-primary">RWF {driver.totalEarnings?.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {driver.online ? (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Offline</span>
                  )}
                </div>
                <button className="text-xs text-primary flex items-center gap-1">
                  <TrendingUp size={12} /> View Stats
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}