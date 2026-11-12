import React from 'react';

export default function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen bg-[#E7F0EF] text-[#102F32] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-[800px] mx-auto space-y-8">
        {/* Success Card Skeleton */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D4E5E3] shadow-card text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#DDF3F2] shrink-0" />
          <div className="space-y-2 max-w-md mx-auto">
            <div className="h-8 w-64 bg-slate-200 rounded-xl mx-auto" />
            <div className="h-4 w-80 bg-slate-100 rounded-md mx-auto" />
          </div>
          <div className="h-10 w-48 bg-[#DDF3F2]/60 rounded-full mx-auto" />

          {/* Order Details Skeleton */}
          <div className="pt-6 border-t border-[#DDF3F2] space-y-4 text-left">
            <div className="h-5 w-36 bg-slate-200 rounded" />
            <div className="space-y-3">
              <div className="h-12 w-full bg-[#F0F9F8] rounded-xl" />
              <div className="h-12 w-full bg-[#F0F9F8] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

