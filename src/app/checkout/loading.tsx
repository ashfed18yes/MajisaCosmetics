import React from 'react';

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#E7F0EF] text-[#102F32] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-2">
          <div className="h-8 sm:h-10 w-48 sm:w-64 bg-slate-200 rounded-xl mx-auto" />
          <div className="h-4 w-72 bg-slate-100 rounded-md mx-auto" />
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Shipping & Payment Steps Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D4E5E3] shadow-card space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#DDF3F2]">
                <div className="w-8 h-8 rounded-full bg-[#DDF3F2] shrink-0" />
                <div className="h-5 w-40 bg-slate-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-10 w-full bg-[#F0F9F8] rounded-xl" />
                <div className="h-10 w-full bg-[#F0F9F8] rounded-xl" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D4E5E3] shadow-card space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-[#DDF3F2]">
                <div className="w-8 h-8 rounded-full bg-[#DDF3F2] shrink-0" />
                <div className="h-5 w-40 bg-slate-200 rounded" />
              </div>
              <div className="h-16 w-full bg-[#F0F9F8] rounded-xl" />
            </div>
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#D4E5E3] shadow-card space-y-6">
            <div className="h-6 w-36 bg-slate-200 rounded" />
            <div className="space-y-3 pb-4 border-b border-[#DDF3F2]">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-5 w-28 bg-slate-200 rounded" />
              <div className="h-7 w-24 bg-[#128F92]/20 rounded-lg" />
            </div>
            <div className="h-12 w-full bg-[#128F92]/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

