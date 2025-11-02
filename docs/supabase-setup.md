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

## 3. Configure API keys locally
- Back in Supabase, go to **Project Settings ? API**.
- Under **Project URL** copy the value (it looks like `https://xyzcompany.supabase.co`).
- Under **Project API Keys**, copy the **anon public** key.
- Locally, duplicate the sample env file:

  ```bash
  cp .env.example .env
  ```

- Open `.env` and replace the placeholders:

  ```env
  VITE_SUPABASE_URL="https://xyzcompany.supabase.co"
  VITE_SUPABASE_ANON_KEY="your-anon-public-key"
  ```

## 4. Optional: Service key for admin scripts
If you write admin tooling later, store the `service_role` key somewhere secure (never commit it). The app itself only needs the anon key from step 3.

## 5. Verify the connection
- From the project root run `npm run dev`.
- The `supabaseClient.ts` helper throws a clear error if either env var is missing.
- Once we hook up queries, you?ll see the live data populate the UI.

That?s it?your Supabase backend is ready for the app to read/write grocery items.
