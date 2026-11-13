'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Eye,
  SquarePen,
  MoreHorizontal,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Truck,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  User,
  MapPin,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  verifyPaymentAction,
  rejectPaymentAction,
  updateFulfillmentStatusAction,
  getSignedProofUrlAction,
  deleteOrderAction,
} from '../actions';

// Order interface for live Supabase orders
export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemsCountText: string;
  status: 'Processing' | 'Shipped' | 'Dispatched' | 'Pending' | 'Cancelled' | 'Confirmed' | 'Delivered' | 'Awaiting Payment' | 'Payment Action Required';
  displayStatus: 'Processing' | 'Shipped' | 'Pending' | 'Cancelled';
  total: number;
  currencySymbol: string;
  date: string;
  orderType: 'online' | 'cod';
  paymentStatus: string;
  itemsSubtotal: number;
  deliveryFee: number;
  shippingAddress?: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  activePayment?: {
    id: string;
    utrReference: string | null;
    proofAssetId: string | null;
    proofSecurePath: string | null;
    status: string;
    amountExpected: number;
    amountCredited: number | null;
    createdAt: string;
  } | null;
  courierPartner?: string | null;












  trackingNumber?: string | null;
  isSampleData?: boolean;
}

export interface AdminPaginationData {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statusFilter?: string;
  searchQuery?: string;
}

interface AdminOnlineOrdersClientProps {
  initialLiveOrders: AdminOrderRow[];
  pagination?: AdminPaginationData;
}

