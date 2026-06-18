'use client';

import Link from 'next/link';

export default function CTABanner() {
  return (
    <section className="relative z-10 py-20">
      <div className="mx-6 md:mx-12 lg:mx-20 bg-bg2 border border-border rounded-2xl p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-75 h-75 rounded-full bg-green-500/8 pointer-events-none" />
        
        <div className="text-center lg:text-left">
          <h2 className="font-head text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3">
            Ready to modernize<br />your fleet?
          </h2>
          <p className="text-muted font-light max-w-md">
            Get your operator account set up in under 10 minutes. No hardware required.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link href="/register" className="bg-green-500 text-bg font-medium px-8 py-4 rounded-lg text-center hover:bg-green-600 transition-all hover:-translate-y-0.5">
            Start free trial
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 text-muted hover:text-white transition-colors px-4 py-4">
            Talk to sales →
          </Link>
        </div>
      </div>
    </section>
  );
}