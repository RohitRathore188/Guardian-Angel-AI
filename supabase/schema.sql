-- ═══════════════════════════════════════════════════════════════════════
-- Guardian Angel AI — Database schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Safe to re-run: drops and recreates policies/triggers idempotently.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Extensions ─────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum
    ('citizen', 'hospital', 'police', 'child_welfare', 'ngo', 'volunteer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum
    ('pending', 'analysis', 'assigned', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- profiles — 1:1 with auth.users, holds role + contact info
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text,
  mobile_number text,
  role          user_role not null default 'citizen',
  agency_name   text,             -- for responders: which org they belong to
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- reports — a citizen's emergency report about a child
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  case_code      text unique not null default
                   ('GA-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')),
  reporter_id    uuid references public.profiles(id) on delete set null,
  status         report_status   not null default 'pending',
  priority       report_priority not null default 'high',

  -- location
  latitude       double precision,
  longitude      double precision,
  address        text,
  city           text,
  state          text,
  country        text,

  -- reported details (from the multi-step form)
  age_group      text,
  gender         text,
  child_count    int default 1,
  condition      text,
  found_place    text,
  weather        text,
  description    text,

  -- media
  image_urls     text[] default '{}',

  -- AI analysis (Gemini) — stored as JSON + a few flattened columns for display
  ai_analysis    jsonb,
  ai_age_estimate   text,
  ai_threat_level   text,
  ai_injury_flag    text,
  ai_dispatch_target text,

  -- reporter contact (may be anonymous)
  is_anonymous   boolean default false,
  contact_name   text,
  contact_phone  text,
  contact_email  text,

  -- assignment (responder who picked up the case)
  assigned_to    uuid references public.profiles(id) on delete set null,
  assigned_role  user_role,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_idx   on public.reports(status);
create index if not exists reports_assigned_idx on public.reports(assigned_to);

-- ═══════════════════════════════════════════════════════════════════════
-- case_events — timeline of what happened to a report
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.case_events (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  event_type  text not null,            -- e.g. 'created', 'ai_analyzed', 'assigned', 'status_changed', 'note'
  message     text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists case_events_report_idx on public.case_events(report_id);

-- ═══════════════════════════════════════════════════════════════════════
-- notifications — per-user alerts
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  report_id   uuid references public.reports(id) on delete cascade,
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- ═══════════════════════════════════════════════════════════════════════
-- agencies — directory of responder orgs (nearby help / seed responders)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null,            -- 'Hospital' | 'Police Station' | 'Child Welfare Office' | 'NGO Shelter'
  phone       text,
  latitude    double precision,
  longitude   double precision,
  address     text,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════════════════

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- auto-create a profile row when a new auth user signs up.
-- reads role / full_name / mobile from the signup metadata (options.data).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, mobile_number, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile_number', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'citizen')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════
alter table public.profiles      enable row level security;
alter table public.reports       enable row level security;
alter table public.case_events   enable row level security;
alter table public.notifications enable row level security;
alter table public.agencies      enable row level security;

-- helper: current user's role
create or replace function public.current_role_val()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- helper: is the current user a responder/admin (can see all cases)?
create or replace function public.is_responder()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid())
      in ('police','hospital','child_welfare','ngo','volunteer','admin'),
    false)
$$;

-- ── profiles policies ──
drop policy if exists "profiles: read own or responder reads all" on public.profiles;
create policy "profiles: read own or responder reads all" on public.profiles
  for select using (id = auth.uid() or public.is_responder());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- ── reports policies ──
drop policy if exists "reports: reporter or responder can read" on public.reports;
create policy "reports: reporter or responder can read" on public.reports
  for select using (reporter_id = auth.uid() or public.is_responder());

drop policy if exists "reports: authed can insert own" on public.reports;
create policy "reports: authed can insert own" on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists "reports: reporter or responder can update" on public.reports;
create policy "reports: reporter or responder can update" on public.reports
  for update using (reporter_id = auth.uid() or public.is_responder());

-- ── case_events policies ──
drop policy if exists "events: visible with parent report" on public.case_events;
create policy "events: visible with parent report" on public.case_events
  for select using (
    exists (select 1 from public.reports r
            where r.id = report_id
              and (r.reporter_id = auth.uid() or public.is_responder()))
  );

drop policy if exists "events: authed can insert" on public.case_events;
create policy "events: authed can insert" on public.case_events
  for insert with check (auth.uid() is not null);

-- ── notifications policies ──
drop policy if exists "notifs: read own" on public.notifications;
create policy "notifs: read own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifs: update own" on public.notifications;
create policy "notifs: update own" on public.notifications
  for update using (user_id = auth.uid());

drop policy if exists "notifs: insert (any authed)" on public.notifications;
create policy "notifs: insert (any authed)" on public.notifications
  for insert with check (auth.uid() is not null);

-- ── agencies policies (public directory: anyone signed in can read) ──
drop policy if exists "agencies: read all" on public.agencies;
create policy "agencies: read all" on public.agencies
  for select using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- missing_children — database of reported missing children
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.missing_children (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  age           int,
  gender        text,
  description   text,
  parent_name   text,
  parent_phone  text,
  parent_email  text,
  photo_url     text,
  created_at    timestamptz not null default now()
);

alter table public.missing_children enable row level security;

drop policy if exists "missing_children: read all" on public.missing_children;
create policy "missing_children: read all" on public.missing_children
  for select using (true);

drop policy if exists "missing_children: write authed" on public.missing_children;
create policy "missing_children: write authed" on public.missing_children
  for all using (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════
-- Realtime — broadcast changes on reports + notifications
-- ═══════════════════════════════════════════════════════════════════════
do $$ begin
  alter publication supabase_realtime add table public.reports;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Storage bucket for report images
-- ═══════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

drop policy if exists "report-images: public read" on storage.objects;
create policy "report-images: public read" on storage.objects
  for select using (bucket_id = 'report-images');

drop policy if exists "report-images: authed upload" on storage.objects;
drop policy if exists "report-images: public upload" on storage.objects;
create policy "report-images: authed upload" on storage.objects
  for insert with check (bucket_id = 'report-images' and auth.uid() is not null);
