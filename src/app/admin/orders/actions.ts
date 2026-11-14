'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSignedPaymentProofUrl } from '@/lib/cloudinary';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export interface VerifyPaymentInput {
  paymentId: string;
  orderId?: string;
  confirmedAmountReceived: number;
  adminNotes?: string | null;
}

export interface RejectPaymentInput {
  paymentId: string;
  orderId?: string;
  rejectionReason: string;
  adminNotes?: string | null;
}

export interface ConfirmCodCollectionInput {
  orderId: string;
  confirmedCollectedAmount: number;
  paymentMethod?: 'cash' | 'upi_doorstep' | 'card_doorstep';
  transactionReference?: string | null;
  adminNotes?: string | null;
}

export interface UpdateFulfillmentStatusInput {
  orderId: string;
  newStatus: 'Confirmed' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';
  courierPartner?: string | null;
  trackingNumber?: string | null;
  cancellationNote?: string | null;
}

export interface DeleteOrderInput {
  orderId: string;
}

/**
 * Server Action: Administrative Manual Payment Verification.
 *
 * Applicable for:
 * 1. Online Orders: Verifies full order amount (subtotal + Rs 100 delivery).
 *    Transitions order to 'Confirmed' and payment_status to 'fully_paid'.
 * 2. COD Orders: Verifies Rs 100 delivery advance ONLY.
 *    Transitions order to 'Confirmed' and payment_status to 'advance_paid'.
 *    Remaining product subtotal remains due on delivery.
 *
 * Uses: verify_payment_admin stored procedure with deadlock-safe row locking.
 */
