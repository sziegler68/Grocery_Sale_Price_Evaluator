/**
 * TypeScript types for Price Tracker feature
 */

// OCR source types
export type OCRSourceType = 
  | 'manual_entry'
  | 'google_vision'
  | 'tesseract'
  | 'aws_textract'
  | 'azure_ocr'
  | 'other';

// OCR scan metadata
export type OCRScan = {
  id: string;
  created_at: string;
  grocery_item_id: string;
  ocr_source: OCRSourceType;
  confidence: number | null;
  raw_text: string | null;
  receipt_url: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  user_id: string | null;
};

// Grocery item with moderation and OCR support
export type GroceryItem = {
  id: string;
  itemName: string;
  category: string;
  
  // Phase 3: Expanded quality tracking
  meatQuality?: string | undefined; // Deprecated - kept for backwards compatibility
  organic?: boolean;
  grassFed?: boolean;
  freshness?: 'Fresh' | 'Previously Frozen' | 'Frozen';
  meatGrade?: 'Choice' | 'Prime' | 'Wagyu';
  seafoodSource?: 'Wild' | 'Farm Raised';
  
  storeName: string;
  price: number;
  quantity: number;
  unitType: string;
  unitPrice: number;
  datePurchased: Date;
  notes?: string;
  targetPrice?: number;
  userId?: string;
  
  // Phase 4: Moderation fields
  flagged_for_review?: boolean;
  verified?: boolean;
  flagged_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  
  // Phase 4: OCR metadata fields (inline, from grocery_items table)
  ocr_source?: OCRSourceType;
  ocr_confidence?: number | null;
  
  // Phase 4: OCR scans (optional, can be loaded separately from ocr_scans table)
  ocr_scans?: OCRScan[];
};

export type DataSource = 'supabase' | 'mock';

export type GroceryDataResult = {
  items: GroceryItem[];
  source: DataSource;
  error?: string;
};

export type GroceryItemDetailResult = {
  item: GroceryItem | null;
  priceHistory: GroceryItem[];
  source: DataSource;
  error?: string;
};
