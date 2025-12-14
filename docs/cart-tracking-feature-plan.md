# Shopping Cart Budget Tracking Feature Plan

## ?? Overview

This document outlines a comprehensive plan to add real-time shopping cart budget tracking to the Grocery Price Tracker app. This feature would allow users to track their spending as they shop, stay within budget, and automatically capture prices for the price database.

**Status:** Planned - Not yet implemented  
**Last Updated:** 2025-11-03  
**Estimated Implementation:** Phase 1 (2-3 hours), Phase 2 (8-12 hours), Phase 3 (TBD)

---

## ?? Problem Statement

**Current Pain Point:**  
While shopping, it's difficult to keep a running total of items in your cart. Shoppers often exceed their budget because manual mental math is error-prone and tedious. By the time you reach checkout, it's awkward to put items back.

**User Need:**  
A way to track cart total in real-time while shopping, with visual warnings when approaching or exceeding budget, and the ability to quickly remove items to get back under budget.

---

## ?? Why This Fits Our App Perfectly

### Existing Infrastructure We Can Leverage:

1. **Price Database** - Historical prices and target prices already tracked
2. **Shopping Lists** - Collaborative lists already shared with family
3. **Store Selection** - User already specifies which store they're at
4. **Item Categorization** - Items organized by category
5. **PWA Architecture** - Offline-capable, camera access available
6. **Real-time Sync** - Supabase enables live updates across devices

### The Synergy:

- Scan/enter prices while shopping ? **automatically adds to price database**
- Compare scanned price vs **your target price in real-time**
- **Check items off list** while adding to cart (dual purpose)
- **Family sees your cart total** update live (optional)
- After trip, **all data is saved** for future price comparison
- Creates a **data flywheel**: More shopping trips ? Better price database

---

## ?? Implementation Phases

### Phase 1: Manual Cart Tracking (2-3 hours) ? START HERE

Build the core budgeting functionality WITHOUT OCR to deliver immediate value.

#### Features:
- "Start Shopping Trip" button on shopping list detail page
- Set trip budget (e.g., $150)
- Quick number pad to manually enter prices as you shop
- Running total with visual progress meter
- Color-coded warnings:
  - ?? **Green (0-89%)**: "Under budget"
  - ?? **Yellow (90-99%)**: "Approaching budget limit"
  - ?? **Red (100-109%)**: "At budget limit"
  - ???? **Flashing Red (110%+)**: "Over budget!"
- Tap item on list ? Quick number pad ? Enter price ? Auto-checks item off
- "Remove from Cart" - Remove items to adjust budget
- End trip: "Save prices to database?" ? One tap adds all to price tracker

#### Why Start Here:
- ? Delivers 80% of the value
- ? Much simpler to implement
- ? Fast and reliable
- ? No image processing complexity
- ? Users can decide if they want OCR later
- ? Proves value before investing in OCR

#### Technical Approach:
```typescript
interface ShoppingTrip {
  id: string;
  list_id: string;
  budget: number;
  store_name: string;
  started_at: string;
  completed_at?: string;
  total_spent: number;
  items_purchased: number;
}

interface CartItem {
  id: string;
  trip_id: string;
  list_item_id: string;
  item_name: string;
  price_paid: number;
  quantity: number;
  added_at: string;
}
```

#### UI Components Needed:
- `StartShoppingTripModal.tsx` - Set budget, confirm store
- `ShoppingTripView.tsx` - Main cart tracking interface
- `QuickPriceInput.tsx` - Number pad for fast entry
- `CartSummary.tsx` - Budget meter, warnings, total
- `CartItemList.tsx` - Items in cart with remove option
- `TripCompleteModal.tsx` - Review, save to database

---

### Phase 2: OCR Price Scanning (8-12 hours)

Add camera-based price tag scanning after Phase 1 proves valuable.

#### Features:
- ?? Camera button next to each item on list
- Snap photo of price tag
- OCR extracts price from image
- Confidence indicator (High/Medium/Low)
- Allow manual correction if OCR is wrong
- Automatic fallback to manual entry if OCR fails
- Option to retake photo
- Process and discard image immediately (privacy)

#### Technical Options:

##### Option A: Tesseract.js (Recommended for MVP)
- **Pros:** Free, runs in browser, offline-capable, no API costs
- **Cons:** 80-90% accuracy, slower (2-5 sec), struggles with angles/glare
- **Library:** `tesseract.js`
- **Cost:** $0

