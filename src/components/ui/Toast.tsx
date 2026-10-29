'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0B4145] text-white px-5 py-3.5 rounded-full shadow-modal border border-[#128F92]/40 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#128F92] shrink-0" />
        <p className="text-sm font-bold text-white">{toastMessage}</p>
      </div>
    </div>
  );
}
