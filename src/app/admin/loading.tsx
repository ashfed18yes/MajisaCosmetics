import React from 'react';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* 1. Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-3.5 w-72 bg-slate-100 rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-slate-100 rounded-lg" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* 2. Top 4 Core Operational KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col justify-between h-[104px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div>
              <div className="h-7 w-16 bg-slate-200 rounded" />
              <div className="h-2.5 w-24 bg-slate-100 rounded mt-1.5" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Financial & COD Settlement KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 flex items-center justify-between h-[96px]"
          >
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-6 w-28 bg-slate-200 rounded" />
              <div className="h-2.5 w-52 bg-slate-100 rounded" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>

      {/* 4. Section: Orders Requiring Payment Verification Skeleton */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="h-4 w-52 bg-slate-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-3.5 w-28 bg-slate-100 rounded" />
                <div className="h-4 w-16 bg-slate-100 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-16 bg-slate-200 rounded" />
                <div className="h-3.5 w-20 bg-slate-100 rounded font-mono" />
                <div className="h-6 w-14 bg-blue-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Two-Column Row: Recent Orders (Left) & Recent COD Collections (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-3.5 w-28 bg-slate-100 rounded" />
                <div className="h-4 w-14 bg-slate-100 rounded" />
                <div className="h-3.5 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-emerald-50 rounded-full" />
                <div className="h-4 w-16 bg-slate-100 rounded-full" />
                <div className="h-6 w-6 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                  <div className="h-2.5 w-28 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

