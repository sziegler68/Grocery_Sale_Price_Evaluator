/**
 * Moderation API
 * Phase 4: Supabase API for flagging and verifying items
 */

import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';
import type { GroceryItem } from '../types';

/**
 * Flag an item for review
 */
export async function flagItemForReview(itemId: string, reason?: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc('flag_item_for_review', {
    item_id: itemId,
    reason: reason || null,
  });

  if (error) {
    console.error('[MODERATION] Failed to flag item:', error);
    throw new Error(`Failed to flag item: ${error.message}`);
  }

  console.log('[MODERATION] Item flagged successfully:', itemId, reason);
}

/**
 * Verify an item (moderator action)
 */
export async function verifyItem(itemId: string, moderatorId?: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc('verify_item', {
    item_id: itemId,
    moderator_id: moderatorId || null,
  });

  if (error) {
    console.error('[MODERATION] Failed to verify item:', error);
    throw new Error(`Failed to verify item: ${error.message}`);
  }

  console.log('[MODERATION] Item verified successfully:', itemId);
}

/**
 * Get moderation queue (flagged but not verified items)
 */
export async function getModerationQueue(limit: number = 50): Promise<GroceryItem[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_moderation_queue', {
    limit_count: limit,
  });

  if (error) {
    console.error('[MODERATION] Failed to fetch moderation queue:', error);
    return [];
  }

  // Map database rows to GroceryItem type
  return (data || []).map((row: any) => ({
    id: row.id,
    itemName: row.item_name,
    category: row.category,
    meatQuality: row.meat_quality ?? undefined,
    storeName: row.store_name,
    price: Number(row.price),
    quantity: Number(row.quantity),
    unitType: row.unit_type,
    unitPrice: Number(row.unit_price),
    datePurchased: new Date(row.date_purchased),
    notes: row.notes ?? undefined,
    targetPrice: row.target_price ? Number(row.target_price) : undefined,
    userId: row.user_id ?? undefined,
    flagged_for_review: row.flagged_for_review ?? false,
    verified: row.verified ?? false,
    flagged_reason: row.flagged_reason ?? undefined,
    reviewed_by: row.reviewed_by ?? undefined,
    reviewed_at: row.reviewed_at ?? undefined,
  }));
}

/**
 * Get flagged items count (for dashboard)
 */
export async function getFlaggedItemsCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    return 0;
  }

  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('grocery_items')
    .select('*', { count: 'exact', head: true })
    .eq('flagged_for_review', true)
    .eq('verified', false);

  if (error) {
    console.error('[MODERATION] Failed to get flagged items count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get verified items count (for dashboard)
 */
export async function getVerifiedItemsCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    return 0;
  }

  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('grocery_items')
    .select('*', { count: 'exact', head: true })
    .eq('verified', true);

  if (error) {
    console.error('[MODERATION] Failed to get verified items count:', error);
    return 0;
  }

  return count || 0;
}
