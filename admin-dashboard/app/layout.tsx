'use client';

import { Inter } from 'next/font/google';
// @ts-ignore
import './globals.css';
import { Providers } from './providers';
import MobileHeader from '@/components/layout/MobileHeader';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {!isAuthPage && <MobileHeader />}
          <main className={!isAuthPage ? 'pt-16' : ''}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}