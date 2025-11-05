# LunaCart

**Illuminate the Best Deals**

Check if prices are good deals, create shopping lists, and track prices across stores.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase (optional)**

   - The repo already includes a `supabaseConfig.ts` with a shared Supabase project.
   - To use your own project, edit `supabaseConfig.ts` and replace the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants with the values from your Supabase dashboard.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Vite will print the local URL (typically `http://localhost:5173`). Open it in your browser or scan the QR code Vite displays to test on a phone while on the same network.

4. **Lint and build**

   ```bash
   npm run lint   # static analysis
   npm run build  # production bundle
   ```

## Supabase Bootstrap Checklist

- Create a Supabase project and run the SQL in `supabase/schema.sql` via the Supabase SQL Editor (this creates enums, the `grocery_items` table, indexes, and row-level security policies).
- Generate an anonymous public API key and (optionally) replace the constants in `supabaseConfig.ts`.
- Once the schema is ready, wire the React pages to the Supabase client exported from `supabaseClient.ts` and replace the current mock data.
- See `docs/supabase-setup.md` for a detailed walkthrough of these steps.

## Project Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the Vite dev server              |
| `npm run build` | Type-check and create production build |
| `npm run lint`  | Run ESLint across the project          |

## Install as a PWA

- Run `npm run dev -- --host` to expose the dev server on your local network.
- Open the site on your phone (scan the QR code Vite prints or type the LAN URL).
- In Chrome/Edge, tap the overflow menu (`?`) and choose **Add to Home screen**. iOS Safari uses the **Share ? Add to Home Screen** flow.
- The app now launches full-screen, works offline for cached pages, and will auto-update when you publish a new build.

## Roadmap

See `ROADMAP.md` for a detailed plan covering Supabase integration, offline mode, PWA support, and deployment.
