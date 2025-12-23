/**
 * Gemini Intent Classification
 * 
 * Token-efficient intent classifier. Gemini only classifies intent,
 * the app handles all computation.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export type IntentType =
    | 'add_items'
    | 'navigation'
    | 'create_list'
    | 'open_list'
    | 'price_check'
    | 'compare_prices'
    | 'help'
    | 'unknown';

export interface ParsedItem {
    name: string;
    quantity: number;
    unit: string | null;
    category: string;
}

export interface IntentResult {
    intent: IntentType;
    params: {
        // add_items
        items?: ParsedItem[];
        // navigation
        target?: 'home' | 'settings' | 'help' | 'lists' | 'price-checker' | 'items';
        // create_list / open_list
        listName?: string;
        // price_check
        item?: string;
        price?: number;
        unit?: string;
        // compare_prices
        priceA?: number;
        unitA?: string;
        priceB?: number;
        unitB?: string;
        // help
        topic?: string;
    };
    message: string;
    confidence: number;
}

const INTENT_PROMPT = `You are a shopping assistant classifier. Classify the user's intent and extract parameters.

Return ONLY valid JSON (no markdown):
{
  "intent": "...",
  "params": {...},
  "message": "...",
  "confidence": 0.9
}

Intents:
- "add_items": Adding items to shopping list. Extract: items (array of {name, quantity, unit, category})
- "navigation": Going to a page. Extract: target (home, settings, help, lists, price-checker, items)
- "create_list": Creating a new list. Extract: listName
- "open_list": Opening an existing list. Extract: listName
- "price_check": Asking if a price is good. Extract: item, price, unit
- "compare_prices": Comparing two prices. Extract: priceA, unitA, priceB, unitB
- "help": Asking how to use the app. Extract: topic
- "unknown": Can't determine intent

Categories: Meat, Seafood, Dairy, Produce, Deli, Prepared Food, Bakery, Frozen, Pantry, Condiments, Beverages, Snacks, Household, Personal Care, Baby, Pet, Electronics, Other

Examples:
- "add 2 apples and milk" → add_items
- "open my Costco list" → open_list
- "create a list called Trader Joes" → create_list
- "go to settings" → navigation
- "is $5 per pound good for chicken" → price_check
- "what's better, $4 per pound or 30 cents per ounce" → compare_prices
- "how do I share a list" → help

User: `;

export async function classifyIntent(
    userInput: string,
    apiKey: string
): Promise<IntentResult> {
    if (!apiKey) {
        return {
            intent: 'unknown',
            params: {},
            message: "Please add your Gemini API key in Settings.",
            confidence: 0
        };
    }

    try {
        const payload = {
            contents: [{ parts: [{ text: INTENT_PROMPT + userInput }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        };

        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('[Intent] API error:', response.status);
            return {
                intent: 'unknown',
                params: {},
                message: "I had trouble understanding that. Could you try again?",
                confidence: 0
            };
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return {
                intent: 'unknown',
                params: {},
                message: "I didn't catch that. Try again?",
                confidence: 0
            };
        }

        // Parse JSON
        let cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanedText) as IntentResult;
        console.log('[Intent] Classified:', parsed.intent, parsed.params);

        return parsed;
    } catch (error) {
        console.error('[Intent] Error:', error);
        return {
            intent: 'unknown',
            params: {},
            message: "I had trouble understanding that. Could you try again?",
            confidence: 0
        };
    }
}
