'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  ShieldCheck,
  Eye,
  ExternalLink,
  ArrowRight,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';

export interface DashboardOrderRow {
  id: string;
  orderNumber: string;
  orderType: 'online' | 'cod';
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  date: string;
  pendingUtr?: string | null;
}

export interface DashboardCodCollection {
  id: string;
  orderId: string;
  orderNumber: string;
  amountCollected: number;
  paymentMethod: string;
  collectedAt: string;
}

export interface DashboardKpis {
  totalOrders: number;
  pendingVerificationCount: number;
  onlineOrdersCount: number;
  codOrdersCount: number;
  awaitingDispatchCount: number;
  deliveredCount: number;
  outstandingCodBalance: number;
  collectedCodRevenue: number;
}

interface AdminDashboardClientProps {
  kpis: DashboardKpis;
  recentOrders: DashboardOrderRow[];
  pendingVerifications: DashboardOrderRow[];
  recentCollections: DashboardCodCollection[];
}

export default function AdminDashboardClient({
  kpis,
  recentOrders,
  pendingVerifications,
  recentCollections,
}: AdminDashboardClientProps) {
  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badgeColor = 'bg-[#2563EB] text-white'; // Blue default

    if (s.includes('ship') || s.includes('dispatch') || s === 'dispatched') {
      badgeColor = 'bg-[#10B981] text-white'; // Green
    } else if (s.includes('deliver') || s === 'delivered') {
      badgeColor = 'bg-emerald-700 text-white';
    } else if (s.includes('pending') || s.includes('awaiting') || s.includes('action')) {
      badgeColor = 'bg-[#F59E0B] text-white'; // Amber
    } else if (s.includes('cancel')) {
      badgeColor = 'bg-[#E11D48] text-white'; // Rose
    } else if (s.includes('confirm') || s.includes('process')) {
      badgeColor = 'bg-[#2563EB] text-white'; // Blue
    }

    return (
      <span className={`inline-block text-center px-3 py-0.5 text-xs font-semibold rounded-full shadow-xs ${badgeColor}`}>
        {status}
      </span>
    );
  };

  // Payment status badge helper
  const renderPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Fully Paid</span>
          </span>
        );
      case 'advance_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Advance Paid</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment metrics, payment verification queue, and COD revenue tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders/online"
            prefetch={true}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>

      {/* 1. Primary Operational KPI Cards (Top 4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpis.totalOrders}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>{kpis.onlineOrdersCount} Online</span>
              <span>&bull;</span>
              <span>{kpis.codOrdersCount} COD</span>
            </div>
          </div>
        </div>

        {/* Pending Verification Queue */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payment Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpis.pendingVerificationCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {kpis.pendingVerificationCount > 0 ? 'Action required by admin' : 'Queue fully verified'}
            </div>
          </div>
        </div>

        {/* Awaiting Dispatch */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Awaiting Dispatch</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpis.awaitingDispatchCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Confirmed & in processing
            </div>
          </div>
        </div>

        {/* Completed / Delivered */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Delivered Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{kpis.deliveredCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Successfully fulfilled
            </div>
          </div>
        </div>
      </div>

      {/* 2. Financial & COD Settlement KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Outstanding COD Balance Due */}
        <div className="bg-white rounded-xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Outstanding COD Balance
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                ₹{kpis.outstandingCodBalance.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Remaining product subtotal due upon physical doorstep delivery
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100/60 text-amber-700 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Confirmed Collected COD Revenue */}
        <div className="bg-white rounded-xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Collected COD Revenue
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                ₹{kpis.collectedCodRevenue.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Verified doorstep collections recorded in collection audit trail
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Pending Payment Verifications Queue */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Orders Requiring Payment Verification ({pendingVerifications.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders/online"
              prefetch={true}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Online Queue &rarr;
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/admin/orders/cod"
              prefetch={true}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              COD Advance Queue &rarr;
            </Link>
          </div>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
            <p className="text-xs font-semibold text-slate-700">All customer payments are up to date</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No pending payment verification requests at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-2 px-2">Order</th>
                  <th className="py-2 px-2.5">Customer</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Amount</th>
                  <th className="py-2 px-2.5">Submitted UTR</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingVerifications.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2 px-2 font-bold text-slate-900">
                      <Link href={`/admin/orders/${order.id}`} prefetch={true} className="hover:text-[#2563EB]">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 px-2.5 text-slate-700 font-medium">{order.customerName}</td>
                    <td className="py-2 px-2.5">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {order.orderType === 'cod' ? 'COD (₹100)' : 'Online UPI'}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-slate-900">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="py-2 px-2.5 font-mono text-slate-800">
                      {order.pendingUtr || <span className="text-slate-400 italic">Not submitted</span>}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Two-Column Row: Recent Orders (Left) & Recent COD Collections (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table (span 2) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <Link
              href="/admin/orders/online"
              prefetch={true}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No orders placed yet in the database. Customer storefront orders will populate here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2 px-2">Order</th>
                    <th className="py-2 px-2.5">Customer</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Total</th>
                    <th className="py-2 px-2.5">Payment</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                    <th className="py-2 px-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-2 font-bold text-slate-900">
                        <Link href={`/admin/orders/${order.id}`} prefetch={true} className="hover:text-[#2563EB]">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2 px-2.5 text-slate-700 font-medium">{order.customerName}</td>
                      <td className="py-2 px-2.5">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {order.orderType}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-900">₹{order.totalAmount.toFixed(2)}</td>
                      <td className="py-2 px-2.5">{renderPaymentStatusBadge(order.paymentStatus)}</td>
                      <td className="py-2 px-2.5 text-center">{renderStatusBadge(order.status)}</td>
                      <td className="py-2 px-2 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          prefetch={true}
                          title="Open order details"
                          className="p-1 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg inline-flex items-center transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent COD Collections (span 1) */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent COD Collections</h2>
              <Link
                href="/admin/orders/cod"
                prefetch={true}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                COD Orders
              </Link>
            </div>

            {recentCollections.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Banknote className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p className="font-semibold text-slate-600">No collections recorded</p>
                <p className="text-[11px] mt-0.5">Doorstep cash settlements confirmed by admin will be listed here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentCollections.map((col) => (
                  <div
                    key={col.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${col.orderId}`}
                        prefetch={true}
                        className="font-bold text-slate-900 hover:text-[#2563EB] block"
                      >
                        {col.orderNumber}
                      </Link>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {col.paymentMethod.replace('_', ' ')} &bull;{' '}
                        {new Date(col.collectedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div className="font-bold text-emerald-700 text-xs sm:text-sm">
                      ₹{col.amountCollected.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Audit source: public.order_collections</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

