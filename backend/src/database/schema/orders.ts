// services/backend/src/database/schema/orders.ts
// Orders schema with JSONB consolidation (locations, items, labels)

import {
  pgTable,
  pgSchema,
  serial,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./users.js";
import {
  deliveryTypes,
  orderStatuses,
  vehicleCategories,
  weightTiers,
  packageTypes,
  assignmentStatuses,
} from "./public.js";
import { paymentMethods } from "./payments.js";
import type {
  OrderLocationJSONB,
  OrderItemJSONB,
  OrderLabelsJSONB,
  OrderMetadataJSONB,
} from "./types.js";

const ordersSchema = pgSchema("orders");

// Orders Requests (with JSONB optimization)
export const orderRequests = ordersSchema.table("requests", {
  orderId: serial("order_id").primaryKey(),
  orderUuid: uuid("order_uuid").defaultRandom().notNull().unique(),
  orderNumber: varchar("order_number", { length: 50 }).unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  deliveryTypeId: integer("delivery_type_id")
    .notNull()
    .references(() => deliveryTypes.deliveryTypeId),
  statusId: integer("status_id")
    .notNull()
    .references(() => orderStatuses.statusId),
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
  labels: jsonb("labels").$type<OrderLabelsJSONB>().default([]).notNull(),
  metadata: jsonb("metadata").$type<OrderMetadataJSONB>().default({}).notNull(),

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
  declaredValue: numeric("declared_value", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  notifyRecipientSms: boolean("notify_recipient_sms").default(false).notNull(),
  couponCode: varchar("coupon_code", { length: 50 }),
  estimatedDistanceKm: numeric("estimated_distance_km", {
    precision: 6,
    scale: 2,
  }),
  actualDistanceKm: numeric("actual_distance_km", {
    precision: 6,
    scale: 2,
  }),
  actualDurationMins: integer("actual_duration_mins"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  distancePrice: numeric("distance_price", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  weightSurcharge: numeric("weight_surcharge", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).notNull(),
  specialHandlingFee: numeric("special_handling_fee", {
    precision: 10,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  subtotalBeforeTax: numeric("subtotal_before_tax", {
    precision: 10,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  gstAmount: numeric("gst_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
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
});

// Courier Assignments
export const courierAssignments = ordersSchema.table("courier_assignments", {
  assignmentId: serial("assignment_id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orderRequests.orderId, { onDelete: "cascade" }),
  courierId: integer("courier_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  assignmentStatusId: integer("assignment_status_id")
    .notNull()
    .references(() => assignmentStatuses.statusId),
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
});

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
