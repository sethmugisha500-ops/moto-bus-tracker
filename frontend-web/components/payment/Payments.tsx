'use client';

import WalletCard from './WalletCard';

const paymentMethods = [
  {
    icon: '💛',
    name: 'MTN Mobile Money',
    description: 'Instant USSD confirmation. No internet needed.',
    badge: 'Popular',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
  },
  {
    icon: '💜',
    name: 'In-app wallet',
    description: 'Pre-load funds for faster checkout.',
    badge: null,
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
  },
  {
    icon: '💚',
    name: 'Cash',
    description: 'Pay the driver directly, logged in app.',
    badge: null,
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
  },
];

export default function Payments() {
  return (
    <section className="relative z-10 bg-bg2 border-y border-border py-24" id="payments">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <div className="text-green-500 text-xs font-semibold tracking-[0.12em] uppercase mb-4">
              Payments
            </div>
            <h2 className="font-head text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4">
              Pay your way,<br />every time
            </h2>
            <p className="text-lg text-muted font-light leading-relaxed mb-6">
              Seamless MoMo integration, a digital wallet, and cash — whatever works for your riders.
            </p>

            <div className="flex flex-col gap-3">
              {paymentMethods.map((method, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-bg3 border border-border rounded-lg p-4 hover:border-border-hover transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${method.bgClass} border ${method.borderClass} flex items-center justify-center text-lg flex-shrink-0`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{method.name}</div>
                    <div className="text-xs text-muted font-light">{method.description}</div>
                  </div>
                  {method.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                      {method.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <WalletCard />
        </div>
      </div>
    </section>
  );
}