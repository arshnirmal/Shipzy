// services/backend/src/database/schema/orders.ts
// Orders schema with JSONB consolidation (locations, items)

import {
  pgTable,
  pgSchema,
  serial,
  index,
  check,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
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
} from "./public.js";
import { paymentMethods } from "./payments.js";
import type {
  OrderLocationJSONB,
  OrderItemJSONB,
  OrderMetadataJSONB,
} from "./types.js";

const ordersSchema = pgSchema("orders");

// Orders Requests (with JSONB optimization)
export const orderRequests = ordersSchema.table(
  "requests",
  {
    orderId: serial("order_id").primaryKey(),
    orderUuid: uuid("order_uuid").defaultRandom().notNull().unique(),
    orderNumber: varchar("order_number", { length: 50 }).unique(),
    clientId: integer("client_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    deliveryTypeId: integer("delivery_type_id")
      .notNull()
      .references(() => deliveryTypes.deliveryTypeId),
    status: orderStatusEnum("status").notNull(),
    vehicleCategoryId: integer("vehicle_category_id")
      .notNull()
      .references(() => vehicleCategories.categoryId),
    weightTierId: integer("weight_tier_id").references(
      () => weightTiers.tierId,
    ),

  // OPTIMIZED: JSONB columns (replaces separate tables)
    pickupLocation: jsonb("pickup_location")
      .$type<OrderLocationJSONB>()
      .notNull(),
    deliveryLocation: jsonb("delivery_location")
      .$type<OrderLocationJSONB>()
      .notNull(),
    items: jsonb("items").$type<OrderItemJSONB[]>().default([]).notNull(),
    metadata: jsonb("metadata")
      .$type<OrderMetadataJSONB>()
      .default({})
      .notNull(),

  // Note: pickup_point and delivery_point are computed PostGIS columns
  // defined in SQL schema. They are available for queries but not in Drizzle schema.
  // Use sql`pickup_point` or sql`delivery_point` in queries.

    scheduledPickupTime: timestamp("scheduled_pickup_time", {
      withTimezone: true,
    }),
    actualPickupTime: timestamp("actual_pickup_time", { withTimezone: true }),
    scheduledDeliveryTime: timestamp("scheduled_delivery_time", {
      withTimezone: true,
    }),
    actualDeliveryTime: timestamp("actual_delivery_time", {
      withTimezone: true,
    }),
    packageTypeId: integer("package_type_id").references(
      () => packageTypes.packageTypeId,
    ),
    specialInstructions: text("special_instructions"),
    packageDescription: text("package_description"),
    declaredValue: numeric("declared_value", { precision: 10, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    notifyRecipientSms: boolean("notify_recipient_sms").default(false).notNull(),
    couponCode: varchar("coupon_code", { length: 50 }),
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
    basePrice: numeric("base_price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    distancePrice: numeric("distance_price", { precision: 10, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    weightSurcharge: numeric("weight_surcharge", { precision: 10, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    platformFee: numeric("platform_fee", { precision: 10, scale: 2, mode: "number" }).notNull(),
    specialHandlingFee: numeric("special_handling_fee", {
      precision: 10,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),
    subtotalBeforeTax: numeric("subtotal_before_tax", {
      precision: 10,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),
    gstAmount: numeric("gst_amount", { precision: 10, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.methodId),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check("orders_requests_declared_value_non_negative_chk", sql`${table.declaredValue} >= 0`),
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
    check("orders_requests_base_price_non_negative_chk", sql`${table.basePrice} >= 0`),
    check(
      "orders_requests_distance_price_non_negative_chk",
      sql`${table.distancePrice} >= 0`,
    ),
    check(
      "orders_requests_weight_surcharge_non_negative_chk",
      sql`${table.weightSurcharge} >= 0`,
    ),
    check("orders_requests_platform_fee_non_negative_chk", sql`${table.platformFee} >= 0`),
    check(
      "orders_requests_special_handling_fee_non_negative_chk",
      sql`${table.specialHandlingFee} >= 0`,
    ),
    check(
      "orders_requests_subtotal_before_tax_non_negative_chk",
      sql`${table.subtotalBeforeTax} >= 0`,
    ),
    check("orders_requests_gst_amount_non_negative_chk", sql`${table.gstAmount} >= 0`),
    check("orders_requests_total_price_non_negative_chk", sql`${table.totalPrice} >= 0`),
    index("idx_orders_requests_client_created_active")
      .on(table.clientId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_orders_requests_status_created_active")
      .on(table.status, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
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
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
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

// Proof of Delivery
export const proofOfDelivery = ordersSchema.table("proof_of_delivery", {
  proofId: serial("proof_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .unique()
    .references(() => orderRequests.orderId, { onDelete: "cascade" }),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => courierAssignments.assignmentId),
  recipientName: varchar("recipient_name", { length: 100 }),
  recipientSignatureUrl: varchar("recipient_signature_url", { length: 255 }),
  photoUrl: varchar("photo_url", { length: 255 }),
  deliveryNotes: text("delivery_notes"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
