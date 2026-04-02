// services/backend/src/database/schema/payments.ts
// Payments schema: payment_methods, payment_statuses, transactions, refunds

import {
  pgTable,
  pgSchema,
  serial,
  check,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orderRequests } from "./orders.js";
import { paymentStatusEnum, refundStatusEnum } from "./public.js";

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
    amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    externalTransactionId: varchar("external_transaction_id", { length: 255 }),
    paymentGateway: varchar("payment_gateway", { length: 50 }),
    upiVpa: varchar("upi_vpa", { length: 100 }),
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
  ],
);
