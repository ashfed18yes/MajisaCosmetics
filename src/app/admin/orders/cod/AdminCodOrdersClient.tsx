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
  Truck,
  AlertCircle,
  ExternalLink,
  X,
  User,
  MapPin,
  CreditCard,
  Banknote,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  verifyPaymentAction,
  rejectPaymentAction,
  confirmCodCollectionAction,
  updateFulfillmentStatusAction,
  getSignedProofUrlAction,
} from '../actions';
import { AdminOrderRow } from '../online/AdminOnlineOrdersClient';

// Sample COD preview records matching Image 2 style
const REFERENCE_COD_SAMPLES: (AdminOrderRow & { balanceDue: number; advancePaid: number })[] = [
  {
    id: 'cod-sample-001',
    orderNumber: '#COD-101',
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav.s@example.com',
    customerPhone: '+91 98111 22334',
    itemsCountText: '2 items',
    status: 'Processing',
    displayStatus: 'Processing',
    total: 1250.0,
    currencySymbol: '₹',
    date: '2024-01-15',
    orderType: 'cod',
    paymentStatus: 'advance_paid',
    itemsSubtotal: 1150.0,
    deliveryFee: 100.0,
    advancePaid: 100.0,
    balanceDue: 1150.0,
    shippingAddress: {
      recipientName: 'Aarav Sharma',
      phone: '+91 98111 22334',
      addressLine1: 'Flat 302, Sunrise Towers, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400053',
    },
    activePayment: {
      id: 'pay-cod-001',
      utrReference: '401598211099',
      proofAssetId: 'proof_cod_1',
      proofSecurePath: 'majisa-cosmetics/payment-proofs/sample/cod1',
      status: 'verified',
      amountExpected: 100.0,
      amountCredited: 100.0,
      createdAt: '2024-01-15T11:00:00Z',
    },
    isSampleData: true,
  },
  {
    id: 'cod-sample-002',
    orderNumber: '#COD-102',
    customerName: 'Pooja Patel',
    customerEmail: 'pooja.p@example.com',
    customerPhone: '+91 99000 11223',
    itemsCountText: '3 items',
    status: 'Pending',
    displayStatus: 'Pending',
    total: 2400.0,
    currencySymbol: '₹',
    date: '2024-01-15',
    orderType: 'cod',
    paymentStatus: 'pending',
    itemsSubtotal: 2300.0,
    deliveryFee: 100.0,
    advancePaid: 0.0,
    balanceDue: 2300.0,
    shippingAddress: {
      recipientName: 'Pooja Patel',
      phone: '+91 99000 11223',
      addressLine1: 'B-14 Gokul Dham, Satellite',
      city: 'Ahmedabad',
      state: 'Gujarat',
      postalCode: '380015',
    },
    activePayment: {
      id: 'pay-cod-002',
      utrReference: '401589123400',
      proofAssetId: 'proof_cod_2',
      proofSecurePath: 'majisa-cosmetics/payment-proofs/sample/cod2',
      status: 'pending',
      amountExpected: 100.0,
      amountCredited: null,
      createdAt: '2024-01-15T14:15:00Z',
    },
    isSampleData: true,
  },
  {
    id: 'cod-sample-003',
    orderNumber: '#COD-103',
    customerName: 'Rohan Mehra',
    customerEmail: 'rohan.m@example.com',
    customerPhone: '+91 98777 66554',
    itemsCountText: '1 items',
    status: 'Shipped',
    displayStatus: 'Shipped',
    total: 850.0,
    currencySymbol: '₹',
    date: '2024-01-14',
    orderType: 'cod',
    paymentStatus: 'advance_paid',
    itemsSubtotal: 750.0,
    deliveryFee: 100.0,
    advancePaid: 100.0,
    balanceDue: 750.0,
    shippingAddress: {
      recipientName: 'Rohan Mehra',
      phone: '+91 98777 66554',
      addressLine1: 'Villa 12, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560066',
    },
    courierPartner: 'Delhivery',
    trackingNumber: 'DEL-99238411',
    isSampleData: true,
  },
];

interface AdminCodOrdersClientProps {
  initialLiveOrders: (AdminOrderRow & { balanceDue: number; advancePaid: number })[];
}

