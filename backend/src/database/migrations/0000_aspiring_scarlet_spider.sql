CREATE TABLE "assignment_statuses" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_statuses_name_unique" UNIQUE("name")
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
CREATE TABLE "delivery_type_labels" (
	"delivery_type_id" integer NOT NULL,
	"label_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
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
	CONSTRAINT "delivery_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"label_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_text" varchar(100) NOT NULL,
	"color" varchar(7),
	"background_color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "labels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"channel_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_channels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notification_statuses" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "order_statuses" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"display_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "package_types" (
	"package_type_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"special_handling_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"requires_special_handling" boolean DEFAULT false NOT NULL,
	"handling_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_types_name_unique" UNIQUE("name")
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
	CONSTRAINT "pricing_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"role_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_name_unique" UNIQUE("name")
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
	CONSTRAINT "vehicle_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "weight_tiers" (
	"tier_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"min_weight_kg" numeric(10, 2) NOT NULL,
	"max_weight_kg" numeric(10, 2) NOT NULL,
	"additional_charge" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."auth_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"otp_code" varchar(6),
	"otp_expires_at" timestamp with time zone,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_attempts" integer DEFAULT 0 NOT NULL,
	"jwt_token_hash" varchar(255) NOT NULL,
	"device_id" varchar(255),
	"device_info" jsonb,
	"ip_address" "inet",
	"auth_method" varchar(20) DEFAULT 'email' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_jwt_token_hash_unique" UNIQUE("jwt_token_hash")
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
	"location" "geography(POINT, 4326)" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."profiles" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"user_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"role_id" integer NOT NULL,
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
	"assignment_status_id" integer NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"completed_at" timestamp with time zone,
	"courier_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders"."requests" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"order_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50),
	"client_id" integer NOT NULL,
	"delivery_type_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"vehicle_category_id" integer NOT NULL,
	"weight_tier_id" integer,
	"pickup_location" jsonb NOT NULL,
	"delivery_location" jsonb NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_pickup_time" timestamp with time zone,
	"actual_pickup_time" timestamp with time zone,
	"scheduled_delivery_time" timestamp with time zone,
	"actual_delivery_time" timestamp with time zone,
	"package_type_id" integer,
	"special_instructions" text,
	"package_description" text,
	"declared_value" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"notify_recipient_sms" boolean DEFAULT false NOT NULL,
	"coupon_code" varchar(50),
	"estimated_distance_km" numeric(6, 2),
	"actual_distance_km" numeric(6, 2),
	"base_price" numeric(10, 2) NOT NULL,
	"distance_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"weight_surcharge" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"platform_fee" numeric(10, 2) DEFAULT '10.00' NOT NULL,
	"special_handling_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"subtotal_before_tax" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"gst_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"payment_method_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "requests_order_uuid_unique" UNIQUE("order_uuid")
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
	"current_location" "geography(POINT, 4326)",
	"last_location_update" timestamp with time zone,
	"current_assignment_id" integer,
	"total_deliveries_today" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courier_status_courier_id_unique" UNIQUE("courier_id")
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
	"last_location_lat" numeric(10, 8),
	"last_location_lng" numeric(11, 8),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics"."locations" (
	"location_id" serial PRIMARY KEY NOT NULL,
	"building_name" varchar(100),
	"floor_number" varchar(10),
	"flat_number" varchar(10),
	"address" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"location" "geography(POINT, 4326)" NOT NULL,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"landmark" varchar(255),
	"how_to_reach" text,
	"contact_name" varchar(100),
	"contact_phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "payments"."payment_statuses" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "payments"."transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"payment_status_id" integer NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments"."refunds" (
	"refund_id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"refund_amount" numeric(10, 2) NOT NULL,
	"refund_reason" text NOT NULL,
	"refund_status" varchar(50) NOT NULL,
	"external_refund_id" varchar(255),
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking"."events" (
	"event_id" bigserial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"courier_id" integer NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"location" "geography(POINT, 4326)",
	"accuracy_meters" numeric(6, 2),
	"speed_kmph" numeric(5, 2),
	"bearing_degrees" numeric(5, 2),
	"event_description" text,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics"."driver_ratings" (
	"rating_id" bigserial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_ratings_order_id_unique" UNIQUE("order_id")
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
	"channel_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_type_capabilities" ADD CONSTRAINT "delivery_type_capabilities_delivery_type_id_delivery_types_delivery_type_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("delivery_type_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_type_capabilities" ADD CONSTRAINT "delivery_type_capabilities_weight_tier_id_weight_tiers_tier_id_fk" FOREIGN KEY ("weight_tier_id") REFERENCES "public"."weight_tiers"("tier_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_type_labels" ADD CONSTRAINT "delivery_type_labels_delivery_type_id_delivery_types_delivery_type_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("delivery_type_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_type_labels" ADD CONSTRAINT "delivery_type_labels_label_id_labels_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("label_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."business_accounts" ADD CONSTRAINT "business_accounts_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."addresses" ADD CONSTRAINT "addresses_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users"."profiles" ADD CONSTRAINT "profiles_role_id_user_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("role_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ADD CONSTRAINT "courier_assignments_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ADD CONSTRAINT "courier_assignments_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."courier_assignments" ADD CONSTRAINT "courier_assignments_assignment_status_id_assignment_statuses_status_id_fk" FOREIGN KEY ("assignment_status_id") REFERENCES "public"."assignment_statuses"("status_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_client_id_profiles_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_delivery_type_id_delivery_types_delivery_type_id_fk" FOREIGN KEY ("delivery_type_id") REFERENCES "public"."delivery_types"("delivery_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_status_id_order_statuses_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."order_statuses"("status_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_vehicle_category_id_vehicle_categories_category_id_fk" FOREIGN KEY ("vehicle_category_id") REFERENCES "public"."vehicle_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_weight_tier_id_weight_tiers_tier_id_fk" FOREIGN KEY ("weight_tier_id") REFERENCES "public"."weight_tiers"("tier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_package_type_id_package_types_package_type_id_fk" FOREIGN KEY ("package_type_id") REFERENCES "public"."package_types"("package_type_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD CONSTRAINT "requests_payment_method_id_payment_methods_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_methods"("method_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_status" ADD CONSTRAINT "courier_status_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_status" ADD CONSTRAINT "courier_status_current_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("current_assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_vehicles" ADD CONSTRAINT "courier_vehicles_courier_id_profiles_user_id_fk" FOREIGN KEY ("courier_id") REFERENCES "users"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."courier_vehicles" ADD CONSTRAINT "courier_vehicles_category_id_vehicle_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vehicle_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics"."driver_sessions" ADD CONSTRAINT "driver_sessions_driver_id_courier_status_courier_id_fk" FOREIGN KEY ("driver_id") REFERENCES "logistics"."courier_status"("courier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD CONSTRAINT "transactions_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_methods"("method_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD CONSTRAINT "transactions_payment_status_id_payment_statuses_status_id_fk" FOREIGN KEY ("payment_status_id") REFERENCES "payments"."payment_statuses"("status_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "notifications"."queue" ADD CONSTRAINT "queue_channel_id_notification_channels_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."notification_channels"("channel_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications"."queue" ADD CONSTRAINT "queue_status_id_notification_statuses_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."notification_statuses"("status_id") ON DELETE no action ON UPDATE no action;