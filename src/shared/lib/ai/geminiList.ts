/**
 * Google Gemini Vision API Integration for Grocery Lists
 * 
 * Extracts grocery items from handwritten or printed list images using AI.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const EXTRACTION_PROMPT = `Analyze this image of a grocery list. Extract all items and their quantities.
Return the result as a simple text list, one item per line.
Do not include any other text, markdown, or explanations.

Format: [Quantity] [Unit] [Item Name]

Example Output:
2 lbs Chicken Breast
3 Apples
1 gallon Milk
Bread
5x Eggs
`;

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
 * Extract grocery list items from an image using Gemini Vision API
 */
export async function extractGroceryListFromImage(
    imageBlob: Blob,
    apiKey: string
): Promise<string> {
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
                temperature: 0.1, // Low temperature for consistent output
                maxOutputTokens: 1000
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

        console.log('[Gemini List] Raw response:', rawText);

        // Clean up text
        let cleanedText = rawText.trim();

        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```\w*\n?/g, '').replace(/```\n?/g, '');

        return cleanedText.trim();

    } catch (error: any) {
        console.error('[Gemini List] Extraction failed:', error);
        throw new Error(`Failed to extract list: ${error.message}`);
    }
}
