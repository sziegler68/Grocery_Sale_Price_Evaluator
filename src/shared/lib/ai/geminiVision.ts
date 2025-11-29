/**
 * Google Gemini Vision API Integration
 * 
 * Extracts structured data from price tag images using AI.
 */

export interface PriceTagData {
    itemName: string;
    totalPrice?: number; // Deprecated: use memberPrice or regularPrice
    memberPrice?: number;
    regularPrice?: number;
    unitPrice?: number; // Deprecated: use memberUnitPrice
    memberUnitPrice?: number;
    unitPriceUnit?: string; // "ounce", "pound", "gram", etc.
    containerSize?: string; // "14 oz", "1 lb", etc.
    onSale: boolean;
    saleRequirement?: string; // "Must Buy 3", "Buy 2 Get 1 Free", etc.
    confidence: number; // 0-1
    rawResponse?: string; // For debugging
}

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

const EXTRACTION_PROMPT = `You are a grocery price tag data extractor. Analyze this price tag image and extract structured data.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "itemName": "Product name from the tag",
  "memberPrice": 5.99,
  "regularPrice": 7.99,
  "memberUnitPrice": 0.358,
  "unitPriceUnit": "ounce",
  "containerSize": "14 oz",
  "onSale": true,
  "saleRequirement": "Must Buy 3",
  "confidence": 0.95
}

Rules:
- itemName: The product name (e.g., "Guacamole Mild", "Milk")
- memberPrice: The price for members/sale price (e.g., 5.99). If no member price, use the main price.
- regularPrice: The regular/non-member price (e.g., 7.99). If only one price, set same as memberPrice.
- memberUnitPrice: Price per unit for members (e.g., 0.358 for 35.8¢).
- unitPriceUnit: Unit for unitPrice ("ounce", "pound", "gram", "kilogram", "each")
- containerSize: Container size if shown (e.g., "14 oz", "1 lb")
- onSale: true if "Member Price", "Sale", "SAVE", or similar indicator
- saleRequirement: Any quantity requirements (e.g., "Must Buy 3", "Buy 2 Get 1 Free")
- confidence: 0-1 score (0.8+ = high confidence, 0.5-0.8 = medium, <0.5 = low)

If a field is unclear or not shown, omit it (except itemName, onSale, and confidence which are required).
If the image is not a price tag, return {"itemName": "Unknown", "onSale": false, "confidence": 0}`;

/**
 * Convert image Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Extract price tag data from an image using Gemini Vision API
 */
export async function extractPriceTagData(
    imageBlob: Blob,
    apiKey: string
): Promise<PriceTagData> {
    if (!apiKey) {
        throw new Error('API key is required');
    }

    try {
        // Convert image to base64
        const base64Image = await blobToBase64(imageBlob);

        // Prepare request payload
        const payload = {
            contents: [
                {
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        {
                            inline_data: {
                                mime_type: imageBlob.type || 'image/jpeg',
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1, // Low temperature for consistent structured output
                maxOutputTokens: 500
            }
        };

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Extract text from response
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            throw new Error('No response from Gemini API');
        }

        console.log('[Gemini] Raw response:', rawText);

        // Parse JSON response
        // Remove markdown code blocks if present
        const cleanedText = rawText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsedData: PriceTagData = JSON.parse(cleanedText);

        // Validate required fields
        if (!parsedData.itemName || typeof parsedData.onSale !== 'boolean' || typeof parsedData.confidence !== 'number') {
            throw new Error('Invalid response format from Gemini');
        }

        // Add raw response for debugging
        parsedData.rawResponse = rawText;

        return parsedData;

    } catch (error: any) {
        console.error('[Gemini] Extraction failed:', error);
        throw new Error(`Failed to extract price tag data: ${error.message}`);
    }
}

/**
 * Check if API key is valid
 */
export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        return response.ok;
    } catch {
        return false;
    }
}
