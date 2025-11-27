/**
 * Shared OCR types for Phase 4 & Phase 6
 */

import { z } from 'zod';

// OCR source enum
export const OCRSourceSchema = z.enum([
  'manual_entry',
  'google_vision',
  'tesseract',
  'aws_textract',
  'azure_ocr',
  'other',
]);

export type OCRSource = z.infer<typeof OCRSourceSchema>;

// OCR scan metadata schema (database)
export const OCRScanSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  grocery_item_id: z.string().uuid(),
  ocr_source: OCRSourceSchema,
  confidence: z.number().min(0).max(1).nullable(),
  raw_text: z.string().nullable(),
  receipt_url: z.string().url().nullable(),
  processing_time_ms: z.number().int().positive().nullable(),
  error_message: z.string().nullable(),
  user_id: z.string().uuid().nullable(),
});

export type OCRScan = z.infer<typeof OCRScanSchema>;

// Input for creating an OCR scan
export const CreateOCRScanSchema = z.object({
  grocery_item_id: z.string().uuid(),
  ocr_source: OCRSourceSchema.default('manual_entry'),
  confidence: z.number().min(0).max(1).optional(),
  raw_text: z.string().optional(),
  receipt_url: z.string().url().optional(),
  processing_time_ms: z.number().int().positive().optional(),
  error_message: z.string().optional(),
  user_id: z.string().uuid().optional(),
});

export type CreateOCRScanInput = z.infer<typeof CreateOCRScanSchema>;

// Phase 6: OCR processing types (API responses)

export interface OCRLineItem {
  description: string;
  price: number;
  quantity: number;
  confidence: number;
}

export interface OCRMetadata {
  storeName: string;
  storeConfidence: number;
  total: number;
  totalConfidence: number;
  date: string;
  dateConfidence: number;
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  receiptUrl: string;
  lineItems: OCRLineItem[];
  metadata: OCRMetadata;
}

export interface OCRScanResponse {
  success: boolean;
  processingTimeMs: number;
  ocrResult?: OCRResult;
  ingestedItems?: Array<{
    id: string | null;
    itemName: string;
    price: number;
    flagged: boolean;
    flagReason?: string;
  }>;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  _note?: string; // For mock API responses
}

// Moderation fields schema
export const ModerationFieldsSchema = z.object({
  flagged_for_review: z.boolean().default(false),
  verified: z.boolean().default(false),
  flagged_reason: z.string().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
});

export type ModerationFields = z.infer<typeof ModerationFieldsSchema>;

// Input for flagging an item
export const FlagItemInputSchema = z.object({
  item_id: z.string().uuid(),
  reason: z.string().optional(),
});

export type FlagItemInput = z.infer<typeof FlagItemInputSchema>;

// Input for verifying an item
export const VerifyItemInputSchema = z.object({
  item_id: z.string().uuid(),
  moderator_id: z.string().uuid().optional(),
});

export type VerifyItemInput = z.infer<typeof VerifyItemInputSchema>;
