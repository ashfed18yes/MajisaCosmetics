'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Banknote,
  SquarePen,
  FileText,
  Loader2,
  Package,
  Layers,
  ChevronRight,
  Eye,
  X,
  ImageIcon,
} from 'lucide-react';
import {
  verifyPaymentAction,
  rejectPaymentAction,
  confirmCodCollectionAction,
  updateFulfillmentStatusAction,
  getSignedProofUrlAction,
} from '../actions';

export interface OrderDetailsData {
  id: string;
  orderNumber: string;
  orderType: 'online' | 'cod';
  status: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  advanceAmountPaid: number;
  balanceAmountDue: number;
  codBalanceCollected: number;
  codCollectedAt: string | null;
  customerNotes: string | null;
  courierPartner: string | null;
  trackingNumber: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  shippingAddress: {
    recipientName: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    addressType?: string;
  };
  items: Array<{
    id: string;
    productId: string | null;
    variantId: string | null;
    productName: string;
    brandName: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    imageUrl: string;
  }>;
  payments: Array<{
    id: string;
    attemptNumber: number;
    paymentMethod: string;
    amountExpected: number;
    amountSubmitted: number;
    advanceAmount: number;
    balanceAmount: number;
    utrReference: string | null;
    proofPublicId: string | null;
    proofFileFormat: string | null;
    verificationStatus: 'awaiting_submission' | 'pending' | 'verified' | 'rejected';
    verifiedAt: string | null;
    rejectionReason: string | null;
    rejectedAt: string | null;
    adminNotes: string | null;
    createdAt: string;
  }>;
  codCollection: {
    id: string;
    collectionType: string;
    amountCollected: number;
    collectedAt: string;
    paymentMethod: string;
    transactionReference: string | null;
    adminNotes: string | null;
    createdAt: string;
    collector: {
      fullName: string;
      email: string;
    } | null;
  } | null;
}

interface OrderDetailsClientProps {
  initialOrder: OrderDetailsData;
}

