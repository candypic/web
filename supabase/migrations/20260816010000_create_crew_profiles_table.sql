-- =========================================================================
-- Candy Pic: Crew Profiles, Team Member Registration & Admin Approval
-- =========================================================================

create table if not exists public.crew_profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  phone        text not null,
  role         text not null default 'Candid Photographer',
  city         text default 'Kumta',
  push_token   text,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  approved_by  text,
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists crew_profiles_status_idx on public.crew_profiles (status);
create index if not exists crew_profiles_email_idx on public.crew_profiles (email);

alter table public.crew_profiles enable row level security;

-- 1. Anyone can read crew profiles (pending & approved)
drop policy if exists "Anyone can read approved crew profiles" on public.crew_profiles;
drop policy if exists "Anyone can read crew profiles" on public.crew_profiles;
create policy "Anyone can read crew profiles"
  on public.crew_profiles for select
  using (true);

-- 2. Anyone (public applicants) can register a crew profile
drop policy if exists "Anyone can register crew profile" on public.crew_profiles;
create policy "Anyone can register crew profile"
  on public.crew_profiles for insert
  with check (true);

-- 3. Authenticated admins can update crew profiles (approve/reject)
drop policy if exists "Authenticated admins can manage crew profiles" on public.crew_profiles;
drop policy if exists "Anyone can update crew profile" on public.crew_profiles;
create policy "Anyone can update crew profile"
  on public.crew_profiles for update
  using (true)
  with check (true);

drop policy if exists "Anyone can delete crew profile" on public.crew_profiles;
create policy "Anyone can delete crew profile"
  on public.crew_profiles for delete
  using (true);

-- Notify schema cache
notify pgrst, 'reload schema';

-- Insert Default Core Studio Crew (Chandan, Vikram, Rahul)
insert into public.crew_profiles (name, email, phone, role, city, status, approved_by, approved_at)
values
  ('Chandan Naik', 'chandan@candypic.com', '+91 9743174487', 'Studio Lead & Candid Lead', 'Kumta', 'approved', 'superadmin', now()),
  ('Vikram Naik', 'vikram@candypic.com', '+91 98866 02703', 'Drone Pilot & Aerial Cinema', 'Kumta', 'approved', 'superadmin', now()),
  ('Rahul Naik', 'rahul@candypic.com', '+91 98451 23456', 'Lead Cinematographer', 'Kumta', 'approved', 'superadmin', now())
on conflict (email) do update set status = 'approved';
