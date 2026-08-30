-- Hisaab hosted-security layer.
-- Run this file in the Supabase SQL Editor only.
-- It intentionally references Supabase's auth.uid(), so it is not part of the
-- portable local PostgreSQL migration.

create or replace function public.hisaab_is_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = (select auth.uid())::text
  );
$$;

create or replace function public.hisaab_is_owner(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace
      and w.owner_id = (select auth.uid())::text
  );
$$;

create or replace function public.hisaab_is_editor(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = (select auth.uid())::text
      and wm.role in ('owner', 'member')
  );
$$;

revoke all on function public.hisaab_is_member(uuid) from public;
revoke all on function public.hisaab_is_owner(uuid) from public;
revoke all on function public.hisaab_is_editor(uuid) from public;
grant execute on function public.hisaab_is_member(uuid) to authenticated;
grant execute on function public.hisaab_is_owner(uuid) to authenticated;
grant execute on function public.hisaab_is_editor(uuid) to authenticated;

alter table public.app_users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- app_users: a signed-in person can see or change only their own profile.
drop policy if exists "hisaab users read own profile" on public.app_users;
create policy "hisaab users read own profile"
  on public.app_users for select to authenticated
  using (id = (select auth.uid())::text);

drop policy if exists "hisaab users create own profile" on public.app_users;
create policy "hisaab users create own profile"
  on public.app_users for insert to authenticated
  with check (id = (select auth.uid())::text);

drop policy if exists "hisaab users update own profile" on public.app_users;
create policy "hisaab users update own profile"
  on public.app_users for update to authenticated
  using (id = (select auth.uid())::text)
  with check (id = (select auth.uid())::text);

-- Workspaces: members can read; only owners can manage the workspace itself.
drop policy if exists "hisaab members read workspaces" on public.workspaces;
create policy "hisaab members read workspaces"
  on public.workspaces for select to authenticated
  using (public.hisaab_is_member(id));

drop policy if exists "hisaab owners create workspaces" on public.workspaces;
create policy "hisaab owners create workspaces"
  on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid())::text);

drop policy if exists "hisaab owners update workspaces" on public.workspaces;
create policy "hisaab owners update workspaces"
  on public.workspaces for update to authenticated
  using (public.hisaab_is_owner(id))
  with check (public.hisaab_is_owner(id));

drop policy if exists "hisaab owners delete workspaces" on public.workspaces;
create policy "hisaab owners delete workspaces"
  on public.workspaces for delete to authenticated
  using (public.hisaab_is_owner(id));

-- Memberships: members can see membership for workspaces they belong to;
-- owners can add, change, or remove members.
drop policy if exists "hisaab members read memberships" on public.workspace_members;
create policy "hisaab members read memberships"
  on public.workspace_members for select to authenticated
  using (public.hisaab_is_member(workspace_id));

drop policy if exists "hisaab owners create memberships" on public.workspace_members;
create policy "hisaab owners create memberships"
  on public.workspace_members for insert to authenticated
  with check (public.hisaab_is_owner(workspace_id));

drop policy if exists "hisaab owners update memberships" on public.workspace_members;
create policy "hisaab owners update memberships"
  on public.workspace_members for update to authenticated
  using (public.hisaab_is_owner(workspace_id))
  with check (public.hisaab_is_owner(workspace_id));

drop policy if exists "hisaab owners delete memberships" on public.workspace_members;
create policy "hisaab owners delete memberships"
  on public.workspace_members for delete to authenticated
  using (public.hisaab_is_owner(workspace_id));

-- Categories are shared reference data. Users can read them, but cannot edit
-- the master list from the client.
drop policy if exists "hisaab signed in users read categories" on public.expense_categories;
create policy "hisaab signed in users read categories"
  on public.expense_categories for select to authenticated
  using (true);

-- Expenses: members can read; owners and members can write; viewers are read-only.
drop policy if exists "hisaab members read expenses" on public.expenses;
create policy "hisaab members read expenses"
  on public.expenses for select to authenticated
  using (public.hisaab_is_member(workspace_id));

drop policy if exists "hisaab editors create expenses" on public.expenses;
create policy "hisaab editors create expenses"
  on public.expenses for insert to authenticated
  with check (
    created_by = (select auth.uid())::text
    and public.hisaab_is_editor(workspace_id)
  );

drop policy if exists "hisaab editors update expenses" on public.expenses;
create policy "hisaab editors update expenses"
  on public.expenses for update to authenticated
  using (public.hisaab_is_editor(workspace_id))
  with check (public.hisaab_is_editor(workspace_id));

drop policy if exists "hisaab editors delete expenses" on public.expenses;
create policy "hisaab editors delete expenses"
  on public.expenses for delete to authenticated
  using (public.hisaab_is_editor(workspace_id));

-- Explicitly keep the public/anonymous role out of all app data.
revoke all on table public.app_users from anon;
revoke all on table public.workspaces from anon;
revoke all on table public.workspace_members from anon;
revoke all on table public.expense_categories from anon;
revoke all on table public.expenses from anon;
