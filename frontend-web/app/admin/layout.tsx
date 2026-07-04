// app/admin/login/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login - MotoBus",
  description: "Admin portal login for MotoBus platform management",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080C09]">
      {children}
    </div>
  );
}
