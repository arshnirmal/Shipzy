ALTER TABLE "logistics"."courier_vehicles"
ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

ALTER TABLE "logistics"."driver_sessions"
DROP CONSTRAINT IF EXISTS "driver_sessions_driver_id_courier_status_courier_id_fk";
--> statement-breakpoint

ALTER TABLE "logistics"."driver_sessions"
ADD COLUMN "last_location" geography(POINT, 4326);
--> statement-breakpoint

UPDATE "logistics"."driver_sessions"
SET "last_location" = CASE
  WHEN "last_location_lat" IS NOT NULL AND "last_location_lng" IS NOT NULL
    THEN ST_SetSRID(ST_MakePoint("last_location_lng", "last_location_lat"), 4326)::geography
  ELSE NULL
END;
--> statement-breakpoint

ALTER TABLE "logistics"."driver_sessions"
DROP COLUMN "last_location_lat";
--> statement-breakpoint

ALTER TABLE "logistics"."driver_sessions"
DROP COLUMN "last_location_lng";
--> statement-breakpoint

ALTER TABLE "logistics"."driver_sessions"
ADD CONSTRAINT "driver_sessions_driver_id_profiles_user_id_fk"
FOREIGN KEY ("driver_id")
REFERENCES "users"."profiles"("user_id")
ON DELETE no action
ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "orders"."requests"
DROP COLUMN "labels";
--> statement-breakpoint

UPDATE "orders"."requests"
SET "metadata" = "metadata" - 'couponCode' - 'notifyRecipientSms' - 'specialInstructions'
WHERE "metadata" ?| ARRAY['couponCode', 'notifyRecipientSms', 'specialInstructions'];
--> statement-breakpoint

DROP TABLE IF EXISTS "public"."delivery_type_labels";
--> statement-breakpoint

DROP TABLE IF EXISTS "public"."labels";
--> statement-breakpoint

DROP TABLE IF EXISTS "logistics"."locations";
