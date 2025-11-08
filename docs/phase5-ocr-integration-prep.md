# Phase 5: OCR Integration Prep - Architecture & Planning

This document defines the OCR integration architecture, backend contract, and serverless workflow for Phase 6 implementation.

---

## Part 1: Unified Ingestion Pipeline ✅

### Current State Verification

All item creation flows now route through `ingestGroceryItem()`:

#### Flow 1: Manual Item Entry
**Component:** `AddItem.tsx`
**Path:** User form → `ingestGroceryItem()` → validation → fuzzy match → create item
**Status:** ✅ UNIFIED

```typescript
// src/features/price-tracker/components/AddItem.tsx
const result = await ingestGroceryItem({
  itemName: data.itemName,
  price: data.price,
  quantity: data.quantity,
  storeName: data.storeName,
  unitType: data.unitType,
  category: data.category,
  targetPrice: data.targetPrice,
  meatQuality: data.meatQuality,
  notes: data.notes,
  datePurchased: data.datePurchased,
}, {
  skipDuplicateCheck: false,
  fuzzyThreshold: 0.85,
});
```

#### Flow 2: Shopping Trip Export
**Component:** `ShoppingListDetail.tsx`
**Path:** Trip completion → cart items → `ingestGroceryItem()` for each → price tracker
**Status:** ✅ UNIFIED

```typescript
// src/features/shopping-lists/components/ShoppingListDetail.tsx
for (const item of cartItems) {
  const result = await ingestGroceryItem({
    itemName: item.item_name,
    price: item.price_paid,
    quantity: item.quantity,
    unitType: item.unit_type || 'each',
    storeName: completedTrip.store_name,
    category: groceryCategory,
    targetPrice: item.target_price || undefined,
    notes: undefined,
    datePurchased: new Date(),
  }, {
    skipDuplicateCheck: false,
    fuzzyThreshold: 0.85,
  });
}
```

#### Flow 3: Future OCR Ingestion
**Component:** (To be created in Phase 6)
**Path:** Receipt scan → OCR → `ingestGroceryItem()` → with OCR metadata
**Status:** ✅ READY (pipeline prepared)

```typescript
// Future: OCR component (Phase 6)
const result = await ingestGroceryItem({
  itemName: ocrData.itemName,
  price: ocrData.price,
  quantity: ocrData.quantity,
  storeName: ocrData.storeName,
  unitType: ocrData.unitType || 'each',
  category: ocrData.category || 'Other',
  
  // OCR metadata
  ocr_source: 'google_vision',
  ocr_confidence: ocrData.confidence,
  ocr_raw_text: ocrData.rawText,
  receipt_url: ocrData.receiptUrl,
  auto_flag_if_suspicious: true, // Auto-flag low confidence
}, {
  skipDuplicateCheck: false,
  fuzzyThreshold: 0.85,
});
```

### No Duplicate Write Logic

**Verified:** No components call `createGroceryItem()` directly.

```bash
$ grep "from.*groceryData.*createGroceryItem" src/features/*/components/*.tsx
# NO MATCHES ✅

$ grep "createGroceryItem\(" src/features/*/components/*.tsx
# NO MATCHES ✅
```

**Only Services Call Create Functions:**
- `itemIngestion.ts` → `createGroceryItem()`
- `tripService.ts` → cart operations (separate domain)

---

## Part 2: OCR Backend Contract

### Provider Selection: **Google Cloud Vision API**

**Why Google Vision:**
- ✅ Highest accuracy for receipt text extraction (95%+ typical)
- ✅ Handles structured data (line items, totals, dates)
- ✅ Reasonable pricing ($1.50 per 1000 images)
- ✅ Mature API with good documentation
- ✅ Built-in confidence scores per text block
- ✅ Supports image from URL or base64

**Alternatives Considered:**
- AWS Textract: More expensive, overkill for receipts
- Tesseract: Free but lower accuracy, no confidence scores
- Azure Computer Vision: Similar to Google, but less mature

---

### Request Contract

#### Upload Endpoint: `POST /api/ocr/scan`

