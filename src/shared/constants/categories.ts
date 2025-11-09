/**
 * Shared category and quality constants
 * Used across Price Tracker and Shopping Lists
 */

// Main categories
export const CATEGORIES = [
  'Meat',
  'Seafood',
  'Dairy',
  'Produce',
  'Snacks',
  'Drinks',
  'Household',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

// Quality modifiers - always available (all categories)
export const FRESHNESS_OPTIONS = [
  'Fresh',
  'Previously Frozen',
  'Frozen',
] as const;

export type Freshness = typeof FRESHNESS_OPTIONS[number];

// Meat-specific qualities
export const MEAT_GRADES = [
  'Choice',
  'Prime',
  'Wagyu',
] as const;

export type MeatGrade = typeof MEAT_GRADES[number];

// Seafood-specific qualities
export const SEAFOOD_SOURCES = [
  'Wild',
  'Farm Raised',
] as const;

export type SeafoodSource = typeof SEAFOOD_SOURCES[number];

// Quality flags that can be combined
export interface QualityFlags {
  organic?: boolean;        // Available for all categories
  grassFed?: boolean;       // Meat only
  freshness?: Freshness;    // All categories (radio group)
  meatGrade?: MeatGrade;    // Meat only (radio group)
  seafoodSource?: SeafoodSource; // Seafood only (radio group)
}

// Helper to check if category supports specific quality options
export const categorySupports = {
  meatGrades: (category: string) => category === 'Meat',
  grassFed: (category: string) => category === 'Meat',
  seafoodSource: (category: string) => category === 'Seafood',
};

// Store names (shared)
export const STORE_NAMES = [
  'Costco',
  'Farmers Market',
  'FoodMaxx',
  'Lucky',
  'Mexican Market',
  'Raley',
  'Ranch 99',
  'Safeway',
  'Sprouts',
  'Trader Joes',
  'Whole Foods',
  'WinCo',
  'Other',
] as const;

export type StoreName = typeof STORE_NAMES[number];

// Unit types (shared)
export const UNIT_TYPES = [
  'pound',
  'ounce',
  'can',
  'each',
  'liter',
  'ml',
  'gallon',
  'quart',
  'pint',
  'cup',
  'tablespoon',
  'teaspoon',
] as const;

export type UnitType = typeof UNIT_TYPES[number];
