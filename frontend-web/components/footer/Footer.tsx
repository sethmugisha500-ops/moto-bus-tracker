'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 pt-16 pb-10 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-head font-extrabold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              MotoBus
            </Link>
            <p className="text-sm text-muted font-light mt-3 max-w-xs leading-relaxed">
              Kigali's smart ride network. Real-time tracking, instant payments, and fleet intelligence for Rwanda's roads.
            </p>
          </div>
          
          <div>
            <h4 className="font-head text-xs font-bold mb-4 tracking-wide">Riders</h4>
            <ul className="space-y-2.5">
              <li><Link href="/booking" className="text-sm text-muted hover:text-white transition-colors font-light">Book a ride</Link></li>
              <li><Link href="/tracking" className="text-sm text-muted hover:text-white transition-colors font-light">Track my ride</Link></li>
              <li><Link href="/wallet" className="text-sm text-muted hover:text-white transition-colors font-light">Wallet & payments</Link></li>
              <li><Link href="/safety" className="text-sm text-muted hover:text-white transition-colors font-light">Safety</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-head text-xs font-bold mb-4 tracking-wide">Operators</h4>
            <ul className="space-y-2.5">
              <li><Link href="/admin" className="text-sm text-muted hover:text-white transition-colors font-light">Admin dashboard</Link></li>
              <li><Link href="/fleet" className="text-sm text-muted hover:text-white transition-colors font-light">Fleet management</Link></li>
              <li><Link href="/analytics" className="text-sm text-muted hover:text-white transition-colors font-light">Analytics</Link></li>
              <li><Link href="/docs" className="text-sm text-muted hover:text-white transition-colors font-light">API docs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-head text-xs font-bold mb-4 tracking-wide">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-muted hover:text-white transition-colors font-light">About</Link></li>
              <li><Link href="/careers" className="text-sm text-muted hover:text-white transition-colors font-light">Careers</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted hover:text-white transition-colors font-light">Privacy</Link></li>
              <li><Link href="/contact" className="text-sm text-muted hover:text-white transition-colors font-light">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-border">
          <span className="text-xs text-muted font-light">© 2025 MotoBus Ltd. · Kigali, Rwanda</span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center text-xs text-muted hover:border-border-hover hover:text-green-500 transition-all">
              tw
            </Link>
            <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center text-xs text-muted hover:border-border-hover hover:text-green-500 transition-all">
              in
            </Link>
            <Link href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center text-xs text-muted hover:border-border-hover hover:text-green-500 transition-all">
              fb
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}