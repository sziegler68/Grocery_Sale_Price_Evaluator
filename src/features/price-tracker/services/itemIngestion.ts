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
  meatQuality?: string;
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
    return {
      success: false,
      error: validation.error,
    };
  }

  // Step 2: Check for duplicates (unless skipped)
  if (!skipDuplicateCheck) {
    const similarItem = await findSimilarItems(normalized.itemName, fuzzyThreshold);

    if (similarItem) {
      const { match: existingItem, similarity } = similarItem;

      // Exact match or very high similarity
      if (similarity >= 0.95) {
        if (autoMerge) {
          // Auto-merge: add as new price entry for same item
          console.log(`Auto-merging with existing item: ${existingItem.itemName}`);
        } else {
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
        // Moderate match - suggest confirmation
        return {
          success: false,
          matchFound: {
            existingItem,
            similarity,
            suggestedAction: 'confirm',
          },
          error: `Possible duplicate: "${existingItem.itemName}" (${Math.round(similarity * 100)}% match). Confirm if this is a new item.`,
        };
      }
    }
  }

  // Step 3: Calculate unit price
  const unitPrice = normalized.price / normalized.quantity;

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
    const createdItem = await createGroceryItem({
      itemName: input.itemName, // Use original capitalization for display
      price: normalized.price,
      quantity: normalized.quantity,
      unitType: normalized.unitType || 'each',
      unitPrice,
      storeName: input.storeName, // Use original capitalization
      category: (normalized.category as any) || 'Other',
      targetPrice: input.targetPrice ? Number(input.targetPrice) : undefined,
      meatQuality: input.meatQuality as any,
      notes: input.notes,
      datePurchased: input.datePurchased || new Date(),
    });

    // Step 6: Phase 4 - TODO: Create OCR scan record if OCR metadata provided
    // This requires createdItem.id, which would be added in a future PR
    // For now, OCR metadata is accepted but not persisted separately
    if (input.ocr_source && input.ocr_source !== 'manual_entry') {
      console.log('[INGESTION] OCR metadata received:', {
        source: input.ocr_source,
        confidence: input.ocr_confidence,
        receipt_url: input.receipt_url,
      });
      // TODO: Call createOCRScan(createdItem.id, {...}) once API is ready
    }
    
    // Step 7: Phase 4 - TODO: Flag item if suspicious
    // This requires an API to update flagged_for_review
    if (shouldFlag) {
      console.warn('[INGESTION] Suspicious data detected, should flag:', flagReason);
      // TODO: Call flagItemForReview(createdItem.id, flagReason) once API is ready
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
