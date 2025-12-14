/**
 * OCR Scans API
 * Phase 4: Supabase API for OCR metadata
 */

import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';
import type { OCRScan, CreateOCRScanInput } from '@shared/types/ocr';

/**
 * Create an OCR scan record
 */
export async function createOCRScan(input: CreateOCRScanInput): Promise<OCRScan> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ocr_scans')
    .insert({
      grocery_item_id: input.grocery_item_id,
      ocr_source: input.ocr_source || 'manual_entry',
      confidence: input.confidence || null,
      raw_text: input.raw_text || null,
      receipt_url: input.receipt_url || null,
      processing_time_ms: input.processing_time_ms || null,
      error_message: input.error_message || null,
      user_id: input.user_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[OCR] Failed to create OCR scan:', error);
    throw new Error(`Failed to create OCR scan: ${error.message}`);
  }

  return data as OCRScan;
}

/**
 * Get all OCR scans for a grocery item
 */
export async function getOCRScansForItem(itemId: string): Promise<OCRScan[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ocr_scans')
    .select('*')
    .eq('grocery_item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[OCR] Failed to fetch OCR scans:', error);
    return [];
  }

  return (data as OCRScan[]) || [];
}

/**
 * Get recent OCR scans (for debugging/analytics)
 */
export async function getRecentOCRScans(limit: number = 50): Promise<OCRScan[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ocr_scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[OCR] Failed to fetch recent OCR scans:', error);
    return [];
  }

  return (data as OCRScan[]) || [];
}

/**
 * Get OCR scans by source (for analytics)
 */
export async function getOCRScansBySource(source: string, limit: number = 100): Promise<OCRScan[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ocr_scans')
    .select('*')
    .eq('ocr_source', source)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[OCR] Failed to fetch OCR scans by source:', error);
    return [];
  }

  return (data as OCRScan[]) || [];
}
