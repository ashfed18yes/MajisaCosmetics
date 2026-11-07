'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export interface AdminShellProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 antialiased font-sans">
      {/* Fixed Left Sidebar */}
      <AdminSidebar
        user={user}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area shifted right by sidebar width (w-64) */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Fixed Top Header */}
        <AdminHeader
          user={user}
          onMobileToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 pt-16 px-6 sm:px-8 lg:px-10 py-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

