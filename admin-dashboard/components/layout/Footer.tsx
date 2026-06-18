import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-bold text-lg">MotoBus</span>
            </div>
            <p className="text-muted text-sm">
              East Africa's smartest ride-hailing platform. Real-time tracking, instant payments.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Riders</h4>
            <ul className="space-y-2 text-muted text-sm">
              <li><Link href="/passenger" className="hover:text-white transition">Book a ride</Link></li>
              <li><Link href="/tracking" className="hover:text-white transition">Track my ride</Link></li>
              <li><Link href="/wallet" className="hover:text-white transition">Wallet</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Drivers</h4>
            <ul className="space-y-2 text-muted text-sm">
              <li><Link href="/driver" className="hover:text-white transition">Become a driver</Link></li>
              <li><Link href="/earnings" className="hover:text-white transition">Earnings</Link></li>
              <li><Link href="/support" className="hover:text-white transition">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted text-sm">
              <li><Link href="/about" className="hover:text-white transition">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted text-sm">
          © 2024 MotoBus Ltd. Kigali, Rwanda 🇷🇼
        </div>
      </div>
    </footer>
  );
}