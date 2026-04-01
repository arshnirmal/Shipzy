DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'undeliverable', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE assignment_status AS ENUM ('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'email', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'courier', 'admin', 'business');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE auth_method AS ENUM ('email', 'phone', 'google', 'firebase', 'refresh');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE tracking_event_type AS ENUM ('location_update', 'pickup', 'delivery', 'status_change', 'checkpoint', 'route_deviation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

ALTER TABLE "users"."profiles" ADD COLUMN "role" user_role;
--> statement-breakpoint
UPDATE "users"."profiles" p
SET "role" = ur."name"::user_role
FROM "public"."user_roles" ur
WHERE p."role_id" = ur."role_id";
--> statement-breakpoint
ALTER TABLE "users"."profiles" ALTER COLUMN "role" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "orders"."requests" ADD COLUMN "status" order_status;
--> statement-breakpoint
UPDATE "orders"."requests" o
SET "status" = os."name"::order_status
FROM "public"."order_statuses" os
WHERE o."status_id" = os."status_id";
--> statement-breakpoint
ALTER TABLE "orders"."requests" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "orders"."courier_assignments" ADD COLUMN "status" assignment_status;
--> statement-breakpoint
UPDATE "orders"."courier_assignments" ca
SET "status" = ast."name"::assignment_status
FROM "public"."assignment_statuses" ast
WHERE ca."assignment_status_id" = ast."status_id";
--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "payments"."transactions" ADD COLUMN "status" payment_status;
--> statement-breakpoint
UPDATE "payments"."transactions" t
SET "status" = ps."name"::payment_status
FROM "payments"."payment_statuses" ps
WHERE t."payment_status_id" = ps."status_id";
--> statement-breakpoint
ALTER TABLE "payments"."transactions" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "notifications"."queue" ADD COLUMN "channel" notification_channel;
--> statement-breakpoint
UPDATE "notifications"."queue" q
SET "channel" = nc."name"::notification_channel
FROM "public"."notification_channels" nc
WHERE q."channel_id" = nc."channel_id";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" ALTER COLUMN "channel" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "notifications"."queue" ADD COLUMN "status" notification_status;
--> statement-breakpoint
UPDATE "notifications"."queue" q
SET "status" = ns."name"::notification_status
FROM "public"."notification_statuses" ns
WHERE q."status_id" = ns."status_id";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications"."queue" ALTER COLUMN "status" SET DEFAULT 'pending';
--> statement-breakpoint

ALTER TABLE "notifications"."queue" ADD COLUMN "priority_new" notification_priority;
--> statement-breakpoint
UPDATE "notifications"."queue"
SET "priority_new" = CASE
  WHEN "priority" = 'low' THEN 'low'::notification_priority
  WHEN "priority" = 'high' THEN 'high'::notification_priority
  WHEN "priority" = 'critical' THEN 'critical'::notification_priority
  ELSE 'normal'::notification_priority
END;
--> statement-breakpoint
ALTER TABLE "notifications"."queue" ALTER COLUMN "priority_new" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications"."queue" ALTER COLUMN "priority_new" SET DEFAULT 'normal';
--> statement-breakpoint

ALTER TABLE "tracking"."events" ADD COLUMN "event_type_new" tracking_event_type;
--> statement-breakpoint
UPDATE "tracking"."events"
SET "event_type_new" = CASE
  WHEN "event_type" = 'location_update' THEN 'location_update'::tracking_event_type
  WHEN "event_type" = 'pickup' THEN 'pickup'::tracking_event_type
  WHEN "event_type" = 'delivery' THEN 'delivery'::tracking_event_type
  WHEN "event_type" = 'checkpoint' THEN 'checkpoint'::tracking_event_type
  WHEN "event_type" = 'route_deviation' THEN 'route_deviation'::tracking_event_type
  ELSE 'status_change'::tracking_event_type
END;
--> statement-breakpoint
ALTER TABLE "tracking"."events" ALTER COLUMN "event_type_new" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "payments"."refunds" ADD COLUMN "refund_status_new" refund_status;
--> statement-breakpoint
UPDATE "payments"."refunds"
SET "refund_status_new" = CASE
  WHEN "refund_status" IN ('processed', 'completed') THEN 'completed'::refund_status
  WHEN "refund_status" = 'processing' THEN 'processing'::refund_status
  WHEN "refund_status" = 'failed' THEN 'failed'::refund_status
  ELSE 'pending'::refund_status
END;
--> statement-breakpoint
ALTER TABLE "payments"."refunds" ALTER COLUMN "refund_status_new" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions" DROP CONSTRAINT IF EXISTS "auth_sessions_auth_method_chk";
--> statement-breakpoint
ALTER TABLE "users"."auth_sessions"
ALTER COLUMN "auth_method" TYPE auth_method
USING "auth_method"::auth_method;
--> statement-breakpoint
ALTER TABLE "users"."auth_sessions" ALTER COLUMN "auth_method" SET DEFAULT 'email';
--> statement-breakpoint

ALTER TABLE "users"."profiles" DROP CONSTRAINT IF EXISTS "profiles_role_id_user_roles_role_id_fk";
--> statement-breakpoint
ALTER TABLE "orders"."requests" DROP CONSTRAINT IF EXISTS "requests_status_id_order_statuses_status_id_fk";
--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" DROP CONSTRAINT IF EXISTS "courier_assignments_assignment_status_id_assignment_statuses_status_id_fk";
--> statement-breakpoint
ALTER TABLE "payments"."transactions" DROP CONSTRAINT IF EXISTS "transactions_payment_status_id_payment_statuses_status_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" DROP CONSTRAINT IF EXISTS "queue_channel_id_notification_channels_channel_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" DROP CONSTRAINT IF EXISTS "queue_status_id_notification_statuses_status_id_fk";
--> statement-breakpoint

ALTER TABLE "users"."profiles" DROP COLUMN "role_id";
--> statement-breakpoint
ALTER TABLE "orders"."requests" DROP COLUMN "status_id";
--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" DROP COLUMN "assignment_status_id";
--> statement-breakpoint
ALTER TABLE "payments"."transactions" DROP COLUMN "payment_status_id";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" DROP COLUMN "channel_id";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" DROP COLUMN "status_id";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" DROP COLUMN "priority";
--> statement-breakpoint
ALTER TABLE "notifications"."queue" RENAME COLUMN "priority_new" TO "priority";
--> statement-breakpoint
ALTER TABLE "tracking"."events" DROP COLUMN "event_type";
--> statement-breakpoint
ALTER TABLE "tracking"."events" RENAME COLUMN "event_type_new" TO "event_type";
--> statement-breakpoint
ALTER TABLE "payments"."refunds" DROP COLUMN "refund_status";
--> statement-breakpoint
ALTER TABLE "payments"."refunds" RENAME COLUMN "refund_status_new" TO "refund_status";
--> statement-breakpoint

DROP TABLE IF EXISTS "public"."order_statuses";
--> statement-breakpoint
DROP TABLE IF EXISTS "public"."assignment_statuses";
--> statement-breakpoint
DROP TABLE IF EXISTS "payments"."payment_statuses";
--> statement-breakpoint
DROP TABLE IF EXISTS "public"."notification_statuses";
--> statement-breakpoint
DROP TABLE IF EXISTS "public"."notification_channels";
--> statement-breakpoint
DROP TABLE IF EXISTS "public"."user_roles";