##### Option B: Google Cloud Vision API
- **Pros:** 95%+ accuracy, fast (1-2 sec), handles various conditions
- **Cons:** Requires API key, costs money ($1.50 per 1,000 images), needs internet
- **Cost:** ~$0.0015 per scan
- **Monthly cost example:** 100 scans = $0.15, 1,000 scans = $1.50

##### Option C: Hybrid Approach
- Use Tesseract.js as primary
- If confidence < 70%, prompt for manual entry
- Option to upgrade to Cloud Vision for premium users

#### Implementation Strategy:
1. Always show number pad immediately (don't block on OCR)
2. OCR processes in background
3. If OCR completes with high confidence, auto-populate field
4. User can always override OCR result
5. Track OCR accuracy to improve over time

#### Camera Best Practices:
- Guide user to take clear photos (overlay grid, tips)
- Auto-focus on center of image
- Enhance contrast before OCR
- Pre-process image: grayscale, sharpen, threshold

---

### Phase 3: Advanced Features (Future)

Features to consider after Phase 1 & 2 are successful:

#### Receipt Scanning
- Scan entire receipt at checkout
- Auto-populate all prices at once
- Match items to shopping list
- Verify totals match

#### Smart Price Comparisons
- "This milk is $0.50 more than last week" (real-time alert)
- "Better deal at Costco - $3.99 vs $4.99 here"
- Suggest substitutions: "Generic brand saves $2.00"

#### Savings Tracker
- "You saved $23 this trip by staying under target!"
- Monthly savings reports
- Gamification: Badges for staying under budget

#### Multi-Person Cart
- Both shoppers add items to shared cart in real-time
- See what partner added: "Alex added Chips - $3.99"
- Coordinate to stay under budget together

#### Store Layout Optimization
- Reorder shopping list by aisle/store layout
- Navigate efficiently through store
- "Next item: Aisle 5 - Dairy"

#### Barcode Scanning (Alternative to OCR)
- Scan product barcode
- Lookup typical price from database
- User types actual shelf price
- Compare: "Typical: $4.99, Today: $3.99 - Great deal! ??"

---

## ?? User Flow Examples

### Phase 1 - Manual Entry Flow:

```
1. User opens "Family Groceries" shopping list
2. Taps "Start Shopping Trip" button
3. Modal appears: "Set your budget for this trip"
   - Pre-filled with average trip cost ($150)
   - Can adjust with +/- buttons or type
4. Confirms store selection (Costco)
5. Taps "Start Shopping"
6. Screen splits:
   - Top: Budget meter + Cart total
   - Bottom: Shopping list items

7. User finds Milk in store
8. Taps on "Milk" in list
9. Quick number pad slides up
10. Types "499" ? Shows "$4.99"
11. Taps "Add to Cart"
12. Milk checks off, cart shows $4.99 / $150 (3%)
13. Target price shown: "Target: $4.50 - $0.49 over" (yellow highlight)

14. Continues shopping...
15. At $135 total ? Meter turns yellow: "90% of budget"
16. At $155 total ? Meter turns red + vibrate: "5% over budget!"

17. Taps "Review Cart" button
18. Sees all items with prices
19. Unchecks "Cookies - $8.99"
20. Cart updates to $146.01 ? Back to green

21. Reaches checkout
22. Taps "Complete Trip"
23. Modal: "Trip Complete! Total: $146.01"
24. "Save prices to Price Tracker?" ? Tap "Save All"
25. All 15 items auto-added to price database with today's date
26. Shows savings: "Stayed $3.99 under budget! ??"
```

### Phase 2 - OCR Scanning Flow:

```
1-6. [Same as Phase 1]

7. User finds Milk in store
8. Taps ?? camera icon next to "Milk"
9. Camera opens with overlay guide
10. Centers price tag in frame, taps capture
11. Processing indicator (1-3 seconds)
12. OCR extracts "$4.99" with "High confidence" badge
13. Shows extracted price with options:
    - ? Correct ? Add to Cart
    - ?? Edit ? Opens number pad
    - ?? Retake ? Take new photo
14. Taps "? Correct"
15. Milk checks off, cart shows $4.99 / $150 (3%)

[Rest same as Phase 1]
```

### Phase 3 - Multi-Person Shopping Flow:

```
1. Alex starts shopping trip at Costco
2. Sarah sees notification: "Alex started shopping"
3. Sarah opens list, sees live cart: $23.50 (4 items)
4. Sarah remembers forgotten item, adds "Eggs" to list
5. Alex sees "Eggs" appear on list in real-time
6. Alex finds eggs, scans price, adds to cart
7. Both see cart update to $28.49
8. Cart hits 95% of budget
9. Both get warning notification
10. Sarah removes "Ice Cream" from home
11. Alex sees it disappear, puts it back on shelf
12. Finish shopping under budget together
```

---

## ?? Technical Considerations

### Database Schema:

```sql
-- Shopping trips table
CREATE TABLE shopping_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  budget DECIMAL(10,2) NOT NULL,
  store_name VARCHAR(100),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_spent DECIMAL(10,2) DEFAULT 0,
  items_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cart items (temporary during trip)
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE,
  list_item_id UUID REFERENCES shopping_list_items(id),
  item_name VARCHAR(255) NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_type VARCHAR(50),
  added_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shopping_trips_list ON shopping_trips(list_id);
CREATE INDEX idx_shopping_trips_active ON shopping_trips(completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_cart_items_trip ON cart_items(trip_id);
```

### Real-time Subscriptions:

```typescript
// Subscribe to cart updates for live sync
const subscription = supabase
  .channel(`trip:${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'cart_items',
    filter: `trip_id=eq.${tripId}`
  }, payload => {
    // Update cart total in real-time
    updateCartTotal();
  })
  .subscribe();
