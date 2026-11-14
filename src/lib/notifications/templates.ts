/**
 * High-Converting, Responsive HTML Email Templates for Majisa Cosmetics.
 * Styled with inline CSS to guarantee universal compatibility across Gmail, Outlook, Apple Mail, etc.
 * Reflects Majisa Cosmetics' regal botanical luxury aesthetic: #0B4145, #128F92, #DDF3F2.
 */

export interface OrderItemSummary {
  productName: string;
  brandName?: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface ShippingAddressSummary {
  recipientName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  addressType?: string;
}

export interface OrderCreatedEmailData {
  orderNumber: string;
  orderDate: string;
  orderType: 'online' | 'cod';
  items: OrderItemSummary[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  advanceAmountPaid: number;
  balanceAmountDue: number;
  shippingAddress: ShippingAddressSummary;
  orderUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  utrReference?: string | null;
}

export interface PaymentVerifiedEmailData {
  orderNumber: string;
  customerName: string;
  verifiedAmount: number;
  paymentMethod: string;
  orderType: 'online' | 'cod';
  balanceRemaining: number;
  orderUrl: string;
}

export interface OrderDeliveredEmailData {
  orderNumber: string;
  customerName: string;
  shippingAddress: ShippingAddressSummary;
  items: OrderItemSummary[];
  orderUrl: string;
}

function emailWrapper(content: string, previewText: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Majisa Cosmetics</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAF9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #102F32;">
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAF9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2ECEA; box-shadow: 0 4px 20px rgba(11,65,69,0.06);" cellspacing="0" cellpadding="0" border="0">
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #0B4145; padding: 28px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 42px; height: 42px; line-height: 42px; border-radius: 50%; background-color: #DDF3F2; color: #128F92; font-family: Georgia, serif; font-size: 22px; font-weight: bold; margin-bottom: 8px;">
                      M
                    </div>
                    <div style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; letter-spacing: 0.18em; color: #FFFFFF; text-transform: uppercase;">
                      MAJISA
                    </div>
                    <div style="font-size: 10px; font-weight: 600; letter-spacing: 0.28em; color: #DDF3F2; text-transform: uppercase; margin-top: 2px;">
                      COSMETICS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Slot -->
          <tr>
            <td style="padding: 32px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F0F6F5; border-top: 1px solid #E2ECEA; padding: 24px; text-align: center; color: #687F8D; font-size: 12px; line-height: 1.6;">
              <div style="font-weight: bold; color: #0B4145; font-size: 13px; margin-bottom: 4px;">
                Majisa Cosmetics Boutique
              </div>
              <div>
                Shop No. 02, 03, Sai Vatika Complex, Near Sahyog Hotel, Kadodara, Surat, Gujarat 394305
              </div>
              <div style="margin-top: 8px;">
                Concierge Assistance: <a href="tel:+916377482039" style="color: #128F92; text-decoration: none; font-weight: bold;">+91 6377482039</a> &bull; <a href="mailto:majisacosmeticsales@gmail.com" style="color: #128F92; text-decoration: none; font-weight: bold;">majisacosmeticsales@gmail.com</a>
              </div>
              <div style="margin-top: 14px; font-size: 11px; color: #9AAEB0;">
                &copy; ${new Date().getFullYear()} Majisa Cosmetics. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderItemsTable(items: OrderItemSummary[]): string {
  if (!items || items.length === 0) return '';

  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #EDF3F2;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            ${
              item.imageUrl
                ? `
            <td width="54" valign="top" style="padding-right: 12px;">
              <img src="${item.imageUrl}" alt="${item.productName}" width="54" height="68" style="border-radius: 8px; object-fit: contain; background: #F8FAF9; border: 1px solid #E2ECEA; display: block;" />
            </td>`
                : ''
            }
            <td valign="top" style="vertical-align: top;">
              <div style="font-weight: bold; font-size: 13px; color: #0B4145; line-height: 1.3;">
                ${item.productName}
              </div>
              ${
                item.variantName
                  ? `<div style="font-size: 11px; color: #687F8D; margin-top: 2px;">Variant: ${item.variantName}</div>`
                  : ''
              }
              <div style="font-size: 11px; color: #687F8D; margin-top: 2px;">
                Qty: ${item.quantity} &times; &#8377;${item.unitPrice.toLocaleString('en-IN')}
              </div>
            </td>
            <td align="right" valign="top" style="vertical-align: top; font-weight: bold; font-size: 13px; color: #0B4145; white-space: nowrap;">
              &#8377;${item.totalPrice.toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('');

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
    ${rows}
  </table>`;
}

function renderAddressBlock(address: ShippingAddressSummary): string {
  if (!address) return '';
  return `
  <div style="background-color: #F8FAF9; border: 1px solid #E2ECEA; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #128F92; margin-bottom: 6px;">
      Delivery Address (${address.addressType || 'Shipping'})
    </div>
    <div style="font-size: 13px; font-weight: bold; color: #0B4145; margin-bottom: 2px;">
      ${address.recipientName || 'Customer'}
    </div>
    <div style="font-size: 12px; color: #4B6366; line-height: 1.5;">
      ${address.streetAddress ? `${address.streetAddress}<br>` : ''}
      ${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.postalCode || ''}
      ${address.phone ? `<br>Contact: <strong>${address.phone}</strong>` : ''}
    </div>
  </div>`;
}

/**
 * 1A. Customer Order Created Email Template
 */
export function buildCustomerOrderCreatedEmail(data: OrderCreatedEmailData): { subject: string; html: string; text: string } {
  const isOnline = data.orderType === 'online';
  const isZeroAdvanceCod = data.orderType === 'cod' && data.deliveryFee === 0;

  const paymentStatusNote = isZeroAdvanceCod
    ? `Your order has been <strong>confirmed</strong> with complimentary free delivery. The total balance of <strong>&#8377;${data.totalAmount.toLocaleString('en-IN')}</strong> will be collected upon doorstep delivery.`
    : isOnline
    ? `We have received your payment proof (UTR: <strong>${data.utrReference || 'Submitted'}</strong>). Our boutique atelier is reviewing your transaction and will verify it shortly.`
    : `We have received your advance delivery fee payment proof (UTR: <strong>${data.utrReference || 'Submitted'}</strong>). Our atelier is verifying your advance of &#8377;${data.advanceAmountPaid.toLocaleString('en-IN')}. The remaining balance of <strong>&#8377;${data.balanceAmountDue.toLocaleString('en-IN')}</strong> will be due at delivery.`;

  const subject = `Order Confirmed: ${data.orderNumber} - Majisa Cosmetics`;

  const content = `
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #DDF3F2; color: #0B4145; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
      Order Placed Successfully
    </span>
    <h1 style="font-family: Georgia, serif; font-size: 24px; color: #0B4145; margin: 4px 0 8px 0; font-weight: bold;">
      Thank You for Your Order
    </h1>
    <p style="font-size: 13px; color: #687F8D; margin: 0;">
      Order Ref: <strong style="color: #0B4145;">${data.orderNumber}</strong> &bull; ${data.orderDate}
    </p>
  </div>

  <p style="font-size: 14px; color: #2D3E40; line-height: 1.6; margin: 0 0 16px 0;">
    Dear <strong>${data.customerName || 'Valued Customer'}</strong>,
  </p>
  <p style="font-size: 13px; color: #4B6366; line-height: 1.6; margin: 0 0 20px 0;">
    We are delighted to receive your formulation order. ${paymentStatusNote}
  </p>

  <!-- Items Summary -->
  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #128F92; border-bottom: 2px solid #DDF3F2; padding-bottom: 6px;">
    Items Ordered
  </div>
  ${renderItemsTable(data.items)}

  <!-- Financial Breakdown -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 12px; border-top: 1px solid #E2ECEA; padding-top: 12px;">
    <tr>
      <td style="padding: 4px 0; font-size: 12px; color: #687F8D;">Subtotal</td>
      <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: bold; color: #0B4145;">&#8377;${data.subtotal.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; font-size: 12px; color: #687F8D;">Delivery Fee</td>
      <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: bold; color: #0B4145;">${data.deliveryFee === 0 ? '<span style="color: #128F92;">FREE</span>' : `&#8377;${data.deliveryFee.toLocaleString('en-IN')}`}</td>
    </tr>
    <tr style="border-top: 1px dashed #DDF3F2;">
      <td style="padding: 8px 0; font-size: 14px; font-weight: bold; color: #0B4145;">Total Order Value</td>
      <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: bold; color: #128F92;">&#8377;${data.totalAmount.toLocaleString('en-IN')}</td>
    </tr>
    ${
      !isOnline && data.balanceAmountDue > 0
        ? `
    <tr>
      <td style="padding: 4px 0; font-size: 12px; color: #8F5400;">Remaining Due on Delivery (COD)</td>
      <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold; color: #8F5400;">&#8377;${data.balanceAmountDue.toLocaleString('en-IN')}</td>
    </tr>`
        : ''
    }
  </table>

  ${renderAddressBlock(data.shippingAddress)}

  <!-- CTA -->
  <div style="text-align: center; margin-top: 28px;">
    <a href="${data.orderUrl}" style="display: inline-block; background-color: #128F92; color: #FFFFFF; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 4px 12px rgba(18,143,146,0.25);">
      View Order in Account
    </a>
  </div>`;

  const text = `Thank you for your order! Order ${data.orderNumber} placed on ${data.orderDate}.\nTotal: Rs ${data.totalAmount}.\nView your order: ${data.orderUrl}`;

  return { subject, html: emailWrapper(content, `Order confirmation for ${data.orderNumber}`), text };
}

/**
 * 1B. Admin Order Created Notification Email Template
 */
export function buildAdminOrderCreatedEmail(data: OrderCreatedEmailData): { subject: string; html: string; text: string } {
  const isOnline = data.orderType === 'online';
  const isZeroAdvanceCod = data.orderType === 'cod' && data.deliveryFee === 0;

  const subject = `[NEW ORDER] ${data.orderNumber} - ₹${data.totalAmount.toLocaleString('en-IN')} (${data.orderType.toUpperCase()})`;

  const content = `
  <div style="border-left: 4px solid #128F92; padding-left: 12px; margin-bottom: 20px;">
    <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #128F92;">
      Admin Store Notification
    </span>
    <h2 style="font-family: Georgia, serif; font-size: 20px; color: #0B4145; margin: 4px 0;">
      New Order Received: ${data.orderNumber}
    </h2>
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAF9; border: 1px solid #E2ECEA; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
    <tr>
      <td width="35%" style="color: #687F8D; font-weight: bold;">Customer:</td>
      <td style="color: #0B4145; font-weight: bold;">${data.customerName} (${data.customerEmail})</td>
    </tr>
    <tr>
      <td style="color: #687F8D; font-weight: bold;">Phone:</td>
      <td style="color: #0B4145;">${data.customerPhone || data.shippingAddress.phone || 'N/A'}</td>
    </tr>
    <tr>
      <td style="color: #687F8D; font-weight: bold;">Order Type:</td>
      <td style="color: #0B4145; text-transform: uppercase; font-weight: bold;">${data.orderType}</td>
    </tr>
    <tr>
      <td style="color: #687F8D; font-weight: bold;">Payment Method:</td>
      <td style="color: #0B4145;">${isZeroAdvanceCod ? 'COD (Free Delivery - No Advance Needed)' : isOnline ? 'Online UPI' : 'COD (Advance Delivery Fee)'}</td>
    </tr>
    ${
      data.utrReference
        ? `
    <tr>
      <td style="color: #687F8D; font-weight: bold;">Submitted UTR:</td>
      <td style="color: #128F92; font-weight: bold; font-family: monospace; font-size: 13px;">${data.utrReference}</td>
    </tr>`
        : ''
    }
    <tr>
      <td style="color: #687F8D; font-weight: bold;">Order Total:</td>
      <td style="color: #128F92; font-weight: bold; font-size: 14px;">&#8377;${data.totalAmount.toLocaleString('en-IN')}</td>
    </tr>
    ${
      !isOnline
        ? `
    <tr>
      <td style="color: #8F5400; font-weight: bold;">COD Balance Due:</td>
      <td style="color: #8F5400; font-weight: bold;">&#8377;${data.balanceAmountDue.toLocaleString('en-IN')}</td>
    </tr>`
        : ''
    }
  </table>

  <!-- Items -->
  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #128F92; border-bottom: 2px solid #DDF3F2; padding-bottom: 6px;">
    Order Line Items
  </div>
  ${renderItemsTable(data.items)}

  ${renderAddressBlock(data.shippingAddress)}

  <div style="text-align: center; margin-top: 24px;">
    <a href="${data.orderUrl}" style="display: inline-block; background-color: #0B4145; color: #FFFFFF; font-size: 12px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.08em;">
      Open Order in Admin Panel &rarr;
    </a>
  </div>`;

  const text = `New order ${data.orderNumber} received for Rs ${data.totalAmount}. Customer: ${data.customerName} (${data.customerEmail}). Manage order: ${data.orderUrl}`;

  return { subject, html: emailWrapper(content, `New order ${data.orderNumber} received`), text };
}

/**
 * 2. Payment Verified Email Template (Customer Only)
 */
export function buildPaymentVerifiedEmail(data: PaymentVerifiedEmailData): { subject: string; html: string; text: string } {
  const subject = `Payment Verified for Order ${data.orderNumber} - Majisa Cosmetics`;

  const content = `
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: #DDF3F2; color: #128F92; font-size: 22px; margin-bottom: 8px;">
      &#10003;
    </div>
    <h1 style="font-family: Georgia, serif; font-size: 22px; color: #0B4145; margin: 4px 0 8px 0; font-weight: bold;">
      Payment Successfully Verified
    </h1>
    <p style="font-size: 13px; color: #687F8D; margin: 0;">
      Order Ref: <strong style="color: #0B4145;">${data.orderNumber}</strong>
    </p>
  </div>

  <p style="font-size: 14px; color: #2D3E40; line-height: 1.6; margin: 0 0 16px 0;">
    Dear <strong>${data.customerName || 'Valued Customer'}</strong>,
  </p>
  <p style="font-size: 13px; color: #4B6366; line-height: 1.6; margin: 0 0 20px 0;">
    We are pleased to inform you that your payment transaction has been authoritatively verified by our accounts atelier. Your order status is now confirmed and our formulation team is preparing your package for fulfillment.
  </p>

  <!-- Verification Card -->
  <div style="background-color: #F8FAF9; border: 1px solid #BCE7E5; border-radius: 12px; padding: 18px; margin: 20px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px; line-height: 1.6;">
      <tr>
        <td style="color: #687F8D; padding: 4px 0;">Verified Amount:</td>
        <td align="right" style="color: #128F92; font-weight: bold; font-size: 16px;">&#8377;${data.verifiedAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color: #687F8D; padding: 4px 0;">Payment Category:</td>
        <td align="right" style="color: #0B4145; font-weight: bold;">${data.paymentMethod}</td>
      </tr>
      <tr>
        <td style="color: #687F8D; padding: 4px 0;">Order Status:</td>
        <td align="right" style="color: #0B4145; font-weight: bold;"><span style="background-color: #DDF3F2; color: #0B4145; padding: 2px 8px; border-radius: 9999px; font-size: 11px;">Confirmed</span></td>
      </tr>
      ${
        data.orderType === 'cod' && data.balanceRemaining > 0
          ? `
      <tr style="border-top: 1px dashed #DDF3F2;">
        <td style="color: #8F5400; font-weight: bold; padding-top: 8px;">Remaining Balance at Delivery:</td>
        <td align="right" style="color: #8F5400; font-weight: bold; font-size: 14px; padding-top: 8px;">&#8377;${data.balanceRemaining.toLocaleString('en-IN')}</td>
      </tr>`
          : `
      <tr style="border-top: 1px dashed #DDF3F2;">
        <td style="color: #128F92; font-weight: bold; padding-top: 8px;">Remaining Balance:</td>
        <td align="right" style="color: #128F92; font-weight: bold; padding-top: 8px;">&#8377;0 (Fully Paid)</td>
      </tr>`
      }
    </table>
  </div>

  <div style="text-align: center; margin-top: 28px;">
    <a href="${data.orderUrl}" style="display: inline-block; background-color: #128F92; color: #FFFFFF; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 4px 12px rgba(18,143,146,0.25);">
      Track Order Progress
    </a>
  </div>`;

  const text = `Payment verified for Order ${data.orderNumber}. Verified Amount: Rs ${data.verifiedAmount}. Track your order: ${data.orderUrl}`;

  return { subject, html: emailWrapper(content, `Payment verified for Order ${data.orderNumber}`), text };
}

/**
 * 3. Order Delivered Email Template (Customer Only)
 */
export function buildOrderDeliveredEmail(data: OrderDeliveredEmailData): { subject: string; html: string; text: string } {
  const subject = `Your Majisa Formulations Have Arrived: Order ${data.orderNumber}`;

  const content = `
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #DDF3F2; color: #0B4145; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
      Delivered
    </span>
    <h1 style="font-family: Georgia, serif; font-size: 24px; color: #0B4145; margin: 4px 0 8px 0; font-weight: bold;">
      Your Formulations Have Arrived
    </h1>
    <p style="font-size: 13px; color: #687F8D; margin: 0;">
      Order Ref: <strong style="color: #0B4145;">${data.orderNumber}</strong>
    </p>
  </div>

  <p style="font-size: 14px; color: #2D3E40; line-height: 1.6; margin: 0 0 16px 0;">
    Dear <strong>${data.customerName || 'Valued Customer'}</strong>,
  </p>
  <p style="font-size: 13px; color: #4B6366; line-height: 1.6; margin: 0 0 20px 0;">
    We are delighted to confirm that your order <strong>${data.orderNumber}</strong> has been successfully delivered. We hope these handcrafted botanical formulations elevate your daily ritual with pure radiance and grace.
  </p>

  <!-- Items Summary -->
  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #128F92; border-bottom: 2px solid #DDF3F2; padding-bottom: 6px;">
    Delivered Package Contents
  </div>
  ${renderItemsTable(data.items)}

  ${renderAddressBlock(data.shippingAddress)}

  <div style="background-color: #DDF3F2; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
    <h3 style="font-family: Georgia, serif; font-size: 16px; color: #0B4145; margin: 0 0 6px 0;">
      A Note of Gratitude
    </h3>
    <p style="font-size: 12px; color: #0B4145; line-height: 1.5; margin: 0;">
      Thank you for welcoming Majisa Cosmetics into your home. If you have any inquiries regarding application rituals or ingredient profiles, our personal concierge is always at your service.
    </p>
  </div>

  <div style="text-align: center; margin-top: 24px;">
    <a href="${data.orderUrl}" style="display: inline-block; background-color: #0B4145; color: #FFFFFF; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.08em;">
      View Order in Account
    </a>
  </div>`;

  const text = `Order ${data.orderNumber} has been delivered. Thank you for choosing Majisa Cosmetics! View your order: ${data.orderUrl}`;

  return { subject, html: emailWrapper(content, `Order ${data.orderNumber} has been delivered`), text };
}

