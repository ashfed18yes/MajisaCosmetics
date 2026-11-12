import React from 'react';

export default function CollectionsLoading() {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="space-y-3 max-w-2xl">
        <div className="h-8 sm:h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-md" />
      </div>

      {/* 2. Filter Tabs / Category Pills Skeleton */}
      <div className="flex flex-wrap items-center gap-2.5 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-28 bg-[#DDF3F2]/50 rounded-full" />
        ))}
      </div>

      {/* 3. Product Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white rounded-[18px] p-3 sm:p-3.5 border border-[#D4E5E3] shadow-card space-y-3"
          >
            <div className="aspect-[4/5] w-full rounded-[14px] bg-[#F0F9F8]" />
            <div className="space-y-2 pt-1">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
            </div>
            <div className="pt-2 border-t border-[#DDF3F2] flex items-center justify-between">
              <div className="h-5 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-24 bg-[#128F92]/20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

