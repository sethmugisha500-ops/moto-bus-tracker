'use client';

const rides = [
  { icon: '🏍', iconBg: 'bg-green-500/10', iconBorder: 'border-green-500/20', id: '#R-4821', type: 'Moto', route: 'CBD → Airport Rd', amount: '1,800 RWF', status: 'Done', statusClass: 'badge-active' },
  { icon: '🚌', iconBg: 'bg-indigo-500/10', iconBorder: 'border-indigo-500/20', id: '#R-4820', type: 'Bus', route: 'Nyabugogo → Kimironko', amount: '', status: 'Active', statusClass: 'badge-busy' },
  { icon: '🏍', iconBg: 'bg-green-500/10', iconBorder: 'border-green-500/20', id: '#R-4819', type: 'Moto', route: 'Kacyiru → KCC', amount: '2,200 RWF', status: 'Done', statusClass: 'badge-active' },
  { icon: '🏍', iconBg: 'bg-orange-500/10', iconBorder: 'border-orange-500/20', id: '#R-4818', type: 'Moto', route: 'Remera → Gisozi', amount: '', status: 'Cancelled', statusClass: 'badge-offline' },
];

export default function AdminRidesList() {
  return (
    <div className="bg-bg3 border border-border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-border">
        <span className="text-xs font-medium">Recent rides</span>
        <span className="text-[11px] text-green-500 cursor-pointer hover:text-green-400 transition-colors">
          See all →
        </span>
      </div>
      {rides.map((ride, idx) => (
        <div key={idx} className="flex justify-between items-center px-4 py-2.5 border-b border-border last:border-none">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full ${ride.iconBg} border ${ride.iconBorder} flex items-center justify-center text-xs`}>
              {ride.icon}
            </div>
            <div>
              <div className="text-xs font-medium">
                {ride.id} · {ride.type}
              </div>
              <div className="text-[11px] text-muted">
                {ride.route} {ride.amount && `· ${ride.amount}`}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            ride.statusClass === 'badge-active' ? 'bg-green-500/12 text-green-500' :
            ride.statusClass === 'badge-busy' ? 'bg-orange-500/12 text-orange-500' :
            'bg-white/6 text-muted'
          }`}>
            {ride.status}
          </span>
        </div>
      ))}
    </div>
  );
}