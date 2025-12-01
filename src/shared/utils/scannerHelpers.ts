/**
 * Scanner Helper Functions
 * 
 * Utility functions for scanner feature: quantity calculation, price calculation, and deal indicators.
 */

/**
 * Parse sale requirement string to get minimum quantity
 * Examples: "Must Buy 2" → 2, "Buy 3 Get 1 Free" → 3
 */
export function getMinimumQuantity(saleRequirement?: string): number {
    if (!saleRequirement) return 1;

    // Match first number in requirement string
    const match = saleRequirement.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

/**
 * Calculate total price based on quantity and sale conditions
 */
export function calculateScannerTotal(
    quantity: number,
    regularPrice: number,
    salePrice?: number,
    saleRequirement?: string
): number {
    const minQty = getMinimumQuantity(saleRequirement);

    // Use sale price if available and quantity meets requirement
    const price = (salePrice && quantity >= minQty) ? salePrice : regularPrice;

    return price * quantity;
}

/**
 * Get deal indicator status by comparing scanned unit price to target
 */
export function getDealStatus(
    scannedUnitPrice: number,
    targetUnitPrice?: number
): {
    color: 'red' | 'green' | 'gray';
    message: string;
} {
    if (!targetUnitPrice) {
        return {
            color: 'gray',
            message: 'No target price set'
        };
    }

    if (scannedUnitPrice > targetUnitPrice) {
        return {
            color: 'red',
            message: `Higher than target ($${targetUnitPrice.toFixed(2)}/unit)`
        };
    }

    return {
        color: 'green',
        message: `Good deal! (vs $${targetUnitPrice.toFixed(2)}/unit)`
    };
}

/**
 * Get the effective unit price (sale if available and conditions met, otherwise regular)
 */
export function getEffectiveUnitPrice(
    quantity: number,
    regularUnitPrice: number,
    saleUnitPrice?: number,
    saleRequirement?: string
): number {
    const minQty = getMinimumQuantity(saleRequirement);

    // Use sale unit price if available and quantity meets requirement
    return (saleUnitPrice && quantity >= minQty) ? saleUnitPrice : regularUnitPrice;
}
