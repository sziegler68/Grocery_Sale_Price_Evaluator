-- Enable extensions (run once per database)
create extension if not exists pgcrypto;

-- Custom enum types keep data consistent across the UI
do $$
begin
  if not exists (select 1 from pg_type where typname = 'grocery_category') then
    create type public.grocery_category as enum (
      'Beef',
      'Pork',
      'Chicken',
      'Seafood',
      'Meat',
      'Dairy',
      'Produce',
      'Snacks',
      'Drinks',
      'Household',
      'Other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'meat_quality') then
    create type public.meat_quality as enum (
      'Choice',
      'Prime',
      'Wagyu',
      'Grassfed',
      'Organic',
      'Regular',
      'Free Range',
      'Fresh',
      'Farm Raised',
      'Frozen'
    );
  end if;
end $$;

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  user_id uuid null references auth.users(id) on delete set null,

  item_name text not null,
  category public.grocery_category not null,
  meat_quality public.meat_quality null,

  store_name text not null,
  price numeric(12, 2) not null check (price >= 0),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_type text not null,
  unit_price numeric(12, 4) not null check (unit_price >= 0),
  date_purchased date not null,

  notes text null,
  target_price numeric(12, 4) null check (target_price >= 0)
);

create index if not exists grocery_items_user_id_idx on public.grocery_items(user_id, created_at desc);
create index if not exists grocery_items_name_idx on public.grocery_items(item_name);

-- Enable row level security
alter table public.grocery_items enable row level security;

-- PUBLIC COLLABORATIVE DATABASE POLICIES
-- Anyone can read and add items, but nobody can modify or delete
-- This allows crowdsourced data while protecting against malicious users

-- Policy: Anyone can SELECT (read) all items
create policy if not exists "Public read access"
on public.grocery_items
for select
using (true);

-- Policy: Anyone can INSERT (add) new items
create policy if not exists "Public insert access"
on public.grocery_items
for insert
with check (true);

-- No UPDATE policy = nobody can modify existing items
-- No DELETE policy = nobody can delete items

-- Optional: Uncomment below to allow admin access via email
-- Replace 'your-email@example.com' with your actual email
-- create policy if not exists "Admin can update"
-- on public.grocery_items
-- for update
-- using (auth.jwt()->>'email' = 'your-email@example.com')
-- with check (auth.jwt()->>'email' = 'your-email@example.com');

-- create policy if not exists "Admin can delete"
-- on public.grocery_items
-- for delete
-- using (auth.jwt()->>'email' = 'your-email@example.com');
