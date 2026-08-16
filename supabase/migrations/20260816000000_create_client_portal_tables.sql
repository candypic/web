-- =========================================================================
-- Candy Pic: Client Events, Photo Proofing, Album Selections & Notifications
-- Run this in Supabase SQL Editor (All-in-one clean execution)
-- =========================================================================

-- 1. Create Tables First
create table if not exists public.client_events (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text not null unique,
  client_name         text not null,
  client_phone        text not null,
  event_date          date not null,
  passcode            text not null default '1234',
  guest_passcode      text not null default 'GUEST',
  target_album_photos int not null default 100,
  cover_image_url     text,
  status              text not null default 'active'
    check (status in ('active', 'in_selection', 'submitted', 'delivered', 'archived')),
  is_live_gallery     boolean not null default false,
  announcement_text   text default 'Welcome to your private memory vault! Select your favourite photos for the wedding album.',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.event_photos (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.client_events(id) on delete cascade,
  r2_key        text not null,
  public_url    text not null,
  filename      text not null,
  category      text not null default 'Ceremony',
  width         int,
  height        int,
  size_bytes    bigint,
  content_type  text default 'image/jpeg',
  is_highlight  boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.photo_selections (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.client_events(id) on delete cascade,
  photo_id           uuid not null references public.event_photos(id) on delete cascade,
  is_album_selected  boolean not null default false,
  is_favorite        boolean not null default false,
  client_note        text,
  updated_at         timestamptz not null default now(),
  unique (event_id, photo_id)
);

create table if not exists public.album_submissions (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.client_events(id) on delete cascade,
  client_name        text not null,
  client_phone       text not null,
  selected_count     int not null default 0,
  client_notes       text,
  selected_filenames jsonb not null default '[]'::jsonb,
  status             text not null default 'submitted'
    check (status in ('submitted', 'in_design', 'printed', 'delivered')),
  submitted_at       timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'booking' check (type in ('booking', 'album_submission', 'quote_inquiry', 'general')),
  link        text,
  metadata    jsonb default '{}'::jsonb,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2. Indexes
create index if not exists client_events_slug_idx on public.client_events (slug);
create index if not exists client_events_status_idx on public.client_events (status);
create index if not exists event_photos_event_idx on public.event_photos (event_id, category, sort_order);
create index if not exists event_photos_highlight_idx on public.event_photos (event_id, is_highlight);
create index if not exists photo_selections_event_idx on public.photo_selections (event_id, is_album_selected);
create index if not exists album_submissions_event_idx on public.album_submissions (event_id, submitted_at desc);
create index if not exists admin_notifications_read_idx on public.admin_notifications (is_read, created_at desc);

-- 3. Enable Row Level Security (RLS)
alter table public.client_events enable row level security;
alter table public.event_photos enable row level security;
alter table public.photo_selections enable row level security;
alter table public.album_submissions enable row level security;
alter table public.admin_notifications enable row level security;

-- 4. RLS Policies for client_events
drop policy if exists "Anyone can read active client events" on public.client_events;
create policy "Anyone can read active client events"
  on public.client_events for select
  using (true);

drop policy if exists "Authenticated can manage client events" on public.client_events;
create policy "Authenticated can manage client events"
  on public.client_events for all
  to authenticated
  using (true)
  with check (true);

-- 5. RLS Policies for event_photos
drop policy if exists "Anyone can read event photos" on public.event_photos;
create policy "Anyone can read event photos"
  on public.event_photos for select
  using (true);

drop policy if exists "Authenticated can manage event photos" on public.event_photos;
create policy "Authenticated can manage event photos"
  on public.event_photos for all
  to authenticated
  using (true)
  with check (true);

-- 6. RLS Policies for photo_selections
drop policy if exists "Anyone can select and note photos" on public.photo_selections;
create policy "Anyone can select and note photos"
  on public.photo_selections for all
  using (true)
  with check (true);

-- 7. RLS Policies for album_submissions
drop policy if exists "Anyone can insert album submission" on public.album_submissions;
create policy "Anyone can insert album submission"
  on public.album_submissions for insert
  with check (true);

drop policy if exists "Anyone can read album submissions" on public.album_submissions;
create policy "Anyone can read album submissions"
  on public.album_submissions for select
  using (true);

drop policy if exists "Authenticated can manage album submissions" on public.album_submissions;
create policy "Authenticated can manage album submissions"
  on public.album_submissions for all
  to authenticated
  using (true)
  with check (true);

-- 8. RLS Policies for admin_notifications
drop policy if exists "Anyone can insert admin notification" on public.admin_notifications;
create policy "Anyone can insert admin notification"
  on public.admin_notifications for insert
  with check (true);

drop policy if exists "Anyone can read admin notifications" on public.admin_notifications;
create policy "Anyone can read admin notifications"
  on public.admin_notifications for select
  using (true);

drop policy if exists "Authenticated can manage admin notifications" on public.admin_notifications;
create policy "Authenticated can manage admin notifications"
  on public.admin_notifications for all
  to authenticated
  using (true)
  with check (true);
