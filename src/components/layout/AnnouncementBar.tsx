'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#0B4145] text-white text-xs py-2.5 px-4 transition-all border-b border-[#128F92]/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-center relative">
        <div className="flex-1 flex items-center justify-center gap-2 tracking-wide font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#128F92] hidden sm:inline shrink-0" />
          <span>
            Complimentary Royal Delivery on orders above ₹1,999 | Use code{' '}
            <span className="font-bold text-[#DDF3F2] bg-[#128F92]/30 px-2 py-0.5 rounded-full border border-[#128F92]/30">
              MAJISA10
            </span>{' '}
            for 10% off
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss announcement"
          className="text-[#DDF3F2]/70 hover:text-white p-0.5 ml-2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}