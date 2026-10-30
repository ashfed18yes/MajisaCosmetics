'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Shield, HeartHandshake, Sparkles, MessageCircle } from 'lucide-react';
import { CATEGORIES } from '@/data/mockData';
import { CONTACT_INFO } from '@/config/contact';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#0B4145] text-white border-t border-[#0E7A7D]/30">
      {/* Brand Value Pillars */}
      <div className="border-b border-[#0E7A7D]/30 py-12 bg-[#083336]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#128F92] flex items-center justify-center shrink-0 text-white shadow-cta">
                <Shield className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-bold mb-1">
                  100% Genuine Formulations
                </h4>
                <p className="text-xs sm:text-sm text-[#DDF3F2] font-medium leading-relaxed">
                  Every product is authentic, ethically sourced, and tested under strict dermatological safety standards.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#128F92] flex items-center justify-center shrink-0 text-white shadow-cta">
                <Sparkles className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-bold mb-1">
                  Complimentary Royal Delivery
                </h4>
                <p className="text-xs sm:text-sm text-[#DDF3F2] font-medium leading-relaxed">
                  Packed in luxury gift boxes and dispatched swiftly on orders above ₹1,999.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#128F92] flex items-center justify-center shrink-0 text-white shadow-cta">
                <HeartHandshake className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-bold mb-1">
                  Beauty Concierge Support
                </h4>
                <p className="text-xs sm:text-sm text-[#DDF3F2] font-medium leading-relaxed">
                  Have questions about shades or orders? Call or WhatsApp us at{' '}
                  <a href={CONTACT_INFO.phoneLink} className="underline hover:text-white font-bold transition-colors">
                    {CONTACT_INFO.phone}
                  </a>{' '}
                  or email{' '}
                  <a href={CONTACT_INFO.emailLink} className="underline hover:text-white font-bold transition-colors">
                    {CONTACT_INFO.email}
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Intro & Newsletter */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#128F92] flex items-center justify-center text-white font-serif text-xl font-bold shadow-cta">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-[0.14em] text-white uppercase block leading-tight">
                  Majisa
                </span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#DDF3F2] font-semibold">
                  Cosmetics
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#DDF3F2] leading-relaxed max-w-sm font-medium">
              Majisa Cosmetics marries timeless regal botanical traditions with modern French formulation science. Designed for lovers of pure, clean elegance.
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider font-bold text-white mb-2">
                Join the Majisa Circle
              </p>
              <p className="text-xs text-[#DDF3F2] mb-3 font-medium">
                Receive confidential launches, shade advice, and an exclusive 10% welcome privilege.
              </p>
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-xs text-white bg-[#0E7A7D] p-3 rounded-2xl border border-[#128F92]">
                  <CheckCircle2 className="w-4 h-4 text-[#DDF3F2] shrink-0" />
                  <span>Welcome to the Majisa Circle. Check your inbox soon.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-md">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-[#083336] border border-[#0E7A7D] rounded-l-full text-sm text-white placeholder-[#DDF3F2]/60 focus:outline-none focus:border-[#128F92]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#128F92] hover:bg-[#0E7A7D] text-white font-bold text-xs sm:text-sm rounded-r-full transition-colors flex items-center gap-1.5 shadow-cta"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 1: Collections */}
          <div>
            <h5 className="font-serif text-base text-white font-bold tracking-wider uppercase mb-4">
              Collections
            </h5>
            <ul className="space-y-3 text-sm text-[#DDF3F2] font-medium">
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  All Collections
                </Link>
              </li>
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/collections/${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Brands */}
          <div>
            <h5 className="font-serif text-base text-white font-bold tracking-wider uppercase mb-4">
              Brands
            </h5>
            <ul className="space-y-3 text-sm text-[#DDF3F2] font-medium">
              <li>
                <Link href="/brands" className="hover:text-white transition-colors">
                  Brand Directory
                </Link>
              </li>
              <li>
                <Link href="/brands/majisa-atelier" className="hover:text-white transition-colors">
                  Majisa Atelier
                </Link>
              </li>
              <li>
                <Link href="/brands/lumiere-royale" className="hover:text-white transition-colors">
                  Lumière Royale
                </Link>
              </li>
              <li>
                <Link href="/brands/velours-de-paris" className="hover:text-white transition-colors">
                  Velours de Paris
                </Link>
              </li>
              <li>
                <Link href="/brands/solaris-sun-labs" className="hover:text-white transition-colors">
                  Solaris Sun Labs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Care & Contact Details */}
          <div>
            <h5 className="font-serif text-base text-white font-bold tracking-wider uppercase mb-4">
              Client Care
            </h5>
            <ul className="space-y-3 text-sm text-[#DDF3F2] font-medium mb-6">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors font-bold text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-white transition-colors">
                  Our Brands
                </Link>
              </li>
            </ul>

            {/* Official Business Contact Details */}
            <div className="space-y-3 text-xs sm:text-sm text-[#DDF3F2] border-t border-[#0E7A7D]/40 pt-4 font-medium">
              <a
                href={CONTACT_INFO.emailLink}
                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                aria-label={`Email ${CONTACT_INFO.businessName} at ${CONTACT_INFO.email}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#128F92]/40 flex items-center justify-center shrink-0 group-hover:bg-[#128F92] transition-colors">
                  <Mail className="w-4 h-4 text-[#DDF3F2] group-hover:text-white" />
                </div>
                <span className="truncate">{CONTACT_INFO.email}</span>
              </a>

              <a
                href={CONTACT_INFO.phoneLink}
                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                aria-label={`Call ${CONTACT_INFO.businessName} at ${CONTACT_INFO.phone}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#128F92]/40 flex items-center justify-center shrink-0 group-hover:bg-[#128F92] transition-colors">
                  <Phone className="w-4 h-4 text-[#DDF3F2] group-hover:text-white" />
                </div>
                <span>{CONTACT_INFO.phone}</span>
              </a>

              <a
                href={CONTACT_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                aria-label={`Chat with ${CONTACT_INFO.businessName} on WhatsApp at ${CONTACT_INFO.phone}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#128F92]/40 flex items-center justify-center shrink-0 group-hover:bg-[#128F92] transition-colors">
                  <MessageCircle className="w-4 h-4 text-[#DDF3F2] group-hover:text-white" />
                </div>
                <span>WhatsApp: {CONTACT_INFO.phone}</span>
              </a>

              {/* Physical Store Address */}
              <a
                href={CONTACT_INFO.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 hover:text-white transition-colors group pt-1"
                aria-label={`View store location: ${CONTACT_INFO.address.formatted}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#128F92]/40 flex items-center justify-center shrink-0 group-hover:bg-[#128F92] transition-colors mt-0.5">
                  <MapPin className="w-4 h-4 text-[#DDF3F2] group-hover:text-white" />
                </div>
                <div className="flex flex-col text-xs leading-relaxed">
                  <span className="font-bold text-white">Store Address:</span>
                  <span className="line-clamp-2 text-[#DDF3F2]/90">{CONTACT_INFO.address.formatted}</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-[#0E7A7D]/30 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-[#DDF3F2] gap-4 font-medium">
          <p>&copy; {new Date().getFullYear()} {CONTACT_INFO.businessName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact Us
            </Link>
            <span>&bull;</span>
            <Link href="/collections" className="hover:text-white transition-colors">
              Collections
            </Link>
            <span>&bull;</span>
            <Link href="/account" className="hover:text-white transition-colors">
              My Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
