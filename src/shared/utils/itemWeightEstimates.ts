/**
 * Average weight estimates for common grocery items sold by "each"
 * Weights are in pounds (lb)
 * 
 * These are rough estimates based on typical grocery store items.
 * Used to normalize "each" pricing to weight-based pricing for comparison.
 */

export interface ItemWeightEstimate {
  weight: number; // in pounds
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export const ITEM_WEIGHT_ESTIMATES: Record<string, ItemWeightEstimate> = {
  // Fruits (by each)
  'apple': { weight: 0.33, confidence: 'high', notes: 'Medium apple' },
  'avocado': { weight: 0.35, confidence: 'high', notes: 'Medium Hass avocado' },
  'banana': { weight: 0.28, confidence: 'high', notes: 'Medium banana' },
  'grapefruit': { weight: 0.5, confidence: 'high', notes: 'Medium grapefruit' },
  'lemon': { weight: 0.15, confidence: 'high', notes: 'Medium lemon' },
  'lime': { weight: 0.1, confidence: 'high', notes: 'Medium lime' },
  'mango': { weight: 0.5, confidence: 'medium', notes: 'Medium mango' },
  'orange': { weight: 0.3, confidence: 'high', notes: 'Medium orange' },
  'peach': { weight: 0.3, confidence: 'medium', notes: 'Medium peach' },
  'pear': { weight: 0.4, confidence: 'medium', notes: 'Medium pear' },
  'pineapple': { weight: 3.5, confidence: 'medium', notes: 'Whole pineapple' },
  'plum': { weight: 0.15, confidence: 'medium', notes: 'Medium plum' },
  'pomegranate': { weight: 0.6, confidence: 'medium', notes: 'Medium pomegranate' },
  
  // Vegetables (by each)
  'bell pepper': { weight: 0.4, confidence: 'high', notes: 'Medium bell pepper' },
  'cucumber': { weight: 0.6, confidence: 'high', notes: 'Medium cucumber' },
  'eggplant': { weight: 1.0, confidence: 'medium', notes: 'Medium eggplant' },
  'head of lettuce': { weight: 1.0, confidence: 'medium', notes: 'Iceberg lettuce head' },
  'lettuce': { weight: 1.0, confidence: 'medium', notes: 'Iceberg lettuce head' },
  'onion': { weight: 0.4, confidence: 'high', notes: 'Medium yellow onion' },
  'potato': { weight: 0.4, confidence: 'high', notes: 'Medium russet potato' },
  'tomato': { weight: 0.4, confidence: 'high', notes: 'Medium tomato' },
  'zucchini': { weight: 0.5, confidence: 'high', notes: 'Medium zucchini' },
  'corn': { weight: 0.6, confidence: 'high', notes: 'Ear of corn with husk' },
  
  // Other
  'cantaloupe': { weight: 3.0, confidence: 'medium', notes: 'Whole cantaloupe' },
  'watermelon': { weight: 15.0, confidence: 'low', notes: 'Whole watermelon (varies widely)' },
  'honeydew': { weight: 4.0, confidence: 'medium', notes: 'Whole honeydew melon' },
};

/**
 * Get estimated weight for an item
 * Returns null if no estimate is available
 */
export const getItemWeightEstimate = (itemName: string): ItemWeightEstimate | null => {
  const normalizedName = itemName.toLowerCase().trim();
  
  // Direct match
  if (ITEM_WEIGHT_ESTIMATES[normalizedName]) {
    return ITEM_WEIGHT_ESTIMATES[normalizedName];
  }
  
  // Partial match (e.g., "organic apple" matches "apple")
  for (const [key, estimate] of Object.entries(ITEM_WEIGHT_ESTIMATES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return estimate;
    }
  }
  
  return null;
};

/**
 * Convert "each" price to price per pound using estimated weight
 */
export const convertEachToPound = (
  pricePerEach: number,
  itemName: string
): { pricePerPound: number; estimate: ItemWeightEstimate } | null => {
  const estimate = getItemWeightEstimate(itemName);
  if (!estimate) return null;
  
  const pricePerPound = pricePerEach / estimate.weight;
  return { pricePerPound, estimate };
};
