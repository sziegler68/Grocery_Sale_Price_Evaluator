# Grocery Price Tracker

Help track sale prices and price-per-unit trends so you and your family can spot the best grocery deals, online or offline.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   - Copy the sample env file and fill in your Supabase project details:

     ```bash
     cp .env.example .env
     ```

   - Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from your Supabase project settings.

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

- Create a Supabase project and a `grocery_items` table that matches the flat JSON shape outlined in `supabaseClient.ts`.
- Generate an anonymous public API key and add it to your `.env` file.
- Once the schema is ready, wire the React pages to the Supabase client exported from `supabaseClient.ts` and replace the current mock data.

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
