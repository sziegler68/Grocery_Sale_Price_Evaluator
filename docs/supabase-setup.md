# Supabase Setup Guide

Use this checklist to connect the Grocery Price Tracker web app to Supabase.

## 1. Create project
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
- Choose a strong database password (you'll need it to open the SQL editor).
- Wait for the project to finish provisioning.

## 2. Run the schema SQL
- In the Supabase dashboard, open **SQL Editor ? New query**.
- Copy the contents of [`supabase/schema.sql`](../supabase/schema.sql) from this repo and paste it into the editor.
- Click **Run**. This script:
  - Enables the `pgcrypto` extension (needed for UUID generation).
  - Creates enum types for categories and meat quality.
  - Creates the `public.grocery_items` table with indexes.
  - Enables Row Level Security (RLS) and adds policies so each user can manage their own items.

> **Tip:** If you re-run the script later it will no-op safely thanks to the `if not exists` checks.

## 3. Configure API keys in the app
- In Supabase, go to **Project Settings ? API**.
- Copy the **Project URL** (it looks like `https://xyzcompany.supabase.co`).
- Copy the **anon public** key from the API keys section.
- Open `supabaseConfig.ts` and replace the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants with your values.

## 4. Optional: Service key for admin scripts
If you write admin tooling later, store the `service_role` key somewhere secure (never commit it). The app itself only needs the anon key from step 3.

## 5. Verify the connection
- From the project root run `npm run dev`.
- The `supabaseClient.ts` helper logs a warning if the constants are missing and falls back to demo data.
- Once the data layer is configured, the UI will load live prices from Supabase.

That's it?your Supabase backend is ready for the app to read/write grocery items.
