-- Gallery images uploaded/published by admins, downloadable by guests.
-- Files live in Cloudflare R2; this table only stores metadata + the public URL.

create table if not exists public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  r2_key        text not null unique,
  public_url    text not null,
  title         text not null default '',
  category      text not null default 'General',
  content_type  text,
  size_bytes    bigint,
  width         int,
  height        int,
  published     boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists gallery_images_published_idx
  on public.gallery_images (published, sort_order, created_at desc);

alter table public.gallery_images enable row level security;

-- Guests (anon) may read ONLY published images.
drop policy if exists "Public can read published images" on public.gallery_images;
create policy "Public can read published images"
  on public.gallery_images
  for select
  using (published = true);

-- Authenticated admins may read everything (published or not).
drop policy if exists "Authenticated can read all images" on public.gallery_images;
create policy "Authenticated can read all images"
  on public.gallery_images
  for select
  to authenticated
  using (true);

-- Authenticated admins may insert / update / delete.
drop policy if exists "Authenticated can insert images" on public.gallery_images;
create policy "Authenticated can insert images"
  on public.gallery_images
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update images" on public.gallery_images;
create policy "Authenticated can update images"
  on public.gallery_images
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete images" on public.gallery_images;
create policy "Authenticated can delete images"
  on public.gallery_images
  for delete
  to authenticated
  using (true);