export async function verifyPaymentAction(input: VerifyPaymentInput) {
  try {
    const { user } = await requireAdmin();

    if (!input.paymentId || !isValidUuid(input.paymentId)) {
      return { success: false, error: 'Invalid payment attempt ID.' };
    }

    if (
      typeof input.confirmedAmountReceived !== 'number' ||
      isNaN(input.confirmedAmountReceived) ||
      input.confirmedAmountReceived <= 0
    ) {
      return { success: false, error: 'Confirmed received amount must be greater than zero.' };
    }

    const roundedAmount = Math.round(input.confirmedAmountReceived * 100) / 100;

    const adminClient = createAdminClient();

    // 1. Authoritative pre-check of the payment record
    const { data: paymentRecord, error: paymentFetchErr } = await adminClient
      .from('payments')
      .select('id, order_id, verification_status, verified_at, amount_expected, utr_reference, proof_public_id')
      .eq('id', input.paymentId)
      .maybeSingle();

    if (paymentFetchErr || !paymentRecord) {
      return { success: false, error: 'Payment attempt record not found.' };
    }

    // Security verification: If caller provided orderId, verify payment belongs to this order
    if (input.orderId && paymentRecord.order_id !== input.orderId) {
      return {
        success: false,
        error: 'Security mismatch: Payment attempt does not belong to the specified order.',
      };
    }

    // Case 3 — Already verified: return immediately without calling RPC unnecessarily
    if (paymentRecord.verification_status === 'verified') {
      const orderId = paymentRecord.order_id;
      if (orderId) {
        revalidatePath('/admin');
        revalidatePath('/admin/orders/online');
        revalidatePath('/admin/orders/cod');
        revalidatePath(`/admin/orders/${orderId}`);
      }

      return {
        success: true,
        alreadyVerified: true,
        message: 'Payment has already been verified and confirmed in the database.',
        data: {
          order_id: orderId,
          payment_id: input.paymentId,
          verification_status: 'verified',
          verified_at: paymentRecord.verified_at,
        },
      };
    }

    // Case 4 — Rejected: Cannot verify a rejected payment
    if (paymentRecord.verification_status === 'rejected') {
      return {
        success: false,
        error: 'Cannot verify this payment attempt: it has already been rejected. A new payment attempt must be submitted by the customer.',
      };
    }

    // Case 1 — Mandatory Payment Proof & UTR Validation:
    // Both UTR reference number and payment screenshot proof are strictly required.
    const utr = paymentRecord.utr_reference?.trim();
    const proofId = paymentRecord.proof_public_id?.trim();

    if (!utr || !proofId) {
      return {
        success: false,
        error: 'Cannot verify payment: Both a valid UTR reference number and an uploaded payment screenshot proof are strictly mandatory before verification.',
      };
    }

    if (utr.length < 8 || utr.length > 22) {
      return {
        success: false,
        error: 'Cannot verify payment: Invalid UTR reference format (must be 8-22 alphanumeric characters).',
      };
    }

    // Asset namespace security verification:
    // Strictly verify proof belongs to the exact payment attempt and order via regex (not just loose prefix)
    const exactProofRegex = new RegExp(`^majisa-cosmetics/payment-proofs/${paymentRecord.order_id}/${paymentRecord.id}_\\d+(\\.[a-zA-Z0-9]+)?$`);
    const sampleProofRegex = /^majisa-cosmetics\/payment-proofs\/sample\/[a-zA-Z0-9_-]+$/;

    if (!exactProofRegex.test(proofId) && !sampleProofRegex.test(proofId)) {
      return {
        success: false,
        error: `Security violation: Payment proof asset (${proofId}) is not structurally bound to order ${paymentRecord.order_id} and payment attempt ${paymentRecord.id}.`,
      };
    }

    // Proof reuse prevention: Ensure rejected and retry payment attempts cannot reuse another attempt's proof
    if (!sampleProofRegex.test(proofId)) {
      const { data: reusedProof } = await adminClient
        .from('payments')
        .select('id, order_id, attempt_number, verification_status')
        .eq('proof_public_id', proofId)
        .neq('id', paymentRecord.id)
        .maybeSingle();

      if (reusedProof) {
        return {
          success: false,
          error: `Security violation: Payment proof screenshot has already been used in payment attempt #${reusedProof.attempt_number} (status: ${reusedProof.verification_status}). Reusing proof screenshots across attempts is strictly prohibited.`,
        };
      }
    }

    // 2. Execute verification RPC using authenticated admin identity context
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('verify_payment_admin', {
      p_payment_id: input.paymentId,
      p_confirmed_amount_received: roundedAmount,
      p_admin_notes: input.adminNotes?.trim() || null,
      p_admin_id: user.id,
    });

    if (rpcError || !rpcResult) {
      // Idempotent handling with strict DB confirmation:
      // If RPC reports "current: verified", only treat as success if DB actually confirms it belongs to this order and is verified.
      if (rpcError?.message && rpcError.message.includes('current: verified')) {
        const { data: existingPayment } = await adminClient
          .from('payments')
          .select('id, order_id, verification_status, verified_at, amount_expected')
          .eq('id', input.paymentId)
          .maybeSingle();

        if (existingPayment && existingPayment.verification_status === 'verified') {
          const orderId = existingPayment.order_id;
          if (orderId) {
            revalidatePath('/admin');
            revalidatePath('/admin/orders/online');
            revalidatePath('/admin/orders/cod');
            revalidatePath(`/admin/orders/${orderId}`);
          }

          return {
            success: true,
            alreadyVerified: true,
            message: 'Payment has already been verified and confirmed in the database.',
            data: {
              order_id: orderId,
              payment_id: input.paymentId,
              verification_status: 'verified',
              verified_at: existingPayment.verified_at,
            },
          };
        }
      }

      console.error('RPC verify_payment_admin error:', rpcError);
      return {
        success: false,
        error: rpcError?.message || 'Failed to verify payment with database.',
      };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders/online');
    revalidatePath('/admin/orders/cod');
    revalidatePath(`/admin/orders/${rpcResult.order_id}`);

    return {
      success: true,
      data: rpcResult,
    };
  } catch (err: unknown) {
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('verifyPaymentAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected authorization error occurred.',
    };
  }
}

/**
 * Server Action: Administrative Payment Rejection.
 *
 * Rejects an invalid or fraudulent payment attempt.
 * Transitions order to 'Payment Action Required' while maintaining payment_status 'pending'.
 * Customer can view rejection reason and resubmit a new payment attempt.
 *
 * Uses: reject_payment_admin stored procedure with mutual exclusivity audit guards.
 */
export async function rejectPaymentAction(input: RejectPaymentInput) {
  try {
    const { user } = await requireAdmin();

    if (!input.paymentId || !isValidUuid(input.paymentId)) {
      return { success: false, error: 'Invalid payment attempt ID.' };
    }

    if (!input.rejectionReason || !input.rejectionReason.trim()) {
      return { success: false, error: 'Rejection reason is required.' };
    }

    const adminClient = createAdminClient();

    // Authoritative pre-check
    const { data: paymentRecord, error: paymentFetchErr } = await adminClient
      .from('payments')
      .select('id, order_id, verification_status')
      .eq('id', input.paymentId)
      .maybeSingle();

    if (paymentFetchErr || !paymentRecord) {
      return { success: false, error: 'Payment attempt record not found.' };
    }

    if (input.orderId && paymentRecord.order_id !== input.orderId) {
      return {
        success: false,
        error: 'Security mismatch: Payment attempt does not belong to the specified order.',
      };
    }

    if (paymentRecord.verification_status === 'verified') {
      return {
        success: false,
        error: 'Cannot reject this payment attempt: it has already been verified and credited in the database.',
      };
    }

    if (paymentRecord.verification_status === 'rejected') {
      const orderId = paymentRecord.order_id;
      if (orderId) {
        revalidatePath('/admin');
        revalidatePath('/admin/orders/online');
        revalidatePath('/admin/orders/cod');
        revalidatePath(`/admin/orders/${orderId}`);
      }

      return {
        success: true,
        alreadyRejected: true,
        message: 'Payment attempt has already been rejected in the database.',
        data: {
          order_id: orderId,
          payment_id: input.paymentId,
          verification_status: 'rejected',
        },
      };
    }

    const { data: rpcResult, error: rpcError } = await adminClient.rpc('reject_payment_admin', {
      p_payment_id: input.paymentId,
      p_rejection_reason: input.rejectionReason.trim(),
      p_admin_notes: input.adminNotes?.trim() || null,
      p_admin_id: user.id,
    });

    if (rpcError || !rpcResult) {
      if (rpcError?.message && rpcError.message.includes('current: verified')) {
        return {
          success: false,
          error: 'Cannot reject this payment attempt: it has already been verified and credited in the database.',
        };
      }

      console.error('RPC reject_payment_admin error:', rpcError);
      return {
        success: false,
        error: rpcError?.message || 'Failed to reject payment with database.',
      };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders/online');
    revalidatePath('/admin/orders/cod');
    revalidatePath(`/admin/orders/${rpcResult.order_id}`);

    return {
      success: true,
      data: rpcResult,
    };
  } catch (err: unknown) {
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('rejectPaymentAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected authorization error occurred.',
    };
  }
}

/**
 * Server Action: Administrative COD Doorstep Balance Collection Confirmation.
 *
 * Records cash/doorstep UPI collection of the remaining product subtotal when parcel is delivered.
 * Enforces:
 * - Order must be COD.
 * - Advance must have been verified ('advance_paid').
 * - Order must be in delivery phase ('Dispatched' or 'Delivered').
 * - Confirmed amount must match balance_amount_due exactly.
 * - Inserts permanent audit record into public.order_collections.
 * - Sets payment_status = 'fully_paid', balance_amount_due = 0.00.
 *
 * Uses: confirm_cod_balance_collected_admin stored procedure with idempotency safeguards.
 */
export async function confirmCodCollectionAction(input: ConfirmCodCollectionInput) {
  try {
    const { user } = await requireAdmin();

    if (!input.orderId || !isValidUuid(input.orderId)) {
      return { success: false, error: 'Invalid order ID.' };
    }

    if (
      typeof input.confirmedCollectedAmount !== 'number' ||
      isNaN(input.confirmedCollectedAmount) ||
      input.confirmedCollectedAmount <= 0
    ) {
      return { success: false, error: 'Confirmed collected amount must be greater than zero.' };
    }

    const method = input.paymentMethod || 'cash';
    if (!['cash', 'upi_doorstep', 'card_doorstep'].includes(method)) {
      return { success: false, error: 'Invalid payment collection method.' };
    }

    const adminClient = createAdminClient();

    // 1. Authoritative pre-check of the parent order
    const { data: orderRecord, error: orderFetchErr } = await adminClient
      .from('orders')
      .select('id, order_type, status, payment_status, balance_amount_due, cod_balance_collected, total_amount')
      .eq('id', input.orderId)
      .maybeSingle();

    if (orderFetchErr || !orderRecord) {
      return { success: false, error: 'Order not found in database.' };
    }

    if (orderRecord.order_type !== 'cod') {
      return {
        success: false,
        error: 'Doorstep balance collection confirmation is only applicable to COD orders.',
      };
    }

    // Idempotent recovery check: If order is already fully paid and balance is 0, return success
    if (orderRecord.payment_status === 'fully_paid' && Number(orderRecord.balance_amount_due) <= 0) {
      revalidatePath('/admin');
      revalidatePath('/admin/orders/cod');
      revalidatePath(`/admin/orders/${input.orderId}`);

      return {
        success: true,
        alreadyCollected: true,
        message: 'COD doorstep balance has already been collected and confirmed in the database.',
        data: {
          order_id: input.orderId,
          payment_status: 'fully_paid',
          cod_balance_collected: orderRecord.cod_balance_collected ?? input.confirmedCollectedAmount,
          balance_amount_due: 0,
        },
      };
    }

    if (orderRecord.payment_status !== 'advance_paid') {
      return {
        success: false,
        error: `Cannot collect remaining balance before delivery advance has been verified (current payment status: "${orderRecord.payment_status}").`,
      };
    }

    if (!['Dispatched', 'Delivered'].includes(orderRecord.status)) {
      return {
        success: false,
        error: `COD balance can only be collected for orders that are Dispatched or Delivered (current order status: "${orderRecord.status}").`,
      };
    }

    const roundedCollected = Math.round(input.confirmedCollectedAmount * 100) / 100;
    const roundedBalanceDue = Math.round(Number(orderRecord.balance_amount_due) * 100) / 100;

    if (roundedCollected !== roundedBalanceDue) {
      return {
        success: false,
        error: `Confirmed collected amount (₹${roundedCollected.toFixed(2)}) must exactly equal the outstanding balance (₹${roundedBalanceDue.toFixed(2)}).`,
      };
    }

    // 2. Execute collection confirmation RPC via privileged admin context
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'confirm_cod_balance_collected_admin',
      {
        p_order_id: input.orderId,
        p_confirmed_collected_amount: roundedCollected,
        p_payment_method: method,
        p_transaction_reference: input.transactionReference?.trim() || null,
        p_admin_notes: input.adminNotes?.trim() || null,
        p_admin_id: user.id,
      }
    );

    if (rpcError || !rpcResult) {
      const errMsg = rpcError?.message || '';

      // Idempotent recovery guard: if RPC reported already collected or unique violation,
      // verify database state before failing.
      if (
        errMsg.includes('already been collected') ||
        errMsg.includes('idx_order_collections_unique_cod_doorstep') ||
        errMsg.includes('current payment status: fully_paid')
      ) {
        const { data: confirmedOrder } = await adminClient
          .from('orders')
          .select('id, payment_status, balance_amount_due, cod_balance_collected')
          .eq('id', input.orderId)
          .maybeSingle();

        if (confirmedOrder && confirmedOrder.payment_status === 'fully_paid') {
          revalidatePath('/admin');
          revalidatePath('/admin/orders/cod');
          revalidatePath(`/admin/orders/${input.orderId}`);

          return {
            success: true,
            alreadyCollected: true,
            message: 'COD doorstep balance has already been collected and confirmed in the database.',
            data: {
              order_id: input.orderId,
              payment_status: 'fully_paid',
              cod_balance_collected: confirmedOrder.cod_balance_collected ?? roundedCollected,
              balance_amount_due: 0,
            },
          };
        }
      }

      console.error('RPC confirm_cod_balance_collected_admin error:', rpcError);
      return {
        success: false,
        error: rpcError?.message || 'Failed to record COD balance collection.',
      };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders/cod');
    revalidatePath(`/admin/orders/${input.orderId}`);

    return {
      success: true,
      data: rpcResult,
    };
  } catch (err: unknown) {
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('confirmCodCollectionAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected authorization error occurred.',
    };
  }
}

/**
 * Server Action: Administrative Order Fulfillment Status Transition.
 *
 * Enforces valid lifecycle progressions according to the database transition trigger:
 * - Confirmed -> Processing
 * - Processing -> Dispatched (requires tracking number and courier partner)
 * - Dispatched -> Delivered
 * - Non-terminal -> Cancelled
 *
 * Triggers database trg_check_order_status_transition to enforce transition integrity.
 */
export async function updateFulfillmentStatusAction(input: UpdateFulfillmentStatusInput) {
  try {
    await requireAdmin();

    if (!input.orderId || !isValidUuid(input.orderId)) {
      return { success: false, error: 'Invalid order ID.' };
    }

    const validStatuses = [
      'Confirmed',
      'Processing',
      'Dispatched',
      'Delivered',
      'Cancelled',
    ] as const;

    if (!validStatuses.includes(input.newStatus)) {
      return { success: false, error: `Invalid target fulfillment status: ${input.newStatus}.` };
    }

    const adminClient = createAdminClient();

    // 1. Fetch current status to validate preconditions against authoritative state machine
    const { data: order, error: fetchErr } = await adminClient
      .from('orders')
      .select('id, status, customer_notes, dispatched_at, delivered_at, cancelled_at')
      .eq('id', input.orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: 'Order not found in database.' };
    }

    const currentStatus = order.status;

    // Terminal state guards
    if (currentStatus === 'Delivered') {
      return { success: false, error: 'Order is already Delivered. Cannot modify a terminal fulfillment status.' };
    }
    if (currentStatus === 'Cancelled') {
      return { success: false, error: 'Order is already Cancelled. Cannot modify a terminal fulfillment status.' };
    }

    // Payment pre-condition guards
    if (['Awaiting Payment', 'Pending Verification', 'Payment Action Required'].includes(currentStatus)) {
      if (input.newStatus !== 'Cancelled') {
        return {
          success: false,
          error: `Order is currently "${currentStatus}". Payment must be verified and confirmed before fulfillment can proceed.`,
        };
      }
    }

    // Strict state machine validation: Confirmed -> Processing -> Dispatched -> Delivered
    if (currentStatus === 'Confirmed') {
      if (input.newStatus !== 'Processing' && input.newStatus !== 'Cancelled') {
        return {
          success: false,
          error: `Cannot transition Confirmed order directly to "${input.newStatus}". The order must first be moved to "Processing".`,
        };
      }
    } else if (currentStatus === 'Processing') {
      if (input.newStatus !== 'Dispatched' && input.newStatus !== 'Cancelled') {
        return {
          success: false,
          error: `Cannot transition Processing order directly to "${input.newStatus}". The order must first be "Dispatched" with courier tracking details before it can be marked Delivered.`,
        };
      }
    } else if (currentStatus === 'Dispatched') {
      if (input.newStatus !== 'Delivered' && input.newStatus !== 'Cancelled') {
        return {
          success: false,
          error: `Cannot transition Dispatched order to "${input.newStatus}". Allowed transitions are "Delivered" or "Cancelled".`,
        };
      }
    }

    if (input.newStatus === 'Dispatched') {
      const partner = input.courierPartner?.trim();
      const tracking = input.trackingNumber?.trim();
      if (!partner) {
        return { success: false, error: 'Courier partner name is required when dispatching an order.' };
      }
      if (!tracking) {
        return { success: false, error: 'Courier tracking / AWB number is required when dispatching an order.' };
      }
    }

    const updatePayload: Record<string, any> = {
      status: input.newStatus,
      updated_at: new Date().toISOString(),
    };

    if (input.newStatus === 'Dispatched') {
      updatePayload.courier_partner = input.courierPartner?.trim() || 'Standard Courier';
      updatePayload.tracking_number = input.trackingNumber?.trim() || '';
      if (!order.dispatched_at) {
        updatePayload.dispatched_at = new Date().toISOString();
      }
    } else if (input.newStatus === 'Delivered') {
      if (!order.delivered_at) {
        updatePayload.delivered_at = new Date().toISOString();
      }
    } else if (input.newStatus === 'Cancelled') {
      if (!order.cancelled_at) {
        updatePayload.cancelled_at = new Date().toISOString();
      }
      if (input.cancellationNote?.trim()) {
        const prevNotes = order.customer_notes ? `${order.customer_notes}\n` : '';
        updatePayload.customer_notes = `${prevNotes}[Admin Cancellation Note: ${input.cancellationNote.trim()}]`;
      }
    }

    const { error: updateErr } = await adminClient
      .from('orders')
      .update(updatePayload)
      .eq('id', input.orderId);

    if (updateErr) {
      console.error('Update fulfillment error:', updateErr);
      return {
        success: false,
        error: updateErr.message || 'Database rejected status transition.',
      };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/orders/online');
    revalidatePath('/admin/orders/cod');
    revalidatePath(`/admin/orders/${input.orderId}`);

    return {
      success: true,
      newStatus: input.newStatus,
    };
  } catch (err: unknown) {
    console.error('updateFulfillmentStatusAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    };
  }
}

/**
 * Server Action: Generates a short-lived signed delivery URL for payment proof screenshots.
 *
 * Ensures screenshots are strictly inaccessible through static/permanent public URLs.
 * Requires active administrative session.
 */
export async function getSignedProofUrlAction(publicId: string) {
  try {
    await requireAdmin();

    if (!publicId || typeof publicId !== 'string') {
      return { success: false, error: 'Valid proof asset public ID is required.' };
    }

    // 1-hour expiry signed URL
    const signedUrl = getSignedPaymentProofUrl(publicId, 3600);

    return {
      success: true,
      url: signedUrl,
    };
  } catch (err: unknown) {
    console.error('getSignedProofUrlAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate signed proof URL.',
    };
  }
}

/**
 * Server Action: Administrative Permanent Order Deletion.
 *
 * Permanently removes an order, its line items, payment records, and collection audits.
 * Requires active administrative session.
 */
export async function deleteOrderAction(input: DeleteOrderInput) {
  try {
    await requireAdmin();

    if (!input.orderId || !isValidUuid(input.orderId)) {
      return { success: false, error: 'Invalid order ID provided.' };
    }

    const adminClient = createAdminClient();

    // 1. Authoritative check that the order exists
    const { data: order, error: fetchErr } = await adminClient
      .from('orders')
      .select('id, order_number, order_type')
      .eq('id', input.orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: 'Order not found in database.' };
    }

    // 2. Clear related records defensively
    await adminClient
      .from('order_collections')
      .delete()
      .eq('order_id', input.orderId);

    await adminClient
      .from('order_items')
      .delete()
      .eq('order_id', input.orderId);

    await adminClient
      .from('payments')
      .delete()
      .eq('order_id', input.orderId);

    // 3. Delete parent order record
    const { error: deleteErr } = await adminClient
      .from('orders')
      .delete()
      .eq('id', input.orderId);

    if (deleteErr) {
      console.error('Delete order error:', deleteErr);
      return { success: false, error: deleteErr.message || 'Database rejected order deletion.' };
    }

    // 4. Revalidate all cached admin routes
    revalidatePath('/admin');
    revalidatePath('/admin/orders/online');
    revalidatePath('/admin/orders/cod');
    revalidatePath(`/admin/orders/${input.orderId}`);

    return {
      success: true,
      orderId: input.orderId,
      orderNumber: order.order_number,
      orderType: order.order_type,
      message: `Order #${order.order_number} has been permanently deleted.`,
    };
  } catch (err: unknown) {
    console.error('deleteOrderAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting order.',
    };
  }
}

export interface AdminNotificationData {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderType: 'online' | 'cod';
  createdAt: string;
}

/**
 * Server Action: Load Recent Admin Notifications.
 *
 * Securely retrieves the most recent customer orders for the notification bell.
 * Enforces admin authorization via requireAdmin().
 * Sanitizes customer address snapshots to extract the display recipient name.
 */
export async function getRecentAdminNotificationsAction(): Promise<{
  success: boolean;
  notifications?: AdminNotificationData[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data: recentOrders, error } = await adminClient
      .from('orders')
      .select('id, order_number, order_type, total_amount, created_at, shipping_address_snapshot')
      .neq('status', 'Awaiting Payment')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('getRecentAdminNotificationsAction error:', error);
      return { success: false, error: error.message };
    }

    const notifications: AdminNotificationData[] = (recentOrders || []).map((o) => {
      let addr: Record<string, any> = {};
      if (typeof o.shipping_address_snapshot === 'object' && o.shipping_address_snapshot !== null) {
        addr = o.shipping_address_snapshot as Record<string, any>;
      } else if (typeof o.shipping_address_snapshot === 'string') {
        try {
          addr = JSON.parse(o.shipping_address_snapshot);
        } catch {
          addr = {};
        }
      }

      const customerName = addr.recipient_name || addr.fullName || addr.name || 'Customer';

      return {
        id: o.id,
        orderNumber: o.order_number || o.id.slice(0, 8),
        customerName,
        totalAmount: Number(o.total_amount) || 0,
        orderType: (o.order_type === 'cod' ? 'cod' : 'online') as 'online' | 'cod',
        createdAt: o.created_at,
      };
    });

    return { success: true, notifications };
  } catch (err: unknown) {
    if ((err as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    console.error('getRecentAdminNotificationsAction exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unauthorized or error loading notifications',
    };
  }
}


