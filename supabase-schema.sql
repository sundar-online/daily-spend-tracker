-- ============================================================
-- SpendSmart — Supabase Database Schema
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. BUDGETS TABLE
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month int not null,
  year int not null,
  total numeric not null,
  sources jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(user_id, month, year)
);

alter table budgets enable row level security;

create policy "Users can view own budgets"
  on budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on budgets for delete
  using (auth.uid() = user_id);


-- 2. EXPENSES TABLE
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month_key text not null,
  amount numeric not null,
  category text not null,
  sub_category text not null,
  date text not null,
  note text default '',
  is_new_sub boolean default false,
  created_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Users can view own expenses"
  on expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on expenses for delete
  using (auth.uid() = user_id);


-- 3. NOTES TABLE
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  amount numeric,
  pinned boolean default false,
  done boolean default false,
  created_at timestamptz default now()
);

alter table notes enable row level security;

create policy "Users can view own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on notes for delete
  using (auth.uid() = user_id);


-- 4. CUSTOM CATEGORIES TABLE
create table if not exists custom_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  categories jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table custom_categories enable row level security;

create policy "Users can view own categories"
  on custom_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on custom_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on custom_categories for update
  using (auth.uid() = user_id);
