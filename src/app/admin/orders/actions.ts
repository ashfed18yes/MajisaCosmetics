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
  confirmedAmountReceived: number;
  adminNotes?: string | null;
}

export interface RejectPaymentInput {
  paymentId: string;
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

    // Case 1 — Awaiting submission: Cannot verify if neither UTR nor proof screenshot was submitted
    if (!paymentRecord.utr_reference?.trim() && !paymentRecord.proof_public_id?.trim()) {
      return {
        success: false,
        error: 'Cannot verify payment: The customer has not submitted a UTR reference number or payment screenshot yet (Awaiting Payment Submission).',
      };
    }

    // 2. Execute verification RPC via authenticated user context
    const supabase = await createClient();

    const { data: rpcResult, error: rpcError } = await supabase.rpc('verify_payment_admin', {
      p_payment_id: input.paymentId,
      p_confirmed_amount_received: input.confirmedAmountReceived,
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
      .select('id, verification_status')
      .eq('id', input.paymentId)
      .maybeSingle();

    if (paymentFetchErr || !paymentRecord) {
      return { success: false, error: 'Payment attempt record not found.' };
    }

    if (paymentRecord.verification_status === 'verified') {
      return {
        success: false,
        error: 'Cannot reject this payment attempt: it has already been verified and credited in the database.',
      };
    }

    const supabase = await createClient();

    const { data: rpcResult, error: rpcError } = await supabase.rpc('reject_payment_admin', {
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
 * Uses: confirm_cod_balance_collected_admin stored procedure.
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

    const supabase = await createClient();

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'confirm_cod_balance_collected_admin',
      {
        p_order_id: input.orderId,
        p_confirmed_collected_amount: input.confirmedCollectedAmount,
        p_payment_method: method,
        p_transaction_reference: input.transactionReference?.trim() || null,
        p_admin_notes: input.adminNotes?.trim() || null,
        p_admin_id: user.id,
      }
    );

    if (rpcError || !rpcResult) {
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
