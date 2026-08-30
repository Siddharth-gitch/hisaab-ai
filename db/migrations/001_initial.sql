-- Hisaab database blueprint
-- Run this same migration against local PostgreSQL and Supabase PostgreSQL.
-- The application keeps the user's authentication identity in owner_id. On
-- Supabase that value is the Supabase Auth user id; local demo mode uses a
-- harmless demo id until real sign-in is enabled.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id text primary key,
  email text not null default '',
  display_name text not null default 'Hisaab user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references app_users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('individual', 'business')),
  subtitle text not null default '',
  currency char(3) not null default 'INR',
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists expense_categories (
  id text primary key,
  label text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by text not null references app_users(id) on delete restrict,
  merchant varchar(80) not null,
  category varchar(50) not null,
  amount numeric(12, 2) not null check (amount > 0 and amount <= 100000000),
  tax numeric(12, 2) not null default 0 check (tax >= 0 and tax <= amount),
  currency char(3) not null default 'INR',
  expense_date date not null,
  payment_method varchar(40) not null default 'Not set',
  notes varchar(240) not null default '',
  receipt_name varchar(160) not null default '',
  receipt_path varchar(400) not null default '',
  receipt_retained boolean not null default false,
  deductible boolean not null default false,
  needs_review boolean not null default false,
  source varchar(20) not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on workspaces(owner_id);
create index if not exists workspace_members_user_id_idx on workspace_members(user_id);
create index if not exists expenses_workspace_date_idx on expenses(workspace_id, expense_date desc);
create index if not exists expenses_created_by_idx on expenses(created_by);

insert into expense_categories (id, label, sort_order) values
  ('groceries', 'Groceries', 10),
  ('food-dining', 'Food & dining', 20),
  ('transport', 'Transport', 30),
  ('shopping', 'Shopping', 40),
  ('bills-utilities', 'Bills & utilities', 50),
  ('health', 'Health', 60),
  ('entertainment', 'Entertainment', 70),
  ('travel', 'Travel', 80),
  ('software', 'Software', 90),
  ('marketing', 'Marketing', 100),
  ('office-supplies', 'Office supplies', 110),
  ('professional-services', 'Professional services', 120),
  ('rent', 'Rent', 130),
  ('other', 'Other', 140)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- These policies are intentionally documented for the hosted database. The
-- API uses parameterised, user-scoped queries too. RLS will be enabled and
-- refined in the security hardening phase after the Auth flow is connected.
