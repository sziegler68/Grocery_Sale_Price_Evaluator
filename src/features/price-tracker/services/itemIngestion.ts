/**
 * Item Ingestion Service
 * Centralizes logic for adding/updating grocery items with normalization,
 * validation, and fuzzy matching to avoid duplicates
 */

import {
  normalizeItemName,
  normalizeStoreName,
  normalizeNumericInput,
  normalizeUnitType,
  normalizeCategory,
} from '@shared/utils/normalization';
import {
  validateItemInput,
  type ValidationResult,
  type ItemInput,
} from '@shared/utils/validators';
import {
  findBestFuzzyMatch,
  type FuzzyMatchResult,
} from '@shared/utils/fuzzyMatch';
import { fetchAllItems, createGroceryItem } from '../api/groceryData';
import { createOCRScan } from '../api/ocrScans';
import { flagItemForReview } from '../api/moderation';
import { getUserName } from '@shared/utils/settings';
import type { GroceryItem } from '../types';

/**
 * Input for item ingestion (Phase 4: with OCR/moderation support)
 */
export interface IngestItemInput {
  itemName: string;
  price: number | string;
  quantity: number | string;
  storeName: string;
  unitType?: string;
  category?: string;
  targetPrice?: number | string;

  // Phase 3: Quality fields
  organic?: boolean;
  grassFed?: boolean;
  freshness?: 'Fresh' | 'Previously Frozen' | 'Frozen';
  meatGrade?: 'Choice' | 'Prime' | 'Wagyu';
  seafoodSource?: 'Wild' | 'Farm Raised';
  meatQuality?: string; // Legacy - kept for backwards compatibility

  notes?: string;
  datePurchased?: Date;

  // Phase 4: OCR metadata (optional)
  ocr_source?: 'manual_entry' | 'google_vision' | 'tesseract' | 'aws_textract' | 'azure_ocr' | 'other';
  ocr_confidence?: number;
  ocr_raw_text?: string;
  receipt_url?: string;

  // Phase 4: Auto-flagging (optional, for suspicious data)
  auto_flag_if_suspicious?: boolean;
}

/**
 * Result of item ingestion
 */
export interface IngestItemResult {
  success: boolean;
  item?: GroceryItem;
  error?: string;
  matchFound?: {
    existingItem: GroceryItem;
    similarity: number;
    suggestedAction: 'update' | 'create_new' | 'confirm';
  };
}

/**
 * Normalize and validate input before processing
 */
function normalizeAndValidateInput(input: IngestItemInput): {
  normalized: ItemInput;
  validation: ValidationResult;
} {
  // Normalize numeric inputs
  const price = typeof input.price === 'string'
    ? normalizeNumericInput(input.price)
    : input.price;
  const quantity = typeof input.quantity === 'string'
    ? normalizeNumericInput(input.quantity)
    : input.quantity;
  if (price === null || quantity === null) {
    return {
      normalized: {} as ItemInput,
      validation: {
        isValid: false,
        error: 'Invalid price or quantity'
      }
    };
  }

  // Normalize text inputs
  const normalized: ItemInput = {
    itemName: normalizeItemName(input.itemName),
    price,
    quantity,
    storeName: normalizeStoreName(input.storeName),
    unitType: input.unitType ? normalizeUnitType(input.unitType) : undefined,
    category: input.category ? normalizeCategory(input.category) : undefined,
  };

  // Validate the normalized input
  const validation = validateItemInput(normalized);

  return { normalized, validation };
}

/**
 * Check if an item is an exact duplicate (same item + store + date + price)
 * Only exact duplicates on the same day should be skipped
 */
function isExactDuplicate(
  newItem: {
    itemName: string;
    storeName: string;
    unitPrice: number;
    datePurchased: Date;
  },
  existingItem: GroceryItem
): boolean {
  const today = new Date(newItem.datePurchased).toISOString().split('T')[0]; // YYYY-MM-DD
  const existingDate = new Date(existingItem.datePurchased).toISOString().split('T')[0];

  const isSameDay = existingDate === today;
  const isSameItem = existingItem.itemName.toLowerCase() === newItem.itemName.toLowerCase();
  const isSameStore = existingItem.storeName.toLowerCase() === newItem.storeName.toLowerCase();
  const isSamePrice = Math.abs(existingItem.unitPrice - newItem.unitPrice) < 0.01; // Within 1 cent

  // Only consider duplicate if ALL match (same item, store, day, price)
  return isSameDay && isSameItem && isSameStore && isSamePrice;
}

/**
 * Find similar existing items using fuzzy matching
 */
