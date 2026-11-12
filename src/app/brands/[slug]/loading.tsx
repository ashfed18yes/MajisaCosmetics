import React from 'react';

export default function BrandDetailLoading() {
  return (
    <div className="space-y-9 sm:space-y-12 pb-16 sm:pb-20 animate-pulse">
      {/* Brand Hero Banner Skeleton */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2">
        <div className="bg-[#0B4145]/80 rounded-[26px] sm:rounded-[30px] py-12 sm:py-16 px-6 sm:px-10 lg:px-12 space-y-4">
          <div className="h-7 w-48 bg-white/10 rounded-full" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-white/15 rounded-full" />
            <div className="h-6 w-24 bg-white/15 rounded-full" />
          </div>
          <div className="h-10 sm:h-12 w-64 sm:w-80 bg-white/25 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-white/15 rounded-md" />
        </div>
      </div>

      {/* Brand Products Skeleton */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">
        <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#D4E5E3] flex justify-between items-center">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-7 w-28 bg-[#DDF3F2]/60 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[18px] p-3 sm:p-3.5 border border-[#D4E5E3] shadow-card space-y-3"
            >
              <div className="aspect-[4/5] w-full rounded-[14px] bg-[#F0F9F8]" />
              <div className="space-y-2 pt-1">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
              </div>
              <div className="pt-2 border-t border-[#DDF3F2] flex items-center justify-between">
                <div className="h-5 w-16 bg-slate-200 rounded" />
                <div className="h-8 w-24 bg-[#128F92]/20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

