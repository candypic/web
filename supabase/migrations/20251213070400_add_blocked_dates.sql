
-- Drop existing status check
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_status_check";

-- Add blocked to status check
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_status_check" 
CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text, 'blocked'::text])));

-- Make client fields nullable
ALTER TABLE "public"."bookings" ALTER COLUMN "client_name" DROP NOT NULL;
ALTER TABLE "public"."bookings" ALTER COLUMN "client_phone" DROP NOT NULL;

-- Add type column
ALTER TABLE "public"."bookings" ADD COLUMN "type" text NOT NULL DEFAULT 'booking';
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_type_check" CHECK (type IN ('booking', 'block'));
