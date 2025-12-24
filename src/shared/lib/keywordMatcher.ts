/**
 * Keyword-based Intent Matcher
 * 
 * Fast, free intent matching using regex patterns.
 * Falls back to AI for complex queries.
 * 
 * To add new patterns:
 * 1. Add a new entry to INTENT_PATTERNS
 * 2. Add extraction logic in matchIntent()
 */

import type { IntentResult, IntentType, ParsedItem } from '@shared/lib/ai/geminiIntent';

// ============================================
// EDITABLE PATTERNS - Add new keywords here!
// ============================================

interface PatternConfig {
    intent: IntentType;
    patterns: RegExp[];
    extract?: (match: RegExpMatchArray, input: string) => Record<string, unknown>;
}

const INTENT_PATTERNS: PatternConfig[] = [
    // ADD ITEMS - "add 2 apples", "put milk on the list", "get bread"
    {
        intent: 'add_items',
        patterns: [
            /^(add|put|get|buy|grab|pick up)\s+(.+?)(\s+(to|on)\s+(the\s+)?(list|cart))?$/i,
            /^(i need|we need|need)\s+(.+)$/i,
        ],
        extract: (_match, input) => {
            // Remove the action word and parse items
            const itemText = input
                .replace(/^(add|put|get|buy|grab|pick up|i need|we need|need)\s+/i, '')
                .replace(/\s+(to|on)\s+(the\s+)?(list|cart)$/i, '');

            return { items: parseItemsFromText(itemText) };
        }
    },

    // CREATE LIST - "create a list", "new list", "make a shopping list"
    {
        intent: 'create_list',
        patterns: [
            /^(create|make|start|new)\s+(a\s+)?(new\s+)?(shopping\s+)?list(\s+called\s+(.+))?$/i,
            /^new\s+list$/i,
        ],
        extract: (match) => {
            const listName = match[6] || null; // captured group from "called X"
            return { listName };
        }
    },

    // OPEN LIST - "open my costco list", "show the trader joes list"
    {
        intent: 'open_list',
        patterns: [
            /^(open|show|go to)\s+(my\s+)?(.+?)\s+list$/i,
        ],
        extract: (match) => {
            return { listName: match[3] };
        }
    },

    // NAVIGATION - "go to settings", "open help", "show home"
    {
        intent: 'navigation',
        patterns: [
            /^(go\s+to|open|show|take me to)\s+(settings|help|home|lists|items|price[- ]?checker)$/i,
        ],
        extract: (match) => {
            const targetMap: Record<string, string> = {
                'settings': 'settings',
                'help': 'help',
                'home': 'home',
                'lists': 'lists',
                'items': 'items',
                'price-checker': 'price-checker',
                'pricechecker': 'price-checker',
                'price checker': 'price-checker',
            };
            return { target: targetMap[match[2].toLowerCase()] || match[2].toLowerCase() };
        }
    },

    // PRICE CHECK - "is $5/lb good for chicken?"
    {
        intent: 'price_check',
        patterns: [
            /is\s+\$?([\d.]+)\s*\/?\s*(lb|oz|pound|ounce|each|per\s+\w+)?\s+(good|cheap|a good deal|worth it|reasonable)(\s+for\s+(.+))?/i,
        ],
        extract: (match) => {
            return {
                price: parseFloat(match[1]),
                unit: normalizeUnit(match[2]),
                item: match[5] || null
            };
        }
    },

    // COMPARE PRICES - "$4/lb vs $0.30/oz"
    {
        intent: 'compare_prices',
        patterns: [
            /\$?([\d.]+)\s*\/?\s*(lb|oz|pound|ounce|each)?\s*(vs|versus|or|compared to|better than)\s*\$?([\d.]+)\s*\/?\s*(lb|oz|pound|ounce|each)?/i,
            /which\s+(is\s+)?(better|cheaper).+\$?([\d.]+)\s*\/?\s*(lb|oz|pound|ounce|each)?.+\$?([\d.]+)\s*\/?\s*(lb|oz|pound|ounce|each)?/i,
        ],
        extract: (match) => {
            // Handle both pattern types
            if (match[3] && ['vs', 'versus', 'or', 'compared to', 'better than'].includes(match[3].toLowerCase())) {
                return {
                    priceA: parseFloat(match[1]),
                    unitA: normalizeUnit(match[2]),
                    priceB: parseFloat(match[4]),
                    unitB: normalizeUnit(match[5])
                };
            } else {
                return {
                    priceA: parseFloat(match[3]),
                    unitA: normalizeUnit(match[4]),
                    priceB: parseFloat(match[5]),
                    unitB: normalizeUnit(match[6])
                };
            }
        }
    },

    // HELP - "how do I share a list?", "help with settings"
    {
        intent: 'help',
        patterns: [
            /^(how\s+(do\s+i|can\s+i|to)|help(\s+with)?|what\s+is)\s+(.+)/i,
            /^help$/i,
        ],
        extract: (match) => {
            return { topic: match[4] || 'general' };
        }
    },
];

