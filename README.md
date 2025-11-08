# LunaCart

**Illuminate the Best Deals**

A collaborative grocery price tracking app with smart shopping lists, real-time sync, receipt OCR scanning, and crowdsourced data moderation.

## Features

✨ **Smart Shopping Lists** - Create shared lists with target prices and real-time collaboration  
🛒 **Shopping Trips** - Track spending against budget with live cart updates  
📊 **Price Tracking** - Compare prices across stores and view price history  
📸 **Receipt OCR** - Scan receipts to automatically extract items and prices  
🛡️ **Moderation** - Review and verify crowdsourced price data for accuracy  
🔄 **Real-Time Sync** - Changes appear instantly across all devices  
📱 **PWA Support** - Install as a native app with offline support

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

#### Option A: Use Existing Shared Project (Quick Start)
- The repo includes a pre-configured Supabase project in `supabaseConfig.ts`
- No configuration needed - works out of the box

#### Option B: Use Your Own Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Edit `src/shared/config/supabaseConfig.ts`:
   ```typescript
   export const SUPABASE_URL = 'https://your-project.supabase.co';
   export const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. Run database migrations in order:
   ```sql
   -- In Supabase SQL Editor, run these in order:
   1. supabase/schema.sql                        -- Core tables
   2. supabase/shopping_lists_schema.sql         -- Shopping lists
   3. supabase/shopping_trip_schema.sql          -- Shopping trips
   4. supabase/notifications_schema.sql          -- Live notifications
   5. supabase/phase4_ocr_moderation_migration.sql  -- OCR & moderation
   ```

See `docs/supabase-setup.md` for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173`). Open it in your browser.

### 4. (Optional) Enable OCR Scanning

OCR scanning requires a Google Cloud Vision API setup and Vercel deployment:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable the Vision API
   - Create a service account
   - Download JSON credentials

2. **Configure Environment Variables**
   
   Create `.env.local` in project root:
   ```env
   # Supabase (if using your own project)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Google Cloud Vision API
   GOOGLE_VISION_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # Vercel Blob Storage (optional, for receipt images)
   VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
   ```

3. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```
   
   The `/api/ocr/scan` serverless function will be automatically deployed.

**Note:** OCR features work with mock data in development mode without any setup. See `docs/phase5-ocr-integration-prep.md` for full OCR architecture details.

---

## Project Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the Vite dev server              |
| `npm run build` | Type-check and create production build |
| `npm run lint`  | Run ESLint across the project          |
| `npm run preview` | Preview production build locally    |

---

## Architecture

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** Zustand (stores for lists, trips, price tracker)
- **Styling:** Tailwind CSS + Radix UI
- **Forms:** React Hook Form + Zod validation
- **Real-Time:** Supabase Realtime subscriptions

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Vercel Blob Storage (receipts)
- **Serverless:** Vercel Functions (`/api` directory)
- **OCR:** Google Cloud Vision API

### Service Layer
- **Item Ingestion:** `src/features/price-tracker/services/itemIngestion.ts`  
  Unified pipeline for creating items with normalization, validation, fuzzy matching
- **Trip Service:** `src/features/shopping-trips/services/tripService.ts`  
  Centralized cart operations and trip management
- **Normalization:** `src/shared/utils/normalization.ts`  
  Standardize text, numbers, units, categories
- **Validation:** `src/shared/utils/validators.ts`  
  Enforce data integrity with Zod schemas
- **Fuzzy Matching:** `src/shared/utils/fuzzyMatch.ts`  
  Detect duplicate items with Levenshtein distance

---

## Project Structure

```
/workspace
├── api/                      # Vercel serverless functions
│   └── ocr/
│       └── scan.ts          # Receipt OCR endpoint
├── src/
│   ├── app/                 # App-level components (layout, routing)
│   ├── features/            # Feature modules
│   │   ├── price-tracker/  # Price tracking & item management
│   │   │   ├── api/         # Supabase API calls
│   │   │   ├── components/  # UI components
│   │   │   ├── services/    # Business logic (ingestion, trip)
│   │   │   ├── store/       # Zustand state management
│   │   │   └── types/       # TypeScript types
│   │   ├── shopping-lists/  # Collaborative shopping lists
│   │   ├── shopping-trips/  # Shopping trip tracking
│   │   ├── ocr/            # Receipt scanning
│   │   └── moderation/     # Data moderation
│   └── shared/             # Shared utilities & config
│       ├── api/            # Supabase client
│       ├── config/         # App configuration
│       ├── lib/            # Shared libraries (OCR parsing)
│       ├── types/          # Shared types (OCR, moderation)
│       └── utils/          # Utilities (normalization, validation)
├── supabase/               # Database migrations
│   ├── schema.sql
│   ├── shopping_lists_schema.sql
│   ├── shopping_trip_schema.sql
│   ├── notifications_schema.sql
│   └── phase4_ocr_moderation_migration.sql
└── docs/                   # Documentation
    ├── supabase-setup.md
    ├── phase5-ocr-integration-prep.md
    └── phase6-regression-checklist.md
