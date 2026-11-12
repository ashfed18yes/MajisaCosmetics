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
} from 'lucide-react';
import {
  verifyPaymentAction,
  rejectPaymentAction,
  updateFulfillmentStatusAction,
  getSignedProofUrlAction,
} from '../actions';

// Order interface accommodating both live Supabase orders and reference sample items
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

// Exact reference samples from Image 2
const REFERENCE_SAMPLE_ORDERS: AdminOrderRow[] = [
  {
    id: 'sample-001',
    orderNumber: '#ORD-001',
    customerName: 'Emma Thompson',
    customerEmail: 'emma.t@example.com',
    customerPhone: '+91 98765 43210',
    itemsCountText: '3 items',
    status: 'Processing',
    displayStatus: 'Processing',
    total: 156.0,
    currencySymbol: '$',
    date: '2024-01-15',
    orderType: 'online',
    paymentStatus: 'verified',
    itemsSubtotal: 136.0,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'Emma Thompson',
      phone: '+91 98765 43210',
      addressLine1: '42 Orchid Boulevard, Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
    },
    activePayment: {
      id: 'pay-001',
      utrReference: '401598234190',
      proofAssetId: 'proof_sample_1',
      proofSecurePath: 'majisa-cosmetics/payment-proofs/sample/1',
      status: 'verified',
      amountExpected: 156.0,
      amountCredited: 156.0,
      createdAt: '2024-01-15T10:30:00Z',
    },
    isSampleData: true,
  },
  {
    id: 'sample-002',
    orderNumber: '#ORD-002',
    customerName: 'James Rodriguez',
    customerEmail: 'james.r@example.com',
    customerPhone: '+91 91234 56789',
    itemsCountText: '1 items',
    status: 'Shipped',
    displayStatus: 'Shipped',
    total: 89.5,
    currencySymbol: '$',
    date: '2024-01-15',
    orderType: 'online',
    paymentStatus: 'verified',
    itemsSubtotal: 69.5,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'James Rodriguez',
      phone: '+91 91234 56789',
      addressLine1: '18 Lotus Tower, Sector 15',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    },
    courierPartner: 'Delhivery',
    trackingNumber: 'DEL-894210984',
    isSampleData: true,
  },
  {
    id: 'sample-003',
    orderNumber: '#ORD-003',
    customerName: 'Sofia Chen',
    customerEmail: 'sofia.c@example.com',
    customerPhone: '+91 99887 76655',
    itemsCountText: '5 items',
    status: 'Pending',
    displayStatus: 'Pending',
    total: 342.0,
    currencySymbol: '$',
    date: '2024-01-14',
    orderType: 'online',
    paymentStatus: 'pending',
    itemsSubtotal: 322.0,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'Sofia Chen',
      phone: '+91 99887 76655',
      addressLine1: '74 Park View Apartments',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
    },
    activePayment: {
      id: 'pay-003',
      utrReference: '401490283411',
      proofAssetId: 'proof_sample_3',
      proofSecurePath: 'majisa-cosmetics/payment-proofs/sample/3',
      status: 'pending',
      amountExpected: 342.0,
      amountCredited: null,
      createdAt: '2024-01-14T15:20:00Z',
    },
    isSampleData: true,
  },
  {
    id: 'sample-004',
    orderNumber: '#ORD-004',
    customerName: 'Michael Brown',
    customerEmail: 'm.brown@example.com',
    customerPhone: '+91 94567 12345',
    itemsCountText: '2 items',
    status: 'Shipped',
    displayStatus: 'Shipped',
    total: 124.99,
    currencySymbol: '$',
    date: '2024-01-14',
    orderType: 'online',
    paymentStatus: 'verified',
    itemsSubtotal: 104.99,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'Michael Brown',
      phone: '+91 94567 12345',
      addressLine1: '12 Emerald Enclave',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
    },
    courierPartner: 'Blue Dart',
    trackingNumber: 'BLU-33291048',
    isSampleData: true,
  },
  {
    id: 'sample-005',
    orderNumber: '#ORD-005',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa.a@example.com',
    customerPhone: '+91 98220 11223',
    itemsCountText: '1 items',
    status: 'Cancelled',
    displayStatus: 'Cancelled',
    total: 75.0,
    currencySymbol: '$',
    date: '2024-01-13',
    orderType: 'online',
    paymentStatus: 'rejected',
    itemsSubtotal: 55.0,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'Lisa Anderson',
      phone: '+91 98220 11223',
      addressLine1: '9 Rose Gardens, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302006',
    },
    isSampleData: true,
  },
  {
    id: 'sample-006',
    orderNumber: '#ORD-006',
    customerName: 'David Wilson',
    customerEmail: 'david.w@example.com',
    customerPhone: '+91 97112 33445',
    itemsCountText: '4 items',
    status: 'Processing',
    displayStatus: 'Processing',
    total: 298.5,
    currencySymbol: '$',
    date: '2024-01-13',
    orderType: 'online',
    paymentStatus: 'verified',
    itemsSubtotal: 278.5,
    deliveryFee: 20.0,
    shippingAddress: {
      recipientName: 'David Wilson',
      phone: '+91 97112 33445',
      addressLine1: '55 Lake Promenade',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
    },
    activePayment: {
      id: 'pay-006',
      utrReference: '401319082341',
      proofAssetId: 'proof_sample_6',
      proofSecurePath: 'majisa-cosmetics/payment-proofs/sample/6',
      status: 'verified',
      amountExpected: 298.5,
      amountCredited: 298.5,
      createdAt: '2024-01-13T12:00:00Z',
    },
    isSampleData: true,
  },
];

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
  // Always default to real live database orders
  const [dataMode, setDataMode] = useState<'live' | 'sample'>('live');
  const [liveOrders, setLiveOrders] = useState<AdminOrderRow[]>(initialLiveOrders);
  const [samplePage, setSamplePage] = useState(1);
  const [activeTab, setActiveTab] = useState<'All' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled'>(
    (pagination?.statusFilter as any) || 'All'
  );
  const [searchQuery, setSearchQuery] = useState(pagination?.searchQuery || '');

  // Keep live orders state synchronized with fresh server props
  React.useEffect(() => {
    setLiveOrders(initialLiveOrders);
  }, [initialLiveOrders]);

  // Selected order for inspection & manual payment verification slide-over
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [isPendingAction, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  // Active dataset based on mode
  const currentOrders = useMemo(() => {
    if (dataMode === 'live') {
      return liveOrders;
    }
    const samplePageSize = 25;
    const start = (samplePage - 1) * samplePageSize;
    return REFERENCE_SAMPLE_ORDERS.slice(start, start + samplePageSize);
  }, [dataMode, liveOrders, samplePage]);

  // Active pagination metadata
  const activePagination = useMemo(() => {
    if (dataMode === 'live' && pagination) {
      return pagination;
    }
    return {
      page: samplePage,
      pageSize: 25,
      totalCount: REFERENCE_SAMPLE_ORDERS.length,
      totalPages: Math.max(1, Math.ceil(REFERENCE_SAMPLE_ORDERS.length / 25)),
    };
  }, [dataMode, pagination, samplePage]);

  const handlePageChange = (newPage: number) => {
    if (dataMode === 'live') {
      const params = new URLSearchParams();
      params.set('page', String(newPage));
      if (activeTab !== 'All') params.set('status', activeTab);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      startTransition(() => {
        router.push(`/admin/orders/online?${params.toString()}`);
      });
    } else {
      setSamplePage(newPage);
    }
  };

  const handleTabChange = (tab: 'All' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled') => {
    setActiveTab(tab);
    if (dataMode === 'live') {
      const params = new URLSearchParams();
      params.set('page', '1');
      if (tab !== 'All') params.set('status', tab);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      startTransition(() => {
        router.push(`/admin/orders/online?${params.toString()}`);
      });
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (dataMode === 'live') {
      const params = new URLSearchParams();
      params.set('page', '1');
      if (activeTab !== 'All') params.set('status', activeTab);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      startTransition(() => {
        router.push(`/admin/orders/online?${params.toString()}`);
      });
    }
  };

  // Filter orders by search query and active tab for instant client feedback
  const filteredOrders = useMemo(() => {
    return currentOrders.filter((order) => {
      // Tab filter (if not already handled server-side)
      if (activeTab !== 'All' && order.displayStatus !== activeTab) {
        return false;
      }
      // Instant client-side search filter
      if (searchQuery.trim() && dataMode === 'sample') {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.orderNumber.toLowerCase().includes(query);
        const matchesCustomer = order.customerName.toLowerCase().includes(query);
        const matchesDate = order.date.toLowerCase().includes(query);
        if (!matchesId && !matchesCustomer && !matchesDate) {
          return false;
        }
      }
      return true;
    });
  }, [currentOrders, activeTab, searchQuery, dataMode]);

  // Open inspection drawer
  const handleInspectOrder = async (order: AdminOrderRow) => {
    setSelectedOrder(order);
    setActionError(null);
    setActionSuccess(null);
    setShowRejectInput(false);
    setRejectionReason('');
    setCourierName(order.courierPartner || '');
    setTrackingNum(order.trackingNumber || '');
    setProofPreviewUrl(null);

    // If order has a proof secure path, load short-lived signed delivery URL
    if (order.activePayment?.proofSecurePath && !order.isSampleData) {
      setIsLoadingProof(true);
      try {
        const res = await getSignedProofUrlAction(order.activePayment.proofSecurePath);
        if (res.success && res.url) {
          setProofPreviewUrl(res.url);
        }
        
      } catch (err) {
        console.error('Failed to get signed proof URL:', err);
      } finally {
        setIsLoadingProof(false);
      }
    }
  };

  // Payment Verification Handler
  const handleVerifyPayment = () => {
    if (!selectedOrder) return;
    if (selectedOrder.isSampleData) {
      setActionSuccess('Demo Mode: Payment verified successfully for reference sample.');
      return;
    }

    if (!selectedOrder.activePayment?.id) {
      setActionError('No active payment attempt found to verify.');
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await verifyPaymentAction({
        paymentId: selectedOrder.activePayment!.id,
        confirmedAmountReceived: selectedOrder.total,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to verify payment.');
      } else {
        const isAlready = Boolean((res as any).alreadyVerified);
        setActionSuccess(
          isAlready
            ? 'Payment is already verified and credited in the database. Status synchronized.'
            : 'Payment verified successfully! Order is now Confirmed.'
        );
        // Update local status
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'Confirmed',
                displayStatus: 'Processing',
                paymentStatus: 'verified',
                activePayment: prev.activePayment
                  ? { ...prev.activePayment, status: 'verified' }
                  : null,
              }
            : null
        );
        // Update live orders list in memory immediately
        setLiveOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? {
                  ...o,
                  status: 'Confirmed',
                  displayStatus: 'Processing',
                  paymentStatus: 'verified',
                  activePayment: o.activePayment
                    ? { ...o.activePayment, status: 'verified' }
                    : null,
                }
              : o
          )
        );
        router.refresh();
      }
    });
  };

  // Payment Rejection Handler
  const handleRejectPayment = () => {
    if (!selectedOrder) return;
    if (!rejectionReason.trim()) {
      setActionError('Please provide a specific reason for rejection.');
      return;
    }

    if (selectedOrder.isSampleData) {
      setActionSuccess('Demo Mode: Payment rejected for reference sample.');
      setShowRejectInput(false);
      return;
    }

    if (!selectedOrder.activePayment?.id) {
      setActionError('No active payment attempt found to reject.');
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await rejectPaymentAction({
        paymentId: selectedOrder.activePayment!.id,
        rejectionReason: rejectionReason.trim(),
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to reject payment.');
      } else {
        setActionSuccess('Payment rejected. Customer will be notified to re-submit proof.');
        setShowRejectInput(false);
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'Payment Action Required',
                displayStatus: 'Pending',
                paymentStatus: 'rejected',
                activePayment: prev.activePayment
                  ? { ...prev.activePayment, verificationStatus: 'rejected' }
                  : null,
              }
            : null
        );
        router.refresh();
      }
    });
  };

  // Fulfillment status update
  const handleUpdateFulfillment = (newStatus: 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled') => {
    if (!selectedOrder) return;
    if (selectedOrder.isSampleData) {
      setActionSuccess(`Demo Mode: Status updated to ${newStatus}.`);
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await updateFulfillmentStatusAction({
        orderId: selectedOrder.id,
        newStatus,
        courierPartner: courierName.trim() || undefined,
        trackingNumber: trackingNum.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to update order status.');
      } else {
        setActionSuccess(`Order status successfully updated to ${newStatus}.`);
        const targetDisplay: 'Processing' | 'Shipped' | 'Pending' | 'Cancelled' =
          newStatus === 'Processing'
            ? 'Processing'
            : newStatus === 'Dispatched'
            ? 'Shipped'
            : newStatus === 'Delivered'
            ? 'Shipped'
            : 'Cancelled';

        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                displayStatus: targetDisplay,
              }
            : null
        );
        router.refresh();
      }
    });
  };

  // Helper to render exact solid badge pill matching Image 2
  const renderStatusBadge = (displayStatus: 'Processing' | 'Shipped' | 'Pending' | 'Cancelled') => {
    switch (displayStatus) {
      case 'Processing':
        return (
          <span className="inline-block text-center min-w-[76px] px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#2563EB] text-white shadow-xs">
            Processing
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-block text-center min-w-[76px] px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#10B981] text-white shadow-xs">
            Shipped
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-block text-center min-w-[76px] px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#F59E0B] text-white shadow-xs">
            Pending
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-block text-center min-w-[76px] px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#E11D48] text-white shadow-xs">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header: Title, Subtitle, and Export Button - Exact recreation of Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and manage all customer orders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Data Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setDataMode('live')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dataMode === 'live'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Live Orders ({initialLiveOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setDataMode('sample')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dataMode === 'sample'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Design Mockup Preview
            </button>
          </div>

          {/* Export Orders Action Button (Blue rounded button matching Image 2) */}
          <button
            type="button"
            onClick={() => alert('Exporting orders CSV/Excel report...')}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      {/* Prominent Banner when viewing Sample Preview */}
      {dataMode === 'sample' && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Design Reference Mode:</strong> Viewing static Image 2 reference samples for visual comparison only. These are not real orders.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDataMode('live')}
            className="font-semibold underline hover:text-amber-900 text-xs"
          >
            Switch to Live Orders ({initialLiveOrders.length})
          </button>
        </div>
      )}

      {/* Main White Card Container - Exact match to Image 2 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
        {/* Top Controls Row: Inner Search & Status Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
          {/* Inner Search Field ("Search orders...") */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Status Tabs: All, Processing, Shipped, Pending, Cancelled */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Processing', 'Shipped', 'Pending', 'Cancelled'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structured Table - Exact columns and styling from Image 2 */}
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2.5 px-2 font-semibold text-slate-500">Order ID</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Customer</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Items</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500 text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Total</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Date</th>
                <th className="py-2.5 px-2 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      {dataMode === 'live' ? 'No live online orders found' : 'No sample orders match the filter'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {dataMode === 'live'
                        ? 'Actual customer orders placed through storefront checkout will appear here for manual UPI payment verification.'
                        : 'Adjust the active filter tabs or search query to view sample orders.'}
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
                    <td className="py-2.5 px-2 text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3 text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                      {order.customerName}
                    </td>

                    {/* Items */}
                    <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {order.itemsCountText}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(order.displayStatus)}
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

                    {/* Actions Icons (Eye, Pencil, ...) */}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        {/* Eye / View details icon */}
                        <Link
                          href={order.isSampleData ? '#' : `/admin/orders/${order.id}`}
                          prefetch={!order.isSampleData}
                          onClick={(e: React.MouseEvent) => {
                            if (order.isSampleData) {
                              e.preventDefault();
                              handleInspectOrder(order);
                            }
                          }}
                          title="Open full order details and fulfillment page"
                          className="p-1 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors text-slate-400"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit icon */}
                        <button
                          type="button"
                          onClick={() => handleInspectOrder(order)}
                          title="Quick Actions"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>

                        {/* Three dots / more icon */}
                        <button
                          type="button"
                          onClick={() => handleInspectOrder(order)}
                          title="More options"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {activePagination && activePagination.totalCount > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{Math.min((activePagination.page - 1) * activePagination.pageSize + 1, activePagination.totalCount)}</span> to{' '}
              <span className="font-semibold text-slate-800">{Math.min(activePagination.page * activePagination.pageSize, activePagination.totalCount)}</span> of{' '}
              <span className="font-semibold text-slate-800">{activePagination.totalCount}</span> orders
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={activePagination.page <= 1 || isPendingAction}
                onClick={() => handlePageChange(activePagination.page - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors shadow-2xs"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {activePagination.page} of {Math.max(1, activePagination.totalPages)}
              </span>
              <button
                type="button"
                disabled={activePagination.page >= activePagination.totalPages || isPendingAction}
                onClick={() => handlePageChange(activePagination.page + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Order Inspection & Manual Payment Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay Backdrop */}
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedOrder.orderNumber}
                </h2>
                {renderStatusBadge(selectedOrder.displayStatus)}
              </div>
              <div className="flex items-center gap-2">
                {!selectedOrder.isSampleData && (
                  <Link
                    href={`/admin/orders/${selectedOrder.id}`}
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-semibold rounded-xl transition-colors"
                  >
                    <span>Full Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {actionSuccess && (
              <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Customer & Shipping Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Customer Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Name</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.customerEmail}</span>
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Shipping Address</span>
                    </div>
                    <p className="text-slate-700">
                      {selectedOrder.shippingAddress.addressLine1}
                      {selectedOrder.shippingAddress.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                      <br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Verification Section */}
              <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Payment Verification (UPI)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Expected: {selectedOrder.currencySymbol}{selectedOrder.total.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">UTR / Ref Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrder.activePayment?.utrReference || 'Not yet submitted'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>

                  {/* Payment Screenshot Proof */}
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">Screenshot Proof:</span>
                    {isLoadingProof ? (
                      <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Generating secure signed access URL...</span>
                      </div>
                    ) : proofPreviewUrl ? (
                      <div className="space-y-2">
                        <a
                          href={proofPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#2563EB] hover:bg-blue-100 rounded-lg font-medium text-xs transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>View Uploaded Proof Screenshot</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    ) : selectedOrder.activePayment?.proofAssetId ? (
                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                        Asset ID: <span className="font-mono text-slate-800">{selectedOrder.activePayment.proofAssetId}</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No proof screenshot attached</p>
                    )}
                  </div>
                </div>

                {/* Manual Verification Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {(selectedOrder.activePayment?.status === 'verified' || selectedOrder.paymentStatus === 'verified' || selectedOrder.paymentStatus === 'fully_paid') ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Payment Verified & Order Confirmed</span>
                      </div>
                      <Link
                        href={`/admin/orders/${selectedOrder.id}`}
                        prefetch={true}
                        className="text-[#2563EB] hover:underline font-bold"
                      >
                        Full Details &rarr;
                      </Link>
                    </div>
                  ) : selectedOrder.activePayment?.status === 'rejected' ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                      <div className="flex items-center gap-2 font-semibold">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Payment Rejected (Awaiting Customer Resubmission)</span>
                      </div>
                    </div>
                  ) : (!selectedOrder.activePayment?.utrReference?.trim() && !selectedOrder.activePayment?.proofSecurePath?.trim()) ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Awaiting Payment Submission (No UTR or proof attached)</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleVerifyPayment}
                        disabled={isPendingAction}
                        className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isPendingAction ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Verify Payment & Confirm Order</span>
                      </button>

                      {!showRejectInput ? (
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(true)}
                          disabled={isPendingAction}
                          className="w-full text-rose-600 hover:bg-rose-50 border border-rose-200 font-medium text-xs py-2 rounded-xl transition-colors"
                        >
                          Reject Payment
                        </button>
                      ) : (
                        <div className="space-y-2 pt-2 border-t border-rose-100 animate-in fade-in duration-150">
                          <label className="text-[11px] font-semibold text-rose-800 block">
                            Reason for rejection (e.g. UTR not found, invalid screenshot):
                          </label>
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason..."
                            className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleRejectPayment}
                              disabled={isPendingAction}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-1.5 rounded-lg transition-colors"
                            >
                              Confirm Rejection
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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
                      className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
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
                          placeholder="e.g. DEL-123456"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateFulfillment('Dispatched')}
                      disabled={isPendingAction}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      {isPendingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      <span>Dispatch & Mark Shipped</span>
                    </button>
                  </div>
                ) : selectedOrder.status === 'Dispatched' ? (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex justify-between items-center">
                      <span className="font-semibold">{selectedOrder.courierPartner || courierName || 'Courier Assigned'}</span>
                      <span className="font-mono text-slate-600">#{selectedOrder.trackingNumber || trackingNum}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateFulfillment('Delivered')}
                      disabled={isPendingAction}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