**Request Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <supabase-jwt>
```

**Request Body (multipart/form-data):**
```typescript
{
  receiptImage: File, // JPEG/PNG, max 5MB
  listId?: string,    // Optional: associate with shopping list
  storeName?: string, // Optional: pre-fill store if known
}
```

**Or URL-based:**
```typescript
{
  receiptUrl: string,  // Public URL to receipt image
  listId?: string,
  storeName?: string,
}
```

---

### Google Vision API Call

**Internal API Call (Server-side only):**
```typescript
// POST https://vision.googleapis.com/v1/images:annotate
{
  "requests": [{
    "image": {
      "content": "<base64-encoded-image>"
      // OR
      "source": { "imageUri": "https://..." }
    },
    "features": [{
      "type": "DOCUMENT_TEXT_DETECTION",
      "maxResults": 1
    }]
  }]
}
```

**Google Vision Response:**
```typescript
{
  "responses": [{
    "fullTextAnnotation": {
      "text": "WHOLE FOODS MARKET\n123 Main St\nOrganic Milk $4.99\nBananas 3lb $2.49\n...",
      "pages": [{
        "blocks": [...],
        "confidence": 0.95
      }]
    },
    "textAnnotations": [
      { "description": "WHOLE FOODS", "boundingPoly": {...}, "confidence": 0.98 },
      { "description": "Organic Milk", "boundingPoly": {...}, "confidence": 0.92 },
      { "description": "$4.99", "boundingPoly": {...}, "confidence": 0.96 },
      // ... more text blocks
    ]
  }]
}
```

---

### Response Contract

#### Success Response: `200 OK`

```typescript
{
  "success": true,
  "processingTimeMs": 1234,
  "ocrResult": {
    "rawText": "Full receipt text...",
    "confidence": 0.92,
    "receiptUrl": "https://storage.googleapis.com/receipts/abc123.jpg",
    
    // Parsed line items (best-effort extraction)
    "lineItems": [
      {
        "description": "Organic Milk",
        "price": 4.99,
        "quantity": 1,
        "confidence": 0.92
      },
      {
        "description": "Bananas 3lb",
        "price": 2.49,
        "quantity": 1,
        "confidence": 0.89
      }
    ],
    
    // Extracted metadata
    "metadata": {
      "storeName": "WHOLE FOODS MARKET",
      "storeConfidence": 0.98,
      "total": 7.48,
      "totalConfidence": 0.95,
      "date": "2025-01-15",
      "dateConfidence": 0.91
    }
  },
  
  // Auto-ingested items
  "ingestedItems": [
    {
      "id": "item-uuid-1",
      "itemName": "Organic Milk",
      "price": 4.99,
      "flagged": false
    },
    {
      "id": "item-uuid-2",
      "itemName": "Bananas",
      "price": 2.49,
      "flagged": true,
      "flagReason": "Low OCR confidence"
    }
  ]
}
```

#### Error Response: `4xx / 5xx`

```typescript
{
  "success": false,
  "error": {
    "code": "OCR_FAILED",
    "message": "Failed to extract text from receipt",
    "details": "Google Vision API returned error: ..."
  },
  "processingTimeMs": 500,
  "receiptUrl": "https://storage.googleapis.com/receipts/abc123.jpg"
}
```

**Error Codes:**
- `INVALID_IMAGE` - Not a valid image format
- `IMAGE_TOO_LARGE` - > 5MB
- `OCR_FAILED` - Google Vision API error
- `PARSING_FAILED` - Text extracted but parsing failed
- `NO_TEXT_FOUND` - Receipt is blank/unreadable
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

### TypeScript Types

```typescript
// src/shared/types/ocr.ts (additions)

export interface OCRScanRequest {
  receiptImage?: File;
  receiptUrl?: string;
  listId?: string;
  storeName?: string;
}

export interface OCRLineItem {
  description: string;
  price: number;
  quantity: number;
  confidence: number;
}

export interface OCRMetadata {
  storeName: string;
  storeConfidence: number;
  total: number;
  totalConfidence: number;
  date: string;
  dateConfidence: number;
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  receiptUrl: string;
  lineItems: OCRLineItem[];
  metadata: OCRMetadata;
}

