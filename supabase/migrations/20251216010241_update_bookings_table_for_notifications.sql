ALTER TABLE "public"."bookings" ADD COLUMN "event_type" text;
ALTER TABLE "public"."bookings" ADD COLUMN "type" text default 'booking'::text;
ALTER TABLE "public"."bookings" ADD COLUMN "assigned_phones" text[];

ALTER TABLE "public"."bookings" ALTER COLUMN "booking_end_date" TYPE date USING ("booking_end_date"::date);

ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_status_check";
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text, 'blocked'::text])));

create trigger "notify-telegram"
after INSERT on bookings for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://tikqxpgqgfciuyvaspdi.supabase.co/functions/v1/telegram-bot',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa3F4cGdxZ2ZjaXV5dmFzcGRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU4MDg4NCwiZXhwIjoyMDgxMTU2ODg0fQ.__5WIk8UWGWszjUaTSRrcwdT_c4YSOKJILHN6eXIJbs"}',
  '{"type":"notify"}',
  '5000'
);
