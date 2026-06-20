// services/backend/src/database/schema/payments.ts
// Payments schema: payment_methods, payment_statuses, transactions, refunds,
//                  driver_earnings_ledger, driver_payouts

import {
  pgTable,
  pgSchema,
  serial,
  check,
  index,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orderRequests, courierAssignments } from "./orders.js";
import {
  paymentStatusEnum,
  refundStatusEnum,
  paymentModeEnum,
  payoutStatusEnum,
  earningsStatusEnum,
} from "./public.js";

const paymentsSchema = pgSchema("payments");

// Payment Methods
export const paymentMethods = paymentsSchema.table("payment_methods", {
  methodId: serial("method_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Payment Transactions
export const paymentTransactions = paymentsSchema.table(
  "transactions",
  {
    transactionId: serial("transaction_id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId, { onDelete: "cascade" }),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.methodId),
    status: paymentStatusEnum("status").notNull(),
    paymentMode: paymentModeEnum("payment_mode").notNull().default("prepaid"),
    amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
    externalTransactionId: varchar("external_transaction_id", { length: 255 }),
    paymentGateway: varchar("payment_gateway", { length: 50 }).default("razorpay"),
    upiVpa: varchar("upi_vpa", { length: 100 }),
    qrCodeId: varchar("qr_code_id", { length: 255 }),
    qrImageUrl: varchar("qr_image_url", { length: 500 }),
    qrExpiresAt: timestamp("qr_expires_at", { withTimezone: true }),
    paymentInitiatedAt: timestamp("payment_initiated_at", { withTimezone: true }),
    paymentCompletedAt: timestamp("payment_completed_at", {
      withTimezone: true,
    }),
    paymentFailedAt: timestamp("payment_failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("payments_transactions_amount_non_negative_chk", sql`${table.amount} >= 0`),
    check(
      "chk_payment_status_timestamp",
      sql`(${table.status} <> 'completed' OR ${table.paymentCompletedAt} IS NOT NULL) AND (${table.status} <> 'failed' OR ${table.paymentFailedAt} IS NOT NULL)`,
    ),
  ],
);

// Refunds
export const refunds = paymentsSchema.table(
  "refunds",
  {
    refundId: serial("refund_id").primaryKey(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => paymentTransactions.transactionId, {
        onDelete: "cascade",
      }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId, { onDelete: "cascade" }),
    refundAmount: numeric("refund_amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    refundReason: text("refund_reason").notNull(),
    refundStatus: refundStatusEnum("refund_status").notNull(),
    externalRefundId: varchar("external_refund_id", { length: 255 }),
    initiatedAt: timestamp("initiated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("payments_refunds_amount_non_negative_chk", sql`${table.refundAmount} >= 0`),
    check(
      "chk_refund_status_timestamp",
      sql`${table.refundStatus} NOT IN ('completed', 'failed') OR ${table.processedAt} IS NOT NULL`,
    ),
  ],
);

// Driver Earnings Ledger — tracks per-delivery earnings before settlement
export const driverEarningsLedger = paymentsSchema.table(
  "driver_earnings_ledger",
  {
    ledgerId: serial("ledger_id").primaryKey(),
    driverId: integer("driver_id").notNull(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId, { onDelete: "cascade" }),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => courierAssignments.assignmentId, { onDelete: "cascade" }),
    grossAmount: numeric("gross_amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    commissionPct: numeric("commission_pct", { precision: 5, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    commissionAmt: numeric("commission_amt", { precision: 10, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    netAmount: numeric("net_amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    status: earningsStatusEnum("status").notNull().default("pending"),
    payoutId: integer("payout_id"),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("earnings_gross_non_negative_chk", sql`${table.grossAmount} >= 0`),
    check("earnings_net_non_negative_chk", sql`${table.netAmount} >= 0`),
    check("earnings_commission_pct_range_chk", sql`${table.commissionPct} BETWEEN 0 AND 100`),
    index("idx_earnings_driver_status").on(table.driverId, table.status),
    index("idx_earnings_driver_earned").on(table.driverId, table.earnedAt),
  ],
);

// Driver Payouts — tracks daily batch settlements to drivers
export const driverPayouts = paymentsSchema.table(
  "driver_payouts",
  {
    payoutId: serial("payout_id").primaryKey(),
    driverId: integer("driver_id").notNull(),
    totalDeliveries: integer("total_deliveries").notNull(),
    grossAmount: numeric("gross_amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    totalCommission: numeric("total_commission", { precision: 10, scale: 2, mode: "number" }).notNull(),
    netAmount: numeric("net_amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    payoutMethod: varchar("payout_method", { length: 20 }).notNull().default("upi"),
    payoutUpiId: varchar("payout_upi_id", { length: 100 }),
    externalPayoutId: varchar("external_payout_id", { length: 255 }),
    status: payoutStatusEnum("status").notNull().default("pending"),
    failureReason: text("failure_reason"),
    payoutDate: date("payout_date").notNull(),
    initiatedAt: timestamp("initiated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("payout_net_non_negative_chk", sql`${table.netAmount} >= 0`),
    check("payout_gross_non_negative_chk", sql`${table.grossAmount} >= 0`),
    index("idx_payouts_driver_date").on(table.driverId, table.payoutDate),
    index("idx_payouts_status").on(table.status),
  ],
);

// Webhook event deduplication log — prevents double-processing of provider events
export const paymentWebhookEvents = paymentsSchema.table(
  "payment_webhook_events",
  {
    provider: varchar("provider", { length: 50 }).notNull(),
    eventId: varchar("event_id", { length: 255 }).primaryKey(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("received"),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
);