```

---

## Testing

### Manual Testing

Use the comprehensive regression checklist:

```bash
# See checklist at:
docs/phase6-regression-checklist.md
```

The checklist covers:
- Shopping lists (CRUD, real-time sync)
- Shopping trips (cart operations, totals)
- Price tracker (search, filters, history)
- OCR workflow (scan, review, confirm)
- Moderation (flagged items, verification)
- Multi-browser real-time synchronization

### Multi-Browser Testing

1. Open app in Browser 1 (e.g., Chrome)
2. Open app in Browser 2 (e.g., Firefox or incognito)
3. Sign in with the same user in both
4. Make changes in Browser 1
5. Verify real-time updates appear in Browser 2 (< 2 seconds)

---

## Install as a PWA

### Desktop
1. Visit the app in Chrome/Edge
2. Click the install icon in the address bar
3. Click "Install"

### Mobile
1. Run `npm run dev -- --host` to expose dev server on your network
2. Open the site on your phone (scan QR code Vite prints)
3. **iOS Safari:** Tap Share → Add to Home Screen
4. **Android Chrome:** Tap menu → Add to Home Screen

The app will:
- Launch full-screen
- Work offline for cached pages
- Auto-update when new versions are published
- Support push notifications (if enabled)

---

## Database Schema

### Core Tables
- `grocery_items` - Price tracker items with OCR metadata
- `shopping_lists` - Collaborative shopping lists
- `shopping_list_items` - Items in shopping lists
- `shopping_trips` - Shopping trip tracking
- `cart_items` - Items in active shopping carts
- `ocr_scans` - Receipt scan metadata
- `live_notifications` - Real-time notifications

### Moderation Fields
- `flagged_for_review` - Auto-flagged suspicious items
- `verified` - Moderator-approved items
- `flagged_reason` - Why item was flagged
- `reviewed_by` - Moderator user ID
- `reviewed_at` - Review timestamp

See `supabase/` directory for full schema and migrations.

---

## Environment Variables

### Production (Vercel)

Set these in Vercel dashboard under Settings → Environment Variables:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Cloud Vision
GOOGLE_VISION_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_VISION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Vercel Blob Storage
VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

### Local Development

Create `.env.local` in project root (same variables as above).

**Note:** `.env.local` is gitignored for security.

---

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Configure environment variables (see above)
4. Deploy!

Vercel will:
- Build the Vite app
- Deploy serverless functions (`/api` directory)
- Serve the static site from CDN
- Auto-deploy on Git push

### Deploy to Other Platforms

The app is a static Vite build + serverless functions:

- **Frontend:** Any static host (Netlify, Cloudflare Pages, AWS S3)
- **Backend:** Requires serverless function support for `/api/ocr/scan`
  - Netlify Functions
  - AWS Lambda
  - Supabase Edge Functions (Deno-based, requires refactor)

---

## Performance

### Expected Metrics
- Initial page load: < 3 seconds
- Shopping list load: < 2 seconds
- Real-time sync latency: < 2 seconds
- OCR processing: 3-6 seconds (Google Vision API call + parsing)

### Optimization Tips
- Enable Vercel Edge caching
- Use Supabase connection pooling
- Optimize images in receipts (< 5MB)
- Monitor Vercel Analytics for slow requests

---

## Monitoring & Logs

### Vercel Logs
```bash
vercel logs
```

### Supabase Logs
Go to Supabase Dashboard → Logs → Database/Auth/Storage

### OCR Metrics
Monitor Google Cloud Console for Vision API usage and errors.

---

## Troubleshooting

### OCR Returns Mock Data
**Cause:** Missing Google Vision API credentials  
**Fix:** Set `GOOGLE_VISION_EMAIL` and `GOOGLE_VISION_PRIVATE_KEY` in Vercel env vars

### Real-Time Updates Not Working
**Cause:** Supabase Realtime not enabled  
**Fix:** Go to Supabase Dashboard → Database → Replication → Enable for tables

### Build Fails with "Unresolved Import"
**Cause:** Missing or incorrect path alias  
**Fix:** Check `vite.config.ts` and `tsconfig.app.json` for correct alias configuration

### "Failed to load moderation queue"
**Cause:** Database migration not applied  
**Fix:** Run `supabase/phase4_ocr_moderation_migration.sql` in Supabase SQL Editor

---

## Documentation

- `docs/supabase-setup.md` - Database setup guide
- `docs/phase5-ocr-integration-prep.md` - OCR architecture (500+ lines)
- `docs/phase6-regression-checklist.md` - Testing guide
- `REFRACTOR_OCR_PLAN.md` - Full refactoring plan (Phases 0-6)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the MIT License.

---

## Roadmap

- [x] Shopping lists with real-time collaboration
- [x] Shopping trip tracking with budget monitoring
- [x] Price tracker with history charts
- [x] Receipt OCR scanning (Google Vision)
- [x] Crowdsourced data moderation
- [x] PWA support with offline mode
- [ ] AI-powered price predictions
- [ ] Push notifications for price drops
- [ ] Barcode scanning
- [ ] Recipe integration
- [ ] Store locator with map view

See `ROADMAP.md` for detailed plans.