export default function OrderDetailsClient({ initialOrder }: OrderDetailsClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetailsData>(initialOrder);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Dispatch modal / form states
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [courierInput, setCourierInput] = useState(order.courierPartner || '');
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber || '');

  // Payment proof inspection modal
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);

  // Rejection modal state
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Doorstep collection modal state
  const [showCodCollectionModal, setShowCodCollectionModal] = useState(false);
  const [collectionMethodInput, setCollectionMethodInput] = useState<'cash' | 'upi_doorstep' | 'card_doorstep'>('cash');
  const [collectionNotesInput, setCollectionNotesInput] = useState('');

  // Helper to open short-lived signed proof URL
  const handleOpenProof = async (proofPublicId: string | null) => {
    if (!proofPublicId) return;
    setIsLoadingProof(true);
    setActionError(null);
    try {
      const res = await getSignedProofUrlAction(proofPublicId);
      if (res.success && res.url) {
        setProofModalUrl(res.url);
      } else {
        setActionError(res.error || 'Failed to generate signed screenshot access URL.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error loading proof asset.');
    } finally {
      setIsLoadingProof(false);
    }
  };

  // Payment Verification
  const handleVerifyPayment = (paymentId: string, expectedAmount: number) => {
    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await verifyPaymentAction({
        paymentId,
        confirmedAmountReceived: expectedAmount,
      });

      if (!res.success) {
        setActionError(res.error || 'Payment verification failed.');
      } else {
        setActionSuccess('Payment verified successfully! Order updated.');
        router.refresh();
      }
    });
  };

  // Payment Rejection
  const handleRejectPayment = () => {
    if (!rejectingPaymentId) return;
    if (!rejectionReasonInput.trim()) {
      setActionError('Please provide a specific rejection reason.');
      return;
    }

    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await rejectPaymentAction({
        paymentId: rejectingPaymentId,
        rejectionReason: rejectionReasonInput.trim(),
      });

      if (!res.success) {
        setActionError(res.error || 'Payment rejection failed.');
      } else {
        setActionSuccess('Payment attempt rejected. Order marked Action Required.');
        setRejectingPaymentId(null);
        setRejectionReasonInput('');
        router.refresh();
      }
    });
  };

  // Doorstep COD Cash Collection
  const handleConfirmCodCollection = () => {
    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await confirmCodCollectionAction({
        orderId: order.id,
        confirmedCollectedAmount: order.balanceAmountDue,
        paymentMethod: collectionMethodInput,
        adminNotes: collectionNotesInput.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to confirm balance collection.');
      } else {
        setActionSuccess('Doorstep cash collection confirmed! Order is now Fully Paid.');
        setShowCodCollectionModal(false);
        setCollectionNotesInput('');
        router.refresh();
      }
    });
  };

  // Fulfillment Lifecycle Transitions
  const handleFulfillmentTransition = (newStatus: 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled') => {
    startTransition(async () => {
      setActionError(null);
      setActionSuccess(null);

      const res = await updateFulfillmentStatusAction({
        orderId: order.id,
        newStatus,
        courierPartner: courierInput.trim() || undefined,
        trackingNumber: trackingInput.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || 'Failed to update fulfillment status.');
      } else {
        setActionSuccess(`Order status transitioned to ${newStatus}.`);
        setShowDispatchModal(false);
        router.refresh();
      }
    });
  };

  // Status badge styling helper
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badgeColor = 'bg-[#2563EB] text-white'; // Default blue

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
      <span className={`inline-block text-center px-3.5 py-1 text-xs font-semibold rounded-full shadow-xs ${badgeColor}`}>
        {status}
      </span>
    );
  };

  // Payment status badge helper
  const renderPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fully Paid</span>
          </span>
        );
      case 'advance_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>₹100 Advance Paid</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Payment Pending</span>
          </span>
        );
    }
  };

  // Active / pending payment attempt
  const pendingPayment = order.payments.find((p) => p.verificationStatus === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={order.orderType === 'cod' ? '/admin/orders/cod' : '/admin/orders/online'}
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to orders list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/admin" className="hover:text-slate-600">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <Link
                href={order.orderType === 'cod' ? '/admin/orders/cod' : '/admin/orders/online'}
                className="hover:text-slate-600"
              >
                {order.orderType === 'cod' ? 'COD Orders' : 'Online Orders'}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="font-semibold text-slate-700">{order.orderNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
              <span>{order.orderNumber}</span>
              {renderStatusBadge(order.status)}
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {order.orderType === 'cod' ? 'COD' : 'Online UPI'}
              </span>
            </h1>
          </div>
        </div>

        {/* Action feedback notifications */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Alert Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Actions, Products, Payments) & Right Column (Customer, Address, Financials) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Column (span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Fulfillment Lifecycle Transition Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Truck className="w-4 h-4 text-slate-400" />
                <span>Fulfillment Management</span>
              </div>
              <div>{renderStatusBadge(order.status)}</div>
            </div>

            {/* Lifecycle Transition Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {order.status === 'Confirmed' && (
                <button
                  type="button"
                  onClick={() => handleFulfillmentTransition('Processing')}
                  disabled={isPending}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                  <span>Start Processing Order</span>
                </button>
              )}

              {order.status === 'Processing' && (
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(true)}
                  disabled={isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch & Ship Order</span>
                </button>
              )}

              {order.status === 'Dispatched' && (
                <button
                  type="button"
                  onClick={() => handleFulfillmentTransition('Delivered')}
                  disabled={isPending}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Order as Delivered</span>
                </button>
              )}

              {/* Courier and tracking details if dispatched */}
              {order.courierPartner && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/70 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{order.courierPartner}</span>
                  <span className="font-mono text-slate-500">#{order.trackingNumber}</span>
                </div>
              )}

              {/* Cancel option for non-terminal states */}
              {!['Delivered', 'Cancelled'].includes(order.status) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      handleFulfillmentTransition('Cancelled');
                    }
                  }}
                  disabled={isPending}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium transition-colors ml-auto"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {/* Timestamps */}
            {(order.dispatchedAt || order.deliveredAt || order.cancelledAt) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500">
                {order.dispatchedAt && (
                  <div>
                    <span className="text-slate-400 block">Dispatched At</span>
                    <span className="font-medium text-slate-700">{new Date(order.dispatchedAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div>
                    <span className="text-slate-400 block">Delivered At</span>
                    <span className="font-medium text-emerald-700">{new Date(order.deliveredAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.cancelledAt && (
                  <div>
                    <span className="text-slate-400 block">Cancelled At</span>
                    <span className="font-medium text-rose-700">{new Date(order.cancelledAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Ordered Products Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Package className="w-4 h-4 text-slate-400" />
                <span>Ordered Products ({order.items.length})</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 relative">
                              <Image
                                src={item.imageUrl}
                                alt={item.productName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{item.productName}</div>
                            {item.variantName && (
                              <div className="text-[11px] text-slate-400">{item.variantName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{item.brandName || 'Majisa'}</td>
                      <td className="py-3 px-3 text-slate-700">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">₹{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Payment History & Manual Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Payment History & Verification</span>
              </div>
              <div>{renderPaymentStatusBadge(order.paymentStatus)}</div>
            </div>

            {order.payments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No payment attempts recorded for this order.</p>
            ) : (
              <div className="space-y-4">
                {order.payments.map((p) => {
                  const isPendingAttempt = p.verificationStatus === 'pending';
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPendingAttempt
                          ? 'border-amber-300 bg-amber-50/40'
                          : p.verificationStatus === 'verified'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : p.verificationStatus === 'rejected'
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200/60">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-xs text-slate-800">
                            Attempt #{p.attemptNumber}
                          </span>
                          <span className="text-[11px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {p.paymentMethod === 'cod_advance' ? 'COD Advance (₹100)' : 'Full UPI Order'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              p.verificationStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.verificationStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : p.verificationStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.verificationStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Expected Amount</span>
                          <span className="font-bold text-slate-800">₹{p.amountExpected.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Submitted Amount</span>
                          <span className="font-semibold text-slate-700">₹{p.amountSubmitted.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-2">
                          <span className="text-slate-400 block text-[11px]">UTR / Reference Number</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {p.utrReference || 'Not submitted yet'}
                          </span>
                        </div>
                      </div>

                      {/* Payment Proof Access */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 text-xs">
                        <div>
                          {p.proofPublicId ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProof(p.proofPublicId)}
                              disabled={isLoadingProof}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold text-xs rounded-lg transition-colors"
                            >
                              {isLoadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>View Secure Payment Proof</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">No proof screenshot uploaded</span>
                          )}
                        </div>

                        {/* Action buttons if attempt is pending verification */}
                        {isPendingAttempt && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(p.id, p.amountExpected)}
                              disabled={isPending}
                              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              <span>Verify & Confirm (₹{p.amountExpected.toFixed(2)})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPaymentId(p.id);
                                setRejectionReasonInput('');
                              }}
                              disabled={isPending}
                              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Rejection reason & audit details */}
                      {p.verificationStatus === 'rejected' && p.rejectionReason && (
                        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <span className="font-semibold block">Rejection Reason:</span>
                          <span>{p.rejectionReason}</span>
                          {p.rejectedAt && (
                            <span className="block text-[10px] text-rose-600 mt-1">
                              Rejected on: {new Date(p.rejectedAt).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}

                      {p.verificationStatus === 'verified' && p.verifiedAt && (
                        <div className="mt-2 text-[11px] text-emerald-700">
                          Verified on: {new Date(p.verifiedAt).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. COD Doorstep Collection Details (For COD Orders Only) */}
          {order.orderType === 'cod' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Banknote className="w-4 h-4 text-slate-400" />
                  <span>Doorstep COD Collection Audit</span>
                </div>
                <div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      order.paymentStatus === 'fully_paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus === 'fully_paid' ? 'Fully Collected' : 'Balance Pending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">₹100 Delivery Advance</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{order.advanceAmountPaid.toFixed(2)}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    {order.advanceAmountPaid > 0 ? 'Verified & Paid Upfront' : 'Awaiting UPI Verification'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="text-amber-800 block mb-0.5">Remaining Balance Due</span>
                  <span className="font-bold text-amber-950 text-sm">
                    ₹{order.balanceAmountDue.toFixed(2)}
                  </span>
                  <span className="block text-[11px] text-amber-700 mt-1">
                    To be collected at doorstep in cash/UPI
                  </span>
                </div>
              </div>

              {/* Recorded collection information */}
              {order.codCollection ? (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Doorstep Collection Settled</span>
                    <span>₹{order.codCollection.amountCollected.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                    <div>
                      <span className="text-emerald-600 block">Method</span>
                      <span className="font-medium capitalize">{order.codCollection.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-emerald-600 block">Collected At</span>
                      <span className="font-medium">{new Date(order.codCollection.collectedAt).toLocaleString('en-IN')}</span>
                    </div>
                    {order.codCollection.collector && (
                      <div className="col-span-2">
                        <span className="text-emerald-600 block">Confirmed By Admin</span>
                        <span className="font-medium">{order.codCollection.collector.fullName} ({order.codCollection.collector.email})</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : order.balanceAmountDue > 0 && ['Dispatched', 'Delivered'].includes(order.status) ? (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCodCollectionModal(true)}
                    disabled={isPending}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Doorstep Cash Collected (₹{order.balanceAmountDue.toFixed(2)})</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right / Sidebar Column (span 1) */}
        <div className="space-y-6">
          {/* 1. Customer Information Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 mb-4">
              <User className="w-4 h-4 text-slate-400" />
              <span>Customer Details</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Name</span>
                <span className="font-bold text-slate-800 text-sm">{order.shippingAddress.recipientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="font-semibold text-slate-700">{order.customer?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <span className="font-semibold text-slate-700">{order.shippingAddress.phone || order.customer?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 2. Shipping Address Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 mb-4">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Shipping Address</span>
            </div>

            <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
              <div className="font-bold text-slate-900">{order.shippingAddress.recipientName}</div>
              <div>{order.shippingAddress.streetAddress}</div>
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                <span className="font-mono font-semibold">{order.shippingAddress.postalCode}</span>
              </div>
              <div className="pt-2 text-slate-500">Phone: {order.shippingAddress.phone}</div>
            </div>

            {order.customerNotes && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-500 block mb-0.5">Customer Delivery Notes:</span>
                <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  &ldquo;{order.customerNotes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* 3. Order Financial Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 mb-4">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Financial Summary</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Product Subtotal</span>
                <span className="font-semibold text-slate-800">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-800">₹{order.deliveryFee.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-emerald-700">
                <span>Total Paid to Date</span>
                <span className="font-bold">
                  ₹{(order.orderType === 'cod' ? order.advanceAmountPaid + order.codBalanceCollected : order.paymentStatus === 'fully_paid' ? order.totalAmount : 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span>Outstanding Balance</span>
                <span className={order.balanceAmountDue > 0 ? 'text-amber-700' : 'text-slate-700'}>
                  ₹{order.balanceAmountDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Dispatch / Shipping Inputs */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Dispatch Order #{order.orderNumber}</h3>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Courier Partner *</label>
                <input
                  type="text"
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, DTDC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Tracking Number / AWB *</label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. DEL-894210984"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleFulfillmentTransition('Dispatched')}
                disabled={isPending || !courierInput.trim() || !trackingInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isPending ? 'Updating...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason Input */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reject Payment Attempt</h3>
              <button
                type="button"
                onClick={() => setRejectingPaymentId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-600 font-semibold block">
                Provide specific reason for rejection (visible to customer for correction):
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. UTR number not found in merchant bank account; screenshot is blurred."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingPaymentId(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                disabled={isPending || !rejectionReasonInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Doorstep COD Collection Input */}
      {showCodCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Record Doorstep Cash Collection</h3>
              <button
                type="button"
                onClick={() => setShowCodCollectionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold">
                Amount to Collect: ₹{order.balanceAmountDue.toFixed(2)}
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Payment Method</label>
                <select
                  value={collectionMethodInput}
                  onChange={(e) => setCollectionMethodInput(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="cash">Doorstep Cash</option>
                  <option value="upi_doorstep">Doorstep UPI QR</option>
                  <option value="card_doorstep">Doorstep POS / Card</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Admin / Collection Notes</label>
                <input
                  type="text"
                  value={collectionNotesInput}
                  onChange={(e) => setCollectionNotesInput(e.target.value)}
                  placeholder="e.g. Collected by delivery executive"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCodCollectionModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCodCollection}
                disabled={isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Confirm Balance Settled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Secure Payment Proof Preview (Short-lived signed URL) */}
      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Secure Payment Proof Screenshot</h3>
              </div>
              <button
                type="button"
                onClick={() => setProofModalUrl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900 rounded-xl flex items-center justify-center p-2 min-h-[350px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofModalUrl}
                alt="Payment proof screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
              <span>Short-lived private delivery link &bull; Not publicly indexed</span>
              <a
                href={proofModalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <span>Open in full resolution</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

