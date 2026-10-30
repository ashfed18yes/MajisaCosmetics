import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/adminGuard';
import {
  Package,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Admin Portal | Majisa Cosmetics',
  description: 'Product and catalog administration for Majisa Cosmetics.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2D2A26] flex flex-col font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0B4145] text-white border-b border-[#0B4145]/80 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3">
            <Link href="/admin/products" className="flex items-center space-x-2 group">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#D4AF37] group-hover:text-white transition-colors">
                MAJISA
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-widest uppercase bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              href="/admin/products"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Package className="w-4 h-4 text-[#D4AF37]" />
              <span>Products</span>
            </Link>

            <Link
              href="/admin/products/new"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-[#D4AF37] text-[#0B4145] hover:bg-[#c49f2e] transition-colors shadow-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Product</span>
            </Link>

            <div className="h-5 w-px bg-white/20 mx-1 sm:mx-2" />

            <Link
              href="/"
              target="_blank"
              className="flex items-center space-x-1 text-xs text-white/70 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
              title="Open storefront in new tab"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </nav>

          {/* User Status / Identity */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-white/80">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>{user.fullName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="text-[10px] text-white/60 truncate max-w-[140px]">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Admin Minimal Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-4 text-center text-xs text-[#7A7670]">
        Majisa Cosmetics Admin Management &bull; Built with Supabase & Next.js
      </footer>
    </div>
  );
}