// ============================================
// SUGGESTED PROMPTS - Shown in Luna UI
// ============================================

export const SUGGESTED_PROMPTS = [
    // Row 1 - Most common
    { text: "Add milk and eggs", icon: "🛒" },
    { text: "Create new list", icon: "📝" },
    // Row 2
    { text: "Go to settings", icon: "⚙️" },
    { text: "Help", icon: "❓" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeUnit(unit: string | undefined): string {
    if (!unit) return 'each';
    const normalized = unit.toLowerCase().trim();
    const unitMap: Record<string, string> = {
        'lb': 'lb',
        'lbs': 'lb',
        'pound': 'lb',
        'pounds': 'lb',
        'oz': 'oz',
        'ounce': 'oz',
        'ounces': 'oz',
        'each': 'each',
        'ea': 'each',
    };
    return unitMap[normalized] || normalized;
}

function parseItemsFromText(text: string): ParsedItem[] {
    // Split by "and", commas, or just parse as single item
    const parts = text.split(/\s*(?:,|and)\s*/i).filter(p => p.trim());

    return parts.map(part => {
        // Try to extract quantity: "2 apples", "a dozen eggs", "some milk"
        const quantityMatch = part.match(/^(\d+|a|an|some|a few|a couple|a dozen)\s+(.+)$/i);

        let quantity = 1;
        let name = part.trim();

        if (quantityMatch) {
            const qStr = quantityMatch[1].toLowerCase();
            name = quantityMatch[2].trim();

            if (/^\d+$/.test(qStr)) {
                quantity = parseInt(qStr);
            } else if (qStr === 'a' || qStr === 'an' || qStr === 'some') {
                quantity = 1;
            } else if (qStr === 'a couple' || qStr === 'a few') {
                quantity = 2;
            } else if (qStr === 'a dozen') {
                quantity = 12;
            }
        }

        return {
            name,
            quantity,
            unit: null,
            category: guessCategory(name)
        };
    });
}

function guessCategory(itemName: string): string {
    const name = itemName.toLowerCase();

    // Simple category guessing based on keywords
    const categoryKeywords: Record<string, string[]> = {
        'Meat': ['steak', 'beef', 'chicken', 'pork', 'bacon', 'sausage', 'ham', 'turkey', 'lamb', 'ribeye', 'ground'],
        'Seafood': ['fish', 'salmon', 'shrimp', 'tuna', 'crab', 'lobster', 'tilapia'],
        'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs'],
        'Produce': ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'broccoli', 'fruit', 'vegetable'],
        'Bakery': ['bread', 'bagel', 'muffin', 'cake', 'donut', 'croissant', 'rolls'],
        'Frozen': ['ice cream', 'frozen', 'pizza'],
        'Beverages': ['water', 'juice', 'soda', 'coffee', 'tea', 'drink'],
        'Snacks': ['chips', 'crackers', 'cookies', 'candy', 'nuts'],
        'Pantry': ['rice', 'pasta', 'cereal', 'flour', 'sugar', 'oil', 'sauce', 'soup', 'beans', 'canned'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => name.includes(kw))) {
            return category;
        }
    }

    return 'Other';
}

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

export interface MatchResult {
    matched: boolean;
    result?: IntentResult;
}

export function matchIntent(input: string): MatchResult {
    const trimmedInput = input.trim();

    for (const config of INTENT_PATTERNS) {
        for (const pattern of config.patterns) {
            const match = trimmedInput.match(pattern);
            if (match) {
                const params = config.extract ? config.extract(match, trimmedInput) : {};

                // Generate a friendly message based on intent
                const message = generateMessage(config.intent, params);

                return {
                    matched: true,
                    result: {
                        intent: config.intent,
                        params,
                        message,
                        confidence: 0.9
                    }
                };
            }
        }
    }

    // No match found
    return { matched: false };
}

function generateMessage(intent: IntentType, params: Record<string, unknown>): string {
    switch (intent) {
        case 'add_items': {
            const items = params.items as ParsedItem[] | undefined;
            if (items && items.length > 0) {
                return `Adding ${items.length} item${items.length > 1 ? 's' : ''} to your list.`;
            }
            return "I'll add those items for you.";
        }
        case 'create_list':
            return params.listName
                ? `Creating list "${params.listName}"...`
                : "Sure! What would you like to call this list?";
        case 'open_list':
            return `Opening ${params.listName} list...`;
        case 'navigation':
            return `Going to ${params.target}...`;
        case 'price_check':
            return "Let me check that price for you...";
        case 'compare_prices':
            return "Comparing those prices...";
        case 'help':
            return "Let me help you with that...";
        default:
            return "Got it!";
    }
}
