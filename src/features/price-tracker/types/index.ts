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
  meatQuality?: string | undefined;
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
  
  // Phase 4: OCR metadata (optional, can be loaded separately)
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
