import React from 'react';

export default function BrandsLoading() {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12 space-y-8 animate-pulse">
      <div className="space-y-3 max-w-xl">
        <div className="h-8 sm:h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-[24px] p-6 border border-[#D4E5E3] shadow-card space-y-5"
          >
            <div className="h-36 w-full rounded-[18px] bg-[#F0F9F8]" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
            <div className="pt-3 border-t border-[#DDF3F2] flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-8 w-28 bg-[#128F92]/20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

