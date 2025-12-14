/**
 * Batch OCR Item Ingestion
 * 
 * Helper function to ingest multiple items from OCR scans through the
 * unified ingestion pipeline.
 */

import { ingestGroceryItem } from '@features/price-tracker/services/itemIngestion';
import type { OCRLineItem } from '@shared/types/ocr';

export interface BatchIngestMetadata {
  storeName: string;
  datePurchased: string;
  ocrSource: string;
  receiptUrl: string;
}

export interface IngestedItemResult {
  id: string | null;
  itemName: string;
  price: number;
  flagged: boolean;
  flagReason?: string;
  error?: string;
}

/**
 * Batch ingest items from OCR scan through unified pipeline
 * 
 * @param lineItems - Parsed line items from OCR
 * @param metadata - Receipt metadata (store, date, source, URL)
 * @returns Array of ingestion results
 */
export async function batchIngestItems(
  lineItems: OCRLineItem[],
  metadata: BatchIngestMetadata
): Promise<IngestedItemResult[]> {
  const results: IngestedItemResult[] = [];
  
  for (const item of lineItems) {
    try {
      const result = await ingestGroceryItem({
        itemName: item.description,
        price: item.price,
        quantity: item.quantity,
        storeName: metadata.storeName,
        unitType: 'each', // Default to 'each' for OCR items
        category: 'Other', // TODO: AI categorization in future
        datePurchased: new Date(metadata.datePurchased),
        notes: undefined,
        
        // OCR metadata
        ocr_source: metadata.ocrSource as 'manual_entry' | 'google_vision' | 'tesseract' | 'aws_textract' | 'azure_ocr' | 'other',
        ocr_confidence: item.confidence,
        receipt_url: metadata.receiptUrl,
        auto_flag_if_suspicious: true, // Auto-flag low confidence items
      }, {
        skipDuplicateCheck: false,
        fuzzyThreshold: 0.85, // Catch near-duplicates
      });
      
      // Determine if item was flagged
      const flagged = result.matchFound !== undefined || item.confidence < 0.7;
      const flagReason = result.matchFound 
        ? `Possible duplicate of "${result.matchFound.existingItem.itemName}" ($${result.matchFound.existingItem.price})`
        : item.confidence < 0.7 
          ? 'Low OCR confidence'
          : undefined;
      
      results.push({
        id: result.item?.id || null,
        itemName: item.description,
        price: item.price,
        flagged,
        flagReason,
      });
      
    } catch (error: any) {
      console.error('[BATCH_INGEST] Failed to ingest item:', item, error);
      
      results.push({
        id: null,
        itemName: item.description,
        price: item.price,
        flagged: true,
        flagReason: 'Ingestion failed',
        error: error.message,
      });
    }
  }
  
  return results;
}
