// admin-dashboard/app/layout.tsx
'use client';

import { Inter } from 'next/font/google';
// @ts-ignore: side-effect import for global CSS
import './globals.css';
import { Providers } from './providers';
import MobileHeader from '../components/layout/MobileHeader';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });
// Access env via globalThis to avoid 'process' not found in client bundle TypeScript error
const GOOGLE_MAPS_API_KEY = (globalThis as any)?.process?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCB07j6ULHsLCI-QEWG4hXKKEDyhOA3d84';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`}
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[#080C09] text-white antialiased`}>
        <Providers>
          {!isAuthPage && <MobileHeader />}
          <main className={!isAuthPage ? 'pt-16' : ''}>
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#111714',
                color: '#F0F4F1',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}