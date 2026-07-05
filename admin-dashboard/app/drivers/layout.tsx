// app/drivers/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  AlertTriangle, 
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  ListChecks,
  UserCog,
  Home,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'User');
        setUserRole(user.role || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/drivers', label: 'All Drivers', icon: <Car size={18} /> },
    { href: '/drivers/pending', label: 'Pending Approvals', icon: <Users size={18} /> },
    { href: '/rides', label: 'Rides', icon: <ListChecks size={18} /> },
    { href: '/alerts', label: 'Alerts', icon: <AlertTriangle size={18} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#080C09]" />;
  }

  return (
    <div className="min-h-screen bg-[#080C09]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0A0E0B] border-r border-[#1A1E1C] z-50 hidden md:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[#1A1E1C]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">MB</span>
              </div>
              <span className="text-white font-bold text-lg">MotoBus</span>
              <span className="text-yellow-500 text-xs font-medium ml-1">Admin</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                  isActive(item.href)
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1E1C]'
                }`}
              >
                {item.icon}
                {item.label}
                {isActive(item.href) && (
                  <span className="ml-auto w-1 h-6 bg-yellow-500 rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-[#1A1E1C]">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#1A1E1C]">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <User size={16} className="text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400">{userRole || 'User'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0E0B] border-b border-[#1A1E1C] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">MB</span>
            </div>
            <span className="text-white font-bold">MotoBus</span>
            <span className="text-yellow-500 text-xs font-medium">Admin</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-[#1A1E1C] rounded-lg transition"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#080C09] pt-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                  isActive(item.href)
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1E1C]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}