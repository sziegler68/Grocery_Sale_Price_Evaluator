import { UnitPreferences } from '../shared/utils/settings';

const CATEGORY_MAP: Record<string, keyof UnitPreferences> = {
    'Meat': 'meat',
    'Seafood': 'meat',
    'Poultry': 'meat',
    'Beef': 'meat',
    'Pork': 'meat',
    'Chicken': 'meat',
    'Produce': 'veggies', // Default fallback
    'Fruit': 'fruit',
    'Vegetables': 'veggies',
    'Dairy': 'dairy',
    'Cheese': 'dairy',
    'Yogurt': 'dairy',
    'Milk': 'milk',
    'Beverages': 'drinks',
    'Soda': 'soda',
    'Juice': 'drinks',
    'Water': 'drinks',
    'Tea': 'drinks',
    'Coffee': 'drinks',
};

// Mass (base: grams)
const TO_GRAMS: Record<string, number> = {
    'lb': 453.592,
    'lbs': 453.592,
    'pound': 453.592,
    'pounds': 453.592,
    'oz': 28.3495,
    'ounce': 28.3495,
    'ounces': 28.3495,
    'kg': 1000,
    'kilogram': 1000,
    'g': 1,
    'gram': 1,
    'grams': 1,
};

// Volume (base: ml)
const TO_ML: Record<string, number> = {
    'gal': 3785.41,
    'gallon': 3785.41,
    'gallons': 3785.41,
    'qt': 946.353,
    'quart': 946.353,
    'quarts': 946.353,
    'pt': 473.176,
    'pint': 473.176,
    'pints': 473.176,
    'cup': 236.588,
    'cups': 236.588,
    'fl oz': 29.5735,
    'l': 1000,
    'liter': 1000,
    'liters': 1000,
    'ml': 1,
    'milliliter': 1,
    'milliliters': 1,
};

export function getPreferredUnit(itemName: string, category: string, prefs: UnitPreferences): string {
    if (!prefs) return '';

    // 1. Check Custom Items (Case-insensitive)
    if (prefs.customItems) {
        const customKey = Object.keys(prefs.customItems).find(k => k.toLowerCase() === itemName.toLowerCase());
        if (customKey) {
            return prefs.customItems[customKey];
        }
    }

    // 2. Check Category
    // Try exact match, then first word (e.g. "Dairy Products" -> "Dairy")
    const catKey = category ? (CATEGORY_MAP[category] || CATEGORY_MAP[category.split(' ')[0]]) : undefined;

    if (catKey && prefs[catKey]) {
        return prefs[catKey] as string;
    }

    return '';
}

/**
 * Converts a price per unit to a new unit.
 * @param price The price per 'fromUnit'
 * @param fromUnit The current unit
 * @param toUnit The target unit
 * @returns Object with new price and unit, or null if incompatible
 */
export function convertPrice(price: number, fromUnit: string, toUnit: string): { price: number, unit: string } | null {
    if (!fromUnit || !toUnit) return null;

    const normFrom = fromUnit.toLowerCase().trim();
    const normTo = toUnit.toLowerCase().trim();

    if (normFrom === normTo) return { price, unit: toUnit };

    // Mass conversion
    if (TO_GRAMS[normFrom] && TO_GRAMS[normTo]) {
        const newPrice = (price / TO_GRAMS[normFrom]) * TO_GRAMS[normTo];
        return { price: newPrice, unit: toUnit };
    }

    // Volume conversion
    if (TO_ML[normFrom] && TO_ML[normTo]) {
        const newPrice = (price / TO_ML[normFrom]) * TO_ML[normTo];
        return { price: newPrice, unit: toUnit };
    }

    return null; // Incompatible units (e.g. lb to gallon)
}
