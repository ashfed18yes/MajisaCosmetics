import React from 'react';

export default function AccountLoading() {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12 space-y-9 animate-pulse">
      {/* 1. Profile Header Card Skeleton */}
      <div className="bg-white rounded-[24px] sm:rounded-[26px] p-5 sm:p-7 border border-[#D4E5E3] shadow-card flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#DDF3F2]/60 shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-48 sm:w-64 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-36 sm:w-48 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="h-9 w-28 bg-slate-100 rounded-full" />
      </div>

      {/* 2. Navigation Tabs Pill Skeleton */}
      <div className="flex items-center gap-2 border-b border-[#D4E5E3] pb-4">
        <div className="h-10 w-32 bg-[#DDF3F2]/60 rounded-full" />
        <div className="h-10 w-32 bg-slate-100 rounded-full" />
        <div className="h-10 w-32 bg-slate-100 rounded-full" />
      </div>

      {/* 3. Orders Grid / List Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-[22px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#DDF3F2]">
              <div className="space-y-1.5">
                <div className="h-5 w-36 bg-slate-200 rounded-md" />
                <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
              </div>
              <div className="h-7 w-28 bg-[#DDF3F2]/60 rounded-full" />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-16 bg-slate-200 rounded" />
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDF3F2] flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-6 w-24 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

