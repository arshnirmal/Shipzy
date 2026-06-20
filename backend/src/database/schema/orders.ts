// services/backend/src/database/schema/orders.ts
// Orders schema with JSONB consolidation

import {
  pgTable,
  pgSchema,
  serial,
  bigserial,
  index,
  check,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userProfiles } from "./users.js";
import {
  deliveryTypes,
  vehicleCategories,
  weightTiers,
  packageTypes,
  orderStatusEnum,
  assignmentStatusEnum,
  paymentModeEnum,
} from "./public.js";
import { paymentMethods } from "./payments.js";
import type {
  OrderLocationJSONB,
  OrderItemJSONB,
  OrderPricingJSONB,
  OrderScheduleJSONB,
  OrderActualJSONB,
  OrderPackageJSONB,
  OrderSnapshotJSONB,
  AssignmentTimelineJSONB,
  DeliveryAttemptJSONB,
  PodJSONB,
  RatingJSONB,
} from "./types.js";

const ordersSchema = pgSchema("orders");

// Orders Requests
export const orderRequests = ordersSchema.table(
  "requests",
  {
    orderId: serial("order_id").primaryKey(),
    orderUuid: uuid("order_uuid").defaultRandom().notNull().unique(),
    orderNumber: varchar("order_number", { length: 50 }).unique(),

    // ── Identity FKs (kept for integrity + filtering) ──────────────────────────
    clientId: integer("client_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    deliveryTypeId: integer("delivery_type_id")
      .notNull()
      .references(() => deliveryTypes.deliveryTypeId),
    vehicleCategoryId: integer("vehicle_category_id")
      .notNull()
      .references(() => vehicleCategories.categoryId),
    weightTierId: integer("weight_tier_id").references(
      () => weightTiers.tierId,
    ),
    packageTypeId: integer("package_type_id").references(
      () => packageTypes.packageTypeId,
    ),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.methodId),
    paymentMode: paymentModeEnum("payment_mode").notNull().default("prepaid"),

    status: orderStatusEnum("status").notNull(),

    // ── Location JSONB ──────────────────────────────────────────────────────────
    // Note: pickup_point and delivery_point are computed PostGIS columns
    // defined in SQL schema. Use sql`pickup_point` / sql`delivery_point` in queries.
    pickupLocation: jsonb("pickup_location")
      .$type<OrderLocationJSONB>()
      .notNull(),
    deliveryLocation: jsonb("delivery_location")
      .$type<OrderLocationJSONB>()
      .notNull(),

    // ── Items JSONB ─────────────────────────────────────────────────────────────
    items: jsonb("items").$type<OrderItemJSONB[]>().default([]).notNull(),

    // ── Snapshot JSONB — master data as-of order creation ──────────────────────
    // Eliminates repeated JOINs to delivery_types, vehicle_categories,
    // weight_tiers, package_types, payment_methods on every order read.
    snapshot: jsonb("snapshot").$type<OrderSnapshotJSONB>().notNull(),

    // ── Pricing JSONB — full fare breakdown (written once, never filtered) ──────
    // total_price kept as column for SUM/AVG in earnings queries
    pricing: jsonb("pricing").$type<OrderPricingJSONB>().notNull(),
    totalPrice: numeric("total_price", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),

    // ── Scheduling JSONB — requested pickup/delivery windows ───────────────────
    schedule: jsonb("schedule")
      .$type<OrderScheduleJSONB>()
      .default({})
      .notNull(),

    // ── Actual JSONB — GPS-confirmed arrival/departure times ───────────────────
    actual: jsonb("actual").$type<OrderActualJSONB>().default({}).notNull(),

    // ── Package JSONB — package metadata (never individually filtered) ─────────
    package: jsonb("package")
      .$type<OrderPackageJSONB>()
      .default({ notifyRecipientSms: false })
      .notNull(),

    // ── Distance & duration ─────────────────────────────────────────────────────
    estimatedDistanceKm: numeric("estimated_distance_km", {
      precision: 6,
      scale: 2,
      mode: "number",
    }),
    actualDistanceKm: numeric("actual_distance_km", {
      precision: 6,
      scale: 2,
      mode: "number",
    }),
    actualDurationMins: integer("actual_duration_mins"),

    // ── Coupon ──────────────────────────────────────────────────────────────────
    couponCode: varchar("coupon_code", { length: 50 }),

    // ── Status timeline timestamps ─────────────────────────────────────────────
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    inTransitAt: timestamp("in_transit_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),

    // ── Delivery attempt (RTO flow) ─────────────────────────────────────────
    deliveryAttempt: jsonb("delivery_attempt").$type<DeliveryAttemptJSONB>(),

    pod: jsonb("pod").$type<PodJSONB>(),
    rating: jsonb("rating").$type<RatingJSONB>(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "orders_requests_estimated_distance_non_negative_chk",
      sql`${table.estimatedDistanceKm} IS NULL OR ${table.estimatedDistanceKm} >= 0`,
    ),
    check(
      "orders_requests_actual_distance_non_negative_chk",
      sql`${table.actualDistanceKm} IS NULL OR ${table.actualDistanceKm} >= 0`,
    ),
    check(
      "orders_requests_actual_duration_non_negative_chk",
      sql`${table.actualDurationMins} IS NULL OR ${table.actualDurationMins} >= 0`,
    ),
    check(
      "orders_requests_total_price_non_negative_chk",
      sql`${table.totalPrice} >= 0`,
    ),
    index("idx_orders_requests_client_created_active")
      .on(table.clientId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_orders_requests_status_created_active")
      .on(table.status, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_orders_scheduled_pickup")
      .on(table.status, sql`(schedule->>'pickupAt')`)
      .where(sql`status = 'scheduled' AND deleted_at IS NULL`),
  ],
);

// Courier Assignments
export const courierAssignments = ordersSchema.table(
  "courier_assignments",
  {
    assignmentId: serial("assignment_id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId, { onDelete: "cascade" }),
    courierId: integer("courier_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    status: assignmentStatusEnum("status").notNull(),

    // ── Timestamps kept as columns ──────────────────────────────────────────────
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // ── Timeline JSONB — display-only timestamps (acceptedAt, rejectedAt) ───────
    timeline: jsonb("timeline")
      .$type<AssignmentTimelineJSONB>()
      .default({})
      .notNull(),

    // ── Driver net payout (written atomically in deliver_order/return_order) ─
    netEarnings: numeric("net_earnings", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),

    rejectionReason: text("rejection_reason"),
    courierNotes: text("courier_notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_assignments_order").on(table.orderId),
    index("idx_assignments_courier_active")
      .on(table.courierId)
      .where(sql`${table.status} NOT IN ('rejected', 'cancelled')`),
  ],
);

// Order Status History — full audit trail for every status transition
export const orderStatusHistory = ordersSchema.table(
  "status_history",
  {
    historyId: bigserial("history_id", { mode: "number" }).primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    previousStatus: orderStatusEnum("previous_status"),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    changedBy: integer("changed_by").references(() => userProfiles.userId),
    notes: text("notes"),
  },
  (table) => [
    index("idx_status_history_order").on(table.orderId, table.changedAt),
  ],
);

// Templates
export const orderTemplates = ordersSchema.table(
  "templates",
  {
    templateId: serial("template_id").primaryKey(),
    templateUuid: uuid("template_uuid").defaultRandom().notNull().unique(),
    clientId: integer("client_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    fulfillment: jsonb("fulfillment"),
    pickupLocation: jsonb("pickup_location").$type<OrderLocationJSONB>(),
    deliveryLocation: jsonb("delivery_location").$type<OrderLocationJSONB>(),
    items: jsonb("items").$type<OrderItemJSONB[]>().default([]).notNull(),
    package: jsonb("package").$type<OrderPackageJSONB>(),
    useCount: integer("use_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_templates_client_active")
      .on(table.clientId)
      .where(sql`${table.deletedAt} IS NULL AND ${table.isActive} = true`),
  ],
);

// Drafts
export const orderDrafts = ordersSchema.table(
  "drafts",
  {
    draftId: serial("draft_id").primaryKey(),
    draftUuid: uuid("draft_uuid").defaultRandom().notNull().unique(),
    clientId: integer("client_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }),
    fulfillment: jsonb("fulfillment"),
    pickupLocation: jsonb("pickup_location").$type<OrderLocationJSONB>(),
    deliveryLocation: jsonb("delivery_location").$type<OrderLocationJSONB>(),
    items: jsonb("items").$type<OrderItemJSONB[]>().default([]).notNull(),
    package: jsonb("package").$type<OrderPackageJSONB>(),
    pricing: jsonb("pricing").$type<OrderPricingJSONB>(),
    schedule: jsonb("schedule")
      .$type<OrderScheduleJSONB>()
      .default({})
      .notNull(),
    couponCode: varchar("coupon_code", { length: 50 }),
    notes: text("notes"),
    templateId: integer("template_id").references(
      () => orderTemplates.templateId,
      { onDelete: "set null" },
    ),
    submittedOrderId: integer("submitted_order_id").references(
      () => orderRequests.orderId,
      { onDelete: "set null" },
    ),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_drafts_client_created")
      .on(table.clientId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_drafts_client_submitted")
      .on(table.clientId, table.submittedAt)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
