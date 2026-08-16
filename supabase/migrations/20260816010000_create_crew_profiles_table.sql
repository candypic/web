-- =========================================================================
-- Candy Pic: Crew Profiles, Team Member Registration & Admin Approval
-- =========================================================================

create table if not exists public.crew_profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  phone        text not null,
  role         text not null default 'Candid Photographer', -- 'Candid Photographer', 'Traditional Photographer', 'Drone Pilot', 'Cinematographer', 'Editor', 'Assistant'
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

-- 1. Anyone (public crew applicants) can insert registration
drop policy if exists "Anyone can register crew profile" on public.crew_profiles;
create policy "Anyone can register crew profile"
  on public.crew_profiles for insert
  with check (true);

-- 2. Anyone can read approved crew members (for calendar assign dropdown)
drop policy if exists "Anyone can read approved crew profiles" on public.crew_profiles;
create policy "Anyone can read approved crew profiles"
  on public.crew_profiles for select
  using (status = 'approved');

-- 3. Authenticated admins can view and update all crew profiles (pending, approved, rejected)
drop policy if exists "Authenticated admins can manage crew profiles" on public.crew_profiles;
create policy "Authenticated admins can manage crew profiles"
  on public.crew_profiles for all
  to authenticated
  using (true)
  with check (true);

-- Insert Default Core Studio Crew (Chandan, Vikram, Rahul)
insert into public.crew_profiles (name, email, phone, role, city, status, approved_by, approved_at)
values
  ('Chandan Naik', 'chandan@candypic.com', '+91 9743174487', 'Studio Lead & Candid Lead', 'Kumta', 'approved', 'superadmin', now()),
  ('Vikram Naik', 'vikram@candypic.com', '+91 98866 02703', 'Drone Pilot & Aerial Cinema', 'Kumta', 'approved', 'superadmin', now()),
  ('Rahul Naik', 'rahul@candypic.com', '+91 98451 23456', 'Lead Cinematographer', 'Kumta', 'approved', 'superadmin', now())
on conflict (email) do update set status = 'approved';
