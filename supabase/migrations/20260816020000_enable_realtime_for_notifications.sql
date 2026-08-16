-- =========================================================================
-- Enable Supabase Realtime (postgres_changes) replication for the tables
-- the crew notification system listens on. Without this, INSERT/UPDATE
-- events on these tables never reach connected clients over
-- `postgres_changes` — only the ephemeral `broadcast` channel works, and
-- only for devices that are actively connected at the exact send moment.
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'crew_profiles'
  ) then
    alter publication supabase_realtime add table public.crew_profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications'
  ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
