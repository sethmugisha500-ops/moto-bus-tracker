'use client';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▯' },
  { id: 'map', label: 'Live map', icon: '🗺' },
  { id: 'drivers', label: 'Drivers', icon: '👥' },
  { id: 'fleet', label: 'Fleet', icon: '🚌' },
  { id: 'rides', label: 'Rides', icon: '🏍' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'alerts', label: 'Alerts', icon: '⚠' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  return (
    <div className="bg-bg2 border-r border-border py-4">
      {menuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex items-center gap-2.5 px-5 py-2.5 text-xs cursor-pointer transition-all ${
            activeTab === item.id
              ? 'text-green-500 border-l-2 border-green-500 bg-green-500/5'
              : 'text-muted hover:text-white border-l-2 border-transparent'
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center text-sm opacity-30">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}