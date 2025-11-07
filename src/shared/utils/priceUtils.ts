/**
 * Format a price value by rounding UP to 2 decimal places (cents)
 * Examples:
 *   0.3134 → 0.32
 *   0.31 → 0.31
 *   1.999 → 2.00
 *   5.1 → 5.10
 */
export const formatPrice = (price: number): string => {
  // Round up to 2 decimal places
  const rounded = Math.ceil(price * 100) / 100;
  return rounded.toFixed(2);
};

/**
 * Calculate unit price and round up to 2 decimal places
 */
export const calculateUnitPrice = (totalPrice: number, quantity: number): number => {
  const unitPrice = totalPrice / quantity;
  // Round up to 2 decimal places
  return Math.ceil(unitPrice * 100) / 100;
};