```

### Offline Support:

```typescript
// Queue operations when offline
const addToCart = async (item: CartItem) => {
  if (!navigator.onLine) {
    // Store in IndexedDB
    await saveToIndexedDB('pending_cart_items', item);
    // Update UI optimistically
    updateUIOptimistically(item);
  } else {
    // Sync immediately
    await supabase.from('cart_items').insert(item);
  }
};

// Sync when back online
window.addEventListener('online', async () => {
  const pendingItems = await getFromIndexedDB('pending_cart_items');
  for (const item of pendingItems) {
    await supabase.from('cart_items').insert(item);
  }
  await clearIndexedDB('pending_cart_items');
});
```

### OCR Processing (Phase 2):

```typescript
// Tesseract.js implementation
import Tesseract from 'tesseract.js';

const scanPriceTag = async (imageFile: File): Promise<OCRResult> => {
  // Pre-process image
  const processedImage = await preprocessImage(imageFile);
  
  // Run OCR
  const { data } = await Tesseract.recognize(
    processedImage,
    'eng',
    {
      logger: m => console.log(m), // Progress
      tessedit_char_whitelist: '0123456789.$', // Only numbers and $ .
    }
  );
  
  // Extract price with regex
  const priceMatch = data.text.match(/\$?(\d+\.\d{2})/);
  const confidence = data.confidence;
  
  return {
    price: priceMatch ? parseFloat(priceMatch[1]) : null,
    confidence: confidence,
    rawText: data.text
  };
};

