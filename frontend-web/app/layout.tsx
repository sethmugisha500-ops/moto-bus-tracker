// app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
// @ts-ignore
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moto-Bus Tracker",
  description: "Real-time bus tracking for Kigali",
  manifest: "/manifest.json",
  themeColor: "#00C26F",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
