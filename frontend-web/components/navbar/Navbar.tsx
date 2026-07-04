'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Wallet, Settings, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// Extended User type with wallet and fullName
interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN' | 'OPERATOR';
  isVerified: boolean;
  fullName?: string;
  wallet?: {
    balance: number;
  };
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Get user data with proper typing
  const userData = user as User | null;
  const walletBalance = userData?.wallet?.balance || 0;
  const userName = userData?.fullName || userData?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Mock unread count (you can replace with actual notification store)
  const unreadCount = 0;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/rides', label: 'My Rides' },
    { href: '/tracking', label: 'Track Bus' },
    { href: '/support', label: 'Support' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <nav className="bg-[#0A0E0B] border-b border-[#1A1E1C] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-white">MotoBus</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href
                    ? 'text-green-500 font-semibold'
                    : 'text-gray-400 hover:text-green-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 hover:bg-[#141C15] rounded-full transition">
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Wallet */}
                <Link
                  href="/wallet"
                  className="flex items-center space-x-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition"
                >
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-white">
                    {walletBalance.toLocaleString()} RWF
                  </span>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-2 hover:bg-[#141C15] rounded-lg px-3 py-2 transition"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-semibold text-sm">
                        {userInitial}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-[#111714] border border-[#1A1E1C] rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-[#1A1E1C]">
                          <p className="font-semibold text-white">{userName}</p>
                          <p className="text-xs text-gray-400">{userData?.email || userData?.phone}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 px-4 py-2.5 hover:bg-[#0A0E0B] transition text-gray-300 hover:text-white"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center space-x-3 px-4 py-2.5 hover:bg-[#0A0E0B] transition text-gray-300 hover:text-white"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-[#0A0E0B] transition text-red-400 hover:text-red-300 border-t border-[#1A1E1C]"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-400 hover:text-green-500 transition">
                  Login
                </Link>
                <Link href="/register" className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-green-400 transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-[#141C15] rounded-lg transition text-gray-400 hover:text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#1A1E1C] py-4"
            >
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2.5 rounded-lg ${
                      pathname === link.href
                        ? 'bg-green-500/10 text-green-500'
                        : 'text-gray-400 hover:bg-[#141C15] hover:text-white'
                    } transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/wallet"
                      className="px-4 py-2.5 text-gray-400 hover:bg-[#141C15] hover:text-white rounded-lg transition flex items-center justify-between"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>Wallet</span>
                      <span className="text-green-500 font-semibold">{walletBalance.toLocaleString()} RWF</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="px-4 py-2.5 text-gray-400 hover:bg-[#141C15] hover:text-white rounded-lg transition"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2.5 text-gray-400 hover:bg-[#141C15] hover:text-white rounded-lg transition"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2.5 bg-green-500 text-black rounded-lg text-center font-semibold hover:bg-green-400 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;