const preprocessImage = async (file: File): Promise<Blob> => {
  // Convert to grayscale, increase contrast, sharpen
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // ... image processing logic
  return canvas.toBlob();
};
```

### Camera Permissions:

```typescript
// Request camera permission
const requestCamera = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } // Rear camera
    });
    stream.getTracks().forEach(track => track.stop()); // Release
    return true;
  } catch (error) {
    console.error('Camera permission denied', error);
    return false;
  }
};
```

---

## ?? UI/UX Design Notes

### Budget Meter Design:

```
???????????????????????????????????????
?  Shopping Trip - Costco             ?
?  ????????????????????????????????  ?
?  $78.45 / $150.00 (52%)             ?
?  ?? $71.55 remaining                 ?
???????????????????????????????????????
```

At 90%:
```
???????????????????????????????????????
?  Shopping Trip - Costco             ?
?  ????????????????????????????????  ?
?  $135.00 / $150.00 (90%)            ?
?  ?? $15.00 remaining - Almost there! ?
???????????????????????????????????????
```

At 105%:
```
???????????????????????????????????????
?  Shopping Trip - Costco             ?
?  ????????????????????????????????  ?
?  $157.50 / $150.00 (105%) ??        ?
?  ?? $7.50 over budget               ?
?  [Review Cart] [Continue Anyway]    ?
???????????????????????????????????????
```

### Quick Number Pad:

```
???????????????????????????????
?  Milk - Whole (Gallon)      ?
?  ???????????????????????    ?
?  ?       $4.99         ?    ?  <- Live preview
?  ???????????????????????    ?
?                             ?
?   [1] [2] [3]              ?
?   [4] [5] [6]              ?
?   [7] [8] [9]              ?
?   [.] [0] [?]              ?
?                             ?
?  Target: $4.50 ($0.49 over) ?
?                             ?
?  [Cancel]    [Add to Cart]  ?
???????????????????????????????
```

### Price Comparison Badges:

- ?? **Below Target** - Green badge with down arrow
- ?? **Above Target** - Red badge with up arrow  
- ?? **At Target** - Blue badge with equals sign
- ?? **No Target Set** - Gray badge

---

## ?? Success Metrics

### Phase 1 Metrics:
- % of shopping lists that start a trip
- Average items per trip
- % of trips that stay under budget
- % of trips that save prices to database
- User retention after using cart tracking

### Phase 2 Metrics (OCR):
- OCR accuracy rate (% correct without manual edit)
- OCR usage rate (% of users who try it)
- Time saved vs manual entry
- User preference: OCR vs manual

### Business Metrics:
- User engagement (sessions per week)
- Feature adoption rate
- User satisfaction (surveys)
- Viral coefficient (invites sent after using feature)

---

## ?? Challenges & Solutions

### Challenge 1: OCR Accuracy
**Problem:** Price tags vary wildly (fonts, glare, angles, handwritten)  
**Solution:** 
- Always provide manual override
- Use confidence thresholds (< 70% = skip to manual)
- Collect failed scans to improve model
- Consider hybrid: Tesseract + manual corrections train Cloud Vision

### Challenge 2: Speed
**Problem:** OCR takes 2-5 seconds, feels slow while shopping  
**Solution:**
- Show number pad immediately (don't wait for OCR)
- OCR processes in background
- If OCR finishes fast, auto-populate
- Manual typing is always available and often faster

### Challenge 3: In-Store Connectivity
**Problem:** Stores often have poor WiFi/cellular signal  
**Solution:**
- Full offline support via IndexedDB
- Queue all cart operations locally
- Sync when connection returns
- Visual indicator of offline mode
- Never block user on network

### Challenge 4: Privacy Concerns
**Problem:** Users may not want photos stored  
**Solution:**
- Process image in-browser (never upload photo)
- Extract text, immediately discard image
- Only save final price number
- Clear messaging: "Photos are not stored"

### Challenge 5: Battery Drain
**Problem:** Camera + OCR processing drains battery  
**Solution:**
- Optimize OCR (run on smaller image)
- Release camera immediately after capture
- Offer manual mode for battery savings
- Process OCR only when requested

### Challenge 6: Multiple Carts
**Problem:** Two shoppers in same store with separate carts  
**Solution:**
- Multiple active trips per list (rare edge case)
- Label trips: "Alex's Trip", "Sarah's Trip"
- Option to merge trips at end
- Default: One active trip per list

---

## ?? Competitive Analysis

### Existing Solutions:

| App | Features | Limitations |
|-----|----------|-------------|
| **Grocery Pal** | Budget tracking, manual entry | No OCR, no price history, no family sharing |
| **Basket** | Receipt scanning | Only after shopping, no real-time, expensive ($5/mo) |
| **Flipp** | Flyers, coupons | No cart tracking, no budgeting |
| **Our App** | Price history, collaborative lists, target prices | **Missing real-time cart tracking** |

### Our Competitive Advantage:
? **Only app** combining price tracking + collaborative lists + budget tracking + OCR  
? **Data flywheel**: More shopping ? Better price database ? Better targets ? More savings  
? **Family collaboration**: Shared budget, shared savings  
? **Offline-first**: Works in stores with bad connectivity  
? **Privacy-focused**: No photos stored, no tracking  
? **Free & open**: No subscription required

---

## ?? Monetization Potential (Optional)

If you ever want to monetize:

### Free Tier:
- Manual cart tracking
- Up to 3 shopping lists
- Basic price database
- Up to 50 items per trip

### Premium Tier ($2.99/month):
- OCR price scanning (Cloud Vision API)
- Unlimited shopping lists
- Receipt scanning
- Advanced analytics & savings reports
- Priority support
- Export data

### Freemium Conversion Strategy:
- Make Phase 1 completely free (build trust)
- Offer OCR as premium upgrade
- "Unlock OCR scanning - Save time on every trip!"
- Many users will pay $3/mo if it saves 10 min per trip

**Cost analysis:**
- $2.99/month per user
- Cloud Vision: ~$1.50 per 1,000 scans
- Average user: ~100 scans/month = $0.15 cost
- Margin: $2.84 per user per month (95% margin)

---

## ??? Roadmap & Timeline

### Phase 1: Manual Cart Tracking (Week 1-2)
- [ ] Day 1-2: Database schema + API endpoints
- [ ] Day 3-4: UI components (trip start, number pad, cart view)
- [ ] Day 5-6: Budget meter, warnings, real-time updates
- [ ] Day 7: "Save to price database" integration
- [ ] Day 8-10: Testing, bug fixes, polish

**Deliverable:** Fully functional manual cart tracking

### Phase 2: OCR Scanning (Week 3-6)
- [ ] Week 3: Camera integration, permissions
- [ ] Week 4: Tesseract.js setup, image preprocessing
- [ ] Week 5: OCR accuracy testing, confidence thresholds
- [ ] Week 6: UI polish, error handling, user testing

**Deliverable:** OCR price scanning with manual fallback

### Phase 3: Advanced Features (Month 3+)
- [ ] Receipt scanning
- [ ] Smart price comparisons
- [ ] Savings reports
- [ ] Multi-person carts
- [ ] Store layout optimization

**Deliverable:** Premium feature set

---

## ?? Security & Privacy

### Data Collection:
- ? Store: Price, item name, store, date
- ? Never store: Photos, location details, personal info

### User Privacy:
- All cart data tied to anonymous list share codes
- No personal accounts required
- Photos processed locally, never uploaded
- Users can delete trip history anytime

### RLS Policies:
```sql
-- Anyone with the share code can view trips
CREATE POLICY "Public read trips" ON shopping_trips
  FOR SELECT USING (true);

