export interface DeliveryBracket {
  min: number;
  max: number | null;
  fee: number;
}

export const DELIVERY_BRACKETS: DeliveryBracket[] = [
  { min: 0, max: 500, fee: 100 },
  { min: 500, max: 2000, fee: 50 },
  { min: 2000, max: null, fee: 0 },
];

export const FREE_DELIVERY_THRESHOLD = 2000;

/**
 * Calculates authoritative delivery fee based on order subtotal:
 * - Below ₹500: ₹100
 * - ₹500 to below ₹2,000: ₹50
 * - ₹2,000 and above: Free (₹0)
 */
export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  if (subtotal >= 500) return 50;
  return 100;
}

