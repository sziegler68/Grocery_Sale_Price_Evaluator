## Grocery Price Tracker Roadmap

- **Bootstrap Supabase ?**
  - ? Create project/environment scaffolding: added `.env.example`, Supabase client helper with type definitions, and README setup instructions.
  - ? Define the `grocery_items` table in Supabase (pending once schema decisions are finalized).

- **Auth & Multi-User**
  - Select an authentication flow (email magic link or passwordless OTP for simplicity).
  - Build sign-in/out UI and protect app routes with a Supabase session context provider.
  - Attach `user_id` to every item row and support shared access (shared project or invite workflow).

- **Data Access Layer ??**
  - ? Centralized data helpers in `groceryData.ts` with Supabase fallbacks and type-safe mappers.
  - ? Replaced mock data in `Home`, `Items`, `ItemDetail`, and `AddItem` with calls to the shared data layer (gracefully falls back to demo data if Supabase isn?t configured).
  - ? Decide on long-term price-history storage (multiple rows per item vs. dedicated history table) and update analytics accordingly.

- **Real-Time Sync**
  - Subscribe to Supabase real-time channels for `grocery_items` and merge updates into the client cache so spouses see changes instantly.
  - Add optimistic UI updates and rollback handling for mutation errors.

- **Offline Mode**
  - Implement an explicit Online/Offline toggle and detect connection state.
  - Persist data locally (IndexedDB via localforage/Dexie), queue mutations while offline, and replay once connectivity returns.
  - Surface sync status to the UI and implement conflict resolution (e.g., timestamp-based "last write wins" with user-facing alerts).

- **Validation & Robustness**
  - Expand form schema (date picker, comprehensive unit conversions, optional user ID) with shared client/server validation.
  - Harden the unit-price converter to support additional units and edge cases, ensuring no `[Object]` rendering issues.

- **UI & UX Enhancements**
  - Consolidate global state for dark mode and other shared UI concerns; refine layout for mobile touch ergonomics.
  - Populate the Analytics view with live aggregate insights once data is wired up.

- **PWA Enablement ?**
  - ? Added `manifest.webmanifest`, generated placeholder icons, and configured Vite?s PWA plugin (Workbox).
  - ? Documented install flow and tested add-to-home-screen on mobile browsers (manual verification pending real device test).

- **Testing & Tooling**
  - Introduce integration tests (Playwright/Cypress) for add/edit/sync flows plus unit tests for conversion utilities.
  - Configure lint/format hooks and CI (GitHub Actions) to run lint, build, and tests on each push.

- **Deployment**
  - Choose hosting (Netlify, Vercel, Supabase Edge Functions), configure HTTPS, and manage environment variables securely.
  - Document setup processes so both owners can deploy, run migrations, and rotate Supabase keys as needed.
