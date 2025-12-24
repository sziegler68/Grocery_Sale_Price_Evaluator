/**
 * Gemini Chat Service for Mini-Assistant
 * 
 * Parses natural language shopping list input into structured items.
 * Uses the same API key pattern as geminiVision.ts and geminiList.ts.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface ParsedShoppingItem {
    name: string;
    quantity: number;
    unit: string | null;
    category: string;
}

export interface ChatParseResult {
    success: boolean;
    items: ParsedShoppingItem[];
    message: string; // Natural language response for the user
    error?: string;
}

const PARSING_PROMPT = `You are a grocery shopping assistant. Parse the user's input and extract shopping list items.

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "items": [
    { "name": "Apples", "quantity": 2, "unit": null, "category": "Produce" },
    { "name": "Milk", "quantity": 1, "unit": "gallon", "category": "Dairy" }
  ],
  "message": "I found 2 apples and 1 gallon of milk. Should I add these to your list?"
}

Rules:
- name: Capitalize properly (e.g., "Chicken Breast" not "chicken breast")
- quantity: Default to 1 if not specified
- unit: Use "lb", "oz", "gallon", "dozen", etc. or null if just count
- category: One of: Meat, Seafood, Dairy, Produce, Deli, Prepared Food, Bakery, Frozen, Pantry, Condiments, Beverages, Snacks, Household, Personal Care, Baby, Pet, Electronics, Other
- message: A friendly confirmation message listing what you found

If the input is unclear or not about groceries, return:
{ "items": [], "message": "I didn't catch that. Try saying something like 'Add 2 apples and a gallon of milk'." }

User input: `;

/**
 * Parse natural language input into structured shopping items
 */
export async function parseShoppingInput(
    userInput: string,
    apiKey: string
): Promise<ChatParseResult> {
    if (!apiKey) {
        return {
            success: false,
            items: [],
            message: "Please add your Gemini API key in Settings to use the assistant.",
            error: "NO_API_KEY"
        };
    }

    if (!userInput.trim()) {
        return {
            success: false,
            items: [],
            message: "I didn't hear anything. Try again?",
            error: "EMPTY_INPUT"
        };
    }

    try {
        const payload = {
            contents: [
                {
                    parts: [
                        { text: PARSING_PROMPT + userInput }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1000
            }
        };

        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GeminiChat] API error:', errorText);

            if (response.status === 401 || response.status === 403) {
                return {
                    success: false,
                    items: [],
                    message: "Your API key seems invalid. Please check it in Settings.",
                    error: "INVALID_API_KEY"
                };
            }

            return {
                success: false,
                items: [],
                message: "Something went wrong. Please try again.",
                error: "API_ERROR"
            };
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return {
                success: false,
                items: [],
                message: "I couldn't process that. Try again?",
                error: "NO_RESPONSE"
            };
        }

        console.log('[GeminiChat] Raw response:', rawText);

        // Clean and parse JSON
        let cleanedText = rawText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanedText);

        return {
            success: true,
            items: parsed.items || [],
            message: parsed.message || "Ready to add these items?"
        };

    } catch (error: any) {
        console.error('[GeminiChat] Parse error:', error);
        return {
            success: false,
            items: [],
            message: "I had trouble understanding that. Could you try again?",
            error: error.message
        };
    }
}

/**
 * Get API key from localStorage
 */
export function getGeminiApiKey(): string | null {
    return localStorage.getItem('geminiApiKey');
}
