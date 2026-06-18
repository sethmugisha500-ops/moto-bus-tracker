'use client';

const features = [
  {
    icon: '🗺️',
    title: 'Live GPS tracking',
    description: 'Watch your driver move in real-time on an interactive map. Share your trip link with anyone, no app needed.',
    tag: '← Public tracking links',
  },
  {
    icon: '⚡',
    title: 'Instant matching',
    description: 'WebSocket-powered dispatch finds the nearest available driver within seconds, not minutes.',
    tag: '← Sub-5s matching',
  },
  {
    icon: '📱',
    title: 'MoMo payments',
    description: 'Pay with MTN Mobile Money, cash, or your in-app wallet. Zero friction, instant confirmation.',
    tag: '← 3 payment methods',
  },
  {
    icon: '🚨',
    title: 'Emergency SOS',
    description: 'One-tap SOS alerts your emergency contacts with your live location and driver details instantly.',
    tag: '← Always-on safety',
  },
  {
    icon: '📊',
    title: 'Fleet intelligence',
    description: 'Real-time fleet map, revenue analytics, driver safety scores, and maintenance alerts in one dashboard.',
    tag: '← Admin + operators',
  },
  {
    icon: '📴',
    title: 'Offline-ready PWA',
    description: 'Service worker caching keeps the app functional even on weak connections. Syncs when back online.',
    tag: '← Works anywhere',
  },
];

export default function Features() {
  return (
    <section className="relative z-10 px-6 md:px-12 lg:px-20 py-24" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-green-500 text-xs font-semibold tracking-[0.12em] uppercase mb-4">
          Platform features
        </div>
        <h2 className="font-head text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4">
          Everything your ride network needs
        </h2>
        <p className="text-lg text-muted font-light max-w-md leading-relaxed">
          From real-time GPS tracking to MoMo payments and SOS emergency response — fully integrated.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden mt-16">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-bg2 p-10 hover:bg-bg3 transition-colors relative group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl mb-5">
                {feature.icon}
              </div>
              <h3 className="font-head text-lg font-bold mb-2.5 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed font-light">{feature.description}</p>
              <span className="inline-block mt-4 text-[11px] text-green-500 font-medium tracking-wide">
                {feature.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}