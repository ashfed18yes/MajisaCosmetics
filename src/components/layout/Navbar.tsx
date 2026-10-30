'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import SearchModal from '../search/SearchModal';
import { useCart } from '@/context/CartContext';
import { CATEGORIES } from '@/data/mockData';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        setCurrentUser(data.user);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Gracefully handle unconfigured credentials during initial load
    }
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Floating, Detached Pill Navbar with High Contrast White Surface & Elevated Shadow */}
      <header className="sticky top-2.5 sm:top-3.5 z-40 px-3.5 sm:px-6 lg:px-8 xl:px-10 max-w-[1380px] mx-auto w-full pointer-events-none">
        <div className="pointer-events-auto bg-white border border-[#D4E5E3] rounded-full shadow-[0_12px_32px_rgba(11,65,69,0.10),0_2px_8px_rgba(11,65,69,0.04)] px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-all">
          
          {/* Left: Brand Wordmark with Emblem */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#0B4145] hover:text-[#128F92] rounded-full hover:bg-[#F0F9F8] focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] font-serif text-base sm:text-lg font-bold group-hover:bg-[#128F92] group-hover:text-white transition-colors shrink-0 shadow-sm">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.14em] text-[#0B4145] uppercase leading-tight group-hover:text-[#128F92] transition-colors">
                  Majisa
                </span>
                <span className="text-[9px] uppercase tracking-[0.24em] text-[#687F8D] font-bold -mt-0.5">
                  Cosmetics
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links with Calibrated Spacing */}
          <nav className="hidden lg:flex items-center gap-5 lg:gap-6 xl:gap-7 mx-3 xl:mx-5">
            <Link
              href="/"
              className={`text-sm font-bold transition-colors py-1 ${
                isActive('/')
                  ? 'text-[#128F92] border-b-2 border-[#128F92]'
                  : 'text-[#102F32] hover:text-[#128F92]'
              }`}
            >
              Home
            </Link>

            <Link
              href="/collections"
              className={`text-sm font-bold transition-colors py-1 ${
                isActive('/collections') && pathname === '/collections'
                  ? 'text-[#128F92] border-b-2 border-[#128F92]'
                  : 'text-[#102F32] hover:text-[#128F92]'
              }`}
            >
              Collections
            </Link>

            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsCatDropdownOpen(true)}
              onMouseLeave={() => setIsCatDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 text-sm font-bold transition-colors py-1 ${
                  pathname.startsWith('/collections/')
                    ? 'text-[#128F92]'
                    : 'text-[#102F32] hover:text-[#128F92]'
                }`}
                aria-expanded={isCatDropdownOpen}
              >
                <span>Categories</span>
                <ChevronDown className="w-4 h-4 opacity-75" />
              </button>

              {/* Dropdown Menu */}
              {isCatDropdownOpen && (
                <div className="absolute top-full -left-4 w-56 pt-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-white border border-[#D4E5E3] rounded-[20px] shadow-[0_14px_32px_rgba(11,65,69,0.12)] py-2.5 px-2">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/collections/${cat.slug}`}
                        onClick={() => setIsCatDropdownOpen(false)}
                        className="block px-3.5 py-2 text-xs sm:text-sm text-[#102F32] hover:bg-[#F0F9F8] hover:text-[#128F92] rounded-xl transition-colors font-bold"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/brands"
              className={`text-sm font-bold transition-colors py-1 ${
                isActive('/brands')
                  ? 'text-[#128F92] border-b-2 border-[#128F92]'
                  : 'text-[#102F32] hover:text-[#128F92]'
              }`}
            >
              Brands
            </Link>

            <Link
              href="/contact"
              className={`text-sm font-bold transition-colors py-1 ${
                isActive('/contact')
                  ? 'text-[#128F92] border-b-2 border-[#128F92]'
                  : 'text-[#102F32] hover:text-[#128F92]'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right: Actions Group with Clear Separation */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center text-[#0B4145] hover:text-[#128F92] rounded-full bg-[#F0F9F8] hover:bg-[#DDF3F2] transition-colors border border-[#DDF3F2]/60"
              aria-label="Search catalog"
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Account Icon */}
            <Link
              href={currentUser ? '/account' : '/sign-in'}
              className={`relative w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors border ${
                currentUser
                  ? 'bg-[#DDF3F2] text-[#0B4145] border-[#128F92]/40 shadow-xs'
                  : 'bg-[#F0F9F8] text-[#0B4145] hover:text-[#128F92] hover:bg-[#DDF3F2] border-[#DDF3F2]/60'
              }`}
              aria-label={currentUser ? 'My Account' : 'Member Sign In'}
              title={currentUser ? `Signed in as ${currentUser.email}` : 'Sign In'}
            >
              {currentUser ? (
                <span className="font-serif font-bold text-xs sm:text-sm text-[#0B4145]">
                  {(
                    currentUser.user_metadata?.full_name ||
                    currentUser.user_metadata?.name ||
                    currentUser.email ||
                    'M'
                  )[0].toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 stroke-[2.2]" />
              )}
              {currentUser && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#128F92] rounded-full border border-white" />
              )}
            </Link>

            {/* Subtle Divider before Bag CTA */}
            <div className="h-5 w-px bg-[#DDF3F2] hidden sm:block mx-0.5" />

            {/* Distinct Rounded Teal Pill Bag Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm font-bold shadow-cta transition-all hover:scale-102"
              aria-label={`Shopping bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden sm:inline">Bag</span>
              {totalItems > 0 && (
                <span className="bg-white text-[#0B4145] text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="pointer-events-auto lg:hidden fixed inset-0 z-50 bg-[#0B4145]/40 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col p-6 overflow-y-auto border-r border-[#D4E5E3]">
              <div className="flex items-center justify-between pb-5 border-b border-[#DDF3F2]">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-10 h-10 rounded-full bg-[#DDF3F2] flex items-center justify-center text-[#128F92] font-serif text-lg font-bold">
                    M
                  </div>
                  <div>
                    <span className="font-serif text-xl font-bold tracking-[0.14em] text-[#0B4145] uppercase block">
                      Majisa
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.24em] text-[#687F8D] font-semibold">
                      Cosmetics
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-[#0B4145] hover:bg-[#F0F9F8]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-4">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-[#0B4145] hover:text-[#128F92]"
                >
                  Home
                </Link>
                <Link
                  href="/collections"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-[#0B4145] hover:text-[#128F92]"
                >
                  Collections
                </Link>

                <div className="space-y-2 pt-2 border-t border-[#DDF3F2]">
                  <span className="text-xs uppercase font-extrabold text-[#687F8D] tracking-wider block mb-1">
                    Categories
                  </span>
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/collections/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm font-semibold text-[#102F32] hover:text-[#128F92] pl-2"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                <Link
                  href="/brands"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-[#0B4145] hover:text-[#128F92] pt-2 border-t border-[#DDF3F2]"
                >
                  Brands
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-bold text-[#0B4145] hover:text-[#128F92]"
                >
                  Contact
                </Link>
              </div>

              <div className="mt-auto pt-6 border-t border-[#DDF3F2] space-y-3">
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-[#DDF3F2] border border-[#D4E5E3] text-[#0B4145] text-center block text-sm font-bold transition-colors"
                >
                  Contact Concierge
                </Link>
                <Link
                  href={currentUser ? '/account' : '/sign-in'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3.5 px-4 rounded-full bg-[#F0F9F8] border border-[#DDF3F2] text-[#0B4145] text-center block text-sm font-bold flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-[#128F92]" />
                  <span>{currentUser ? 'My Account' : 'Member Access / Sign In'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-full bg-[#128F92] text-white text-center block text-sm font-bold shadow-cta"
                >
                  Shopping Bag ({totalItems})
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}