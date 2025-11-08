/**
 * OCR Scan Serverless Function
 * 
 * Vercel serverless function for receipt OCR processing.
 * Flow: Upload receipt → Google Vision API → Parse → Ingest items
 * 
 * @see /docs/phase5-ocr-integration-prep.md for architecture details
 */

/**
 * Main OCR scan handler
 * 
 * This is a STUB implementation that returns mock data.
 * The full implementation requires:
 * 1. Google Cloud Vision API setup
 * 2. Vercel Blob Storage or Supabase Storage
 * 3. Environment variables configured
 * 4. @vercel/node package installed (npm install @vercel/node)
 * 
 * For now, it demonstrates the contract and returns realistic mock data.
 */
export default async function handler(
  req: any,
  res: any
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const startTime = Date.now();

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
    }

    // TODO: Verify Supabase JWT
    // const token = authHeader.replace('Bearer ', '');
    // const user = await verifySupabaseAuth(token);

    // 2. Parse request (for now, mock the image processing)
    // In full implementation:
    // - Parse multipart/form-data
    // - Extract receiptImage, listId, storeName
    // - Upload image to storage
    // - Call Google Vision API
    // - Parse OCR response
    // - Batch ingest items

    // MOCK DATA: Simulate a realistic receipt scan
    const mockOCRResult = {
      rawText: `WHOLE FOODS MARKET
123 Main Street
San Francisco, CA 94102

Date: 01/15/2025
Time: 14:32

Organic Milk 1gal       $4.99
Bananas 3lb             $2.49
Cage-Free Eggs 12ct     $5.99
Sourdough Bread         $3.49
Organic Spinach         $2.99
Greek Yogurt            $4.29

Subtotal               $24.24
Tax                     $1.94
--------------------------------
TOTAL                  $26.18

Thank you for shopping!`,
      confidence: 0.92,
      receiptUrl: 'https://storage.example.com/receipts/mock-receipt-123.jpg',
      lineItems: [
        {
          description: 'Organic Milk',
          price: 4.99,
          quantity: 1,
          confidence: 0.94,
        },
        {
          description: 'Bananas',
          price: 2.49,
          quantity: 1,
          confidence: 0.91,
        },
        {
          description: 'Cage-Free Eggs',
          price: 5.99,
          quantity: 1,
          confidence: 0.88,
        },
        {
          description: 'Sourdough Bread',
          price: 3.49,
          quantity: 1,
          confidence: 0.93,
        },
        {
          description: 'Organic Spinach',
          price: 2.99,
          quantity: 1,
          confidence: 0.89,
        },
        {
          description: 'Greek Yogurt',
          price: 4.29,
          quantity: 1,
          confidence: 0.90,
        },
      ],
      metadata: {
        storeName: 'WHOLE FOODS MARKET',
        storeConfidence: 0.98,
        total: 26.18,
        totalConfidence: 0.95,
        date: '2025-01-15',
        dateConfidence: 0.96,
      },
    };

    // MOCK: Simulate ingestion results
    const mockIngestedItems = mockOCRResult.lineItems.map((item, index) => ({
      id: `mock-item-${index + 1}`,
      itemName: item.description,
      price: item.price,
      flagged: item.confidence < 0.9, // Flag low confidence items
      flagReason: item.confidence < 0.9 ? 'Low OCR confidence' : undefined,
    }));

    const processingTimeMs = Date.now() - startTime;

    // Return success response
    return res.status(200).json({
      success: true,
      processingTimeMs,
      ocrResult: mockOCRResult,
      ingestedItems: mockIngestedItems,
      _note: 'This is a MOCK implementation. Full OCR requires Google Vision API setup and env vars.',
    });

  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    
    console.error('[OCR] Error processing receipt:', error);
    
    return res.status(500).json({
      success: false,
      processingTimeMs,
      error: {
        code: 'OCR_FAILED',
        message: error.message || 'Failed to process receipt',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
}

// Vercel serverless function config
export const config = {
  maxDuration: 10, // 10 second timeout
  api: {
    bodyParser: false, // We'll parse multipart/form-data manually
  },
};
