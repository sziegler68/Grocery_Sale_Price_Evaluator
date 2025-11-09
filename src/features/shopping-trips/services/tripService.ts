/**
 * Trip Service
 * Higher-level cart operations that can be shared by stores and future OCR
 * Provides validation, normalization, and business logic for shopping trips
 */

import {
  normalizeNumericInput,
  normalizeUnitType,
} from '@shared/utils/normalization';
import {
  validatePrice,
  validateQuantity,
  type ValidationResult,
} from '@shared/utils/validators';
import {
  addItemToCart as addItemToCartAPI,
  updateCartItem as updateCartItemAPI,
  removeCartItem as removeCartItemAPI,
  getCartItems,
  getTripById,
  completeTrip as completeTripAPI,
} from '../api';
import type { CartItem, AddCartItemInput, CartTotals } from '../types';

/**
 * Input for adding item to cart
 */
export interface AddToCartInput {
  trip_id: string;
  list_item_id?: string;
  item_name: string;
  price_paid: number | string;
  tax_amount: number | string;  // Calculated tax (from calculateItemTax)
  quantity: number | string;
  unit_type?: string;
  category?: string;
  target_price?: number | string;
  crv_amount?: number | string;
}

/**
 * Result of cart operation
 */
export interface CartOperationResult {
  success: boolean;
  item?: CartItem;
  error?: string;
  validation?: ValidationResult;
}

/**
 * Normalize and validate cart item input
 */
function normalizeAndValidateCartInput(input: AddToCartInput): {
  normalized: AddCartItemInput;
  validation: ValidationResult;
} {
  // Normalize numeric inputs
  const pricePaid = normalizeNumericInput(input.price_paid);
  const taxAmount = normalizeNumericInput(input.tax_amount);
  const quantity = normalizeNumericInput(input.quantity);
  const crvAmount = input.crv_amount ? normalizeNumericInput(input.crv_amount) : 0;
  const targetPrice = input.target_price ? normalizeNumericInput(input.target_price) : undefined;

  if (pricePaid === null || taxAmount === null || quantity === null) {
    return {
      normalized: {} as AddCartItemInput,
      validation: {
        isValid: false,
        error: 'Invalid price, tax, or quantity'
      }
    };
  }

  // Validate price and quantity
  const priceValidation = validatePrice(pricePaid);
  if (!priceValidation.isValid) {
    return {
      normalized: {} as AddCartItemInput,
      validation: priceValidation
    };
  }

  const quantityValidation = validateQuantity(quantity);
  if (!quantityValidation.isValid) {
    return {
      normalized: {} as AddCartItemInput,
      validation: quantityValidation
    };
  }

  // Normalize text inputs
  const normalized: AddCartItemInput = {
    trip_id: input.trip_id,
    list_item_id: input.list_item_id,
    item_name: input.item_name, // Keep original capitalization for display
    price_paid: pricePaid,
    tax_amount: taxAmount,
    quantity,
    unit_type: input.unit_type ? normalizeUnitType(input.unit_type) : undefined,
    category: input.category,
    target_price: targetPrice !== null ? targetPrice : undefined,
    crv_amount: crvAmount || 0,
  };

  return {
    normalized,
    validation: { isValid: true }
  };
}

/**
 * Add item to cart with validation and normalization
 */
export async function addItemToCart(input: AddToCartInput): Promise<CartOperationResult> {
  // Normalize and validate
  const { normalized, validation } = normalizeAndValidateCartInput(input);

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
      validation,
    };
  }

  try {
    const item = await addItemToCartAPI(normalized);
    return {
      success: true,
      item,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add item to cart',
    };
  }
}

/**
 * Update cart item with validation
 */