export default function AdminCodOrdersClient({
  initialLiveOrders = [],
}: AdminCodOrdersClientProps) {
  const router = useRouter();
  // Always default to real live database COD orders
  const [dataMode, setDataMode] = useState<'live' | 'sample'>('live');
  const [activeTab, setActiveTab] = useState<'All' | 'Processing' | 'Shipped' | 'Pending' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<(AdminOrderRow & { balanceDue: number; advancePaid: number }) | null>(null);
  const [isPendingAction, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  const currentOrders = useMemo(() => {
    return dataMode === 'live' ? initialLiveOrders : REFERENCE_COD_SAMPLES;
  }, [dataMode, initialLiveOrders]);

  const filteredOrders = useMemo(() => {
    return currentOrders.filter((order) => {
      if (activeTab !== 'All' && order.displayStatus !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
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
  }, [currentOrders, activeTab, searchQuery]);

  const handleInspectOrder = async (order: AdminOrderRow & { balanceDue: number; advancePaid: number }) => {
    setSelectedOrder(order);
    setActionError(null);
    setActionSuccess(null);
    setShowRejectInput(false);
    setRejectionReason('');
    setCourierName(order.courierPartner || '');
    setTrackingNum(order.trackingNumber || '');
    setProofPreviewUrl(null);

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

  // Verify ₹100 COD Advance
  const handleVerifyAdvance = () => {
    if (!selectedOrder) return;
    if (selectedOrder.isSampleData) {
      setActionSuccess('Demo Mode: ₹100 COD advance verified successfully.');
      return;
    }

    if (!selectedOrder.activePayment?.id) {
      setActionError('No active advance payment attempt found.');
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await verifyPaymentAction({
        paymentId: selectedOrder.activePayment!.id,
        confirmedAmountReceived: 100, // Fixed ₹100 advance
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to verify COD advance.');
      } else {
        setActionSuccess('₹100 COD Advance verified! Order confirmed for processing.');
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'Confirmed',
                displayStatus: 'Processing',
                paymentStatus: 'advance_paid',
                advancePaid: 100,
                activePayment: prev.activePayment
                  ? { ...prev.activePayment, verificationStatus: 'verified' }
                  : null,
              }
            : null
        );
        router.refresh();
      }
    });
  };

  // Confirm Final Balance Collected at Doorstep
  const handleConfirmBalanceCollected = () => {
    if (!selectedOrder) return;
    if (selectedOrder.isSampleData) {
      setActionSuccess(`Demo Mode: Doorstep balance collection of ₹${selectedOrder.balanceDue} confirmed.`);
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await confirmCodCollectionAction({
        orderId: selectedOrder.id,
        confirmedCollectedAmount: selectedOrder.balanceDue,
        adminNotes: 'Doorstep cash collected by delivery agent.',
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to record balance collection.');
      } else {
        setActionSuccess('Final COD balance collected successfully! Order marked Fully Paid.');
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'fully_paid',
                balanceDue: 0,
              }
            : null
        );
        router.refresh();
      }
    });
  };

  // Reject Payment
  const handleRejectAdvance = () => {
    if (!selectedOrder) return;
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejecting the advance.');
      return;
    }

    if (selectedOrder.isSampleData) {
      setActionSuccess('Demo Mode: COD advance payment rejected.');
      setShowRejectInput(false);
      return;
    }

    if (!selectedOrder.activePayment?.id) {
      setActionError('No active advance payment attempt found to reject.');
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
        setActionSuccess('Advance payment rejected.');
        setShowRejectInput(false);
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'pending',
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

  // Update status
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
        setActionSuccess(`Status updated to ${newStatus}.`);
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
      {/* Page Header: Title, Subtitle, and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            COD Orders Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track ₹100 delivery advance verifications and doorstep cash collections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
              Live COD Orders ({initialLiveOrders.length})
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

          <button
            type="button"
            onClick={() => alert('Exporting COD report...')}
            className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export COD</span>
          </button>
        </div>
      </div>

      {/* Prominent Banner when viewing Sample Preview */}
      {dataMode === 'sample' && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Design Reference Mode:</strong> Viewing static COD reference samples for visual comparison only. These are not real orders.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDataMode('live')}
            className="font-semibold underline hover:text-amber-900 text-xs"
          >
            Switch to Live COD Orders ({initialLiveOrders.length})
          </button>
        </div>
      )}

      {/* Main White Card Container */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search COD orders..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Processing', 'Shipped', 'Pending', 'Cancelled'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
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

        {/* Structured Table */}
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2.5 px-2 font-semibold text-slate-500">Order ID</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Customer</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Items</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500 text-center">Status</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Advance (₹100)</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Balance Due</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">Date</th>
                <th className="py-2.5 px-2 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      {dataMode === 'live' ? 'No live COD orders found' : 'No sample orders match the filter'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {dataMode === 'live'
                        ? 'Customer COD orders requiring upfront ₹100 delivery advance verification will appear here automatically.'
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
                    <td className="py-2.5 px-2 text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                      {order.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {order.itemsCountText}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(order.displayStatus)}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-semibold whitespace-nowrap">
                      <span className={order.advancePaid > 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        {order.advancePaid > 0 ? '₹100 Paid' : '₹100 Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                      ₹{order.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {order.date}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        {/* Eye / View details icon */}
                        <Link
                          href={order.isSampleData ? '#' : `/admin/orders/${order.id}`}
                          onClick={(e) => {
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
                        <button
                          type="button"
                          onClick={() => handleInspectOrder(order)}
                          title="Quick Actions"
                          className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
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
      </div>

      {/* Slide-over Inspection Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-50 overflow-y-auto animate-in slide-in-from-right duration-200">
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

            <div className="p-6 space-y-6 flex-1">
              {/* Customer summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-slate-500">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Customer & Delivery Details</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm">{selectedOrder.customerName}</p>
                <p className="text-slate-600">Phone: {selectedOrder.customerPhone}</p>
                {selectedOrder.shippingAddress && (
                  <p className="text-slate-600">
                    Address: {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}
                  </p>
                )}
              </div>

              {/* Advance verification */}
              <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>COD Advance (₹100 Fixed)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {selectedOrder.advancePaid > 0 ? 'Verified & Paid' : 'Pending Verification'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">UTR / Ref:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrder.activePayment?.utrReference || 'Not yet submitted'}
                    </span>
                  </div>
                </div>

                {selectedOrder.advancePaid === 0 && (
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyAdvance}
                      disabled={isPendingAction}
                      className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
                    >
                      {isPendingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Verify ₹100 Advance & Confirm</span>
                    </button>
                    {!showRejectInput ? (
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        className="w-full text-rose-600 hover:bg-rose-50 border border-rose-200 font-medium text-xs py-1.5 rounded-xl transition-colors"
                      >
                        Reject Advance Payment
                      </button>
                    ) : (
                      <div className="space-y-2 pt-2 border-t border-rose-100">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleRejectAdvance}
                            className="flex-1 bg-rose-600 text-white text-xs py-1.5 rounded-lg"
                          >
                            Confirm Rejection
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectInput(false)}
                            className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Doorstep balance collection */}
              <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Doorstep Cash Due</span>
                  </div>
                  <span className="text-sm font-bold text-amber-900">
                    ₹{selectedOrder.balanceDue.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Collect this balance amount in cash at the time of physical delivery to the customer.
                </p>

                {selectedOrder.balanceDue > 0 ? (
                  <button
                    type="button"
                    onClick={handleConfirmBalanceCollected}
                    disabled={isPendingAction}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Doorstep Cash Collected (₹{selectedOrder.balanceDue.toFixed(2)})</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800">
                    Balance Fully Collected & Settled
                  </div>
                )}
              </div>

              {/* Fulfillment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Fulfillment & Dispatch</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Delhivery"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNum}
                      onChange={(e) => setTrackingNum(e.target.value)}
                      placeholder="e.g. DEL-99238"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateFulfillment('Processing')}
                    className="px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-[11px] font-semibold"
                  >
                    Processing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateFulfillment('Dispatched')}
                    className="px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[11px] font-semibold"
                  >
                    Mark Shipped
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateFulfillment('Delivered')}
                    className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-semibold"
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
