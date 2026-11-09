import React from 'react';

export default function AdminCodOrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 1. Header with Title & Quick Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded-md" />
          <div className="h-3.5 w-68 bg-slate-100 rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          <div className="h-8 w-28 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* 2. Search & Tab Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="h-9 w-full md:w-72 bg-slate-100 rounded-xl" />

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[1, 2, 3, 4, 5].map((tab) => (
            <div key={tab} className="h-7 w-20 bg-slate-100 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* 3. COD Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-10 bg-slate-50 border-b border-slate-100 px-4 flex items-center justify-between">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded hidden sm:block" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded hidden md:block" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded text-center" />
          <div className="h-3 w-16 bg-slate-200 rounded text-right" />
        </div>

        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="space-y-1 w-28">
                <div className="h-3.5 w-20 bg-slate-200 rounded" />
                <div className="h-2.5 w-14 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-20 bg-slate-100 rounded hidden sm:block" />
              <div className="space-y-1 w-32">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-2.5 w-28 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-14 bg-slate-100 rounded hidden md:block" />
              <div className="h-4 w-20 bg-amber-50 rounded-full" />
              <div className="h-3.5 w-16 bg-slate-200 rounded font-semibold" />
              <div className="h-5 w-20 bg-blue-50 rounded-full text-center" />
              <div className="flex items-center gap-1.5 justify-end">
                <div className="h-7 w-16 bg-[#2563EB]/20 rounded-lg" />
                <div className="h-7 w-7 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

