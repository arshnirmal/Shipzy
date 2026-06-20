CREATE TYPE "public"."earnings_status" AS ENUM('pending', 'settled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('prepaid', 'collect_on_delivery');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "payments"."driver_earnings_ledger" (
	"ledger_id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_pct" numeric(5, 2) DEFAULT 0 NOT NULL,
	"commission_amt" numeric(10, 2) DEFAULT 0 NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"status" "earnings_status" DEFAULT 'pending' NOT NULL,
	"payout_id" integer,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "earnings_gross_non_negative_chk" CHECK ("payments"."driver_earnings_ledger"."gross_amount" >= 0),
	CONSTRAINT "earnings_net_non_negative_chk" CHECK ("payments"."driver_earnings_ledger"."net_amount" >= 0),
	CONSTRAINT "earnings_commission_pct_range_chk" CHECK ("payments"."driver_earnings_ledger"."commission_pct" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "payments"."driver_payouts" (
	"payout_id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"total_deliveries" integer NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"total_commission" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"payout_method" varchar(20) DEFAULT 'upi' NOT NULL,
	"payout_upi_id" varchar(100),
	"external_payout_id" varchar(255),
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"payout_date" date NOT NULL,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_net_non_negative_chk" CHECK ("payments"."driver_payouts"."net_amount" >= 0),
	CONSTRAINT "payout_gross_non_negative_chk" CHECK ("payments"."driver_payouts"."gross_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments"."payment_webhook_events" (
	"provider" varchar(50) NOT NULL,
	"event_id" varchar(255) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payments"."transactions" ALTER COLUMN "payment_gateway" SET DEFAULT 'razorpay';--> statement-breakpoint
ALTER TABLE "orders"."requests" ADD COLUMN "payment_mode" "payment_mode" DEFAULT 'prepaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD COLUMN "payment_mode" "payment_mode" DEFAULT 'prepaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD COLUMN "razorpay_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD COLUMN "qr_code_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD COLUMN "qr_image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "payments"."transactions" ADD COLUMN "qr_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments"."driver_earnings_ledger" ADD CONSTRAINT "driver_earnings_ledger_order_id_requests_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"."requests"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments"."driver_earnings_ledger" ADD CONSTRAINT "driver_earnings_ledger_assignment_id_courier_assignments_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "orders"."courier_assignments"("assignment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_earnings_driver_status" ON "payments"."driver_earnings_ledger" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "idx_earnings_driver_earned" ON "payments"."driver_earnings_ledger" USING btree ("driver_id","earned_at");--> statement-breakpoint
CREATE INDEX "idx_payouts_driver_date" ON "payments"."driver_payouts" USING btree ("driver_id","payout_date");--> statement-breakpoint
CREATE INDEX "idx_payouts_status" ON "payments"."driver_payouts" USING btree ("status");