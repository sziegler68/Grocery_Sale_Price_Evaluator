/**
 * Name Matching Service
 * 
 * Fuzzy matching to auto-match scanned item names to shopping list items.
 * Uses Fuse.js for fuzzy string matching.
 */

import Fuse from 'fuse.js';

export interface MatchCandidate {
    id: string;
    item_name: string;
    category?: string;
    target_price?: number;
    unit_type?: string;
}

export interface MatchResult {
    item: MatchCandidate;
    score: number; // 0-1, where 1 is perfect match
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Match scanned item name to list items
 * Returns top 3 matches with confidence scores
 */
export function matchItemName(
    scannedName: string,
    listItems: MatchCandidate[]
): MatchResult[] {
    if (!scannedName || scannedName.trim() === '') {
        return [];
    }

    if (listItems.length === 0) {
        return [];
    }

    // Configure Fuse.js for fuzzy matching
    const fuse = new Fuse(listItems, {
        keys: ['item_name'],
        threshold: 0.4, // 0 = perfect match, 1 = match anything
        distance: 100,
        includeScore: true,
        minMatchCharLength: 2,
    });

    // Search for matches
    const results = fuse.search(scannedName);

    // Convert to MatchResult format and calculate confidence
    const matches: MatchResult[] = results
        .slice(0, 3) // Top 3 matches
        .map(result => {
            const score = 1 - (result.score || 0); // Invert score (higher is better)
            const confidence = getConfidenceLevel(score);

            return {
                item: result.item,
                score,
                confidence,
            };
        });

    return matches;
}

/**
 * Get confidence level based on match score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
}

/**
 * Normalize item name for better matching
 * Removes common variations and standardizes format
 */
export function normalizeItemName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        // Remove common prefixes/suffixes
        .replace(/^(organic|fresh|premium|select)\s+/gi, '')
        .replace(/\s+(steak|chicken|beef|pork)$/gi, ' $1')
        // Remove punctuation
        .replace(/[^\w\s]/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if two item names are likely the same item
 * More lenient than fuzzy matching for exact duplicates
 */
export function isSameItem(name1: string, name2: string): boolean {
    const normalized1 = normalizeItemName(name1);
    const normalized2 = normalizeItemName(name2);

    // Exact match after normalization
    if (normalized1 === normalized2) {
        return true;
    }

    // Check if one contains the other (for variations like "Ribeye" vs "Ribeye Steak")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return true;
    }

    return false;
}

/**
 * Get best match from list
 * Returns null if no good match found
 */
export function getBestMatch(
    scannedName: string,
    listItems: MatchCandidate[]
): MatchResult | null {
    const matches = matchItemName(scannedName, listItems);

    if (matches.length === 0) {
        return null;
    }

    const bestMatch = matches[0];

    // Only return if confidence is at least medium
    if (bestMatch.confidence === 'low') {
        return null;
    }

    return bestMatch;
}
