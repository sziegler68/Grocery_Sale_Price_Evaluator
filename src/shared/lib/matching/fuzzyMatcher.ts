/**
 * Fuzzy Item Matcher
 * 
 * Matches scanned item names to shopping list items using fuzzy string matching.
 */

export interface ShoppingListItem {
    id: string;
    name: string;
    [key: string]: any; // Other properties
}

export interface MatchResult {
    item: ShoppingListItem;
    score: number; // 0-1, where 1 is perfect match
}

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of edits to transform one string into another)
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Normalize string for matching
 * - Lowercase
 * - Remove special characters
 * - Trim whitespace
 * - Remove common words ("organic", "fresh", etc.)
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\b(organic|fresh|natural|premium|select|choice)\b/g, '') // Remove common adjectives
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);

    // Exact match after normalization
    if (normalized1 === normalized2) {
        return 1.0;
    }

    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.9;
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    // Convert distance to similarity score (0-1)
    const similarity = 1 - (distance / maxLength);

    return Math.max(0, similarity);
}

/**
 * Find the best matching item from a shopping list
 * 
 * @param scannedName - Name extracted from price tag
 * @param shoppingList - List of items in shopping list
 * @param threshold - Minimum score to consider a match (default: 0.7)
 * @returns Best match or null if no good match found
 */
export function findBestMatch(
    scannedName: string,
    shoppingList: ShoppingListItem[],
    threshold: number = 0.7
): MatchResult | null {
    if (!scannedName || !shoppingList || shoppingList.length === 0) {
        return null;
    }

    let bestMatch: MatchResult | null = null;

    for (const item of shoppingList) {
        const score = calculateSimilarity(scannedName, item.name);

        if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { item, score };
        }
    }

    return bestMatch;
}

/**
 * Find all potential matches above a threshold
 * 
 * @param scannedName - Name extracted from price tag
 * @param shoppingList - List of items in shopping list
 * @param threshold - Minimum score to include (default: 0.5)
 * @returns Array of matches sorted by score (highest first)
 */
export function findAllMatches(
    scannedName: string,
    shoppingList: ShoppingListItem[],
    threshold: number = 0.5
): MatchResult[] {
    if (!scannedName || !shoppingList || shoppingList.length === 0) {
        return [];
    }

    const matches: MatchResult[] = [];

    for (const item of shoppingList) {
        const score = calculateSimilarity(scannedName, item.name);

        if (score >= threshold) {
            matches.push({ item, score });
        }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
}

/**
 * Get match quality label based on score
 */
export function getMatchQuality(score: number): 'perfect' | 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.95) return 'perfect';
    if (score >= 0.85) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.50) return 'fair';
    return 'poor';
}
