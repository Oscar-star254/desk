-- Run this once against your Neon database (Neon console -> SQL Editor,
-- or `psql "$DATABASE_URL" -f schema.sql`).

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists desk_data (
  user_id uuid not null references users(id) on delete cascade,
  app text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);

create index if not exists desk_data_user_idx on desk_data (user_id);
