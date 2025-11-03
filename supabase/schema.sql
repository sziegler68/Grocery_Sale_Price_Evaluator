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

-- Enable row level security so we can scope items per user
alter table public.grocery_items enable row level security;

-- Policy: allow authenticated users to manage their own rows
create policy if not exists "Users can manage their grocery items"
on public.grocery_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: allow service key (e.g. for admin dashboards) to read everything
create policy if not exists "Service role can read all grocery items"
on public.grocery_items
for select
using (auth.role() = 'service_role');
