import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-pulse">
      {/* Breadcrumbs Pill Skeleton */}
      <div className="h-8 w-64 bg-white rounded-full border border-[#D4E5E3] shadow-soft" />

      {/* Main Product Showcase Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left: Gallery Column Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-3.5 sm:p-4.5 border border-[#D4E5E3] shadow-card flex flex-col-reverse sm:flex-row gap-3">
          <div className="flex sm:flex-col gap-2 overflow-hidden sm:w-16 shrink-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#F0F9F8] border border-[#DDF3F2] shrink-0" />
            ))}
          </div>
          <div className="flex-1 aspect-[4/5] rounded-xl bg-[#F0F9F8] border border-[#DDF3F2]" />
        </div>

        {/* Right: Information & Actions Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#D4E5E3] shadow-card space-y-5">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-[#DDF3F2] rounded" />
            <div className="h-7 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>

          <div className="h-8 w-36 bg-slate-200 rounded-lg" />

          <div className="space-y-2 pt-2 border-t border-[#DDF3F2]">
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200" />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="h-11 w-full bg-[#128F92]/20 rounded-full" />
            <div className="h-11 w-full bg-[#0B4145]/15 rounded-full" />
          </div>

          <div className="pt-4 border-t border-[#DDF3F2] space-y-2">
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

