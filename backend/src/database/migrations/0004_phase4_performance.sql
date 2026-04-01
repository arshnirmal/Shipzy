ALTER TABLE "logistics"."courier_status"
ADD COLUMN "avg_rating" numeric(3, 2),
ADD COLUMN "total_ratings" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

UPDATE "logistics"."courier_status" cs
SET
  "avg_rating" = agg.avg_rating,
  "total_ratings" = agg.total_ratings
FROM (
  SELECT
    dr.driver_id,
    ROUND(AVG(dr.rating)::numeric, 2) AS avg_rating,
    COUNT(*)::integer AS total_ratings
  FROM "logistics"."driver_ratings" dr
  GROUP BY dr.driver_id
) agg
WHERE cs.courier_id = agg.driver_id;
--> statement-breakpoint

ALTER TABLE "logistics"."courier_status"
ADD CONSTRAINT "courier_status_avg_rating_range_chk"
CHECK ("avg_rating" IS NULL OR ("avg_rating" >= 1.00 AND "avg_rating" <= 5.00));
--> statement-breakpoint

ALTER TABLE "logistics"."courier_status"
ADD CONSTRAINT "courier_status_total_ratings_non_negative_chk"
CHECK ("total_ratings" >= 0);
--> statement-breakpoint

-- P1: partial indexes for soft-delete pattern
CREATE INDEX IF NOT EXISTS "idx_orders_requests_client_created_active"
ON "orders"."requests" ("client_id", "created_at" DESC)
WHERE "deleted_at" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_orders_requests_status_created_active"
ON "orders"."requests" ("status", "created_at" DESC)
WHERE "deleted_at" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_users_profiles_uuid_active"
ON "users"."profiles" ("user_uuid")
WHERE "deleted_at" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_users_profiles_phone_active"
ON "users"."profiles" ("phone_number")
WHERE "deleted_at" IS NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_users_profiles_email_active"
ON "users"."profiles" ("email")
WHERE "deleted_at" IS NULL;
--> statement-breakpoint

-- Additional indexes from Phase 4 plan
CREATE INDEX IF NOT EXISTS "idx_assignments_order"
ON "orders"."courier_assignments" ("order_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_assignments_courier_active"
ON "orders"."courier_assignments" ("courier_id")
WHERE "status" NOT IN ('rejected', 'cancelled');
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_tracking_assignment_time"
ON "tracking"."events" ("assignment_id", "timestamp" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread"
ON "notifications"."queue" ("user_id", "status")
WHERE "status" NOT IN ('read', 'failed');
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_ratings_driver"
ON "logistics"."driver_ratings" ("driver_id", "created_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_fcm_tokens_user_active"
ON "notifications"."fcm_tokens" ("user_id")
WHERE "is_active" = true;
--> statement-breakpoint

-- P3: tracking.events retention policy (best effort; requires pg_cron)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension unavailable: %', SQLERRM;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'shipzy_tracking_events_retention';

    PERFORM cron.schedule(
      'shipzy_tracking_events_retention',
      '15 3 * * *',
      'DELETE FROM tracking.events WHERE "timestamp" < NOW() - INTERVAL ''30 days'''
    );
  END IF;
END $$;
