'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Home, Map, Users, User, Bike, Bus, Truck, Car, Route, FileText, Wallet, BarChart, Bell, Headphones, Shield, Settings, LogOut, UserCircle } from 'lucide-react';
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
  { icon: <Home size={18} />, label: 'Dashboard', href: '/' },
  { icon: <Map size={18} />, label: 'Live Map', href: '/live-map' },
  { icon: <Users size={18} />, label: 'Riders', href: '/riders' },
  { 
    icon: <User size={18} />, 
    label: 'Drivers', 
    href: '/drivers/moto',
    submenu: [
      { icon: <Bike size={16} />, label: 'Moto Drivers', href: '/drivers/moto' },
      { icon: <Bus size={16} />, label: 'Bus Drivers', href: '/drivers/bus' },
      { icon: <Truck size={16} />, label: 'Mini-Bus Drivers', href: '/drivers/minibus' },
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
    const userStr = localStorage.getItem('adminUser');
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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
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
        className="fixed top-4 left-4 z-50 md:hidden bg-darkCard border border-border rounded-lg p-2 hover:bg-darkInput transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-white" />}
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
        className={`fixed top-0 left-0 h-full w-80 bg-darkCard border-r border-border z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Close button */}
          <button
            onClick={closeMenu}
            className="absolute top-4 right-4 md:hidden p-2 rounded-lg hover:bg-darkInput"
          >
            <X size={20} className="text-muted" />
          </button>

          {/* Logo */}
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-xl">MotoBus</span>
            <span className="text-xs text-muted bg-darkInput px-2 py-0.5 rounded-full">Admin</span>
          </Link>

          {/* User Info */}
          <div className="mb-6 p-4 bg-darkInput rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <UserCircle size={28} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{userName}</p>
                <p className="text-xs text-muted truncate">{userEmail || 'Administrator'}</p>
              </div>
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
                      isSubActive ? 'text-primary bg-primary/10' : 'text-muted'
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
                              ? 'bg-primary/20 text-primary'
                              : 'text-muted hover:bg-darkInput hover:text-white'
                          }`}
                        >
                          {sub.icon}
                          <span>{sub.label}</span>
                          {isActive(sub.href) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
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
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted hover:bg-darkInput hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
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
      </aside>
    </>
  );
}