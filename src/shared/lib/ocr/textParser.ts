/**
 * Receipt Text Parser
 * 
 * Parses raw OCR text from receipts into structured line items and metadata.
 * Uses regex patterns to extract prices, items, store names, dates, and totals.
 */

import type { OCRLineItem, OCRResult } from '@shared/types/ocr';

/**
 * Parse receipt text into structured data
 * 
 * @param rawText - Full text extracted from receipt
 * @param overallConfidence - Overall OCR confidence (0.0 - 1.0)
 * @returns Parsed receipt data
 */
export function parseReceiptText(
  rawText: string,
  overallConfidence: number
): Omit<OCRResult, 'receiptUrl'> {
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Extract store name (usually first non-empty line)
  const storeName = extractStoreName(lines);
  
  // Extract line items (lines with price patterns)
  const lineItems = extractLineItems(lines, overallConfidence);
  
  // Extract total
  const total = extractTotal(lines);
  
  // Extract date
  const date = extractDate(lines);
  
  return {
    rawText,
    confidence: overallConfidence,
    lineItems,
    metadata: {
      storeName,
      storeConfidence: overallConfidence,
      total: total.value,
      totalConfidence: total.confidence,
      date: date.value,
      dateConfidence: date.confidence,
    },
  };
}

/**
 * Extract store name from receipt lines
 */
function extractStoreName(lines: string[]): string {
  // Common store patterns
  const storePatterns = [
    /whole\s*foods/i,
    /trader\s*joe'?s/i,
    /safeway/i,
    /walmart/i,
    /target/i,
    /costco/i,
    /kroger/i,
    /publix/i,
  ];
  
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    for (const pattern of storePatterns) {
      if (pattern.test(line)) {
        return line.trim();
      }
    }
  }
  
  // Fallback: use first line
  return lines[0]?.trim() || 'Unknown Store';
}

/**
 * Extract line items (product name + price pairs)
 */
function extractLineItems(
  lines: string[],
  baseConfidence: number
): OCRLineItem[] {
  const items: OCRLineItem[] = [];
  
  // Price pattern: $X.XX or X.XX
  const pricePattern = /\$?\d+\.\d{2}\b/g;
  
  // Exclude lines that look like headers, footers, or totals
  const excludePatterns = [
    /^subtotal/i,
    /^total/i,
    /^tax/i,
    /^thank\s*you/i,
    /^date:/i,
    /^time:/i,
    /^card\s*#/i,
    /^change/i,
    /^cash/i,
    /payment/i,
  ];
  
  for (const line of lines) {
    // Skip excluded lines
    if (excludePatterns.some(pattern => pattern.test(line))) {
      continue;
    }
    
    // Find all prices in this line
    const prices = Array.from(line.matchAll(pricePattern));
    
    if (prices.length > 0) {
      // Take the last price (usually the item price, not quantity/weight)
      const priceMatch = prices[prices.length - 1];
      const priceStr = priceMatch[0].replace('$', '');
      const price = parseFloat(priceStr);
      
      // Skip invalid prices
      if (isNaN(price) || price <= 0 || price > 1000) {
        continue;
      }
      
      // Extract item description (everything before the price)
      const description = line
        .substring(0, priceMatch.index)
        .trim()
        .replace(/\d+\s*(lb|oz|ct|ea|kg|g)$/i, '') // Remove trailing units
        .trim();
      
      if (description.length < 2) {
        continue; // Skip if no valid description
      }
      
      // Try to extract quantity (e.g., "2x", "3 @")
      const quantityMatch = description.match(/^(\d+)\s*[@x]/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Clean up description (remove quantity prefix)
      const cleanDescription = quantityMatch
        ? description.replace(/^\d+\s*[@x]\s*/i, '').trim()
        : description;
      
      // Slight confidence penalty for each item (items are harder to parse than full text)
      const itemConfidence = Math.max(0.5, baseConfidence - 0.05);
      
      items.push({
        description: cleanDescription,
        price,
        quantity,
        confidence: itemConfidence,
      });
    }
  }
  
  return items;
}

/**
 * Extract total amount from receipt
 */
function extractTotal(lines: string[]): { value: number; confidence: number } {
  // Look for "TOTAL" or "AMOUNT DUE" lines
  const totalPattern = /(?:^|\s)(total|amount\s*due|balance)[:\s]+\$?(\d+\.\d{2})/i;
  
  for (const line of lines) {
    const match = line.match(totalPattern);
    if (match) {
      const total = parseFloat(match[2]);
      if (!isNaN(total) && total > 0) {
        return { value: total, confidence: 0.95 };
      }
    }
  }
  
  // Fallback: sum all line item prices
  const pricePattern = /\$?(\d+\.\d{2})/g;
  let sum = 0;
  for (const line of lines) {
    const matches = Array.from(line.matchAll(pricePattern));
    for (const match of matches) {
      const price = parseFloat(match[1]);
      if (!isNaN(price)) {
        sum += price;
      }
    }
  }
  
  return { value: sum, confidence: 0.5 }; // Low confidence if estimated
}

/**
 * Extract date from receipt
 */
function extractDate(lines: string[]): { value: string; confidence: number } {
  // Date patterns
  const patterns = [
    /date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i, // Date: 01/15/2025
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,            // 01/15/2025
    /(\d{4}-\d{2}-\d{2})/,                    // 2025-01-15
  ];
  
  for (const line of lines.slice(0, 10)) { // Check first 10 lines
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const dateStr = match[1] || match[0];
        const normalized = normalizeDateString(dateStr);
        if (normalized) {
          return { value: normalized, confidence: 0.9 };
        }
      }
    }
  }
  
  // Fallback: use today's date
  const today = new Date().toISOString().split('T')[0];
  return { value: today, confidence: 0.5 };
}

/**
 * Normalize date string to YYYY-MM-DD format
 */
function normalizeDateString(dateStr: string): string | null {
  try {
    // Try parsing MM/DD/YYYY or MM/DD/YY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let [month, day, year] = parts.map(p => parseInt(p));
      
      // Handle 2-digit year
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      // Validate
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000) {
        const monthStr = month.toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        return `${year}-${monthStr}-${dayStr}`;
      }
    }
    
    // Try parsing YYYY-MM-DD (already normalized)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    return null;
  } catch {
    return null;
  }
}