-- Anyone can create a trip (require share code in app logic)
CREATE POLICY "Public create trips" ON shopping_trips
  FOR INSERT WITH CHECK (true);

-- Anyone can update their own trip
CREATE POLICY "Public update trips" ON shopping_trips
  FOR UPDATE USING (true);
```

---

## ?? Resources & References

### Libraries to Use:
- **Tesseract.js** - OCR: https://github.com/naptha/tesseract.js
- **React Camera Pro** - Camera UI: https://www.npmjs.com/package/react-camera-pro
- **IndexedDB** - Offline storage: https://dexie.org/
- **Chart.js** - Budget meter visualization: https://www.chartjs.org/

### Inspiration:
- **Splitwise** - Shared expense tracking UX
- **Mint** - Budget visualization and warnings
- **Google Lens** - OCR UI patterns
- **Instacart** - In-cart total tracking

### Technical Docs:
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [Camera API MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Tesseract.js Docs](https://tesseract.projectnaptha.com/)
- [PWA Best Practices](https://web.dev/pwa/)

---

## ?? Next Steps

### To Start Phase 1:
1. Review this document with stakeholders
2. Create GitHub issue for Phase 1
3. Set up database schema (shopping_trips, cart_items tables)
4. Build `StartShoppingTripModal` component
5. Implement number pad and cart tracking logic
6. Test with real shopping trips
7. Iterate based on feedback

### To Prepare for Phase 2:
1. Research OCR libraries (benchmark Tesseract vs alternatives)
2. Test OCR accuracy with various price tag photos
3. Evaluate Cloud Vision API costs vs accuracy gains
4. Design camera UI/UX (mockups, user flows)
5. Plan image preprocessing pipeline

### Questions to Answer Before Building:
- [ ] Should cart totals be visible to all list members in real-time?
- [ ] Allow multiple simultaneous trips per list?
- [ ] Auto-save to price database, or always prompt?
- [ ] Show price comparisons during trip, or only after?
- [ ] Support multiple currencies? ($ only for now?)
- [ ] Export trip data (CSV, PDF)?

---

## ?? Contact & Feedback

**Document Maintained By:** Agent (Cursor AI)  
**For Questions:** Review with development team before implementation  
**Last Review Date:** 2025-11-03  

---

**Version History:**
- v1.0 (2025-11-03): Initial feature plan created