export interface OCRScanResponse {
  success: boolean;
  processingTimeMs: number;
  ocrResult?: OCRResult;
  ingestedItems?: Array<{
    id: string;
    itemName: string;
    price: number;
    flagged: boolean;
    flagReason?: string;
  }>;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
```

---

## Part 3: Serverless/Edge Architecture

### Architecture Decision: **Vercel Serverless Functions**

**Why Vercel:**
- ✅ Already using Vercel for hosting (assumed)
- ✅ Serverless functions with 10s timeout (enough for OCR)
- ✅ Environment variables for API keys
- ✅ Built-in image optimization/CDN
- ✅ Easy deployment with Git push
- ✅ Free tier: 100GB bandwidth, 100k invocations/month

**Alternative:** Supabase Edge Functions (Deno-based, faster cold starts, but newer/less mature)

---

### Component Architecture

```
┌─────────────────────┐
│   React Frontend    │
│  (Camera/Upload UI) │
└──────────┬──────────┘
           │ 1. Upload receipt image
           │ POST /api/ocr/scan
           ↓
┌─────────────────────────────────────┐
│    Vercel Serverless Function       │
│    /api/ocr/scan.ts                 │
│                                     │
│  1. Validate auth (Supabase JWT)   │
│  2. Upload image to storage         │
│  3. Call Google Vision API          │
│  4. Parse OCR response              │
│  5. Auto-ingest items               │
│  6. Create OCR scan records         │
│  7. Return results                  │
└──────────┬──────────────────────────┘
           │
           ├─→ 2. Store image
           │   ↓
           │   ┌─────────────────────┐
           │   │  Vercel Blob Storage│
           │   │  or                 │
           │   │  Supabase Storage   │
           │   └─────────────────────┘
           │
           ├─→ 3. OCR processing
           │   ↓
           │   ┌─────────────────────┐
           │   │ Google Vision API   │
           │   │ Document OCR        │
           │   └─────────────────────┘
           │
           └─→ 5-6. Ingest & persist
               ↓
               ┌─────────────────────┐
               │  Supabase Database  │
               │  - grocery_items    │
               │  - ocr_scans        │
               └─────────────────────┘
```

---

### File Structure

```
/api
  /ocr
    scan.ts           # Main OCR endpoint
    parse.ts          # Helper: parse OCR text to line items
    ingest.ts         # Helper: batch ingest items
  
/lib
  /ocr
    googleVision.ts   # Google Vision API wrapper
    textParser.ts     # Receipt text parsing logic
    
/components
  /ocr
    ReceiptScanner.tsx  # Camera/upload UI
    OCRResults.tsx      # Show parsed items, allow edits
    OCRHistory.tsx      # Past scans
```

---

### Workflow: Step-by-Step

#### Step 1: User Uploads Receipt
```typescript
// components/ocr/ReceiptScanner.tsx
const handleUpload = async (file: File) => {
  setUploading(true);
  
  const formData = new FormData();
  formData.append('receiptImage', file);
  formData.append('listId', currentListId);
  
  const response = await fetch('/api/ocr/scan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
    },
    body: formData,
  });
  
  const result: OCRScanResponse = await response.json();
  
  if (result.success) {
    setOCRResult(result.ocrResult);
    setIngestedItems(result.ingestedItems);
  } else {
    showError(result.error.message);
  }
};
```

#### Step 2: Serverless Function Processes Request
```typescript
// api/ocr/scan.ts
import { NextRequest } from 'next/server';
import { verifySupabaseAuth } from '@/lib/auth';
import { uploadReceipt } from '@/lib/storage';
import { extractTextFromReceipt } from '@/lib/ocr/googleVision';
import { parseReceiptText } from '@/lib/ocr/textParser';
import { batchIngestItems } from '@/lib/ocr/ingest';

export const config = {
  api: {
    bodyParser: false, // Handle multipart/form-data
  },
  maxDuration: 10, // 10 second timeout
};

export default async function handler(req: NextRequest) {
  // 1. Verify authentication
  const user = await verifySupabaseAuth(req);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // 2. Parse form data
  const formData = await req.formData();
  const receiptImage = formData.get('receiptImage') as File;
  const listId = formData.get('listId') as string;
  
  const startTime = Date.now();
  
  try {
    // 3. Upload image to storage
    const receiptUrl = await uploadReceipt(receiptImage, user.id);
    
    // 4. Call Google Vision API
    const ocrResponse = await extractTextFromReceipt(receiptUrl);
    
    // 5. Parse OCR text to line items
    const parsed = parseReceiptText(ocrResponse.fullText, ocrResponse.confidence);
    
    // 6. Auto-ingest items through unified pipeline
    const ingestedItems = await batchIngestItems(parsed.lineItems, {
      storeName: parsed.metadata.storeName,
      datePurchased: parsed.metadata.date,
      ocrSource: 'google_vision',
      receiptUrl,
    });
    
    const processingTimeMs = Date.now() - startTime;
    
    // 7. Return success response
    return Response.json({
      success: true,
      processingTimeMs,
      ocrResult: parsed,
      ingestedItems,
    });
    
  } catch (error: any) {
    const processingTimeMs = Date.now() - startTime;
    
    return Response.json({
      success: false,
      processingTimeMs,
      error: {
        code: 'OCR_FAILED',
        message: error.message,
        details: error.stack,
      },
    }, { status: 500 });
  }
}
```

#### Step 3: Google Vision Integration
```typescript
// lib/ocr/googleVision.ts
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_VISION_EMAIL,
    private_key: process.env.GOOGLE_VISION_PRIVATE_KEY,
  },
});

