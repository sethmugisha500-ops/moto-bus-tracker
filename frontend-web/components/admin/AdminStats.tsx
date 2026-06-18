'use client';

const stats = [
  { label: 'Active rides', value: 284, trend: '+18 from yesterday', trendUp: true },
  { label: 'Online drivers', value: 147, trend: '↑ 92% availability', trendUp: true },
  { label: "Today's revenue", value: '4.2M', trend: 'RWF · +12% vs avg', trendUp: true },
  { label: 'SOS alerts', value: 0, trend: 'All clear ✓', trendUp: true },
];

export default function AdminStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-bg3 border border-border rounded-lg p-4 hover:border-border-hover transition-colors">
          <div className="text-[11px] text-muted mb-1.5 font-light uppercase tracking-wider">{stat.label}</div>
          <div className="font-head text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
          <div className={`text-[11px] font-medium ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {stat.trend}
          </div>
        </div>
      ))}
    </div>
  );
}