export async function updateCartItem(
  itemId: string,
  updates: {
    price_paid?: number | string;
    tax_amount?: number | string;
    quantity?: number | string;
    crv_amount?: number | string;
  }
): Promise<CartOperationResult> {
  // Normalize numeric inputs
  const normalized: any = {};

  if (updates.price_paid !== undefined) {
    const pricePaid = normalizeNumericInput(updates.price_paid);
    if (pricePaid === null) {
      return {
        success: false,
        error: 'Invalid price',
      };
    }
    const priceValidation = validatePrice(pricePaid);
    if (!priceValidation.isValid) {
      return {
        success: false,
        error: priceValidation.error,
        validation: priceValidation,
      };
    }
    normalized.price_paid = pricePaid;
  }

  if (updates.tax_amount !== undefined) {
    const taxAmount = normalizeNumericInput(updates.tax_amount);
    if (taxAmount === null) {
      return {
        success: false,
        error: 'Invalid tax amount',
      };
    }
    normalized.tax_amount = taxAmount;
  }

  if (updates.quantity !== undefined) {
    const quantity = normalizeNumericInput(updates.quantity);
    if (quantity === null) {
      return {
        success: false,
        error: 'Invalid quantity',
      };
    }
    const quantityValidation = validateQuantity(quantity);
    if (!quantityValidation.isValid) {
      return {
        success: false,
        error: quantityValidation.error,
        validation: quantityValidation,
      };
    }
    normalized.quantity = quantity;
  }

  if (updates.crv_amount !== undefined) {
    const crvAmount = normalizeNumericInput(updates.crv_amount);
    if (crvAmount === null) {
      return {
        success: false,
        error: 'Invalid CRV amount',
      };
    }
    normalized.crv_amount = crvAmount;
  }

  try {
    await updateCartItemAPI(itemId, normalized);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update cart item',
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeItemFromCart(itemId: string): Promise<CartOperationResult> {
  try {
    await removeCartItemAPI(itemId);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to remove item from cart',
    };
  }
}

/**
 * Calculate tax for a single item
 * SINGLE SOURCE OF TRUTH for tax calculation
 */
export function calculateItemTax(pricePaid: number, salesTaxRate: number): number {
  return pricePaid * (salesTaxRate / 100);
}

/**
 * Compute cart totals from cart items
 * This is the SINGLE SOURCE OF TRUTH for all cart calculations
 * 
 * @param items - Array of cart items (with stored tax_amount)
 * @returns Aggregated totals
 */
export function computeCartTotals(items: CartItem[]): CartTotals {
  let subtotal = 0;    // Sum of all price_paid
  let tax = 0;         // Sum of all tax_amount (stored)
  let crv = 0;         // Sum of all crv_amount
  
  items.forEach(item => {
    subtotal += item.price_paid || 0;
    tax += item.tax_amount || 0;
    crv += item.crv_amount || 0;
  });
  
  return {
    subtotal,
    tax,
    crv,
    total: subtotal + tax + crv,
    itemCount: items.length,
  };
}

/**
 * Legacy async version for backward compatibility
 * @deprecated Use computeCartTotals with items from store instead
 */
export async function calculateCartTotals(
  tripId: string
): Promise<CartTotals> {
  const items = await getCartItems(tripId);
  return computeCartTotals(items);
}

/**
 * Validate budget before completing trip
 */
export async function validateBudgetCompliance(tripId: string): Promise<{
  withinBudget: boolean;
  totalSpent: number;
  budget: number;
  difference: number;
}> {
  const trip = await getTripById(tripId);
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  const totalSpent = trip.total_spent;
  const budget = trip.budget;
  const difference = budget - totalSpent;
  
  return {
    withinBudget: difference >= 0,
    totalSpent,
    budget,
    difference: Math.abs(difference),
  };
}

/**
 * Complete shopping trip
 */
export async function completeShoppingTrip(tripId: string): Promise<CartOperationResult> {
  try {
    await completeTripAPI(tripId);
    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to complete trip',
    };
  }
}

/**
 * Batch add items to cart (useful for OCR)
 */
export async function batchAddToCart(
  items: AddToCartInput[],
  options: {
    stopOnError?: boolean;
  } = {}
): Promise<CartOperationResult[]> {
  const { stopOnError = false } = options;
  const results: CartOperationResult[] = [];

  for (const item of items) {
    const result = await addItemToCart(item);
    results.push(result);

    if (!result.success && stopOnError) {
      break;
    }
  }

  return results;
}
