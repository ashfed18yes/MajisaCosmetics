import QRCode from 'qrcode';

export interface BuildUpiUriParams {
  vpa: string;
  merchantName: string;
  amount: number;
  orderNumber: string;
  note?: string;
}

export interface UtrValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Constructs a standardized, compliant Indian UPI payment URI:
 * upi://pay?pa={vpa}&pn={merchantName}&am={amount}&tn={note}&cu=INR
 *
 * Parameters:
 * - pa: Payee VPA / UPI ID
 * - pn: Payee / Merchant Display Name
 * - am: Amount formatted strictly to 2 decimal places (e.g. "100.00")
 * - tn: Transaction note (e.g. order number)
 * - cu: Currency code (INR)
 */
export function buildUpiPaymentUri({
  vpa,
  merchantName,
  amount,
  orderNumber,
  note,
}: BuildUpiUriParams): string {
  if (!vpa || typeof vpa !== 'string') {
    throw new Error('Valid merchant UPI VPA is required to generate payment link.');
  }

  const cleanVpa = vpa.trim();
  const cleanName = (merchantName || 'Majisa Cosmetics').trim();
  const formattedAmount = Number(amount).toFixed(2);
  const transactionNote = (note || `Order ${orderNumber}`).trim();

  const searchParams = new URLSearchParams({
    pa: cleanVpa,
    pn: cleanName,
    am: formattedAmount,
    tn: transactionNote,
    cu: 'INR',
  });

  return `upi://pay?${searchParams.toString()}`;
}

/**
 * Generates a high-contrast Base64 Data URL (PNG) of the QR code.
 * Optimized for mobile screen scanning with standard UPI apps.
 */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  if (!upiUri) {
    throw new Error('UPI URI is required to generate QR code.');
  }

  return QRCode.toDataURL(upiUri, {
    margin: 2,
    width: 320,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1C1A18', // Brand charcoal for maximum optical contrast
      light: '#FFFFFF',
    },
  });
}

/**
 * Generates an SVG string of the QR code for scalable vector rendering.
 */
export async function generateUpiQrSvg(upiUri: string): Promise<string> {
  if (!upiUri) {
    throw new Error('UPI URI is required to generate QR code.');
  }

  return QRCode.toString(upiUri, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1C1A18',
      light: '#FFFFFF',
    },
  });
}

/**
 * Sanitizes and validates a user-submitted UTR / Reference Number.
 * Strict rules aligned with database procedure submit_payment_proof:
 * - Strips non-alphanumeric characters.
 * - Converts to uppercase.
 * - Enforces length between 8 and 22 characters.
 */
export function validateUtrFormat(utr: string): UtrValidationResult {
  if (!utr || typeof utr !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Please enter your UPI transaction UTR / Reference Number.',
    };
  }

  const sanitized = utr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (sanitized.length < 8) {
    return {
      isValid: false,
      sanitized,
      error: 'UTR / Reference Number must be at least 8 alphanumeric characters.',
    };
  }

  if (sanitized.length > 22) {
    return {
      isValid: false,
      sanitized,
      error: 'UTR / Reference Number cannot exceed 22 characters.',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

