'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI } from '@/lib/api';
import { Search, Plus, Edit, Trash2, Car, Bike, Bus, Truck, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const vehicleIcons = {
  MOTO: '🏍️',
  BUS: '🚌',
  MINIBUS: '🚐',
};

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vehicles', search, typeFilter],
    queryFn: () => vehiclesAPI.getAll().then(res => res.data),
  });

  const vehicles = data?.vehicles || [];

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehiclesAPI.delete(id);
        toast.success('Vehicle deleted');
        refetch();
      } catch (error) {
        toast.error('Failed to delete vehicle');
      }
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">Vehicle Management</h1>
            <p className="text-muted text-xs">Manage fleet vehicles</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-dark px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by plate or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="MOTO">Moto</option>
            <option value="BUS">Bus</option>
            <option value="MINIBUS">Mini-Bus</option>
          </select>
        </div>

        {/* Vehicles List */}
        <div className="space-y-3">
          {vehicles.map((vehicle: any) => (
            <div key={vehicle.id} className="bg-darkCard border border-border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-darkInput flex items-center justify-center">
                    <span className="text-2xl">{vehicleIcons[vehicle.type as keyof typeof vehicleIcons] || '🚗'}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{vehicle.model}</p>
                    <p className="text-xs text-muted">{vehicle.plateNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-darkInput">
                    <Edit size={16} className="text-primary" />
                  </button>
                  <button onClick={() => handleDelete(vehicle.id)} className="p-1.5 rounded-lg hover:bg-darkInput">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Type</span>
                  <p className="font-semibold mt-1">{vehicle.type}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Year</span>
                  <p className="font-semibold mt-1">{vehicle.year}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Capacity</span>
                  <p className="font-semibold mt-1">{vehicle.capacity}</p>
                </div>
                <div className="bg-darkInput rounded-lg p-2 text-center">
                  <span className="text-muted">Status</span>
                  <p className={`font-semibold mt-1 ${vehicle.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                    {vehicle.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Vehicle</h3>
              <button onClick={() => setShowModal(false)} className="p-2">✕</button>
            </div>
            <div className="space-y-3">
              <select className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg">
                <option value="MOTO">Moto</option>
                <option value="BUS">Bus</option>
                <option value="MINIBUS">Mini-Bus</option>
              </select>
              <input type="text" placeholder="Plate Number" className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg" />
              <input type="text" placeholder="Model" className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg" />
              <input type="number" placeholder="Year" className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg" />
              <input type="number" placeholder="Capacity" className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg" />
              <button className="w-full bg-primary text-dark py-3 rounded-lg font-semibold">Add Vehicle</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}