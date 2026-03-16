create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer,
  gender text,
  weight numeric(6,2),
  height numeric(6,2),
  activity_level numeric(4,3),
  goal text,
  -- Pricing tier
  is_premium boolean not null default false,
  free_scans_used integer not null default 0,
  free_scans_limit integer not null default 2,
  --
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  fiber integer,
  water integer,
  -- Phase 3: Meal preferences
  preferred_meal_types jsonb not null default '["breakfast","lunch","dinner","snack"]'::jsonb,
  --
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  food_name text,
  category text,
  portion text,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  fiber integer,
  sugar integer,
  sodium integer,
  glycemic_index text,
  satiety_score integer,
  cutting_score integer,
  confidence text,
  benefits jsonb not null default '[]'::jsonb,
  watch_out text,
  ai_tip text,
  raw_analysis jsonb not null default '{}'::jsonb,
  -- Phase 2: Observability
  request_id text,
  -- Phase 3: Features
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', null)),
  user_notes text,
  status text check (status in ('logged', 'verified', 'flagged')) default 'logged',
  --
  scanned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scan_history_user_id_scanned_at_idx
  on public.scan_history (user_id, scanned_at desc);

create index if not exists scan_history_request_id_idx
  on public.scan_history (request_id);

create index if not exists scan_history_status_idx
  on public.scan_history (status) where status != 'logged';

create table if not exists public.user_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text check (insight_type in ('alert', 'recommendation', 'pattern', 'achievement')),
  title text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz
);

create index if not exists user_insights_user_id_idx
  on public.user_insights (user_id, is_read, created_at desc);

-- Sprint 3: Rate limiting tracking
create table if not exists public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  timestamp timestamptz not null default timezone('utc', now())
);

create index if not exists rate_limit_hits_user_id_timestamp_idx
  on public.rate_limit_hits (user_id, timestamp desc);

alter table public.profiles enable row level security;
alter table public.daily_goals enable row level security;
alter table public.scan_history enable row level security;
alter table public.user_insights enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_goals_select_own"
  on public.daily_goals
  for select
  using (auth.uid() = user_id);

create policy "daily_goals_insert_own"
  on public.daily_goals
  for insert
  with check (auth.uid() = user_id);

create policy "daily_goals_update_own"
  on public.daily_goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scan_history_select_own"
  on public.scan_history
  for select
  using (auth.uid() = user_id);

create policy "scan_history_insert_own"
  on public.scan_history
  for insert
  with check (auth.uid() = user_id);

create policy "scan_history_delete_own"
  on public.scan_history
  for delete
  using (auth.uid() = user_id);

create policy "user_insights_select_own"
  on public.user_insights
  for select
  using (auth.uid() = user_id);

create policy "user_insights_update_own"
  on public.user_insights
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fix security warning: Set search_path on handle_new_user function
alter function if exists auth.handle_new_user() set search_path to public;