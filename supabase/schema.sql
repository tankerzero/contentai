-- Run this in the Supabase SQL editor to set up the database schema.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  plan text not null default 'free' check (plan in ('free', 'basic', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generations table
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  content_type text not null,
  topic text not null,
  tone text not null,
  language text not null default 'en' check (language in ('en', 'fr', 'ar')),
  content text not null,
  is_favorite boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'planner')),
  created_at timestamptz not null default now()
);

-- Brand profiles (one per user)
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  company_name text,
  industry text,
  values text,
  writing_style text,
  tone_examples text,
  updated_at timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

-- Profiles: users can only read/update their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Generations: users can only access their own
create policy "Users can view own generations"
  on public.generations for select using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert with check (auth.uid() = user_id);

create policy "Users can update own generations"
  on public.generations for update using (auth.uid() = user_id);

-- Brand profiles RLS
alter table public.brand_profiles enable row level security;

create policy "Users can manage own brand profile"
  on public.brand_profiles for all using (auth.uid() = user_id);

-- Indexes
create index if not exists generations_user_id_idx on public.generations (user_id);
create index if not exists generations_created_at_idx on public.generations (created_at desc);
