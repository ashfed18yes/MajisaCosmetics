import React from 'react';

export default function AdminOrderDetailsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 1. Back Navigation & Quick Status Banner */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
      </div>

      {/* 2. Order Header Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-slate-200 rounded-md" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-3.5 w-60 bg-slate-100 rounded mt-2" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 3. Main Details 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (span 2): Items & Payment Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Items Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 bg-slate-200 rounded" />
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 w-16 bg-slate-200 rounded ml-auto" />
                    <div className="h-3 w-12 bg-slate-100 rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Verification History Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="h-4 w-44 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded font-mono" />
                </div>
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (span 1): Customer, Address, Totals */}
        <div className="space-y-4">
          {/* Customer & Shipping Summary Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 space-y-3">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="h-3.5 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Order Summary Totals Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="space-y-2 border-t border-slate-100 pt-2 text-xs">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-14 bg-slate-100 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-3 w-14 bg-slate-100 rounded" />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

