/**
 * Fuzzy matching utilities for approximate string matching
 * Used to find similar item names and avoid duplicates
 */

import { normalizeItemName } from './normalization';

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
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
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 * Uses Levenshtein distance normalized by the longer string length
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeItemName(str1);
  const normalized2 = normalizeItemName(str2);
  
  if (normalized1 === normalized2) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Check if two strings are a fuzzy match
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @param threshold Similarity threshold (0-1, default 0.8)
 * @returns True if similarity >= threshold
 */
export function isFuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find the best fuzzy match from a list of candidates
 * @param query String to match
 * @param candidates List of candidate strings
 * @param threshold Minimum similarity threshold (0-1, default 0.8)
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
  threshold: number = 0.8
): FuzzyMatchResult<T> | null {
  let bestMatch: FuzzyMatchResult<T> | null = null;
  let bestSimilarity = threshold;
  
  candidates.forEach((candidate, index) => {
    const similarity = calculateSimilarity(query, candidate.toString());
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = { match: candidate, similarity, index };
    }
  });
  
  return bestMatch;
}

/**
 * Find all fuzzy matches above a threshold
 * @param query String to match
 * @param candidates List of candidate strings
 * @param threshold Minimum similarity threshold (0-1, default 0.8)
 * @returns Array of matches sorted by similarity (descending)
 */
export function findAllFuzzyMatches<T extends { toString(): string }>(
  query: string,
  candidates: T[],
  threshold: number = 0.8
): FuzzyMatchResult<T>[] {
  const matches: FuzzyMatchResult<T>[] = [];
  
  candidates.forEach((candidate, index) => {
    const similarity = calculateSimilarity(query, candidate.toString());
    if (similarity >= threshold) {
      matches.push({ match: candidate, similarity, index });
    }
  });
  
  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
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
