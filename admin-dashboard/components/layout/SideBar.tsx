// components/layout/sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Map, Users, Users2, Car, Route, 
  Wallet, FileText, Bell, Headphones, Shield, Settings,
  LogOut, Truck, Bus, Bike, UserCheck, UserCog,
  Home, Navigation, CreditCard, BarChart3,
  LifeBuoy, AlertTriangle, Menu
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SidebarProps {
  hide?: boolean;
}

const menuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/dashboard' 
  },
  { 
    icon: Map, 
    label: 'Live Map', 
    href: '/live-map' 
  },
  { 
    icon: Users, 
    label: 'Riders', 
    href: '/passengers' 
  },
  { 
    label: 'Drivers', 
    icon: Users2,
    submenu: [
      { icon: UserCheck, label: 'All Drivers', href: '/drivers' },
      { icon: Bike, label: 'Moto Drivers', href: '/drivers/moto' },
      { icon: Bus, label: 'Bus Drivers', href: '/drivers/bus' },
      { icon: Truck, label: 'Mini-Bus Drivers', href: '/drivers/minibus' },
      { icon: UserCog, label: 'Pending Verifications', href: '/drivers/pending' },
    ]
  },
  { 
    icon: Car, 
    label: 'Vehicles', 
    href: '/vehicles' 
  },
  { 
    icon: Route, 
    label: 'Routes & Stops', 
    href: '/routes' 
  },
  { 
    icon: Navigation, 
    label: 'Trips', 
    href: '/trips' 
  },
  { 
    icon: Wallet, 
    label: 'Payments', 
    href: '/payments' 
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    href: '/reports' 
  },
  { 
    icon: Bell, 
    label: 'Notifications', 
    href: '/notifications' 
  },
  { 
    icon: LifeBuoy, 
    label: 'Support', 
    href: '/support' 
  },
  { 
    icon: Shield, 
    label: 'Safety Center', 
    href: '/safety' 
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/settings' 
  },
  { 
    icon: AlertTriangle, 
    label: 'SOS Alerts', 
    href: '/sos' 
  },
];

export default function Sidebar({ hide = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render sidebar on auth pages or if hide is true
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  
  if (isAuthPage || hide) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('demoUser');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#111714] border-r border-gray-800 overflow-y-auto z-50">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">MB</span>
          </div>
          <span className="font-bold text-xl text-white">MotoBus</span>
          <span className="text-xs text-gray-500">Admin</span>
        </Link>

        <nav className="space-y-1">
          {menuItems.map((item, i) => (
            <div key={i}>
              {item.submenu ? (
                <div className="mb-2">
                  <div className="flex items-center gap-3 px-4 py-2 text-gray-400 text-sm font-medium">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.submenu.map((sub, j) => (
                      <Link
                        key={j}
                        href={sub.href}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                          pathname === sub.href
                            ? 'bg-green-500/20 text-green-500'
                            : 'text-gray-400 hover:bg-[#1A1E1C] hover:text-white'
                        }`}
                      >
                        <sub.icon size={16} />
                        <span>{sub.label}</span>
                        {sub.label === 'Pending Verifications' && (
                          <span className="ml-auto px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px]">
                            New
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                    pathname === item.href
                      ? 'bg-green-500/20 text-green-500'
                      : 'text-gray-400 hover:bg-[#1A1E1C] hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.label === 'SOS Alerts' && (
                    <span className="ml-auto px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded-full text-[10px] animate-pulse">
                      3
                    </span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t border-gray-800 pt-4 mb-2">
            <div className="flex items-center gap-3 px-4 py-2 text-gray-400 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>System Online</span>
              <span className="ml-auto text-gray-600">v2.0.1</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}