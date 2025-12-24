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

const INTENT_PROMPT = `You are Luna, a shopping assistant. Classify the user intent and extract parameters.

Return ONLY a JSON object (no markdown, no explanation):
{
  "intent": "<intent_type>",
  "params": {<parameters>},
  "message": "<short friendly response>",
  "confidence": 0.9
}

Intent types and their parameters:
1. "add_items" - User wants to add items to shopping list
   params: { items: [{name: string, quantity: number, unit: string|null, category: string}] }
   Examples:
   - "add 2 ribeye steaks" → items: [{name: "ribeye steaks", quantity: 2, unit: null, category: "Meat"}]
   - "add milk and eggs" → items: [{name: "milk", quantity: 1, unit: null, category: "Dairy"}, {name: "eggs", quantity: 1, unit: null, category: "Dairy"}]
   - "add 3 lb chicken" → items: [{name: "chicken", quantity: 3, unit: "lb", category: "Meat"}]
   - "add apples" → items: [{name: "apples", quantity: 1, unit: null, category: "Produce"}]
   - "put bread on the list" → items: [{name: "bread", quantity: 1, unit: null, category: "Bakery"}]

2. "navigation" - User wants to go to a page
   params: { target: "home"|"settings"|"help"|"lists"|"price-checker"|"items" }

3. "create_list" - User wants to create a NEW shopping list
   params: { listName: "the list name the user specified" }
   Examples:
   - "create a new list" → listName: "New List"
   - "make a new list called Costco" → listName: "Costco"
   - "create list for Trader Joes" → listName: "Trader Joes"
   - "new list" → listName: "New List"
   - "start a list" → listName: "New List"

4. "open_list" - User wants to OPEN an existing list
   params: { listName: "the list name" }

5. "price_check" - User asking if a price is good
   params: { item: "item name", price: number, unit: "lb"|"oz"|"each" }

6. "compare_prices" - User comparing two prices
   params: { priceA: number, unitA: string, priceB: number, unitB: string }

7. "help" - User asking how to use the app
   params: { topic: "what they're asking about" }

8. "unknown" - Cannot determine intent

Categories: Meat, Seafood, Dairy, Produce, Deli, Prepared Food, Bakery, Frozen, Pantry, Condiments, Beverages, Snacks, Household, Personal Care, Baby, Pet, Electronics, Other

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

    let rawText: string | undefined;

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
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
        console.error('[Intent] Parse error:', error);
        console.error('[Intent] Raw text was:', rawText || 'no text');
        return {
            intent: 'unknown',
            params: {},
            message: "Sorry, I had trouble with that. Try saying something like 'create a list called Groceries'.",
            confidence: 0
        };
    }
}
