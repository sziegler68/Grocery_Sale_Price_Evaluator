/**
 * Text and number normalization utilities
 * Used to standardize input before processing, matching, or storage
 */

/**
 * Normalize item name for matching and storage
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes extra spaces
 * - Removes special characters (except hyphens and apostrophes)
 */
export function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^a-z0-9\s'-]/gi, ''); // Keep only alphanumeric, spaces, hyphens, apostrophes
}

/**
 * Normalize store name for consistency
 * - Trims whitespace
 * - Converts to title case
 * - Removes extra spaces
 */
export function normalizeStoreName(storeName: string): string {
  return storeName
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize numeric input (price, quantity)
 * - Converts to number
 * - Handles string input with $ symbols
 * - Returns null for invalid input
 */
export function normalizeNumericInput(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  
  // Remove $ and other non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalize unit type
 * - Converts to lowercase
 * - Standardizes common variations (lb/lbs -> lb, oz/ounce -> oz)
 */
export function normalizeUnitType(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  
  // Standardize common variations
  const unitMap: Record<string, string> = {
    'lbs': 'lb',
    'pounds': 'lb',
    'pound': 'lb',
    'ounces': 'oz',
    'ounce': 'oz',
    'grams': 'g',
    'gram': 'g',
    'kilograms': 'kg',
    'kilogram': 'kg',
    'liters': 'l',
    'liter': 'l',
    'milliliters': 'ml',
    'milliliter': 'ml',
    'pieces': 'each',
    'piece': 'each',
    'units': 'each',
    'unit': 'each',
  };
  
  return unitMap[normalized] || normalized;
}

/**
 * Normalize category name
 * - Converts to title case
 * - Standardizes common variations
 */
export function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase();
  
  // Standardize common category names
  const categoryMap: Record<string, string> = {
    'meat': 'Meat',
    'meats': 'Meat',
    'beef': 'Meat',
    'pork': 'Meat',
    'chicken': 'Meat',
    'poultry': 'Meat',
    'seafood': 'Seafood',
    'fish': 'Seafood',
    'dairy': 'Dairy',
    'produce': 'Produce',
    'fruits': 'Produce',
    'vegetables': 'Produce',
    'snacks': 'Snacks',
    'drinks': 'Drinks',
    'beverages': 'Drinks',
    'household': 'Household',
    'other': 'Other',
  };
  
  return categoryMap[normalized] || category;
}

/**
 * Format price for display
 * - Always shows 2 decimal places
 * - Adds $ prefix
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format unit price for display
 * - Shows price per unit
 * - Example: "$3.99/lb"
 */
export function formatUnitPrice(price: number, unit: string): string {
  return `${formatPrice(price)}/${unit}`;
}

/**
 * Clean and normalize all whitespace in a string
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
