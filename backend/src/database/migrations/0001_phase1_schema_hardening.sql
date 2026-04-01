CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions"
RENAME COLUMN "otp_code" TO "otp_code_hash";
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions"
ALTER COLUMN "otp_code_hash" TYPE varchar(64);
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions"
ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions"
ADD CONSTRAINT "auth_sessions_contact_required_chk"
CHECK ("email" IS NOT NULL OR "phone_number" IS NOT NULL);
--> statement-breakpoint

ALTER TABLE "users"."auth_sessions"
ADD CONSTRAINT "auth_sessions_auth_method_chk"
CHECK ("auth_method" IN ('email', 'phone', 'google', 'firebase', 'refresh'));
--> statement-breakpoint

ALTER TABLE "public"."delivery_type_capabilities"
ADD CONSTRAINT "delivery_type_capabilities_vehicle_category_id_vehicle_categories_category_id_fk"
FOREIGN KEY ("vehicle_category_id")
REFERENCES "public"."vehicle_categories"("category_id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD COLUMN "actual_duration_mins" integer;
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ALTER COLUMN "platform_fee" DROP DEFAULT;
--> statement-breakpoint

CREATE UNIQUE INDEX "uq_requests_order_number_active"
ON "orders"."requests" ("order_number")
WHERE "order_number" IS NOT NULL
  AND "deleted_at" IS NULL;
--> statement-breakpoint

ALTER TABLE "logistics"."driver_ratings"
ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

ALTER TABLE "public"."delivery_types"
ADD CONSTRAINT "delivery_types_base_rate_non_negative_chk"
CHECK ("base_rate" >= 0);
--> statement-breakpoint

ALTER TABLE "public"."delivery_types"
ADD CONSTRAINT "delivery_types_per_km_rate_non_negative_chk"
CHECK ("per_km_rate" >= 0);
--> statement-breakpoint

ALTER TABLE "public"."package_types"
ADD CONSTRAINT "package_types_special_handling_fee_non_negative_chk"
CHECK ("special_handling_fee" >= 0);
--> statement-breakpoint

ALTER TABLE "public"."vehicle_categories"
ADD CONSTRAINT "vehicle_categories_max_weight_non_negative_chk"
CHECK ("max_weight_kg" >= 0);
--> statement-breakpoint

ALTER TABLE "public"."weight_tiers"
ADD CONSTRAINT "weight_tiers_min_weight_non_negative_chk"
CHECK ("min_weight_kg" >= 0);
--> statement-breakpoint

ALTER TABLE "public"."weight_tiers"
ADD CONSTRAINT "weight_tiers_max_gt_min_chk"
CHECK ("max_weight_kg" > "min_weight_kg");
--> statement-breakpoint

ALTER TABLE "public"."weight_tiers"
ADD CONSTRAINT "weight_tiers_additional_charge_non_negative_chk"
CHECK ("additional_charge" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_declared_value_non_negative_chk"
CHECK ("declared_value" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_estimated_distance_non_negative_chk"
CHECK ("estimated_distance_km" IS NULL OR "estimated_distance_km" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_actual_distance_non_negative_chk"
CHECK ("actual_distance_km" IS NULL OR "actual_distance_km" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_base_price_non_negative_chk"
CHECK ("base_price" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_distance_price_non_negative_chk"
CHECK ("distance_price" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_weight_surcharge_non_negative_chk"
CHECK ("weight_surcharge" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_platform_fee_non_negative_chk"
CHECK ("platform_fee" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_special_handling_fee_non_negative_chk"
CHECK ("special_handling_fee" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_subtotal_before_tax_non_negative_chk"
CHECK ("subtotal_before_tax" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_gst_amount_non_negative_chk"
CHECK ("gst_amount" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_total_price_non_negative_chk"
CHECK ("total_price" >= 0);
--> statement-breakpoint

ALTER TABLE "orders"."requests"
ADD CONSTRAINT "requests_actual_duration_non_negative_chk"
CHECK ("actual_duration_mins" IS NULL OR "actual_duration_mins" >= 0);
--> statement-breakpoint

ALTER TABLE "logistics"."driver_ratings"
ADD CONSTRAINT "driver_ratings_rating_between_1_and_5_chk"
CHECK ("rating" BETWEEN 1 AND 5);
