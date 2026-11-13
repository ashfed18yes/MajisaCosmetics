'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Menu,
  LogOut,
  ShieldCheck,
  User,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminNotificationBell from './AdminNotificationBell';

export interface AdminHeaderProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  onMobileToggle?: () => void;
}

export default function AdminHeader({ user, onMobileToggle }: AdminHeaderProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
      router.push('/sign-in');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white z-30 px-6 sm:px-8 flex items-center justify-between border-b border-slate-100">
      {/* Left: Mobile Toggle & Global Search Bar matching Image 2 */}
      <div className="flex items-center gap-3 w-full max-w-md">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMobileToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input field with exact placeholder from Image 2 */}
        <div className="relative w-full max-w-[380px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Go to Store button, Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Simple & clear "Go to Home Page" button */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 hover:text-[#2563EB] text-xs font-semibold text-slate-700 transition-all shadow-xs"
          title="Visit Customer Home Page"
        >
          <Store className="w-4 h-4 text-slate-500 group-hover:text-[#2563EB]" />
          <span className="hidden sm:inline">Visit Store</span>
          <ExternalLink className="w-3 h-3 text-slate-400 opacity-70" />
        </Link>

        {/* Real-time Admin Notification Bell */}
        <AdminNotificationBell userId={user.id} />

        {/* User Profile Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left focus:outline-none"
          >
            {/* Blue Avatar Circle */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              <User className="w-4 h-4 text-white" />
            </div>

            {/* User Name & Role text stack (matches "Sarah Wilson \n Store Manager") */}
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-sm font-semibold text-slate-800">
                {user.fullName || 'Sarah Wilson'}
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                Store Manager
              </div>
            </div>

            {/* Chevron down */}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user.fullName || 'Sarah Wilson'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authorized Administrator</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/"
                  target="_blank"
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open Storefront (Home)</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
