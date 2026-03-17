-- Stack Universe - Supabase schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Universes table (one row per discovered GitHub user)
create table if not exists universes (
  id            uuid primary key default uuid_generate_v4(),
  username      text not null unique,
  universe_score integer not null default 0,
  total_stars   integer not null default 0,
  total_repos   integer not null default 0,
  language_count integer not null default 0,
  account_age_years numeric(6, 2) not null default 0,
  position_x    float not null default 0,
  position_y    float not null default 0,
  position_z    float not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for leaderboard queries
create index if not exists universes_score_idx on universes(universe_score desc);

-- Row Level Security (allow public read, authenticated write)
alter table universes enable row level security;

-- Allow anyone to read
create policy "Public can read universes"
  on universes for select
  using (true);

-- Allow anyone to insert/upsert (server-side API route handles this)
create policy "Service can write universes"
  on universes for all
  using (true)
  with check (true);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger universes_updated_at
  before update on universes
  for each row execute function update_updated_at();