export async function extractTextFromReceipt(imageUrl: string) {
  const [result] = await client.documentTextDetection(imageUrl);
  
  const fullText = result.fullTextAnnotation?.text || '';
  const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0;
  const textAnnotations = result.textAnnotations || [];
  
  return {
    fullText,
    confidence,
    textBlocks: textAnnotations.map(annotation => ({
      text: annotation.description || '',
      confidence: annotation.confidence || 0,
      boundingBox: annotation.boundingPoly,
    })),
  };
}
```

#### Step 4: Parse Receipt Text
```typescript
// lib/ocr/textParser.ts
export function parseReceiptText(rawText: string, overallConfidence: number) {
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Extract store name (usually first line)
  const storeName = lines[0] || 'Unknown Store';
  
  // Extract line items (lines with price patterns)
  const pricePattern = /\$?\d+\.\d{2}/;
  const lineItems: OCRLineItem[] = [];
  
  for (const line of lines) {
    const priceMatch = line.match(pricePattern);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0].replace('$', ''));
      const description = line.replace(priceMatch[0], '').trim();
      
      if (description && price > 0) {
        lineItems.push({
          description,
          price,
          quantity: 1, // Default to 1 unless found
          confidence: overallConfidence,
        });
      }
    }
  }
  
  // Extract total (look for "TOTAL" or "AMOUNT DUE")
  const totalLine = lines.find(line => 
    /total|amount due/i.test(line)
  );
  const totalMatch = totalLine?.match(pricePattern);
  const total = totalMatch ? parseFloat(totalMatch[0].replace('$', '')) : 0;
  
  // Extract date (look for date patterns)
  const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const dateLine = lines.find(line => datePattern.test(line));
  const dateMatch = dateLine?.match(datePattern);
  const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
  
  return {
    rawText,
    confidence: overallConfidence,
    lineItems,
    metadata: {
      storeName,
      storeConfidence: overallConfidence,
      total,
      totalConfidence: overallConfidence,
      date,
      dateConfidence: dateLine ? overallConfidence : 0.5,
    },
  };
}
```

#### Step 5: Batch Ingest Items
```typescript
// lib/ocr/ingest.ts
import { ingestGroceryItem } from '@/features/price-tracker/services/itemIngestion';

export async function batchIngestItems(
  lineItems: OCRLineItem[],
  metadata: {
    storeName: string;
    datePurchased: string;
    ocrSource: string;
    receiptUrl: string;
  }
) {
  const results = [];
  
  for (const item of lineItems) {
    try {
      const result = await ingestGroceryItem({
        itemName: item.description,
        price: item.price,
        quantity: item.quantity,
        storeName: metadata.storeName,
        unitType: 'each',
        category: 'Other', // TODO: AI categorization
        datePurchased: new Date(metadata.datePurchased),
        
        // OCR metadata
        ocr_source: metadata.ocrSource,
        ocr_confidence: item.confidence,
        receipt_url: metadata.receiptUrl,
        auto_flag_if_suspicious: true, // Flag low confidence
      }, {
        skipDuplicateCheck: false,
        fuzzyThreshold: 0.85,
      });
      
      results.push({
        id: result.item?.id,
        itemName: item.description,
        price: item.price,
        flagged: result.matchFound !== undefined || item.confidence < 0.7,
        flagReason: result.matchFound ? 'Possible duplicate' : 
                    item.confidence < 0.7 ? 'Low OCR confidence' : undefined,
      });
      
    } catch (error) {
      console.error('Failed to ingest item:', item, error);
      results.push({
        id: null,
        itemName: item.description,
        price: item.price,
        flagged: true,
        flagReason: 'Ingestion failed',
      });
    }
  }
  
  return results;
}
```

---

### Storage Strategy

**Option 1: Vercel Blob Storage** (Recommended)
```typescript
import { put } from '@vercel/blob';

