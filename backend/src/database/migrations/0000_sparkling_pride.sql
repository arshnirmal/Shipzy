CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'returning', 'delivered', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('email', 'phone', 'google', 'firebase');--> statement-breakpoint
CREATE TYPE "public"."monthly_volume" AS ENUM('0-100', '100-500', '500-2000', '2000+');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('push', 'sms', 'email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'normal', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'scheduled', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'undeliverable', 'returning', 'returned');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tracking_event_type" AS ENUM('location_update', 'pickup', 'delivery', 'status_change', 'checkpoint', 'route_deviation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('client', 'courier', 'admin', 'business');--> statement-breakpoint
CREATE TABLE "business_discount_tiers" (
	"tier_id" serial PRIMARY KEY NOT NULL,
	"label" varchar(100) NOT NULL,
	"min_orders" integer NOT NULL,
	"max_orders" integer,
	"discount_pct" numeric(5, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discount_pct_range_chk" CHECK ("business_discount_tiers"."discount_pct" BETWEEN 0 AND 100),
	CONSTRAINT "min_orders_non_negative_chk" CHECK ("business_discount_tiers"."min_orders" >= 0),
	CONSTRAINT "max_orders_valid_chk" CHECK ("business_discount_tiers"."max_orders" > "business_discount_tiers"."min_orders" OR "business_discount_tiers"."max_orders" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "delivery_type_capabilities" (
	"capability_id" serial PRIMARY KEY NOT NULL,
	"delivery_type_id" integer NOT NULL,
	"vehicle_category_id" integer NOT NULL,
	"weight_tier_id" integer NOT NULL,
	"base_rate_override" numeric(10, 2),
	"per_km_rate_override" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_types" (
	"delivery_type_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"base_rate" numeric(10, 2) NOT NULL,
	"per_km_rate" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_types_name_unique" UNIQUE("name"),
	CONSTRAINT "delivery_types_base_rate_non_negative_chk" CHECK ("delivery_types"."base_rate" >= 0),
	CONSTRAINT "delivery_types_per_km_rate_non_negative_chk" CHECK ("delivery_types"."per_km_rate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "package_types" (
	"package_type_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"special_handling_fee" numeric(10, 2) DEFAULT 0 NOT NULL,
	"requires_special_handling" boolean DEFAULT false NOT NULL,
	"handling_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_types_name_unique" UNIQUE("name"),
	CONSTRAINT "package_types_special_handling_fee_non_negative_chk" CHECK ("package_types"."special_handling_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"config_id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(50) NOT NULL,
	"config_value" numeric(10, 4) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_config_config_key_unique" UNIQUE("config_key"),
	CONSTRAINT "pricing_config_value_non_negative_chk" CHECK ("pricing_config"."config_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"max_weight_kg" numeric(10, 2) NOT NULL,
	"icon_url" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "vehicle_categories_max_weight_non_negative_chk" CHECK ("vehicle_categories"."max_weight_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "weight_tiers" (
	"tier_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_weight_kg" numeric(10, 2) NOT NULL,
	"max_weight_kg" numeric(10, 2) NOT NULL,
	"additional_charge" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weight_tiers_min_weight_non_negative_chk" CHECK ("weight_tiers"."min_weight_kg" >= 0),
	CONSTRAINT "weight_tiers_max_gt_min_chk" CHECK ("weight_tiers"."max_weight_kg" > "weight_tiers"."min_weight_kg"),
	CONSTRAINT "weight_tiers_additional_charge_non_negative_chk" CHECK ("weight_tiers"."additional_charge" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users"."auth_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(100),
	"phone_number" varchar(20),
	"otp_code_hash" varchar(64),
	"otp_expires_at" timestamp with time zone,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_attempts" integer DEFAULT 0 NOT NULL,
	"jwt_token_hash" varchar(255) NOT NULL,
	"refresh_token_hash" varchar(255),
	"device_id" varchar(255),
	"device_info" jsonb,
	"ip_address" "inet",
	"auth_method" "auth_method" DEFAULT 'email' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_jwt_token_hash_unique" UNIQUE("jwt_token_hash"),
	CONSTRAINT "auth_sessions_refresh_token_hash_unique" UNIQUE("refresh_token_hash"),
	CONSTRAINT "auth_sessions_contact_present_chk" CHECK ("users"."auth_sessions"."email" IS NOT NULL OR "users"."auth_sessions"."phone_number" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "users"."business_accounts" (
	"business_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"gst_number" varchar(15),
	"pan_number" varchar(10),
	"business_type" varchar(100),
	"website" varchar(255),
	"monthly_volume" "monthly_volume",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_accounts_gst_number_unique" UNIQUE("gst_number")
);
--> statement-breakpoint
CREATE TABLE "users"."addresses" (
	"address_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"address_type" varchar(50),
	"label" varchar(100),
	"building" varchar(100),
	"floor" varchar(10),
	"flat_number" varchar(10),
	"full_address" text NOT NULL,
	"landmark" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"location" geography(POINT, 4326) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."profiles" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"user_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"firebase_uid" varchar(255),
	"phone_number" varchar(20),
	"email" varchar(100),
	"password_hash" varchar(255),
	"full_name" varchar(100) NOT NULL,
	"profile_picture_url" varchar(255),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "profiles_user_uuid_unique" UNIQUE("user_uuid"),
	CONSTRAINT "profiles_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders"."courier_assignments" (
	"assignment_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"courier_id" integer NOT NULL,
	"status" "assignment_status" NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"timeline" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"net_earnings" numeric(10, 2),
	"rejection_reason" text,
	"courier_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders"."drafts" (
	"draft_id" serial PRIMARY KEY NOT NULL,
	"draft_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(200),
	"fulfillment" jsonb,
	"pickup_location" jsonb,
	"delivery_location" jsonb,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"package" jsonb,
	"pricing" jsonb,
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"coupon_code" varchar(50),
	"notes" text,
	"template_id" integer,
	"submitted_order_id" integer,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "drafts_draft_uuid_unique" UNIQUE("draft_uuid")
);
--> statement-breakpoint
CREATE TABLE "orders"."requests" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"order_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50),
	"client_id" integer NOT NULL,
	"delivery_type_id" integer NOT NULL,
	"vehicle_category_id" integer NOT NULL,
	"weight_tier_id" integer,
	"package_type_id" integer,
	"payment_method_id" integer NOT NULL,
	"status" "order_status" NOT NULL,
	"pickup_location" jsonb NOT NULL,
	"delivery_location" jsonb NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"pricing" jsonb NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"schedule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actual" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"package" jsonb DEFAULT '{"notifyRecipientSms":false}'::jsonb NOT NULL,
	"estimated_distance_km" numeric(6, 2),
	"actual_distance_km" numeric(6, 2),
	"actual_duration_mins" integer,
	"coupon_code" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"in_transit_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"delivery_attempt" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "requests_order_uuid_unique" UNIQUE("order_uuid"),
	CONSTRAINT "requests_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_requests_estimated_distance_non_negative_chk" CHECK ("orders"."requests"."estimated_distance_km" IS NULL OR "orders"."requests"."estimated_distance_km" >= 0),
	CONSTRAINT "orders_requests_actual_distance_non_negative_chk" CHECK ("orders"."requests"."actual_distance_km" IS NULL OR "orders"."requests"."actual_distance_km" >= 0),
	CONSTRAINT "orders_requests_actual_duration_non_negative_chk" CHECK ("orders"."requests"."actual_duration_mins" IS NULL OR "orders"."requests"."actual_duration_mins" >= 0),
	CONSTRAINT "orders_requests_total_price_non_negative_chk" CHECK ("orders"."requests"."total_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders"."status_history" (
	"history_id" bigserial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"status" "order_status" NOT NULL,
	"previous_status" "order_status",
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "orders"."templates" (
	"template_id" serial PRIMARY KEY NOT NULL,
	"template_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"fulfillment" jsonb,
	"pickup_location" jsonb,
	"delivery_location" jsonb,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"package" jsonb,
	"use_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "templates_template_uuid_unique" UNIQUE("template_uuid")
);
--> statement-breakpoint
CREATE TABLE "orders"."proof_of_delivery" (
	"proof_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"recipient_name" varchar(100),
	"recipient_signature_url" varchar(255),
	"photo_url" varchar(255),
	"delivery_notes" text,
	"delivered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proof_of_delivery_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "logistics"."courier_status" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"courier_id" integer NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"current_location" geography(POINT, 4326),
	"location_meta" jsonb,
	"last_location_update" timestamp with time zone,
	"current_assignment_id" integer,
	"total_deliveries_today" integer DEFAULT 0 NOT NULL,
	"avg_rating" numeric(3, 2),
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courier_status_courier_id_unique" UNIQUE("courier_id"),
	CONSTRAINT "courier_status_total_deliveries_non_negative_chk" CHECK ("logistics"."courier_status"."total_deliveries_today" >= 0),
	CONSTRAINT "courier_status_avg_rating_range_chk" CHECK ("logistics"."courier_status"."avg_rating" IS NULL OR ("logistics"."courier_status"."avg_rating" >= 1.00 AND "logistics"."courier_status"."avg_rating" <= 5.00)),
	CONSTRAINT "courier_status_total_ratings_non_negative_chk" CHECK ("logistics"."courier_status"."total_ratings" >= 0)
);
--> statement-breakpoint
CREATE TABLE "logistics"."courier_vehicles" (
	"vehicle_id" serial PRIMARY KEY NOT NULL,
	"courier_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"vehicle_number" varchar(50) NOT NULL,
	"model" varchar(100),
	"year" integer,
	"insurance_expiry" date,
	"registration_document_url" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics"."driver_sessions" (
	"session_id" bigserial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"total_online_minutes" integer,
	"last_location" geography(POINT, 4326),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments"."payment_methods" (
	"method_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "payments"."transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"external_transaction_id" varchar(255),
	"payment_gateway" varchar(50),
	"upi_vpa" varchar(100),
	"payment_initiated_at" timestamp with time zone,
	"payment_completed_at" timestamp with time zone,
	"payment_failed_at" timestamp with time zone,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transactions_amount_non_negative_chk" CHECK ("payments"."transactions"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments"."refunds" (
	"refund_id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"refund_amount" numeric(10, 2) NOT NULL,
	"refund_reason" text NOT NULL,
	"refund_status" "refund_status" NOT NULL,
	"external_refund_id" varchar(255),
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_refunds_amount_non_negative_chk" CHECK ("payments"."refunds"."refund_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tracking"."events" (
	"event_id" bigserial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"courier_id" integer NOT NULL,
	"event_type" "tracking_event_type" NOT NULL,
	"location" geography(POINT, 4326),
	"accuracy_meters" numeric(6, 2),
	"speed_kmph" numeric(5, 2),
	"bearing_degrees" numeric(5, 2),
	"event_description" text,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_events_accuracy_non_negative_chk" CHECK ("tracking"."events"."accuracy_meters" IS NULL OR "tracking"."events"."accuracy_meters" >= 0),
	CONSTRAINT "tracking_events_speed_non_negative_chk" CHECK ("tracking"."events"."speed_kmph" IS NULL OR "tracking"."events"."speed_kmph" >= 0),
	CONSTRAINT "tracking_events_bearing_valid_chk" CHECK ("tracking"."events"."bearing_degrees" IS NULL OR ("tracking"."events"."bearing_degrees" >= 0 AND "tracking"."events"."bearing_degrees" < 360))
);
--> statement-breakpoint
CREATE TABLE "logistics"."driver_ratings" (
	"rating_id" bigserial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_ratings_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "driver_ratings_rating_range_chk" CHECK ("logistics"."driver_ratings"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "notifications"."fcm_tokens" (
	"token_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_token" text NOT NULL,
	"device_type" varchar(20) NOT NULL,
	"device_info" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications"."queue" (
	"notification_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"priority" "notification_priority" DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_queue_retry_count_non_negative_chk" CHECK ("notifications"."queue"."retry_count" >= 0),
	CONSTRAINT "notifications_queue_max_retries_non_negative_chk" CHECK ("notifications"."queue"."max_retries" >= 0)
);
--> statement-breakpoint
ALTER TABLE "delivery_type_capabilities" ADD CONSTRAINT "delivery_type_capabilities_delivery_type_id_delivery_types_delivery_type_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("delivery_type_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_type_capabilities" ADD CONSTRAINT "delivery_type_capabilities_vehicle_category_id_vehicle_categories_category_id_fk" FOREIGN KEY ("vehicle_category_id") REFERENCES "public"."vehicle_categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_type_capabilities" ADD CONSTRAINT "delivery_type_capabilities_weight_tier_id_weight_tiers_tier_id_fk" FOREIGN KEY ("weight_tier_id") REFERENCES "public"."weight_tiers"("tier_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."business_accounts" ADD CONSTRAINT "business_accounts_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ADD CONSTRAINT "courier_assignments_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ADD CONSTRAINT "courier_assignments_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."drafts" ADD CONSTRAINT "drafts_client_id_profiles_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."drafts" ADD CONSTRAINT "drafts_template_id_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "orders"."templates"("template_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."drafts" ADD CONSTRAINT "drafts_submitted_order_id_requests_order_id_fk" FOREIGN KEY ("submitted_order_id") REFERENCES "orders"."requests"("order_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_client_id_profiles_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_delivery_type_id_delivery_types_delivery_type_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("delivery_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_vehicle_category_id_vehicle_categories_category_id_fk" FOREIGN KEY ("vehicle_category_id") REFERENCES "public"."vehicle_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_weight_tier_id_weight_tiers_tier_id_fk" FOREIGN KEY ("weight_tier_id") REFERENCES "public"."weight_tiers"("tier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_package_type_id_package_types_package_type_id_fk" FOREIGN KEY ("package_type_id") REFERENCES "public"."package_types"("package_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_payment_method_id_payment_methods_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_methods"("method_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."status_history" ADD CONSTRAINT "status_history_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."status_history" ADD CONSTRAINT "status_history_changed_by_profiles_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."templates" ADD CONSTRAINT "templates_client_id_profiles_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_status" ADD CONSTRAINT "courier_status_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_status" ADD CONSTRAINT "courier_status_current_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("current_assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_vehicles" ADD CONSTRAINT "courier_vehicles_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_vehicles" ADD CONSTRAINT "courier_vehicles_category_id_vehicle_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vehicle_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."driver_sessions" ADD CONSTRAINT "driver_sessions_driver_id_profiles_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "users"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD CONSTRAINT "transactions_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_methods"("method_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "payments"."transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "refunds_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking"."events" ADD CONSTRAINT "events_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking"."events" ADD CONSTRAINT "events_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking"."events" ADD CONSTRAINT "events_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."driver_ratings" ADD CONSTRAINT "driver_ratings_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."driver_ratings" ADD CONSTRAINT "driver_ratings_driver_id_courier_status_courier_id_fk" FOREIGN KEY ("driver_id") REFERENCES "logistics"."courier_status"("courier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."driver_ratings" ADD CONSTRAINT "driver_ratings_customer_id_profiles_user_id_fk" FOREIGN KEY ("customer_id") REFERENCES "users"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."fcm_tokens" ADD CONSTRAINT "fcm_tokens_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."queue" ADD CONSTRAINT "queue_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_delivery_type_vehicle_weight" ON "delivery_type_capabilities" USING btree ("delivery_type_id","vehicle_category_id","weight_tier_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_config_active_key" ON "pricing_config" USING btree ("config_key") WHERE "pricing_config"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_weight_tiers_name_range" ON "weight_tiers" USING btree ("name","min_weight_kg","max_weight_kg");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_sessions_user_device" ON "users"."auth_sessions" USING btree ("user_id","device_id") WHERE "users"."auth_sessions"."device_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_profiles_uuid_active" ON "users"."profiles" USING btree ("user_uuid") WHERE "users"."profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_profiles_phone_active" ON "users"."profiles" USING btree ("phone_number") WHERE "users"."profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_profiles_email_active" ON "users"."profiles" USING btree ("email") WHERE "users"."profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_assignments_order" ON "orders"."courier_assignments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_courier_active" ON "orders"."courier_assignments" USING btree ("courier_id") WHERE "orders"."courier_assignments"."status" NOT IN ('rejected', 'cancelled');--> statement-breakpoint
CREATE INDEX "idx_drafts_client_created" ON "orders"."drafts" USING btree ("client_id","created_at") WHERE "orders"."drafts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_drafts_client_submitted" ON "orders"."drafts" USING btree ("client_id","submitted_at") WHERE "orders"."drafts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_requests_client_created_active" ON "orders"."requests" USING btree ("client_id","created_at") WHERE "orders"."requests"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_requests_status_created_active" ON "orders"."requests" USING btree ("status","created_at") WHERE "orders"."requests"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_scheduled_pickup" ON "orders"."requests" USING btree ("status",(schedule->>'pickupAt')) WHERE status = 'scheduled' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_status_history_order" ON "orders"."status_history" USING btree ("order_id","changed_at");--> statement-breakpoint
CREATE INDEX "idx_templates_client_active" ON "orders"."templates" USING btree ("client_id") WHERE "orders"."templates"."deleted_at" IS NULL AND "orders"."templates"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_courier_status_assignment" ON "logistics"."courier_status" USING btree ("current_assignment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_courier_vehicles_primary_per_courier" ON "logistics"."courier_vehicles" USING btree ("courier_id") WHERE "logistics"."courier_vehicles"."is_primary" = true AND "logistics"."courier_vehicles"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_tracking_assignment_time" ON "tracking"."events" USING btree ("assignment_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_ratings_driver" ON "logistics"."driver_ratings" USING btree ("driver_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fcm_tokens_user" ON "notifications"."fcm_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fcm_tokens_user_active" ON "notifications"."fcm_tokens" USING btree ("user_id") WHERE "notifications"."fcm_tokens"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications"."queue" USING btree ("user_id","status") WHERE "notifications"."queue"."status" NOT IN ('read', 'failed');