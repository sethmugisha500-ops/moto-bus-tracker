import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MotoBus — East Africa Smart Ride Network',
    template: '%s | MotoBus',
  },
  description:
    'Real-time moto and bus tracking, MoMo payments, and fleet intelligence — built for East Africa.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MotoBus',
  },
  openGraph: {
    title: 'MotoBus',
    description: "East Africa's smartest ride-hailing platform",
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00C26F',
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT — must export <html> and <body> or Next.js throws the
// "Missing required html tags" error.
// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}