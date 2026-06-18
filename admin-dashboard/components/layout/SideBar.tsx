'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Map, Users, Users2, Car, Route, 
  Wallet, FileText, Bell, Headphones, Shield, Settings,
  LogOut, Truck, Bus, Bike
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SidebarProps {
  hide?: boolean;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Map, label: 'Live Map', href: '/live-map' },
  { icon: Users, label: 'Riders', href: '/riders' },
  { 
    label: 'Drivers', 
    icon: Users2,
    submenu: [
      { icon: Bike, label: 'Moto Drivers', href: '/drivers/moto' },
      { icon: Bus, label: 'Bus Drivers', href: '/drivers/bus' },
      { icon: Truck, label: 'Mini-Bus Drivers', href: '/drivers/minibus' },
    ]
  },
  { icon: Car, label: 'Vehicles', href: '/vehicles' },
  { icon: Route, label: 'Routes & Stops', href: '/routes' },
  { icon: FileText, label: 'Trips', href: '/trips' },
  { icon: Wallet, label: 'Payments', href: '/payments' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Bell, label: 'notifications', href: '/notifications' },
  { icon: Headphones, label: 'Support', href: '/support' },
  { icon: Shield, label: 'Safety Center', href: '/safety' },
  { icon: Settings, label: 'Settings', href: '/settings' },
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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-darkCard border-r border-border overflow-y-auto z-50">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-bold text-xl">MotoBus</span>
          <span className="text-xs text-muted">Admin</span>
        </Link>

        <nav className="space-y-1">
          {menuItems.map((item, i) => (
            <div key={i}>
              {item.submenu ? (
                <div className="mb-2">
                  <div className="flex items-center gap-3 px-4 py-2 text-muted text-sm font-medium">
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
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted hover:bg-darkInput hover:text-white'
                        }`}
                      >
                        <sub.icon size={16} />
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                    pathname === item.href
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:bg-darkInput hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}