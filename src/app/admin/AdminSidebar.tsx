'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Package,
  PlusCircle,
  ExternalLink,
  ChevronLeft,
  X,
  Boxes,
} from 'lucide-react';

export interface AdminSidebarProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({
  user,
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Clean, focused admin navigation per roadmap specification
  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      isActive: pathname === '/admin',
      isExternal: false,
    },
    {
      label: 'Online Orders',
      href: '/admin/orders/online',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/admin/orders/online') || pathname === '/admin/orders',
      isExternal: false,
    },
    {
      label: 'COD Orders',
      href: '/admin/orders/cod',
      icon: Truck,
      isActive: pathname.startsWith('/admin/orders/cod'),
      isExternal: false,
    },
    {
      label: 'Products',
      href: '/admin/products',
      icon: Package,
      isActive:
        pathname === '/admin/products' ||
        (pathname.startsWith('/admin/products/') && pathname !== '/admin/products/new'),
      isExternal: false,
    },
    {
      label: 'Add Product',
      href: '/admin/products/new',
      icon: PlusCircle,
      isActive: pathname === '/admin/products/new',
      isExternal: false,
    },
    {
      label: 'Storefront',
      href: '/',
      icon: ExternalLink,
      isActive: false,
      isExternal: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: matches Image 2 width (~260px), white background, clean border */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header - exact recreation of Image 2 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <Link href="/admin/orders/online" className="flex items-center gap-3 group">
            {/* Blue Rounded Square Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Boxes className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            {/* Brand Title */}
            <span className="text-[17px] font-bold text-slate-800 tracking-tight">
              MajisaAdmin
            </span>
          </Link>

          {/* Right Collapse chevron / Close button */}
          <div className="flex items-center">
            {/* Desktop collapse chevron */}
            <button
              type="button"
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation List - exact vertical stack & active blue pill */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noreferrer' : undefined}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  item.isActive
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 transition-colors ${
                    item.isActive ? 'text-white' : 'text-slate-400'
                  }`}
                  strokeWidth={item.isActive ? 2.2 : 1.8}
                />
                <span className={item.isActive ? 'font-semibold' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
