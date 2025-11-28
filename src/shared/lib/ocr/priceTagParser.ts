/**
 * Price Tag Parser
 * 
 * Extracts structured data from price tag OCR text.
 * Handles various price tag formats from different grocery stores.
 */

export interface PriceTagData {
    itemName: string;
    totalPrice?: number;
    unitPrice?: number;
    weight?: number;
    unit?: string;
    regularPrice?: number; // For sale items
    onSale: boolean;
    savingsAmount?: number;
    confidence: number;
    rawText: string;
}

// Price patterns (various formats)
const PRICE_PATTERNS = [
    /\$(\d+\.\d{2})/g,                    // $5.99
    /(\d+\.\d{2})\s*(?:ea|each)/gi,      // 5.99 ea
    /(\d+\.\d{2})\s*(?:lb|lbs)/gi,       // 5.99 lb
    /(\d+\.\d{2})/g,                      // 5.99 (fallback)
    // Safeway specific: "500" -> 5.00 (when decimal is missed)
    // Only match if it looks like a price (3 digits, usually followed by small text or end of line)
    /\b(\d{3})\b/g,
];

// Weight patterns
const WEIGHT_PATTERNS = [
    /(\d+\.?\d*)\s*(lb|lbs|pound|pounds)/gi,
    /(\d+\.?\d*)\s*(oz|ounce|ounces)/gi,
    /(\d+\.?\d*)\s*(kg|kilogram|kilograms)/gi,
    /(\d+\.?\d*)\s*(g|gram|grams)/gi,
];

// Unit price patterns
const UNIT_PRICE_PATTERNS = [
    /\$?(\d+\.\d{2})\s*\/\s*(lb|lbs|oz|kg|g|ea|each)/gi,
    /\$?(\d+\.\d{2})\s*per\s*(lb|lbs|oz|kg|g|ea|each)/gi,
    /(\d+\.?\d*)\s*¢\s*\/\s*(lb|lbs|oz|kg|g|ea|each)/gi, // 35.8¢ / oz
    /(\d+\.?\d*)\s*cents\s*\/\s*(lb|lbs|oz|kg|g|ea|each)/gi,
    /(\d+\.?\d*)\s*¢\s*per\s*(lb|lbs|oz|kg|g|ea|each)/gi,
    /(\d+\.?\d*)\s*cents\s*per\s*(lb|lbs|oz|kg|g|ea|each)/gi,
    // Safeway style: "35.8¢ PER OUNCE" (often appears as just "35.8¢" near unit text)
    /(\d+\.?\d*)\s*¢/gi,
];

// Sale indicators
const SALE_KEYWORDS = [
    'sale', 'special', 'save', 'savings', 'was', 'now', 'reduced',
    'clearance', 'discount', 'promo', 'promotion', 'deal',
    'member price', 'club price', 'card price' // Safeway/Vons specific
];

// Quantity requirements (Safeway "Must Buy 3")
const QUANTITY_PATTERNS = [
    /must\s+buy\s+(\d+)/i,
    /buy\s+(\d+)\s+or\s+more/i,
    /limit\s+(\d+)/i
];

/**
 * Parse price tag OCR text into structured data
 */
export function parsePriceTag(ocrText: string, confidence: number = 1.0): PriceTagData {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);

    // Extract item name (usually first line, or largest text)
    const itemName = extractItemName(lines);

    // Extract prices
    totalPrice,
        unitPrice,
        weight: requiredQuantity || weight, // Use required quantity if found (for "Must Buy 3" deals)
            unit: requiredQuantity ? 'ea' : unit, // Default to 'ea' for quantity deals
                regularPrice,
                onSale,
                savingsAmount,
                confidence,
                rawText: ocrText,
    };
}

/**
 * Extract item name from OCR lines
 * Usually the first line or the line with the most text
 */
function extractItemName(lines: string[]): string {
    if (lines.length === 0) return 'Unknown Item';

    // Filter out lines that are just numbers or prices
    const textLines = lines.filter(line => {
        const hasLetters = /[a-zA-Z]/.test(line);
        const isJustPrice = /^\$?\d+\.?\d*$/.test(line.trim());
        return hasLetters && !isJustPrice;
    });

    if (textLines.length === 0) return lines[0] || 'Unknown Item';

    // Return the first text line (usually the item name)
    return textLines[0];
}

/**
 * Extract all prices from text
 */
function extractPrices(text: string): number[] {
    const prices: number[] = [];

    for (const pattern of PRICE_PATTERNS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            let priceStr = match[1] || match[0].replace('$', '');

            // Handle "500" -> 5.00 case
            if (!priceStr.includes('.') && priceStr.length === 3) {
                priceStr = (parseInt(priceStr) / 100).toFixed(2);
            }

            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0 && price < 1000) {
                prices.push(price);
            }
        }
    }

    // Remove duplicates
    return [...new Set(prices)];
}

/**
 * Detect if item is on sale
 */
function detectSale(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SALE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Extract quantity requirement (e.g. "Must Buy 3")
 */
function extractQuantityRequirement(text: string): number | undefined {
    for (const pattern of QUANTITY_PATTERNS) {
        const match = pattern.exec(text);
        if (match) {
            const quantity = parseInt(match[1]);
            if (!isNaN(quantity) && quantity > 0) {
                return quantity;
            }
        }
    }
    return undefined;
}

/**
 * Extract weight and unit
 */
function extractWeightAndUnit(text: string): { weight?: number; unit?: string } {
    for (const pattern of WEIGHT_PATTERNS) {
        const match = pattern.exec(text);
        if (match) {
            const weight = parseFloat(match[1]);
            const unit = normalizeUnit(match[2]);
            if (!isNaN(weight) && weight > 0) {
                return { weight, unit };
            }
        }
    }

    return {};
}

/**
 * Extract unit price ($/lb, $/oz, etc.)
 */
function extractUnitPrice(text: string): number | undefined {
    for (const pattern of UNIT_PRICE_PATTERNS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            let price = parseFloat(match[1]);

            // Check if it's cents (contains ¢ or "cents" in the full match)
            const fullMatch = match[0].toLowerCase();
            if (fullMatch.includes('¢') || fullMatch.includes('cents')) {
                price = price / 100; // Convert to dollars
            }

            if (!isNaN(price) && price > 0) {
                return price;
            }
        }
    }

    return undefined;
}

/**
 * Normalize unit to standard format
 */
function normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();

    // Map variations to standard units
    const unitMap: Record<string, string> = {
        'lb': 'pound',
        'lbs': 'pound',
        'pound': 'pound',
        'pounds': 'pound',
        'oz': 'ounce',
        'ounce': 'ounce',
        'ounces': 'ounce',
        'kg': 'kilogram',
        'kilogram': 'kilogram',
        'kilograms': 'kilogram',
        'g': 'gram',
        'gram': 'gram',
        'grams': 'gram',
        'ea': 'each',
        'each': 'each',
    };

    return unitMap[normalized] || normalized;
}

/**
 * Calculate unit price from total price and weight
 */
export function calculateUnitPriceFromWeight(
    totalPrice: number,
    weight: number,
    unit: string
): number {
    if (weight <= 0) return 0;

    // Convert to pounds for standardization
    let weightInPounds = weight;

    if (unit === 'ounce') {
        weightInPounds = weight / 16;
    } else if (unit === 'kilogram') {
        weightInPounds = weight * 2.20462;
    } else if (unit === 'gram') {
        weightInPounds = weight / 453.592;
    }

    return totalPrice / weightInPounds;
}
