/**
 * API functions for Alexa integration
 * Manages sync codes for linking Alexa devices to user's shopping lists
 */

import { getSupabaseClient, isSupabaseConfigured } from '@shared/api/supabaseClient';
import { getStoredShareCodes } from '@shared/utils/shoppingListStorage';

export interface AlexaSyncCode {
    id: string;
    sync_code: string;
    share_codes: string[];
    alexa_user_id: string | null;
    created_at: string;
    linked_at: string | null;
    last_used_at: string | null;
}

/**
 * Generate a new Alexa sync code for the current user's lists
 * This creates a one-time code that can be spoken to Alexa
 */
export const generateAlexaSyncCode = async (): Promise<{ success: boolean; syncCode?: string; error?: string }> => {
    if (!isSupabaseConfigured) {
        return { success: false, error: 'Supabase is not configured' };
    }

    const client = getSupabaseClient();

    try {
        // Get user's share codes
        const shareCodes = getStoredShareCodes();

        if (shareCodes.length === 0) {
            return { success: false, error: 'No shopping lists found. Create a list first.' };
        }

        // Generate a unique sync code using the database function
        const { data: codeData, error: codeError } = await client.rpc('generate_alexa_sync_code');

        if (codeError || !codeData) {
            console.error('Failed to generate sync code:', codeError);
            return { success: false, error: 'Failed to generate sync code' };
        }

        const syncCode = codeData as string;

        // Check if user already has a sync code (update it) or create new
        const { data: existing } = await client
            .from('alexa_sync_codes')
            .select('id')
            .contains('share_codes', [shareCodes[0]])
            .single();

        if (existing) {
            // Update existing sync code
            const { error: updateError } = await client
                .from('alexa_sync_codes')
                .update({
                    sync_code: syncCode,
                    share_codes: shareCodes,
                    alexa_user_id: null, // Reset link when regenerating
                    linked_at: null
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('Failed to update sync code:', updateError);
                return { success: false, error: 'Failed to update sync code' };
            }
        } else {
            // Insert new sync code
            const { error: insertError } = await client
                .from('alexa_sync_codes')
                .insert({
                    sync_code: syncCode,
                    share_codes: shareCodes
                });

            if (insertError) {
                console.error('Failed to save sync code:', insertError);
                return { success: false, error: 'Failed to save sync code' };
            }
        }

        // Store sync code locally for quick retrieval
        localStorage.setItem('alexa-sync-code', syncCode);

        return { success: true, syncCode };
    } catch (error) {
        console.error('Error generating sync code:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
};

/**
 * Get the current user's Alexa sync code (if exists)
 */
export const getAlexaSyncCode = async (): Promise<{ syncCode: string | null; isLinked: boolean }> => {
    // First check local storage
    const localCode = localStorage.getItem('alexa-sync-code');

    if (!localCode || !isSupabaseConfigured) {
        return { syncCode: localCode, isLinked: false };
    }

    const client = getSupabaseClient();

    try {
        const { data, error } = await client
            .from('alexa_sync_codes')
            .select('sync_code, alexa_user_id, linked_at')
            .eq('sync_code', localCode)
            .single();

        if (error || !data) {
            return { syncCode: null, isLinked: false };
        }

        return {
            syncCode: data.sync_code,
            isLinked: !!data.alexa_user_id
        };
    } catch (error) {
        console.error('Error getting sync code:', error);
        return { syncCode: localCode, isLinked: false };
    }
};

/**
 * Update the share codes associated with a sync code
 * Called when user creates/deletes lists to keep Alexa in sync
 */
export const refreshAlexaSyncCodes = async (): Promise<void> => {
    const localCode = localStorage.getItem('alexa-sync-code');

    if (!localCode || !isSupabaseConfigured) {
        return;
    }

    const client = getSupabaseClient();
    const shareCodes = getStoredShareCodes();

    try {
        await client
            .from('alexa_sync_codes')
            .update({ share_codes: shareCodes })
            .eq('sync_code', localCode);
    } catch (error) {
        console.error('Error refreshing sync codes:', error);
    }
};
