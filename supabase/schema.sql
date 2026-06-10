-- ───────────────────────────────────────────────────────────────────────────
-- Zillions Club — Supabase schema (shared agents + teams, with Auth)
-- Run this in the Supabase SQL editor once.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.teams (
  id              text primary key,
  name            text not null,
  leader_agent_id text,
  leader_name     text,
  created_at      timestamptz not null default now()
);

create table if not exists public.agents (
  id                  text primary key,
  auth_user_id        uuid references auth.users(id) on delete set null,
  first_name          text,
  last_name           text,
  full_name           text,
  email               text,
  phone               text,
  location            text,
  avatar_url          text,
  team_id             text,
  team_name           text,
  role                text,          -- sales rank (RGA/MGA/GA/SA/Career Agent)
  contract_level      text,
  status              text,
  start_date          timestamptz,
  sponsor             text,
  notes               text,
  leader_id           text,          -- upline agent id
  platform_role       text not null default 'agent',  -- owner | admin | leader | agent
  permissions         jsonb not null default '[]'::jsonb,
  goals               jsonb,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists agents_auth_user_idx on public.agents (auth_user_id);
create index if not exists agents_team_idx on public.agents (team_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.teams  enable row level security;
alter table public.agents enable row level security;

-- Is the caller an owner/admin? (security definer to read past RLS safely)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.agents a
    where a.auth_user_id = auth.uid()
      and a.platform_role in ('owner','admin')
  );
$$;

-- Everyone signed in can READ the shared roster + teams.
drop policy if exists "read teams"  on public.teams;
drop policy if exists "read agents" on public.agents;
create policy "read teams"  on public.teams  for select to authenticated using (true);
create policy "read agents" on public.agents for select to authenticated using (true);

-- INSERT: you may create your own agent row; admins may create anyone.
drop policy if exists "insert agents" on public.agents;
create policy "insert agents" on public.agents for insert to authenticated
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "insert teams" on public.teams;
create policy "insert teams" on public.teams for insert to authenticated
  with check (public.is_admin());

-- UPDATE: your own row, or admins.
drop policy if exists "update agents" on public.agents;
create policy "update agents" on public.agents for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "update teams" on public.teams;
create policy "update teams" on public.teams for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- DELETE: admins only.
drop policy if exists "delete agents" on public.agents;
create policy "delete agents" on public.agents for delete to authenticated using (public.is_admin());
drop policy if exists "delete teams" on public.teams;
create policy "delete teams" on public.teams for delete to authenticated using (public.is_admin());

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.teams;

-- ── Storage: profile pictures ────────────────────────────────────────────────
-- A public-read `avatars` bucket. Each user can only write within their own
-- folder (`<auth.uid>/...`), so they can upload/replace/delete their own avatar
-- but not anyone else's. Reads are public so the URL works on any <img>.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars public read"   on storage.objects;
drop policy if exists "avatars owner insert"   on storage.objects;
drop policy if exists "avatars owner update"   on storage.objects;
drop policy if exists "avatars owner delete"   on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Seed the six teams ───────────────────────────────────────────────────────
insert into public.teams (id, name) values
  ('team_montoni',     'Team Montoni'),
  ('team_hogan',       'Team Hogan'),
  ('team_mickovic',    'Team Mickovic'),
  ('team_nixon',       'Team Nixon'),
  ('team_dean',        'Team Dean'),
  ('team_pronschinske','Team Pronschinske')
on conflict (id) do nothing;

-- ── After you sign up in the app, make yourself the owner: ───────────────────
-- update public.agents set platform_role = 'owner' where email = 'you@email.com';
