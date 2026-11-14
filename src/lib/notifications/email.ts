import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONTACT_INFO } from '@/config/contact';
import {
  buildCustomerOrderCreatedEmail,
  buildAdminOrderCreatedEmail,
  buildPaymentVerifiedEmail,
  buildOrderDeliveredEmail,
  OrderItemSummary,
  ShippingAddressSummary,
} from './templates';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

/**
 * Returns the base public URL for links embedded in transactional emails.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }
  return 'https://majisacosmetics.com';
}

/**
 * Returns the destination email address for internal store admin alerts.
 */
export function getAdminNotificationEmail(): string {
  if (process.env.ORDER_NOTIFICATION_EMAIL?.trim()) {
    return process.env.ORDER_NOTIFICATION_EMAIL.trim();
  }
  return CONTACT_INFO.email; // majisacosmeticsales@gmail.com
}

/**
 * Low-level Resend REST API integration.
 * Executes server-side only via native fetch without third-party dependencies.
 */
export async function sendEmailWithResend(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      '[Notifications] RESEND_API_KEY is not configured in environment variables. Email dispatch was safely bypassed.'
    );
    return {
      success: false,
      skipped: true,
      reason: 'RESEND_API_KEY environment variable is not configured.',
    };
  }

  const from =
    process.env.EMAIL_FROM?.trim() ||
    'Majisa Cosmetics <onboarding@resend.dev>';

  const recipients = (Array.isArray(options.to) ? options.to : [options.to])
    .map((r) => r?.trim())
    .filter((r): r is string => Boolean(r && r.includes('@')));

  if (recipients.length === 0) {
    return {
      success: false,
      error: 'No valid recipient email address was provided.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        `HTTP ${res.status}: Resend transactional email API rejected request.`;
      console.error('[Notifications] Resend API error:', errMsg);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Unknown network error communicating with Resend.';
    console.error('[Notifications] Resend transport error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Queries authoritative order details with associated customer, items, and payments.
 */
async function fetchFullOrderRecord(orderId: string) {
  const adminClient = createAdminClient();
  const { data: order, error } = await adminClient
    .from('orders')
    .select(`
      *,
      customer:profiles!orders_user_id_fkey (
        id,
        email,
        full_name,
        phone
      ),
      order_items (
        id,
        product_name,
        brand_name,
        variant_name,
        unit_price,
        quantity,
        total_price,
        image_url
      ),
      payments (
        id,
        payment_method,
        amount_expected,
        amount_submitted,
        utr_reference,
        verification_status,
        verified_at
      )
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    console.error('[Notifications] Failed to load order for notification:', orderId, error);
    return null;
  }

  return order;
}

/**
 * Idempotency & Outbox Management:
 * Checks whether an event has already been delivered for an order.
 * If the public.order_notifications table exists, records status to prevent duplicates.
 */
async function claimNotification(params: {
  orderId: string;
  eventType: string;
  recipientRole: 'customer' | 'admin';
  recipientEmail: string;
  subject: string;
}): Promise<{ shouldSend: boolean; notificationId?: string }> {
  try {
    const adminClient = createAdminClient();

    // 1. Check existing record in order_notifications
    const { data: existing, error: selectErr } = await adminClient
      .from('order_notifications')
      .select('id, status, sent_at')
      .eq('order_id', params.orderId)
      .eq('event_type', params.eventType)
      .eq('recipient_role', params.recipientRole)
      .maybeSingle();

    if (!selectErr && existing) {
      if (existing.status === 'sent') {
        // Already sent! Skip to guarantee idempotency.
        return { shouldSend: false, notificationId: existing.id };
      }
    }

    // 2. Record pending state
    const { data: inserted, error: insertErr } = await adminClient
      .from('order_notifications')
      .upsert(
        {
          order_id: params.orderId,
          event_type: params.eventType,
          recipient_role: params.recipientRole,
          recipient_email: params.recipientEmail,
          subject: params.subject,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id,event_type,recipient_role' }
      )
      .select('id')
      .maybeSingle();

    if (insertErr) {
      // If table doesn't exist yet (42P01), log and allow send
      if (insertErr.code === '42P01') {
        return { shouldSend: true };
      }
      console.warn('[Notifications] Deduplication check warning:', insertErr.message);
      return { shouldSend: true };
    }

    return { shouldSend: true, notificationId: inserted?.id };
  } catch (err) {
    console.warn('[Notifications] Deduplication check exception:', err);
    return { shouldSend: true };
  }
}

/**
 * Updates notification outbox status after sending attempt.
 */
async function finalizeNotification(params: {
  notificationId?: string;
  orderId: string;
  eventType: string;
  recipientRole: 'customer' | 'admin';
  recipientEmail: string;
  subject: string;
  resendId?: string;
  error?: string;
}) {
  try {
    const adminClient = createAdminClient();
    const isSuccess = !params.error;

    await adminClient
      .from('order_notifications')
      .upsert(
        {
          order_id: params.orderId,
          event_type: params.eventType,
          recipient_role: params.recipientRole,
          recipient_email: params.recipientEmail,
          subject: params.subject,
          status: isSuccess ? 'sent' : 'failed',
          resend_id: params.resendId || null,
          error_message: params.error || null,
          sent_at: isSuccess ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id,event_type,recipient_role' }
      );
  } catch {
    // Gracefully handle if order_notifications table does not exist
  }
}

// ---------------------------------------------------------------------------
// 1. ORDER CREATED NOTIFICATIONS (Customer & Admin)
// ---------------------------------------------------------------------------

/**
 * Trigger Point 1: Order Created
 * Dispatches transactional notifications when an order becomes a valid admin-visible order:
 * - Online order: after payment proof submission.
 * - COD order with advance: after delivery advance payment proof submission.
 * - COD order with zero delivery fee: immediately after checkout creation.
 *
 * Never sends emails for abandoned 'Awaiting Payment' drafts.
 */
export async function sendOrderCreatedNotifications(
  orderId: string
): Promise<{ customer: SendEmailResult; admin: SendEmailResult }> {
  const result: { customer: SendEmailResult; admin: SendEmailResult } = {
    customer: { success: false, skipped: true },
    admin: { success: false, skipped: true },
  };

  try {
    const order = await fetchFullOrderRecord(orderId);
    if (!order) {
      return result;
    }

    // Safety Guard: Do not send for abandoned draft orders still in 'Awaiting Payment'
    if (order.status === 'Awaiting Payment') {
      console.log(
        `[Notifications] Order ${order.order_number} is still in draft state (Awaiting Payment). Notification bypassed.`
      );
      return result;
    }

    const baseUrl = getAppBaseUrl();
    const customerEmail =
      order.customer?.email ||
      order.shipping_address_snapshot?.email ||
      '';
    const customerName =
      order.customer?.full_name ||
      order.shipping_address_snapshot?.recipient_name ||
      'Valued Customer';

    const items: OrderItemSummary[] = (order.order_items || []).map((it: any) => ({
      productName: it.product_name,
      brandName: it.brand_name,
      variantName: it.variant_name,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      totalPrice: Number(it.total_price),
      imageUrl: it.image_url,
    }));

    const addressSnapshot: ShippingAddressSummary = {
      recipientName: order.shipping_address_snapshot?.recipient_name,
      phone: order.shipping_address_snapshot?.phone,
      streetAddress: order.shipping_address_snapshot?.street_address,
      city: order.shipping_address_snapshot?.city,
      state: order.shipping_address_snapshot?.state,
      postalCode: order.shipping_address_snapshot?.postal_code,
      addressType: order.shipping_address_snapshot?.address_type,
    };

    const latestPayment = Array.isArray(order.payments) && order.payments.length > 0
      ? order.payments[order.payments.length - 1]
      : null;

    const emailData: any = {
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      orderType: order.order_type as 'online' | 'cod',
      items,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.delivery_fee),
      totalAmount: Number(order.total_amount),
      advanceAmountPaid: Number(order.advance_amount_paid || 0),
      balanceAmountDue: Number(order.balance_amount_due || 0),
      shippingAddress: addressSnapshot,
      orderUrl: `${baseUrl}/account`,
      customerName,
      customerEmail,
      customerPhone: order.customer?.phone || addressSnapshot.phone,
      utrReference: latestPayment?.utr_reference || null,
    };

    // A. Send to Customer
    if (customerEmail) {
      const customerTemplate = buildCustomerOrderCreatedEmail(emailData);
      const claim = await claimNotification({
        orderId: order.id,
        eventType: 'order_created_customer',
        recipientRole: 'customer',
        recipientEmail: customerEmail,
        subject: customerTemplate.subject,
      });

      if (claim.shouldSend) {
        const sendRes = await sendEmailWithResend({
          to: customerEmail,
          subject: customerTemplate.subject,
          html: customerTemplate.html,
          text: customerTemplate.text,
        });

        await finalizeNotification({
          notificationId: claim.notificationId,
          orderId: order.id,
          eventType: 'order_created_customer',
          recipientRole: 'customer',
          recipientEmail: customerEmail,
          subject: customerTemplate.subject,
          resendId: sendRes.id,
          error: sendRes.error,
        });

        result.customer = sendRes;
      } else {
        result.customer = { success: true, skipped: true, reason: 'Already delivered.' };
      }
    }

    // B. Send to Admin
    const adminEmail = getAdminNotificationEmail();
    if (adminEmail) {
      const adminData = {
        ...emailData,
        orderUrl: `${baseUrl}/admin/orders/${order.id}`,
      };
      const adminTemplate = buildAdminOrderCreatedEmail(adminData);
      const claim = await claimNotification({
        orderId: order.id,
        eventType: 'order_created_admin',
        recipientRole: 'admin',
        recipientEmail: adminEmail,
        subject: adminTemplate.subject,
      });

      if (claim.shouldSend) {
        const sendRes = await sendEmailWithResend({
          to: adminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
          text: adminTemplate.text,
        });

        await finalizeNotification({
          notificationId: claim.notificationId,
          orderId: order.id,
          eventType: 'order_created_admin',
          recipientRole: 'admin',
          recipientEmail: adminEmail,
          subject: adminTemplate.subject,
          resendId: sendRes.id,
          error: sendRes.error,
        });

        result.admin = sendRes;
      } else {
        result.admin = { success: true, skipped: true, reason: 'Already delivered.' };
      }
    }
  } catch (err: unknown) {
    console.error('[Notifications] sendOrderCreatedNotifications exception:', err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 2. PAYMENT VERIFIED NOTIFICATION (Customer Only)
// ---------------------------------------------------------------------------

/**
 * Trigger Point 2: Payment Verified
 * Dispatches an email to the customer when an admin verifies payment receipt.
 * Never sends an admin notification.
 */
export async function sendPaymentVerifiedNotification(
  orderId: string,
  details: {
    paymentId?: string;
    verifiedAmount: number;
  }
): Promise<SendEmailResult> {
  try {
    const order = await fetchFullOrderRecord(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const customerEmail =
      order.customer?.email ||
      order.shipping_address_snapshot?.email ||
      '';

    if (!customerEmail) {
      console.warn('[Notifications] No customer email found for payment verification alert.');
      return { success: false, error: 'Customer email missing.' };
    }

    const customerName =
      order.customer?.full_name ||
      order.shipping_address_snapshot?.recipient_name ||
      'Valued Customer';

    const baseUrl = getAppBaseUrl();
    const isOnline = order.order_type === 'online';
    const paymentMethodLabel = isOnline ? 'Online Payment (UPI)' : 'COD Delivery Advance';

    const templateData = {
      orderNumber: order.order_number,
      customerName,
      verifiedAmount: Number(details.verifiedAmount),
      paymentMethod: paymentMethodLabel,
      orderType: order.order_type as 'online' | 'cod',
      balanceRemaining: Number(order.balance_amount_due || 0),
      orderUrl: `${baseUrl}/account`,
    };

    const template = buildPaymentVerifiedEmail(templateData);

    const claim = await claimNotification({
      orderId: order.id,
      eventType: 'payment_verified',
      recipientRole: 'customer',
      recipientEmail: customerEmail,
      subject: template.subject,
    });

    if (!claim.shouldSend) {
      return { success: true, skipped: true, reason: 'Already delivered.' };
    }

    const sendRes = await sendEmailWithResend({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await finalizeNotification({
      notificationId: claim.notificationId,
      orderId: order.id,
      eventType: 'payment_verified',
      recipientRole: 'customer',
      recipientEmail: customerEmail,
      subject: template.subject,
      resendId: sendRes.id,
      error: sendRes.error,
    });

    return sendRes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send payment verified alert.';
    console.error('[Notifications] sendPaymentVerifiedNotification exception:', msg);
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// 3. ORDER DELIVERED NOTIFICATION (Customer Only)
// ---------------------------------------------------------------------------

/**
 * Trigger Point 3: Order Delivered
 * Dispatches an email to the customer when fulfillment status transitions to 'Delivered'.
 * Never sends an admin notification.
 */
export async function sendOrderDeliveredNotification(
  orderId: string
): Promise<SendEmailResult> {
  try {
    const order = await fetchFullOrderRecord(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const customerEmail =
      order.customer?.email ||
      order.shipping_address_snapshot?.email ||
      '';

    if (!customerEmail) {
      console.warn('[Notifications] No customer email found for order delivery alert.');
      return { success: false, error: 'Customer email missing.' };
    }

    const customerName =
      order.customer?.full_name ||
      order.shipping_address_snapshot?.recipient_name ||
      'Valued Customer';

    const baseUrl = getAppBaseUrl();

    const items: OrderItemSummary[] = (order.order_items || []).map((it: any) => ({
      productName: it.product_name,
      brandName: it.brand_name,
      variantName: it.variant_name,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      totalPrice: Number(it.total_price),
      imageUrl: it.image_url,
    }));

    const addressSnapshot: ShippingAddressSummary = {
      recipientName: order.shipping_address_snapshot?.recipient_name,
      phone: order.shipping_address_snapshot?.phone,
      streetAddress: order.shipping_address_snapshot?.street_address,
      city: order.shipping_address_snapshot?.city,
      state: order.shipping_address_snapshot?.state,
      postalCode: order.shipping_address_snapshot?.postal_code,
      addressType: order.shipping_address_snapshot?.address_type,
    };

    const templateData = {
      orderNumber: order.order_number,
      customerName,
      shippingAddress: addressSnapshot,
      items,
      orderUrl: `${baseUrl}/account`,
    };

    const template = buildOrderDeliveredEmail(templateData);

    const claim = await claimNotification({
      orderId: order.id,
      eventType: 'order_delivered',
      recipientRole: 'customer',
      recipientEmail: customerEmail,
      subject: template.subject,
    });

    if (!claim.shouldSend) {
      return { success: true, skipped: true, reason: 'Already delivered.' };
    }

    const sendRes = await sendEmailWithResend({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await finalizeNotification({
      notificationId: claim.notificationId,
      orderId: order.id,
      eventType: 'order_delivered',
      recipientRole: 'customer',
      recipientEmail: customerEmail,
      subject: template.subject,
      resendId: sendRes.id,
      error: sendRes.error,
    });

    return sendRes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send order delivered alert.';
    console.error('[Notifications] sendOrderDeliveredNotification exception:', msg);
    return { success: false, error: msg };
  }
}

