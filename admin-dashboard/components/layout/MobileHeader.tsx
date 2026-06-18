'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Bell, Settings, LogOut, User, Home, Map, Users, Bike, Bus, Truck, Car, Route, FileText, Wallet, Shield, Headphones } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Map, label: 'Live Map', href: '/live-map' },
  { icon: Users, label: 'Riders', href: '/riders' },
  { icon: Bike, label: 'Moto Drivers', href: '/drivers/moto' },
  { icon: Bus, label: 'Bus Drivers', href: '/drivers/bus' },
  { icon: Truck, label: 'Mini-Bus Drivers', href: '/drivers/minibus' },
  { icon: Car, label: 'Vehicles', href: '/vehicles' },
  { icon: Route, label: 'Routes', href: '/routes' },
  { icon: FileText, label: 'Trips', href: '/trips' },
  { icon: Wallet, label: 'Payments', href: '/payments' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Bell, label: 'notifications', href: '/notifications' },
  { icon: Headphones, label: 'Support', href: '/support' },
  { icon: Shield, label: 'Safety', href: '/safety' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Admin');
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <>
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 bg-darkCard border-b border-border z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-darkInput transition-all"
          >
            <Menu size={24} className="text-white" />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-lg">MotoBus Admin</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-darkInput transition-all relative">
              <Bell size={20} className="text-muted" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold">{userName.charAt(0)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-darkCard border-r border-border z-50 overflow-y-auto shadow-xl">
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-darkCard">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-bold text-lg">Menu</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-darkInput transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {/* User Info */}
              <div className="mb-6 p-4 bg-darkInput rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-xs text-muted">Administrator</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted hover:bg-darkInput hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="my-4 h-px bg-border" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}