# Phase 5 Deliverables - Executive Summary

This document explicitly highlights the Phase 5 deliverables. Full details are in `/docs/phase5-ocr-integration-prep.md` (932 lines).

---

## ✅ Deliverable 1: OCR Provider Contract

**Location:** `docs/phase5-ocr-integration-prep.md` - Lines 107-338

### Provider Selection

**Provider:** Google Cloud Vision API
**Why:** 95%+ accuracy, structured data extraction, $1.50/1k images, mature API, built-in confidence scores

### Request/Response Payloads

**Upload Endpoint:** `POST /api/ocr/scan`

**Request Payload:**
```typescript
// multipart/form-data
{
  receiptImage: File,      // JPEG/PNG, max 5MB
  listId?: string,         // Optional: associate with shopping list
  storeName?: string       // Optional: pre-fill store name
}
```

**Google Vision API Payload (Internal):**
```typescript
POST https://vision.googleapis.com/v1/images:annotate
{
  "requests": [{
    "image": {
      "content": "<base64-encoded-image>",
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
      { "description": "WHOLE FOODS", "confidence": 0.98 },
      { "description": "Organic Milk", "confidence": 0.92 },
      { "description": "$4.99", "confidence": 0.96 }
    ]
  }]
}
```

**Success Response (Our API):**
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
    }
  ]
}
```

### Error Formats

**Error Response:**
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

### Confidence Handling

**Per-Item Confidence:**
- Each line item includes `confidence` score from Google Vision (0.0 - 1.0)
- Items with confidence < 0.7 are auto-flagged for review
- Overall receipt confidence is the page-level confidence from Google Vision

**Auto-Flagging Logic:**
```typescript
// In batchIngestItems()
for (const item of lineItems) {
  await ingestGroceryItem({
    ...item,
    ocr_source: 'google_vision',
    ocr_confidence: item.confidence,
    auto_flag_if_suspicious: true, // Triggers flagging if confidence < 0.7
  });
}
```

**TypeScript Types:**
```typescript
// src/shared/types/ocr.ts
export interface OCRLineItem {
  description: string;
  price: number;
  quantity: number;
  confidence: number;  // 0.0 - 1.0
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
```

---

## ✅ Deliverable 2: Serverless/Edge Integration Plan

**Location:** `docs/phase5-ocr-integration-prep.md` - Lines 340-932

### Function Location

**Platform:** Vercel Serverless Functions
**File:** `/api/ocr/scan.ts`
**Timeout:** 10 seconds
**Runtime:** Node.js 18+

**Why Vercel:**
- ✅ Already using Vercel for hosting
- ✅ Serverless functions with 10s timeout (enough for OCR)
- ✅ Environment variables for API keys
- ✅ Built-in image optimization/CDN
- ✅ Free tier: 100GB bandwidth, 100k invocations/month

**Alternative Considered:** Supabase Edge Functions (Deno-based, faster cold starts, but newer/less mature)

### Complete Flow Diagram

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

### Storage Strategy

**Option 1 (Recommended): Vercel Blob Storage**
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
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
```

### Auth Strategy

**Client-Side (React):**
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

### Retry Strategy

**Google Vision API Failures:**
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

### How Results Reach Ingestion Service

**Step-by-step:**

1. **Upload & Auth**
   ```typescript
   // api/ocr/scan.ts
   const user = await verifySupabaseAuth(req);
   const receiptImage = await req.formData().get('receiptImage');
   ```

2. **Store Image**
   ```typescript
   const receiptUrl = await uploadReceipt(receiptImage, user.id);
   ```

3. **OCR Processing**
   ```typescript
   const ocrResponse = await extractTextFromReceipt(receiptUrl);
   ```

4. **Parse Text to Line Items**
   ```typescript
   const parsed = parseReceiptText(ocrResponse.fullText, ocrResponse.confidence);
   // Returns: { lineItems: [...], metadata: {...} }
   ```

5. **Batch Ingest via Unified Pipeline**
   ```typescript
   const ingestedItems = await batchIngestItems(parsed.lineItems, {
     storeName: parsed.metadata.storeName,
     datePurchased: parsed.metadata.date,
     ocrSource: 'google_vision',
     receiptUrl,
   });
   
   // batchIngestItems() calls ingestGroceryItem() for each item
   for (const item of lineItems) {
     const result = await ingestGroceryItem({
       itemName: item.description,
       price: item.price,
       quantity: item.quantity,
       storeName: metadata.storeName,
       unitType: 'each',
       category: 'Other',
       datePurchased: new Date(metadata.datePurchased),
       
       // OCR metadata
       ocr_source: metadata.ocrSource,
       ocr_confidence: item.confidence,
       receipt_url: metadata.receiptUrl,
       auto_flag_if_suspicious: true,
     }, {
       skipDuplicateCheck: false,
       fuzzyThreshold: 0.85,
     });
     
     results.push({
       id: result.item?.id,
       itemName: item.description,
       price: item.price,
       flagged: result.matchFound !== undefined || item.confidence < 0.7,
     });
   }
   ```

6. **Return Results to Frontend**
   ```typescript
   return Response.json({
     success: true,
     processingTimeMs: Date.now() - startTime,
     ocrResult: parsed,
     ingestedItems,
   });
   ```

### File Structure

```
/api
  /ocr
    scan.ts           # Main OCR endpoint (lines 459-532)
    parse.ts          # Helper: parse OCR text to line items
    ingest.ts         # Helper: batch ingest items (lines 620-666)

/lib
  /ocr
    googleVision.ts   # Google Vision API wrapper (lines 534-563)
    textParser.ts     # Receipt text parsing logic (lines 565-618)

/components
  /ocr
    ReceiptScanner.tsx  # Camera/upload UI (lines 430-457)
    OCRResults.tsx      # Show parsed items, allow edits
    OCRHistory.tsx      # Past scans
```

### Environment Variables

```env
# .env.local (Vercel)
GOOGLE_VISION_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_xxx # If using Vercel Blob
```

### Rate Limiting

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

## Documentation Files

1. **`docs/phase5-ocr-integration-prep.md`** - Full 932-line guide
   - Part 1: Unified ingestion pipeline verification (lines 7-105)
   - Part 2: OCR backend contract (lines 107-338)
   - Part 3: Serverless/edge architecture (lines 340-932)

2. **`PHASE_5_COMPLETE.md`** - 327-line summary

3. **`PHASE_5_DELIVERABLES_SUMMARY.md`** - This document (explicit deliverable breakdown)

---

## Summary

✅ **OCR Provider Contract** - Complete
- Provider: Google Cloud Vision API
- Request/response payloads: Defined
- Error formats: Documented
- Confidence handling: Implemented

✅ **Serverless Integration Plan** - Complete
- Platform: Vercel Serverless Functions
- Storage: Vercel Blob Storage or Supabase Storage
- Auth: Supabase JWT verification
- Retries: 3 attempts with exponential backoff
- Results flow: Receipt → Upload → OCR → Parse → ingestGroceryItem() → Database

**Phase 5 is complete. All planning artifacts exist and are documented.**
