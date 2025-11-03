import type { UnitPreferences } from './Settings';

// Unit conversion factors
const WEIGHT_CONVERSIONS = {
  pound: 1,
  ounce: 16, // 16 oz in 1 lb
};

const VOLUME_CONVERSIONS = {
  gallon: 1,
  quart: 4, // 4 quarts in 1 gallon
  pint: 8, // 8 pints in 1 gallon
  cup: 16, // 16 cups in 1 gallon
  liter: 3.78541, // liters in 1 gallon
  ml: 3785.41, // ml in 1 gallon
  tablespoon: 256, // tablespoons in 1 gallon
  teaspoon: 768, // teaspoons in 1 gallon
};

// Determine if a unit is weight or volume
const WEIGHT_UNITS = ['pound', 'ounce'];
const VOLUME_UNITS = ['gallon', 'quart', 'pint', 'cup', 'liter', 'ml', 'tablespoon', 'teaspoon'];

export interface NormalizedPrice {
  price: number;
  unit: string;
  isNormalized: boolean;
  originalPrice?: number;
  originalUnit?: string;
}

/**
 * Convert a price from one unit to another within the same category (weight or volume)
 */
export const convertUnit = (
  price: number,
  quantity: number,
  fromUnit: string,
  toUnit: string
): { price: number; quantity: number } | null => {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return { price, quantity };
  }

  // Check if it's a weight conversion
  if (WEIGHT_UNITS.includes(fromUnit) && WEIGHT_UNITS.includes(toUnit)) {
    const fromFactor = WEIGHT_CONVERSIONS[fromUnit as keyof typeof WEIGHT_CONVERSIONS];
    const toFactor = WEIGHT_CONVERSIONS[toUnit as keyof typeof WEIGHT_CONVERSIONS];
    
    // Convert to base unit (pounds), then to target unit
    const baseQuantity = quantity / fromFactor;
    const targetQuantity = baseQuantity * toFactor;
    
    return { price, quantity: targetQuantity };
  }

  // Check if it's a volume conversion
  if (VOLUME_UNITS.includes(fromUnit) && VOLUME_UNITS.includes(toUnit)) {
    const fromFactor = VOLUME_CONVERSIONS[fromUnit as keyof typeof VOLUME_CONVERSIONS];
    const toFactor = VOLUME_CONVERSIONS[toUnit as keyof typeof VOLUME_CONVERSIONS];
    
    // Convert to base unit (gallons), then to target unit
    const baseQuantity = quantity / fromFactor;
    const targetQuantity = baseQuantity * toFactor;
    
    return { price, quantity: targetQuantity };
  }

  // Can't convert between different categories
  return null;
};

/**
 * Get the preferred unit for a category
 */
const getCategoryPreferredUnit = (category: string, preferences: UnitPreferences): string | null => {
  const categoryLower = category.toLowerCase();
  
  // Map categories to preference keys
  if (categoryLower === 'beef' || categoryLower === 'pork' || categoryLower === 'chicken' || categoryLower === 'seafood') {
    return preferences.meat;
  } else if (categoryLower === 'fruit') {
    return preferences.fruit;
  } else if (categoryLower === 'produce' || categoryLower === 'veggies') {
    return preferences.veggies;
  } else if (categoryLower === 'dairy') {
    return preferences.dairy;
  } else if (categoryLower === 'drinks') {
    return preferences.drinks;
  } else if (categoryLower === 'snacks' || categoryLower === 'soda') {
    return preferences.soda;
  }
  
  // Default fallback
  return null;
};

/**
 * Normalize a price to user's preferred unit
 */
export const normalizePrice = (
  price: number,
  quantity: number,
  unitType: string,
  preferences: UnitPreferences,
  category?: string
): NormalizedPrice => {
  const originalPricePerUnit = price / quantity;
  
  // Determine preferred unit based on category if provided
  let preferredUnit: string | null = null;
  if (category) {
    preferredUnit = getCategoryPreferredUnit(category, preferences);
  }
  
  // If no category-based preference, use unit type
  if (!preferredUnit) {
    if (WEIGHT_UNITS.includes(unitType)) {
      preferredUnit = preferences.meat; // Default to meat for weight
    } else if (VOLUME_UNITS.includes(unitType)) {
      preferredUnit = preferences.milk; // Default to milk for volume
    }
  }

  // If no preferred unit or already in preferred unit, return as-is
  if (!preferredUnit || unitType === preferredUnit) {
    return {
      price: originalPricePerUnit,
      unit: unitType,
      isNormalized: false,
    };
  }

  // Convert to preferred unit
  const converted = convertUnit(price, quantity, unitType, preferredUnit);
  if (!converted) {
    // Conversion failed, return original
    return {
      price: originalPricePerUnit,
      unit: unitType,
      isNormalized: false,
    };
  }

  const normalizedPricePerUnit = converted.price / converted.quantity;
  
  return {
    price: normalizedPricePerUnit,
    unit: preferredUnit,
    isNormalized: true,
    originalPrice: originalPricePerUnit,
    originalUnit: unitType,
  };
};

/**
 * Get the category name for a unit (weight, volume, or other)
 */
export const getUnitCategory = (unitType: string): 'weight' | 'volume' | 'other' => {
  if (WEIGHT_UNITS.includes(unitType)) return 'weight';
  if (VOLUME_UNITS.includes(unitType)) return 'volume';
  return 'other';
};
