// components/layout/MobileMenu.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Map, Users, User, Bike, Bus, Truck, 
  Car, Route, FileText, Wallet, BarChart, Bell, 
  Headphones, Shield, Settings, LogOut, UserCircle,
  UserCheck, UserCog
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  submenu?: { icon: React.ReactNode; label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: <Home size={18} />, label: 'Dashboard', href: '/dashboard' },
  { icon: <Map size={18} />, label: 'Live Map', href: '/live-map' },
  { icon: <Users size={18} />, label: 'Riders', href: '/passengers' },
  { 
    icon: <User size={18} />, 
    label: 'Drivers', 
    href: '/drivers',
    submenu: [
      { icon: <UserCheck size={16} />, label: 'All Drivers', href: '/drivers' },
      { icon: <Bike size={16} />, label: 'Moto Drivers', href: '/drivers/moto' },
      { icon: <Bus size={16} />, label: 'Bus Drivers', href: '/drivers/bus' },
      { icon: <Truck size={16} />, label: 'Mini-Bus Drivers', href: '/drivers/minibus' },
      { icon: <UserCog size={16} />, label: 'Pending Verifications', href: '/drivers/pending' },
    ]
  },
  { icon: <Car size={18} />, label: 'Vehicles', href: '/vehicles' },
  { icon: <Route size={18} />, label: 'Routes', href: '/routes' },
  { icon: <FileText size={18} />, label: 'Trips', href: '/trips' },
  { icon: <Wallet size={18} />, label: 'Payments', href: '/payments' },
  { icon: <BarChart size={18} />, label: 'Reports', href: '/reports' },
  { icon: <Bell size={18} />, label: 'Notifications', href: '/notifications' },
  { icon: <Headphones size={18} />, label: 'Support', href: '/support' },
  { icon: <Shield size={18} />, label: 'Safety', href: '/safety' },
  { icon: <Settings size={18} />, label: 'Settings', href: '/settings' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Load user data
    const userStr = localStorage.getItem('user') || localStorage.getItem('adminUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Admin');
        setUserEmail(user.email || '');
      } catch (e) {}
    }

    // Close menu when screen size changes to desktop
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
        document.body.classList.remove('sidebar-open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle('sidebar-open', !isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.classList.remove('sidebar-open');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('demoUser');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname?.startsWith(href);
  };

  const isSubmenuActive = (submenu: { href: string }[]) => {
    return submenu.some(item => isActive(item.href));
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#111714] border border-gray-800 rounded-lg p-2 hover:bg-[#1A1E1C] transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} className="text-green-500" /> : <Menu size={20} className="text-white" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[#111714] border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={closeMenu}
            className="absolute top-4 right-4 md:hidden p-2 rounded-lg hover:bg-[#1A1E1C]"
          >
            <X size={20} className="text-gray-400" />
          </button>

          {/* Logo */}
          <Link href="/dashboard" onClick={closeMenu} className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">MB</span>
            </div>
            <span className="font-bold text-xl text-white">MotoBus</span>
            <span className="text-xs text-gray-500 bg-[#0A0E0B] px-2 py-0.5 rounded-full">Admin</span>
          </Link>

          {/* User Info */}
          <div className="mb-6 p-4 bg-[#0A0E0B] rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <UserCircle size={28} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail || 'Administrator'}</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto -mx-3 px-3 space-y-1">
            {menuItems.map((item, index) => {
              if (item.submenu) {
                const isSubActive = isSubmenuActive(item.submenu);
                return (
                  <div key={index} className="mb-2">
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                      isSubActive ? 'text-green-500 bg-green-500/10' : 'text-gray-400'
                    }`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="ml-6 space-y-1 mt-1">
                      {item.submenu.map((sub, idx) => (
                        <Link
                          key={idx}
                          href={sub.href}
                          onClick={closeMenu}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                            isActive(sub.href)
                              ? 'bg-green-500/20 text-green-500'
                              : 'text-gray-400 hover:bg-[#1A1E1C] hover:text-white'
                          }`}
                        >
                          {sub.icon}
                          <span>{sub.label}</span>
                          {isActive(sub.href) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                          {sub.label === 'Pending Verifications' && (
                            <span className="ml-auto px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full text-[10px]">
                              New
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-green-500/20 text-green-500'
                      : 'text-gray-400 hover:bg-[#1A1E1C] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-4 h-px bg-gray-800" />

          {/* Status */}
          <div className="mb-2 flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>System Online</span>
            <span className="ml-auto text-gray-600">v2.0.1</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}