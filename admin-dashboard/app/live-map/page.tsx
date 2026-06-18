'use client';

import { useState, useEffect } from 'react';
import { Bike, Bus, Truck, Users, Activity, AlertTriangle, RefreshCw, Eye, X, MapPin, Navigation } from 'lucide-react';

// Real coordinates for Kigali, Rwanda
const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };

// Mock vehicle data with real coordinates
const generateMockVehicles = () => ({
  motos: [
    { id: 1, lat: -1.9441, lng: 30.0619, name: 'John Mugabo', plate: 'MT-001A', status: 'active', speed: 45, eta: '2 min', rating: 4.8, online: true, destination: 'Kimironko Market' },
    { id: 2, lat: -1.9455, lng: 30.0625, name: 'Peter Nshuti', plate: 'MT-002B', status: 'active', speed: 38, eta: '3 min', rating: 4.9, online: true, destination: 'Kigali City Tower' },
    { id: 3, lat: -1.9430, lng: 30.0605, name: 'James Rukundo', plate: 'MT-003C', status: 'idle', speed: 0, eta: '-', rating: 4.7, online: false, destination: '-' },
    { id: 4, lat: -1.9460, lng: 30.0630, name: 'Alice Mukamana', plate: 'RD-045C', status: 'active', speed: 52, eta: '4 min', rating: 5.0, online: true, destination: 'Airport' },
    { id: 5, lat: -1.9425, lng: 30.0590, name: 'David Niyomugabo', plate: 'MT-004D', status: 'active', speed: 41, eta: '5 min', rating: 4.6, online: true, destination: 'Downtown' },
  ],
  buses: [
    { id: 101, lat: -1.9420, lng: 30.0580, name: 'Downtown Express', plate: 'BUS-101', route: '101', capacity: 30, passengers: 18, status: 'moving', speed: 30, online: true, nextStop: 'Kimironko' },
    { id: 102, lat: -1.9460, lng: 30.0640, name: 'Airport Link', plate: 'BUS-102', route: '102', capacity: 30, passengers: 24, status: 'moving', speed: 28, online: true, nextStop: 'Airport' },
    { id: 103, lat: -1.9410, lng: 30.0570, name: 'City Express', plate: 'BUS-103', route: '103', capacity: 30, passengers: 12, status: 'idle', speed: 0, online: false, nextStop: '-' },
  ],
  minibuses: [
    { id: 201, lat: -1.9445, lng: 30.0630, name: 'City Hopper', plate: 'MB-023', route: 'Downtown Loop', capacity: 15, passengers: 8, status: 'active', online: true, nextStop: 'Kacyiru' },
    { id: 202, lat: -1.9415, lng: 30.0595, name: 'Express Shuttle', plate: 'MB-024', route: 'Express Route', capacity: 15, passengers: 12, status: 'active', online: true, nextStop: 'Gisozi' },
    { id: 203, lat: -1.9470, lng: 30.0650, name: 'Market Connect', plate: 'MB-025', route: 'Market Route', capacity: 15, passengers: 5, status: 'idle', online: false, nextStop: '-' },
  ],
  riders: 234,
  sosAlerts: [
    { id: 1, lat: -1.9441, lng: 30.0619, time: '2 min ago', status: 'active', rider: 'John Doe' },
  ],
});

