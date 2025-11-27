## Refactor & OCR Readiness Blueprint

### Phase 0 – Initial Setup
- Install Zustand: `npm install zustand`
- Create target structure:
  ```
  src/
    app/
    features/
      price-tracker/
      shopping-lists/
      shopping-trips/
      notifications/
    shared/
      components/
      hooks/
      api/
      types/
      utils/
  ```
- Move existing modules into the new tree incrementally (components, APIs, types, utils)
- Add path aliases in `tsconfig.app.json`, `tsconfig.node.json`, and `vite.config.ts`

### Phase 1 – Store Scaffolding & Component Wiring
- Create stores:
  - `src/features/price-tracker/store.ts`
  - `src/features/shopping-lists/store.ts`
  - `src/features/shopping-trips/store.ts`
  - `src/features/notifications/store.ts`
- Refactor `ShoppingListDetail` to consume the shopping-list store (state selectors + actions)
- Refactor `ShoppingTripView` to consume the shopping-trip store
- Local smoke tests (lists, trips, real-time updates) after each screen conversion

### Phase 2 – Service Layer & Shared Utilities
- Implement `itemIngestion.ts` service in `price-tracker/services`
  - Normalize input, fuzzy match existing items, validate prices, create/update item
- Implement `tripService.ts` for cart operations (shared by store and future OCR)
- Build normalization + validation utilities (`shared/utils/normalization.ts`, `validators.ts`)
- Add `fuzzyMatch.ts` helper for approximate name matching
- Update forms/modals to use the ingestion service (remove duplicate insert logic)

### Phase 3 – Subscription & Side-Effect Consolidation
- Move Supabase subscriptions (list items, notifications, cart items, trip totals) into the appropriate stores
- Ensure store actions handle optimistic updates and cleanup
- Optional: add lightweight tests for store actions once stable

### Phase 4 – Schema & Type Updates for OCR/Crowdsourcing
- Supabase migrations:
  - Add OCR metadata fields (or dedicated `ocr_scans` table)
  - Add moderation fields (`flagged_for_review`, `verified`, contributor info)
- Create indexes (`store_name`, `category`, `flagged_for_review`, etc.)
- Update TypeScript models to include new fields (stores + Supabase typings)

### Phase 5 – OCR Integration Prep
- Finalize ingestion pipeline so all item creation flows use the shared service
- Define OCR backend contract (provider choice, response schema)
- Plan serverless/edge function integration to run OCR and call ingestion service

### Phase 6 – Final Integration & Verification
- End-to-end manual regression (lists, trips, notifications)
- Validate real-time sync across multiple clients
- Prepare for camera + OCR flow using the new service/store architecture

### Continuous Practices
- After each phase: `npm run build`, push, verify Vercel preview
- Adopt path aliases gradually as files are touched
- Introduce automated tests once service layer stabilizes (before OCR shipping)
