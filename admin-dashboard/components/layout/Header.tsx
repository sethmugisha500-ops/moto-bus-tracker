'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  scrollY: number;
}

export default function Header({ scrollY }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Check login status on mount and when pathname changes
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserRole(user.role || 'admin');
        setUserName(user.name || 'Admin');
      } catch (error) {
        console.error('Failed to parse user data');
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName(null);
    router.push('/login');
  };

  // Don't show header on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrollY > 20 ? 'bg-dark/95 backdrop-blur-xl border-b border-border' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={isLoggedIn ? '/admin' : '/'} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-xl">MotoBus</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isLoggedIn ? (
              // Public navigation
              <>
                <Link href="#features" className="text-muted hover:text-white transition">Features</Link>
                <Link href="#rides" className="text-muted hover:text-white transition">Rides</Link>
                <Link href="/login" className="text-muted hover:text-white transition">Admin</Link>
              </>
            ) : (
              // Authenticated navigation
              <>
                <Link href="/admin" className={`text-muted hover:text-white transition ${
                  pathname === '/admin' ? 'text-primary' : ''
                }`}>
                  Dashboard
                </Link>
                <Link href="/admin/live-map" className={`text-muted hover:text-white transition ${
                  pathname === '/admin/live-map' ? 'text-primary' : ''
                }`}>
                  Live Map
                </Link>
                <Link href="/admin/drivers" className={`text-muted hover:text-white transition ${
                  pathname?.startsWith('/admin/drivers') ? 'text-primary' : ''
                }`}>
                  Drivers
                </Link>
                <Link href="/admin/rides" className={`text-muted hover:text-white transition ${
                  pathname === '/admin/rides' ? 'text-primary' : ''
                }`}>
                  Rides
                </Link>
              </>
            )}
            
            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm">{userName?.charAt(0) || 'A'}</span>
                  </div>
                  <span className="text-sm text-muted hidden lg:block">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-muted hover:text-red-500 transition text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <button className="btn-outline text-sm py-2 px-4">Sign in</button>
                </Link>
                <Link href="/register">
                  <button className="btn-primary text-sm py-2 px-4">Get Started</button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-darkCard border-b border-border px-4 py-4">
          <div className="flex flex-col gap-4">
            {!isLoggedIn ? (
              // Public mobile menu
              <>
                <Link href="#features" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Features</Link>
                <Link href="#rides" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Rides</Link>
                <Link href="/login" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                <Link href="/login" className="text-white" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
                <Link href="/register" className="btn-primary text-center" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </>
            ) : (
              // Authenticated mobile menu
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">{userName?.charAt(0) || 'A'}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-xs text-muted">{userRole}</p>
                  </div>
                </div>
                <Link href="/admin" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link href="/admin/live-map" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Live Map</Link>
                <Link href="/admin/drivers" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Drivers</Link>
                <Link href="/admin/rides" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Rides</Link>
                <Link href="/admin/settings" className="text-muted hover:text-white" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-red-500 text-left hover:text-red-400"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}