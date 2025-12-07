/**
 * List Parser Utility
 * 
 * Parses pasted grocery list text into structured items.
 * Supports multiple formats: bullets, numbers, plain text, etc.
 */

export interface ParsedItem {
    rawText: string;
    itemName: string;
    quantity: number | null;
    unit: string | null;
    confidence: number;
}

/**
 * Parse pasted list text into structured items
 */
export function parseListText(text: string): ParsedItem[] {
    if (!text || !text.trim()) {
        return [];
    }

    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !isHeaderLine(line));

    return lines.map(line => parseLine(line)).filter(item => item !== null) as ParsedItem[];
}

/**
 * Check if line is a section header (e.g., "Produce:", "Dairy:")
 */
function isHeaderLine(line: string): boolean {
    const headerPatterns = [
        /^[A-Z][a-z]+:$/,  // "Produce:", "Dairy:"
        /^-+$/,             // Separator lines
        /^=+$/,
        /^\*+$/,
    ];

    return headerPatterns.some(pattern => pattern.test(line.trim()));
}

/**
 * Parse a single line into a ParsedItem
 */
function parseLine(line: string): ParsedItem | null {
    // Remove common prefixes (bullets, numbers, dashes)
    let cleaned = line
        .replace(/^[•\-*]\s+/, '')           // Bullets: • - *
        .replace(/^\d+\.\s+/, '')            // Numbers: 1. 2. 3.
        .replace(/^\[\s*\]\s+/, '')          // Checkboxes: [ ]
        .replace(/^\[x\]\s+/i, '')           // Checked: [x]
        .trim();

    if (!cleaned) {
        return null;
    }

    // Extract quantity and unit
    const { quantity, unit, remainingText } = extractQuantity(cleaned);

    // Clean up the item name
    const itemName = cleanItemName(remainingText);

    if (!itemName) {
        return null;
    }

    // Calculate confidence based on how clean the parse was
    const confidence = calculateConfidence(line, itemName, quantity, unit);

    return {
        rawText: line,
        itemName,
        quantity,
        unit,
        confidence,
    };
}

/**
 * Extract quantity and unit from text
 */
function extractQuantity(text: string): {
    quantity: number | null;
    unit: string | null;
    remainingText: string;
} {
    // Patterns to match quantities (in order of specificity)
    const patterns = [
        // "2 lbs chicken" or "chicken 2 lbs"
        {
            // Order matters! Longest matches first. Use word boundaries to avoid partial matches (e.g. "l" matching start of "large")
            regex: /(\d+\.?\d*)\s*\b(milliliters?|kilograms?|gallons?|bottles?|pounds?|ounces?|quarts?|liters?|blocks?|grams?|dozen|boxes|packs?|bunch|loaf|head|bags?|jars?|cups?|tbsp|lbs?|tsp|gal|box|qt|kg|ml|oz|lb|g|l|c)\b/i,
            hasUnit: true,
        },
        // "3x eggs" or "3 x eggs"
        {
            regex: /(\d+)\s*x\s+/i,
            hasUnit: false,
        },
        // Fractions: "1/2 lb", "1 1/2 cups"
        {
            regex: /(\d+\s+)?(\d+)\/(\d+)\s*(lbs?|pounds?|oz|ounces?|kg|g|ml|l|gallons?|qt|cups?|c|tbsp|tsp)?/i,
            hasUnit: true,
            isFraction: true,
        },
        // Just a number at the start: "5 apples"
        {
            regex: /^(\d+\.?\d*)\s+/,
            hasUnit: false,
        },
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match) {
            let quantity: number;
            let unit: string | null = null;

            if (pattern.isFraction) {
                // Handle fractions
                const whole = match[1] ? parseInt(match[1]) : 0;
                const numerator = parseInt(match[2]);
                const denominator = parseInt(match[3]);
                quantity = whole + numerator / denominator;
                unit = match[4] ? match[4].toLowerCase() : null;
            } else {
                quantity = parseFloat(match[1]);
                unit = pattern.hasUnit && match[2] ? match[2].toLowerCase() : null;
            }

            // Remove the matched portion from text
            const remainingText = text.replace(match[0], '').trim();

            return { quantity, unit, remainingText };
        }
    }

    // No quantity found
    return { quantity: null, unit: null, remainingText: text };
}

/**
 * Clean up item name (remove parenthetical notes, extra whitespace)
 */
function cleanItemName(text: string): string {
    return text
        .replace(/\([^)]*\)/g, '')      // Remove (notes in parentheses)
        .replace(/\[[^\]]*\]/g, '')     // Remove [notes in brackets]
        .replace(/\s+/g, ' ')           // Collapse multiple spaces
        .replace(/[,;]+$/, '')          // Remove trailing punctuation
        .trim();
}

/**
 * Calculate confidence score for the parse
 */
function calculateConfidence(
    original: string,
    itemName: string,
    quantity: number | null,
    unit: string | null
): number {
    let confidence = 0.5; // Base confidence

    // Boost if we extracted a quantity
    if (quantity !== null) {
        confidence += 0.2;
    }

    // Boost if we extracted a unit
    if (unit !== null) {
        confidence += 0.1;
    }

    // Boost if item name is clean (no special characters)
    if (/^[a-zA-Z\s]+$/.test(itemName)) {
        confidence += 0.1;
    }

    // Boost if original text was simple (no complex formatting)
    if (original.length < 50 && !/[{}()<>]/.test(original)) {
        confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
}

/**
 * Normalize unit names to standard forms
 */
export function normalizeUnit(unit: string | null): string | null {
    if (!unit) return null;

    const unitMap: Record<string, string> = {
        'lb': 'lbs',
        'pound': 'lbs',
        'pounds': 'lbs',
        'oz': 'oz',
        'ounce': 'oz',
        'ounces': 'oz',
        'kg': 'kg',
        'kilogram': 'kg',
        'kilograms': 'kg',
        'g': 'g',
        'gram': 'g',
        'grams': 'g',
        'l': 'l',
        'liter': 'l',
        'liters': 'l',
        'ml': 'ml',
        'milliliter': 'ml',
        'milliliters': 'ml',
        'gal': 'gal',
        'gallon': 'gal',
        'gallons': 'gal',
        'qt': 'qt',
        'quart': 'qt',
        'quarts': 'qt',
        'cup': 'cup',
        'cups': 'cup',
        'c': 'cup',
        'tbsp': 'tbsp',
        'tsp': 'tsp',
        'dozen': 'dozen',
    };

    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
}