export default function LiveMapPage() {
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState(generateMockVehicles());
  const [refreshing, setRefreshing] = useState(false);
  const [showSOSPanel, setShowSOSPanel] = useState(false);
  const [mapCenter, setMapCenter] = useState(KIGALI_CENTER);
  const [mapZoom, setMapZoom] = useState(13);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => ({
        ...prev,
        motos: prev.motos.map(moto => ({
          ...moto,
          lat: moto.lat + (Math.random() - 0.5) * 0.002,
          lng: moto.lng + (Math.random() - 0.5) * 0.002,
        })),
        buses: prev.buses.map(bus => ({
          ...bus,
          lat: bus.lat + (Math.random() - 0.5) * 0.001,
          lng: bus.lng + (Math.random() - 0.5) * 0.001,
        })),
        minibuses: prev.minibuses.map(mb => ({
          ...mb,
          lat: mb.lat + (Math.random() - 0.5) * 0.0015,
          lng: mb.lng + (Math.random() - 0.5) * 0.0015,
        })),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setRefreshing(true);
    setTimeout(() => {
      setVehicles(generateMockVehicles());
      setRefreshing(false);
    }, 1000);
  };

  const stats = {
    riders: vehicles.riders,
    motos: vehicles.motos.filter(v => v.online).length,
    buses: vehicles.buses.filter(v => v.online).length,
    minibuses: vehicles.minibuses.filter(v => v.online).length,
    online: vehicles.motos.filter(v => v.online).length + vehicles.buses.filter(v => v.online).length + vehicles.minibuses.filter(v => v.online).length,
  };

  const getFilteredVehicles = () => {
    if (selectedLayer === 'all') {
      return { motos: vehicles.motos, buses: vehicles.buses, minibuses: vehicles.minibuses };
    }
    if (selectedLayer === 'moto') return { motos: vehicles.motos, buses: [], minibuses: [] };
    if (selectedLayer === 'bus') return { motos: [], buses: vehicles.buses, minibuses: [] };
    return { motos: [], buses: [], minibuses: vehicles.minibuses };
  };

  const filtered = getFilteredVehicles();

  // Generate map markers URL
  const getMapUrl = () => {
    const markers: string[] = [];
    
    if (selectedLayer === 'all' || selectedLayer === 'moto') {
      vehicles.motos.forEach(v => {
        markers.push(`${v.lat},${v.lng}`);
      });
    }
    if (selectedLayer === 'all' || selectedLayer === 'bus') {
      vehicles.buses.forEach(v => {
        markers.push(`${v.lat},${v.lng}`);
      });
    }
    if (selectedLayer === 'all' || selectedLayer === 'minibus') {
      vehicles.minibuses.forEach(v => {
        markers.push(`${v.lat},${v.lng}`);
      });
    }
    
    const markerParam = markers.map(m => `marker=${m}`).join('&');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05},${mapCenter.lat - 0.05},${mapCenter.lng + 0.05},${mapCenter.lat + 0.05}&layer=mapnik&${markerParam}`;
  };

  const VehicleCard = ({ vehicle, type, onSelect }: any) => (
    <div
      onClick={() => onSelect({ ...vehicle, type })}
      className="bg-darkInput rounded-xl p-4 cursor-pointer hover:bg-darkInput/80 transition-all active:scale-98"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'moto' ? 'bg-orange-500/20' : type === 'bus' ? 'bg-blue-500/20' : 'bg-green-500/20'
          }`}>
            <span className="text-xl">{type === 'moto' ? '🏍️' : type === 'bus' ? '🚌' : '🚐'}</span>
          </div>
          <div>
            <p className="font-semibold">{vehicle.name}</p>
            <p className="text-xs text-muted">{vehicle.plate}</p>
          </div>
        </div>
        {vehicle.online ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-500">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-xs text-muted">Offline</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {type === 'moto' && (
          <>
            <div><span className="text-muted text-xs">Speed</span><br />{vehicle.speed} km/h</div>
            <div><span className="text-muted text-xs">ETA</span><br />{vehicle.eta}</div>
            <div><span className="text-muted text-xs">Rating</span><br />⭐ {vehicle.rating}</div>
          </>
        )}
        {type === 'bus' && (
          <>
            <div><span className="text-muted text-xs">Route</span><br />{vehicle.route}</div>
            <div><span className="text-muted text-xs">Capacity</span><br />{vehicle.passengers}/{vehicle.capacity}</div>
            <div><span className="text-muted text-xs">Next</span><br />{vehicle.nextStop}</div>
          </>
        )}
        {type === 'minibus' && (
          <>
            <div><span className="text-muted text-xs">Route</span><br />{vehicle.route}</div>
            <div><span className="text-muted text-xs">Capacity</span><br />{vehicle.passengers}/{vehicle.capacity}</div>
            <div><span className="text-muted text-xs">Next</span><br />{vehicle.nextStop}</div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-darkCard border-b border-border p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold">Command Center</h1>
            <p className="text-muted text-xs">Real-time vehicle and passenger tracking</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSOSPanel(true)}
              className="px-3 py-2 bg-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm"
            >
              <AlertTriangle size={16} />
              SOS: {vehicles.sosAlerts.length}
            </button>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-darkInput rounded-xl p-3 text-center">
            <Users size={18} className="text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">{stats.riders}</p>
            <p className="text-xs text-muted">Riders</p>
          </div>
          <div className="bg-darkInput rounded-xl p-3 text-center">
            <Bike size={18} className="text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-500">{stats.motos}</p>
            <p className="text-xs text-muted">Moto</p>
          </div>
          <div className="bg-darkInput rounded-xl p-3 text-center">
            <Bus size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-500">{stats.buses}</p>
            <p className="text-xs text-muted">Bus</p>
          </div>
          <div className="bg-darkInput rounded-xl p-3 text-center">
            <Truck size={18} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{stats.minibuses}</p>
            <p className="text-xs text-muted">Mini-Bus</p>
          </div>
          <div className="bg-darkInput rounded-xl p-3 text-center">
            <Activity size={18} className="text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{stats.online}</p>
            <p className="text-xs text-muted">Online</p>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All', icon: '🗺️', color: 'bg-primary' },
            { id: 'moto', label: 'Moto', icon: '🏍️', color: 'bg-orange-500' },
            { id: 'bus', label: 'Bus', icon: '🚌', color: 'bg-blue-500' },
            { id: 'minibus', label: 'Mini-Bus', icon: '🚐', color: 'bg-green-500' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap flex items-center gap-1 ${
                selectedLayer === layer.id
                  ? `${layer.color} text-white`
                  : 'bg-darkInput text-muted hover:text-white'
              }`}
            >
              <span>{layer.icon}</span> {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real Map */}
      <div className="p-4">
        <div className="bg-darkCard border border-border rounded-xl overflow-hidden">
          <div className="bg-darkInput p-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-medium">Live Vehicle Map</span>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setMapCenter(KIGALI_CENTER)}
                className="flex items-center gap-1 px-2 py-1 bg-darkCard rounded-lg hover:bg-darkInput"
              >
                <Navigation size={12} /> Center
              </button>
            </div>
          </div>
          
          {/* Interactive Map */}
          <div className="relative h-[500px] w-full">
            <iframe
              src={getMapUrl()}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Live Vehicle Map"
              className="rounded-b-xl"
            />
            
            {/* Map Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))}
                className="bg-darkCard border border-border rounded-lg p-2 shadow-lg hover:bg-darkInput transition-all w-10 h-10 flex items-center justify-center"
              >
                <span className="text-lg font-bold">+</span>
              </button>
              <button
                onClick={() => setMapZoom(Math.max(mapZoom - 1, 10))}
                className="bg-darkCard border border-border rounded-lg p-2 shadow-lg hover:bg-darkInput transition-all w-10 h-10 flex items-center justify-center"
              >
                <span className="text-lg font-bold">-</span>
              </button>
            </div>
            
            {/* Legend Overlay */}
            <div className="absolute top-4 right-4 bg-darkCard/90 backdrop-blur-sm rounded-lg p-2 text-xs border border-border">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /><span>Moto Active</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /><span>Moto Idle</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span>Bus Moving</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span>Mini-Bus</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span>Rider</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span>SOS Alert</span></div>
              </div>
            </div>
            
            {/* Live Status Overlay */}
            <div className="absolute bottom-4 left-4 bg-darkCard/90 backdrop-blur-sm rounded-lg p-2 text-xs border border-border">
              <div className="flex gap-3">
                <span className="text-green-500">🟢 {stats.online} Online</span>
                <span className="text-yellow-500">🟡 {vehicles.motos.filter(v => !v.online).length + vehicles.buses.filter(v => !v.online).length + vehicles.minibuses.filter(v => !v.online).length} Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="p-4 pb-20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Eye size={16} />
          Live Vehicles ({filtered.motos.length + filtered.buses.length + filtered.minibuses.length})
        </h3>
        <div className="space-y-3">
          {filtered.motos.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} type="moto" onSelect={setSelectedVehicle} />
          ))}
          {filtered.buses.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} type="bus" onSelect={setSelectedVehicle} />
          ))}
          {filtered.minibuses.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} type="minibus" onSelect={setSelectedVehicle} />
          ))}
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedVehicle(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedVehicle.type === 'moto' ? 'bg-orange-500/20' :
                  selectedVehicle.type === 'bus' ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  <span className="text-2xl">
                    {selectedVehicle.type === 'moto' ? '🏍️' : selectedVehicle.type === 'bus' ? '🚌' : '🚐'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedVehicle.name}</h3>
                  <p className="text-xs text-muted">{selectedVehicle.plate}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="p-2">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-darkInput rounded-lg p-3">
                <p className="text-muted text-xs">Status</p>
                <p className="font-semibold">{selectedVehicle.online ? '🟢 Online' : '⚫ Offline'}</p>
              </div>
              {selectedVehicle.speed !== undefined && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Speed</p>
                  <p className="font-semibold">{selectedVehicle.speed} km/h</p>
                </div>
              )}
              {selectedVehicle.rating && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Rating</p>
                  <p className="font-semibold">⭐ {selectedVehicle.rating}</p>
                </div>
              )}
              {selectedVehicle.eta && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">ETA</p>
                  <p className="font-semibold">{selectedVehicle.eta}</p>
                </div>
              )}
              {selectedVehicle.destination && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Destination</p>
                  <p className="font-semibold">{selectedVehicle.destination}</p>
                </div>
              )}
              {selectedVehicle.nextStop && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Next Stop</p>
                  <p className="font-semibold">{selectedVehicle.nextStop}</p>
                </div>
              )}
              {selectedVehicle.capacity && (
                <div className="bg-darkInput rounded-lg p-3">
                  <p className="text-muted text-xs">Capacity</p>
                  <p className="font-semibold">{selectedVehicle.passengers}/{selectedVehicle.capacity}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-primary text-dark py-3 rounded-lg font-semibold">Track Live</button>
              <button className="flex-1 bg-red-500/20 text-red-500 py-3 rounded-lg font-semibold">Send Alert</button>
            </div>
          </div>
        </>
      )}

      {/* SOS Panel */}
      {showSOSPanel && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowSOSPanel(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                SOS Alerts
              </h3>
              <button onClick={() => setShowSOSPanel(false)} className="p-2">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {vehicles.sosAlerts.map((alert) => (
                <div key={alert.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-500">Emergency Alert</p>
                      <p className="text-xs text-muted mt-1">Rider: {alert.rider}</p>
                      <p className="text-xs text-muted">Location: {alert.lat}, {alert.lng}</p>
                      <p className="text-xs text-muted">Time: {alert.time}</p>
                    </div>
                    <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm">Respond</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}