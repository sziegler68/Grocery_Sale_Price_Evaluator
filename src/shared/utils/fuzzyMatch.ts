import Fuse from 'fuse.js';
import { normalizeItemName } from './normalization';

/**
 * Find the best fuzzy match from a list of candidates using Fuse.js
 * @param query String to match
 * @param candidates List of candidate strings
 * @param threshold Similarity threshold (0-1, default 0.4 for Fuse where 0 is perfect)
 * @returns Best match object or null if no match above threshold
 */
export interface FuzzyMatchResult<T = string> {
  match: T;
  similarity: number;
  index: number;
}

export function findBestFuzzyMatch<T extends { toString(): string }>(
  query: string,
  candidates: T[],
  threshold: number = 0.4
): FuzzyMatchResult<T> | null {
  // Configure Fuse options
  const options = {
    includeScore: true,
    threshold: threshold, // 0.0 = perfect match, 1.0 = match anything
    ignoreLocation: true, // Search anywhere in the string
    keys: [] as string[] // Empty for array of strings
  };

  const fuse = new Fuse(candidates, options);
  const result = fuse.search(query);

  if (result.length > 0) {
    const best = result[0];
    // Fuse score: 0 is perfect, 1 is mismatch. Convert to similarity (0-1 where 1 is perfect)
    const similarity = 1 - (best.score || 0);

    return {
      match: best.item,
      similarity,
      index: best.refIndex
    };
  }

  return null;
}

/**
 * Find all fuzzy matches above a threshold using Fuse.js
 * @param query String to match
 * @param candidates List of candidate strings
 * @param threshold Minimum similarity threshold (0-1, default 0.4 for Fuse)
 * @returns Array of matches sorted by similarity (descending)
 */
export function findAllFuzzyMatches<T extends { toString(): string }>(
  query: string,
  candidates: T[],
  threshold: number = 0.4
): FuzzyMatchResult<T>[] {
  const options = {
    includeScore: true,
    threshold: threshold,
    ignoreLocation: true,
    keys: [] as string[]
  };

  const fuse = new Fuse(candidates, options);
  const results = fuse.search(query);

  return results.map(result => ({
    match: result.item,
    similarity: 1 - (result.score || 0),
    index: result.refIndex
  }));
}

// Keep these for backward compatibility if needed, or remove if unused
export function calculateSimilarity(str1: string, str2: string): number {
  // Basic implementation using Fuse score for single item
  const fuse = new Fuse([str2], { includeScore: true });
  const result = fuse.search(str1);
  return result.length > 0 ? 1 - (result[0].score || 0) : 0;
}

export function isFuzzyMatch(str1: string, str2: string, threshold: number = 0.6): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Check if a query contains a substring match (case-insensitive)
 * Useful for quick filtering before fuzzy matching
 */
export function containsSubstring(query: string, target: string): boolean {
  const normalizedQuery = normalizeItemName(query);
  const normalizedTarget = normalizeItemName(target);

  return normalizedTarget.includes(normalizedQuery) || normalizedQuery.includes(normalizedTarget);
}

/**
 * Get match confidence level
 * @param similarity Similarity score (0-1)
 * @returns Confidence level string
 */
export function getMatchConfidence(similarity: number): 'exact' | 'high' | 'medium' | 'low' | 'none' {
  if (similarity >= 0.95) return 'exact';
  if (similarity >= 0.85) return 'high';
  if (similarity >= 0.70) return 'medium';
  if (similarity >= 0.50) return 'low';
  return 'none';
}