export default function AdminOnlineOrdersClient({
  initialLiveOrders = [],
  pagination,
}: AdminOnlineOrdersClientProps) {
  const router = useRouter();
  const [liveOrders, setLiveOrders] = useState<AdminOrderRow[]>(initialLiveOrders);
  const [activeTab, setActiveTab] = useState<'All' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled'>(
    (pagination?.statusFilter as any) || 'All'
  );
  const [searchQuery, setSearchQuery] = useState(pagination?.searchQuery || '');

  // Keep live orders state synchronized with fresh server props
  React.useEffect(() => {
    setLiveOrders(initialLiveOrders);
  }, [initialLiveOrders]);

  // Selected order for inspection slide-over
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [isPendingAction, startTransition] = useTransition();
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isRejectingPayment, setIsRejectingPayment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNum, setTrackingNum] = useState('');

  // Delete Order state
  const [orderToDelete, setOrderToDelete] = useState<AdminOrderRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal for payment proof preview
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  // Active pagination metadata
  const activePagination = useMemo(() => {
    if (pagination) return pagination;
    return {
      page: 1,
      pageSize: 25,
      totalCount: liveOrders.length,
      totalPages: Math.max(1, Math.ceil(liveOrders.length / 25)),
    };
  }, [pagination, liveOrders.length]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(newPage));
    if (activeTab !== 'All') params.set('status', activeTab);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    startTransition(() => {
      router.push(`/admin/orders/online?${params.toString()}`);
    });
  };

  const handleTabChange = (tab: 'All' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    params.set('page', '1');
    if (tab !== 'All') params.set('status', tab);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    startTransition(() => {
      router.push(`/admin/orders/online?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    params.set('page', '1');
    if (activeTab !== 'All') params.set('status', activeTab);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    startTransition(() => {
      router.push(`/admin/orders/online?${params.toString()}`);
    });
  };

  // Filter orders by active tab
  const filteredOrders = useMemo(() => {
    return liveOrders.filter((order) => {
      if (activeTab !== 'All' && order.displayStatus !== activeTab) {
        return false;
      }
      return true;
    });
  }, [liveOrders, activeTab]);

  // Open inspection drawer
  const handleInspectOrder = async (order: AdminOrderRow) => {
    setSelectedOrder(order);
    setActionError(null);
    setActionSuccess(null);
    setShowRejectInput(false);
    setRejectionReason('');
    setCourierName(order.courierPartner || '');
    setTrackingNum(order.trackingNumber || '');

    // Fetch signed URL if proof is attached
    if (order.activePayment?.proofSecurePath) {
      setIsLoadingProof(true);
      try {
        const res = await getSignedProofUrlAction(order.activePayment.proofSecurePath);
        if (res.success && res.url) {
          setProofPreviewUrl(res.url);
        } else {
          setProofPreviewUrl(null);
        }
      } catch {
        setProofPreviewUrl(null);
      } finally {
        setIsLoadingProof(false);
      }
    } else {
      setProofPreviewUrl(null);
    }
  };

  // 1. Verify Payment Action
  const handleVerifyPayment = async () => {
    if (!selectedOrder || !selectedOrder.activePayment || isVerifyingPayment) return;

    setActionError(null);
    setActionSuccess(null);
    setIsVerifyingPayment(true);

    const activeOrder = selectedOrder;
    const activePayment = selectedOrder.activePayment;
    const expectedAmount = activePayment.amountExpected ?? activeOrder.total;

    try {
      const res = await verifyPaymentAction({
        paymentId: activePayment.id,
        orderId: activeOrder.id,
        confirmedAmountReceived: expectedAmount,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to verify payment with database.');
      } else {
        const msg = res.alreadyVerified
          ? 'Payment has already been verified and confirmed in the database.'
          : 'Payment verified successfully! Order is now Confirmed and ready for fulfillment.';
        setActionSuccess(msg);

        // Immediate state update
        setLiveOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === activeOrder.id) {
              return {
                ...ord,
                status: 'Confirmed',
                displayStatus: 'Processing',
                paymentStatus: 'fully_paid',
                activePayment: ord.activePayment
                  ? {
                    ...ord.activePayment,
                    status: 'verified',
                    amountCredited: expectedAmount,
                  }
                  : null,
              };
            }
            return ord;
          })
        );

        setSelectedOrder((prev) =>
          prev && prev.id === activeOrder.id
            ? {
              ...prev,
              status: 'Confirmed',
              displayStatus: 'Processing',
              paymentStatus: 'fully_paid',
              activePayment: prev.activePayment
                ? {
                  ...prev.activePayment,
                  status: 'verified',
                  amountCredited: expectedAmount,
                }
                : null,
            }
            : prev
        );

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err: unknown) {
      console.error('handleVerifyPayment error:', err);
      setActionError(err instanceof Error ? err.message : 'Network error verifying payment.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // 2. Reject Payment Action
  const handleRejectPayment = async () => {
    if (!selectedOrder || !selectedOrder.activePayment || isRejectingPayment) return;
    if (!rejectionReason.trim()) {
      setActionError('Please specify a rejection reason for the customer.');
      return;
    }

    const activeOrder = selectedOrder;
    const activePayment = selectedOrder.activePayment;

    setActionError(null);
    setActionSuccess(null);
    setIsRejectingPayment(true);

    try {
      const res = await rejectPaymentAction({
        paymentId: activePayment.id,
        orderId: activeOrder.id,
        rejectionReason: rejectionReason.trim(),
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to reject payment.');
      } else {
        setActionSuccess('Payment rejected. Customer will be notified to resubmit proof.');
        setShowRejectInput(false);
        setRejectionReason('');

        setLiveOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === activeOrder.id) {
              return {
                ...ord,
                status: 'Payment Action Required',
                displayStatus: 'Pending',
                paymentStatus: 'rejected',
                activePayment: ord.activePayment
                  ? {
                    ...ord.activePayment,
                    status: 'rejected',
                  }
                  : null,
              };
            }
            return ord;
          })
        );

        setSelectedOrder((prev) =>
          prev && prev.id === activeOrder.id
            ? {
              ...prev,
              status: 'Payment Action Required',
              displayStatus: 'Pending',
              paymentStatus: 'rejected',
              activePayment: prev.activePayment
                ? {
                  ...prev.activePayment,
                  status: 'rejected',
                }
                : null,
            }
            : prev
        );

        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err: unknown) {
      console.error('handleRejectPayment error:', err);
      setActionError(err instanceof Error ? err.message : 'Network error rejecting payment.');
    } finally {
      setIsRejectingPayment(false);
    }
  };

  // 3. Update Fulfillment Transition Action
  const handleUpdateFulfillment = (newStatus: 'Confirmed' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled') => {
    if (!selectedOrder) return;
    setActionError(null);
    setActionSuccess(null);

    const activeOrder = selectedOrder;

    startTransition(async () => {
      const res = await updateFulfillmentStatusAction({
        orderId: activeOrder.id,
        newStatus,
        courierPartner: courierName.trim() || undefined,
        trackingNumber: trackingNum.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to update order fulfillment status.');
      } else {
        setActionSuccess(`Order status transitioned to ${newStatus}.`);

        let displayStatus: AdminOrderRow['displayStatus'] = 'Processing';
        if (newStatus === 'Dispatched' || newStatus === 'Delivered') displayStatus = 'Shipped';
        if (newStatus === 'Cancelled') displayStatus = 'Cancelled';

        setLiveOrders((prev) =>
          prev.map((ord) => {
            if (ord.id === activeOrder.id) {
              return {
                ...ord,
                status: newStatus,
                displayStatus,
                courierPartner: courierName.trim() || ord.courierPartner,
                trackingNumber: trackingNum.trim() || ord.trackingNumber,
              };
            }
            return ord;
          })
        );

        setSelectedOrder((prev) =>
          prev && prev.id === activeOrder.id
            ? {
              ...prev,
              status: newStatus,
              displayStatus,
              courierPartner: courierName.trim() || prev.courierPartner,
              trackingNumber: trackingNum.trim() || prev.trackingNumber,
            }
            : prev
        );

        router.refresh();
      }
    });
  };

  // 4. Delete Order Action
  const handleDeleteOrder = (order: AdminOrderRow) => {
    setIsDeleting(true);
    setActionError(null);
    startTransition(async () => {
      const res = await deleteOrderAction({ orderId: order.id });
      if (!res.success) {
        setActionError(res.error || 'Failed to delete order.');
        setIsDeleting(false);
        setOrderToDelete(null);
      } else {
        setActionSuccess(`Order #${order.orderNumber} deleted successfully.`);
        setLiveOrders((prev) => prev.filter((o) => o.id !== order.id));
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
        setOrderToDelete(null);
        setIsDeleting(false);
        router.refresh();
      }
    });
  };

  // Status badge style helper
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badgeColor = 'bg-[#2563EB] text-white';

    if (s.includes('ship') || s.includes('dispatch') || s === 'shipped') {
      badgeColor = 'bg-[#10B981] text-white';
    } else if (s.includes('deliver') || s === 'delivered') {
      badgeColor = 'bg-emerald-700 text-white';
    } else if (s.includes('pending') || s.includes('awaiting') || s.includes('action')) {
      badgeColor = 'bg-[#F59E0B] text-white';
    } else if (s.includes('cancel')) {
      badgeColor = 'bg-[#E11D48] text-white';
    } else if (s.includes('confirm') || s.includes('process')) {
      badgeColor = 'bg-[#2563EB] text-white';
    }

    return (
      <span className={`inline-block text-center px-3.5 py-1 text-xs font-semibold rounded-full shadow-xs ${badgeColor}`}>
        {status}
      </span>
    );
  };

  // Payment status badge style helper
  const renderPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'verified':
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'advance_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Advance Paid</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'awaiting_submission':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Awaiting Proof</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Verification</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Online Orders
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {activePagination.totalCount} {activePagination.totalCount === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and verify customer online orders and manual UPI payments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => alert('Exporting orders CSV/Excel report...')}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      {/* Global Toast Feedback */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Filter Navigation Tabs & Search Controls */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {(['All', 'Processing', 'Shipped', 'Pending', 'Cancelled'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  const params = new URLSearchParams();
                  params.set('page', '1');
                  if (activeTab !== 'All') params.set('status', activeTab);
                  startTransition(() => {
                    router.push(`/admin/orders/online?${params.toString()}`);
                  });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-2.5 px-3 font-semibold text-slate-500">Order ID</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Customer</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Items</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500 text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Total</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Date</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      No live online orders found
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Actual customer orders placed through storefront checkout will appear here for manual UPI payment verification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleInspectOrder(order)}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                    </td>

                    {/* Items Count */}
                    <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {order.itemsCountText}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(order.status)}
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                      {order.currencySymbol}
                      {order.total.toFixed(2)}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {order.date}
                    </td>

                    {/* Actions Icons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        {/* Eye / View details icon */}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          prefetch={true}
                          title="Open full order details and fulfillment page"
                          className="p-1 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors text-slate-400"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Quick Inspect Drawer */}
                        <button
                          type="button"
                          onClick={() => handleInspectOrder(order)}
                          title="Quick Actions"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Order Action */}
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          title="Delete order"
                          className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {activePagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-semibold text-slate-900">{activePagination.page}</span> of{' '}
              <span className="font-semibold text-slate-900">{activePagination.totalPages}</span> ({activePagination.totalCount} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(activePagination.page - 1)}
                disabled={activePagination.page <= 1 || isPendingAction}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(activePagination.page + 1)}
                disabled={activePagination.page >= activePagination.totalPages || isPendingAction}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-100 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Online Order Details
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Live
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{selectedOrder.orderNumber}</span>
                  {renderStatusBadge(selectedOrder.status)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${selectedOrder.id}`}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open full page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Drawer Inline Action Feedback */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                  <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                  <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Customer Information */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Customer Information</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                  <p className="text-slate-600">{selectedOrder.customerEmail}</p>
                  <p className="text-slate-600">{selectedOrder.customerPhone}</p>
                  {selectedOrder.shippingAddress && (
                    <div className="pt-2 mt-2 border-t border-slate-200/70 text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Financials */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{selectedOrder.itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Shipping & Delivery Fee</span>
                  <span className="font-semibold text-slate-700">₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-[#2563EB]">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Manual Payment Verification Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Payment Verification</span>
                  </div>
                  <div>{renderPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>

                {selectedOrder.activePayment ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">UTR / Reference No:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedOrder.activePayment.utrReference || 'Not Submitted'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Expected Amount:</span>
                        <span className="font-semibold text-slate-800">
                          ₹{selectedOrder.activePayment.amountExpected.toFixed(2)}
                        </span>
                      </div>
                      {selectedOrder.activePayment.amountCredited !== null && (
                        <div className="flex items-center justify-between text-emerald-700">
                          <span>Confirmed Received:</span>
                          <span className="font-bold">
                            ₹{selectedOrder.activePayment.amountCredited.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Screenshot preview */}
                    {selectedOrder.activePayment.proofSecurePath && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
                        <span className="text-slate-500 block">Payment Screenshot Proof:</span>
                        {isLoadingProof ? (
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading proof...
                          </div>
                        ) : proofPreviewUrl ? (
                          <div className="space-y-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proofPreviewUrl}
                              alt="Payment proof screenshot"
                              className="max-h-48 w-full object-contain rounded-lg border border-slate-200 bg-slate-900"
                            />
                            <a
                              href={proofPreviewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <span>Open full size</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="p-2 text-slate-400 text-center text-xs">
                            Screenshot attached: {selectedOrder.activePayment.proofSecurePath}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions if payment is pending */}
                    {selectedOrder.activePayment.status === 'verified' ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Payment has already been verified and credited.</span>
                      </div>
                    ) : selectedOrder.activePayment.status === 'rejected' ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Payment Rejected (Awaiting Customer Resubmission)</span>
                        </div>
                      </div>
                    ) : (!selectedOrder.activePayment?.utrReference?.trim() || !selectedOrder.activePayment?.proofSecurePath?.trim()) ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2 font-medium">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Awaiting Complete Payment Submission (Both UTR &amp; proof screenshot required)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {!showRejectInput ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={handleVerifyPayment}
                              disabled={isVerifyingPayment || isRejectingPayment}
                              className="flex-1 min-h-[44px] sm:min-h-[38px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            >
                              {isVerifyingPayment ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Verify ₹{(selectedOrder.activePayment?.amountExpected ?? selectedOrder.total).toFixed(2)} Payment</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(true)}
                              disabled={isVerifyingPayment || isRejectingPayment}
                              className="min-h-[44px] sm:min-h-[38px] py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2">
                            <label className="text-[11px] font-semibold text-slate-600 block">
                              Reason for Rejection *
                            </label>
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="e.g. UTR mismatch, blur screenshot"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowRejectInput(false)}
                                className="min-h-[40px] px-3 py-1 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleRejectPayment}
                                disabled={isRejectingPayment || !rejectionReason.trim()}
                                className="min-h-[40px] px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                              >
                                {isRejectingPayment && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>{isRejectingPayment ? 'Rejecting...' : 'Confirm Rejection'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No payment attempt recorded yet.</p>
                )}
              </div>

              {/* Fulfillment Status Controls */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Fulfillment & Dispatch</span>
                </div>

                {['Pending Verification', 'Awaiting Payment', 'Payment Action Required'].includes(selectedOrder.status) ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-semibold text-amber-800">
                    Fulfillment Locked: Payment must be verified before processing or dispatching.
                  </div>
                ) : selectedOrder.status === 'Confirmed' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Payment is confirmed. Start preparing the parcel for packaging and dispatch.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleUpdateFulfillment('Processing')}
                      disabled={isPendingAction}
                      className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isPendingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      <span>Start Processing Order</span>
                    </button>
                  </div>
                ) : selectedOrder.status === 'Processing' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Order is in processing. Enter courier partner and tracking/AWB number to dispatch.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-500 block mb-1">Courier Partner *</label>
                        <input
                          type="text"
                          value={courierName}
                          onChange={(e) => setCourierName(e.target.value)}
                          placeholder="e.g. Delhivery, Bluedart"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Tracking Number *</label>
                        <input
                          type="text"
                          value={trackingNum}
                          onChange={(e) => setTrackingNum(e.target.value)}
                          placeholder="AWB / Tracking #"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateFulfillment('Dispatched')}
                      disabled={isPendingAction || !courierName.trim() || !trackingNum.trim()}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isPendingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      <span>Confirm Dispatch & Save Tracking</span>
                    </button>
                  </div>
                ) : selectedOrder.status === 'Dispatched' ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="text-slate-500">Shipped with:</div>
                      <div className="font-semibold text-slate-800">{selectedOrder.courierPartner || 'Courier'}</div>
                      <div className="font-mono text-slate-500 text-[11px]">#{selectedOrder.trackingNumber}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateFulfillment('Delivered')}
                      disabled={isPendingAction}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isPendingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Mark Order as Delivered</span>
                    </button>
                  </div>
                ) : selectedOrder.status === 'Delivered' ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Order Successfully Delivered & Settled</span>
                  </div>
                ) : selectedOrder.status === 'Cancelled' ? (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-800 flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Order Cancelled</span>
                  </div>
                ) : null}
              </div>

              {/* Danger Zone: Delete Order */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(selectedOrder)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200/80 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Order Confirmation */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Order Permanently</h3>
                  <p className="text-[11px] text-slate-500">Order #{orderToDelete.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>Order #{orderToDelete.orderNumber}</strong>?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This action cannot be undone. The order, items, and payment attempts will be permanently erased from the database.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(orderToDelete)}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