async function findSimilarItems(
  itemName: string,
  threshold: number = 0.85
): Promise<FuzzyMatchResult<GroceryItem> | null> {
  try {
    // Fetch all existing items
    const result = await fetchAllItems();

    if (result.source === 'mock' || !result.items.length) {
      return null;
    }

    // Create searchable objects with itemName
    const searchableItems = result.items.map(item => ({
      ...item,
      toString: () => item.itemName
    }));

    // Find best fuzzy match
    return findBestFuzzyMatch(itemName, searchableItems, threshold);
  } catch (error) {
    console.error('Error finding similar items:', error);
    return null;
  }
}

/**
 * Ingest a new grocery item with smart duplicate detection
 * 
 * @param input Raw item input
 * @param options Ingestion options
 * @returns Result with created item or duplicate warning
 */
export async function ingestGroceryItem(
  input: IngestItemInput,
  options: {
    autoMerge?: boolean; // Automatically merge with exact matches
    fuzzyThreshold?: number; // Similarity threshold for fuzzy matching (default 0.85)
    skipDuplicateCheck?: boolean; // Skip duplicate detection
  } = {}
): Promise<IngestItemResult> {
  const {
    autoMerge = false,
    fuzzyThreshold = 0.85,
    skipDuplicateCheck = false,
  } = options;

  // Step 1: Normalize and validate
  const { normalized, validation } = normalizeAndValidateInput(input);

  if (!validation.isValid) {
    console.error('[INGESTION] Validation failed:', validation.error);
    console.error('[INGESTION] Input:', input);
    console.error('[INGESTION] Normalized:', normalized);
    return {
      success: false,
      error: validation.error,
    };
  }

  // Step 2: Calculate unit price (needed for duplicate check)
  const unitPrice = normalized.price / normalized.quantity;
  const datePurchased = input.datePurchased || new Date();

  // Step 3: Check for exact duplicates (unless skipped)
  if (!skipDuplicateCheck) {
    // First, check for exact duplicates (same item + store + date + price)
    const result = await fetchAllItems();

    if (result.source !== 'mock' && result.items.length > 0) {
      const exactDuplicate = result.items.find(existingItem =>
        isExactDuplicate(
          {
            itemName: normalized.itemName,
            storeName: normalized.storeName,
            unitPrice,
            datePurchased,
          },
          existingItem
        )
      );

      if (exactDuplicate) {
        const today = datePurchased.toISOString().split('T')[0];
        console.log(`[DUPLICATE] Skipping: ${normalized.itemName} - exact match found for today (${today})`);
        return {
          success: false,
          matchFound: {
            existingItem: exactDuplicate,
            similarity: 1.0,
            suggestedAction: 'update',
          },
          error: `Exact duplicate detected: "${exactDuplicate.itemName}" already exists for ${normalized.storeName} on ${today} with the same price. Skipping to avoid duplicate entry.`,
        };
      }
    }

    // Then check for fuzzy matches (similar name) - but allow saving if different date/price
    const similarItem = await findSimilarItems(normalized.itemName, fuzzyThreshold);

    if (similarItem) {
      const { match: existingItem, similarity } = similarItem;

      // Very high similarity - check if it's a different price point (price history)
      if (similarity >= 0.95) {
        // Check if it's a different date or price - if so, allow saving (price history)
        const existingDate = new Date(existingItem.datePurchased).toISOString().split('T')[0];
        const newDate = datePurchased.toISOString().split('T')[0];
        const priceDifference = Math.abs(existingItem.unitPrice - unitPrice);

        if (existingDate !== newDate || priceDifference >= 0.01) {
          // Different date or price - this is price history, allow saving
          console.log(`[PRICE_HISTORY] Saving: ${normalized.itemName} - new price point for ${normalized.storeName} (${existingDate !== newDate ? 'different date' : 'different price'})`);
          // Continue to save the item
        } else if (autoMerge) {
          // Auto-merge: add as new price entry for same item
          console.log(`[PRICE_HISTORY] Auto-merging: ${normalized.itemName} - adding new price entry`);
          // Continue to save the item
        } else {
          // Same date and price - this was already caught by exact duplicate check above
          // But if we get here, it means exact duplicate check didn't find it (edge case)
          // Return match info for user to decide
          return {
            success: false,
            matchFound: {
              existingItem,
              similarity,
              suggestedAction: 'update',
            },
            error: `Similar item found: "${existingItem.itemName}" (${Math.round(similarity * 100)}% match). Consider updating instead of creating new.`,
          };
        }
      } else if (similarity >= fuzzyThreshold) {
        // Moderate match - different enough to be a separate item, allow saving
        console.log(`[PRICE_HISTORY] Saving: ${normalized.itemName} - similar but distinct item (${Math.round(similarity * 100)}% match)`);
        // Continue to save the item
      }
    }
  }

  // Unit price already calculated in Step 2 for duplicate check

  // Step 4: Phase 4 - Check for suspicious data (auto-flagging)
  let shouldFlag = false;
  let flagReason: string | undefined;

  if (input.auto_flag_if_suspicious) {
    // Auto-flag if price is suspiciously low/high
    if (normalized.price < 0.01 || normalized.price > 10000) {
      shouldFlag = true;
      flagReason = 'Suspicious price detected';
    }

    // Auto-flag if OCR confidence is low
    if (input.ocr_confidence !== undefined && input.ocr_confidence < 0.5) {
      shouldFlag = true;
      flagReason = flagReason ? `${flagReason}; Low OCR confidence` : 'Low OCR confidence';
    }

    // Auto-flag if quantity is suspicious
    if (normalized.quantity > 1000) {
      shouldFlag = true;
      flagReason = flagReason ? `${flagReason}; Suspicious quantity` : 'Suspicious quantity';
    }
  }

  // Step 5: Create the item
  try {
    // Get user name from settings (hidden, for database sorting)
    const settingsUserName = getUserName();

    // Combine notes with user name metadata (hidden from UI)
    let finalNotes = input.notes || '';
    if (settingsUserName) {
      // Store user name in notes for database sorting (hidden metadata)
      finalNotes = finalNotes ? `${finalNotes} [USER:${settingsUserName}]` : `[USER:${settingsUserName}]`;
    }

    const createdItem = await createGroceryItem({
      itemName: input.itemName, // Use original capitalization for display
      price: normalized.price,
      quantity: normalized.quantity,
      unitType: normalized.unitType || 'each',
      unitPrice,
      storeName: input.storeName, // Use original capitalization
      category: (normalized.category as any) || 'Other',
      targetPrice: input.targetPrice ? Number(input.targetPrice) : undefined,
      // Phase 3: Quality fields
      organic: input.organic,
      grassFed: input.grassFed,
      freshness: input.freshness,
      meatGrade: input.meatGrade,
      seafoodSource: input.seafoodSource,
      meatQuality: input.meatQuality as any, // Legacy
      notes: finalNotes,
      datePurchased: datePurchased,
    });

    // Step 6: Phase 4 - Create OCR scan record if OCR metadata provided
    if (input.ocr_source && input.ocr_source !== 'manual_entry') {
      try {
        console.log('[INGESTION] Creating OCR scan record for item:', createdItem.id);
        await createOCRScan({
          grocery_item_id: createdItem.id,
          ocr_source: input.ocr_source,
          confidence: input.ocr_confidence,
          raw_text: input.ocr_raw_text,
          receipt_url: input.receipt_url,
        });
        console.log('[INGESTION] ✅ OCR scan record created successfully');
      } catch (error: any) {
        console.error('[INGESTION] ⚠️ Failed to create OCR scan record:', error.message);
        // Don't fail the whole operation if OCR record creation fails
      }
    }

    // Step 7: Phase 4 - Flag item if suspicious
    if (shouldFlag && flagReason) {
      try {
        console.warn('[INGESTION] Flagging suspicious item:', createdItem.id, flagReason);
        await flagItemForReview(createdItem.id, flagReason);
        console.log('[INGESTION] ✅ Item flagged successfully');
      } catch (error: any) {
        console.error('[INGESTION] ⚠️ Failed to flag item:', error.message);
        // Don't fail the whole operation if flagging fails
      }
    }

    return {
      success: true,
      item: createdItem,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create item',
    };
  }
}

/**
 * Batch ingest multiple items (e.g., from OCR)
 * 
 * @param items Array of items to ingest
 * @param options Ingestion options
 * @returns Results for each item
 */
export async function batchIngestItems(
  items: IngestItemInput[],
  options: {
    autoMerge?: boolean;
    fuzzyThreshold?: number;
    stopOnError?: boolean;
  } = {}
): Promise<IngestItemResult[]> {
  const { stopOnError = false } = options;
  const results: IngestItemResult[] = [];

  for (const item of items) {
    const result = await ingestGroceryItem(item, options);
    results.push(result);

    if (!result.success && stopOnError) {
      break;
    }
  }

  return results;
}

/**
 * Validate item input without creating it
 * Useful for form validation
 */
export function validateItemForIngestion(input: IngestItemInput): ValidationResult {
  const { validation } = normalizeAndValidateInput(input);
  return validation;
}