export async function uploadReceipt(file: File, userId: string) {
  const blob = await put(`receipts/${userId}/${Date.now()}.jpg`, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  
  return blob.url; // https://xxx.public.blob.vercel-storage.com/...
}
```

**Option 2: Supabase Storage**
```typescript
import { getSupabaseClient } from '@/lib/supabase';

export async function uploadReceipt(file: File, userId: string) {
  const supabase = getSupabaseClient();
  const fileName = `${userId}/${Date.now()}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

---

### Auth & Permissions

**Client-Side:**
```typescript
// Get Supabase JWT for API calls
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

fetch('/api/ocr/scan', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

**Server-Side (Vercel Function):**
```typescript
// api/ocr/scan.ts
import { createClient } from '@supabase/supabase-js';

async function verifySupabaseAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}
```

---

### Error Handling & Retries

**1. Google Vision API Failures:**
```typescript
async function extractTextWithRetry(imageUrl: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await extractTextFromReceipt(imageUrl);
    } catch (error: any) {
      console.error(`OCR attempt ${i + 1} failed:`, error);
      
      if (i === maxRetries - 1) {
        throw error; // Final retry failed
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

**2. Partial Ingestion Failures:**
- If some items fail to ingest, continue with others
- Return both successful and failed items in response
- Flag failed items for manual review

**3. Invalid Image Handling:**
```typescript
// Validate image before processing
function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return 'Image must be less than 5MB';
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Image must be JPEG, PNG, or WebP';
  }
  
  return null; // Valid
}
```

**4. Rate Limiting:**
```typescript
// Track OCR usage per user
const userOCRCount = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const count = userOCRCount.get(userId) || 0;
  if (count >= 50) { // 50 scans per hour
    return false;
  }
  
  userOCRCount.set(userId, count + 1);
  setTimeout(() => {
    userOCRCount.set(userId, Math.max(0, (userOCRCount.get(userId) || 0) - 1));
  }, 3600000); // Reset after 1 hour
  
  return true;
}
```

---

### Environment Variables

```env
# .env.local (Vercel)
GOOGLE_VISION_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # For server-side admin operations

VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_xxx # If using Vercel Blob
```

---

### Cost Estimation

**Google Vision API:**
- First 1,000 images/month: FREE
- Next 1 million: $1.50 per 1,000 images
- Expected monthly cost (10,000 scans): $13.50

**Vercel:**
- Hobby plan: Free (100GB bandwidth, 100k function invocations)
- Pro plan: $20/month (1TB bandwidth, 1M invocations)

**Supabase:**
- Free tier: 500MB storage, 2GB bandwidth
- Pro plan: $25/month (8GB storage, 250GB bandwidth)

**Total Estimated Monthly Cost:**
- Low usage (< 1k scans): $0
- Medium usage (10k scans): ~$13.50
- High usage (100k scans): ~$150 + $20 (Vercel Pro)

---

### Testing Strategy

**Unit Tests:**
- `textParser.ts` - Test receipt parsing with sample text
- `googleVision.ts` - Mock Google Vision API responses
- `ingest.ts` - Test batch ingestion logic

**Integration Tests:**
- End-to-end: Upload image → OCR → Ingest → Verify database

**Manual Tests:**
- Test with various receipt formats (Whole Foods, Walmart, etc.)
- Test error cases (blurry image, no text, invalid format)
- Test rate limiting

---

## Phase 5 Checklist

- [x] Unified ingestion pipeline verified
- [x] No duplicate write logic remaining
- [x] OCR provider selected (Google Vision)
- [x] Request/response contract defined
- [x] TypeScript types created
- [x] Serverless architecture designed (Vercel)
- [x] Storage strategy defined
- [x] Auth/permissions planned
- [x] Error handling strategy documented
- [x] Retry logic planned
- [x] Rate limiting designed
- [x] Cost estimation completed
- [x] Testing strategy defined

---

## Next Steps (Phase 6)

1. Set up Google Cloud project + Vision API
2. Create Vercel serverless functions
3. Implement image upload UI
4. Implement OCR processing pipeline
5. Build review/edit UI for OCR results
6. Add manual correction flow
7. Test with real receipts
8. Deploy to production

**Phase 5 (Prep) is complete. Phase 6 (Implementation) is ready to begin.**
