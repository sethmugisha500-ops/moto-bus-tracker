'use client';

const drivers = [
  { initials: 'JM', name: 'Jean-Marie K.', zone: 'Kacyiru zone · RAB 403A', status: 'On ride', statusClass: 'badge-active' },
  { initials: 'AM', name: 'Amina M.', zone: 'Nyarugenge · RAD 211B', status: 'On ride', statusClass: 'badge-active' },
  { initials: 'PM', name: 'Patrick M.', zone: 'Remera · RAE 088C', status: 'Available', statusClass: 'badge-busy' },
  { initials: 'GN', name: 'Grace N.', zone: 'Gasabo · RAF 556D', status: 'Offline', statusClass: 'badge-offline' },
];

export default function AdminDriversList() {
  return (
    <div className="bg-bg3 border border-border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-border">
        <span className="text-xs font-medium">Active drivers</span>
        <span className="text-[11px] text-green-500 cursor-pointer hover:text-green-400 transition-colors">
          See all →
        </span>
      </div>
      {drivers.map((driver, idx) => (
        <div key={idx} className="flex justify-between items-center px-4 py-2.5 border-b border-border last:border-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] font-semibold text-green-500">
              {driver.initials}
            </div>
            <div>
              <div className="text-xs font-medium">{driver.name}</div>
              <div className="text-[11px] text-muted">{driver.zone}</div>
            </div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            driver.statusClass === 'badge-active' ? 'bg-green-500/12 text-green-500' :
            driver.statusClass === 'badge-busy' ? 'bg-orange-500/12 text-orange-500' :
            'bg-white/6 text-muted'
          }`}>
            {driver.status}
          </span>
        </div>
      ))}
    </div>
  );
}