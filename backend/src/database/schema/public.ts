// services/backend/src/database/schema/public.ts
// Master data and reference tables in public schema

import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// Tables in PostgreSQL default "public" schema — use pgTable() directly (no pgSchema("public")).

// Native enums (Phase 2)
export const userRoleEnum = pgEnum("user_role", [
  "client",
  "courier",
  "admin",
  "business",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "undeliverable",
  "returned",
]);
export const assignmentStatusEnum = pgEnum("assignment_status", [
  "assigned",
  "accepted",
  "rejected",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "push",
  "sms",
  "email",
  "in_app",
]);
export const authMethodEnum = pgEnum("auth_method", [
  "email",
  "phone",
  "google",
  "firebase",
  "refresh",
]);
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "normal",
  "high",
  "critical",
]);
export const trackingEventTypeEnum = pgEnum("tracking_event_type", [
  "location_update",
  "pickup",
  "delivery",
  "status_change",
  "checkpoint",
  "route_deviation",
]);
export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
]);

// Weight Tiers
export const weightTiers = pgTable("weight_tiers", {
  tierId: serial("tier_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minWeightKg: numeric("min_weight_kg", { precision: 10, scale: 2 }).notNull(),
  maxWeightKg: numeric("max_weight_kg", { precision: 10, scale: 2 }).notNull(),
  additionalCharge: numeric("additional_charge", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Delivery Types
export const deliveryTypes = pgTable("delivery_types", {
  deliveryTypeId: serial("delivery_type_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  baseRate: numeric("base_rate", { precision: 10, scale: 2 }).notNull(),
  perKmRate: numeric("per_km_rate", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Package Types
export const packageTypes = pgTable("package_types", {
  packageTypeId: serial("package_type_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  specialHandlingFee: numeric("special_handling_fee", {
    precision: 10,
    scale: 2,
  })
    .default("0.00")
    .notNull(),
  requiresSpecialHandling: boolean("requires_special_handling")
    .default(false)
    .notNull(),
  handlingDescription: text("handling_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Delivery Type Capabilities
export const deliveryTypeCapabilities = pgTable(
  "delivery_type_capabilities",
  {
    capabilityId: serial("capability_id").primaryKey(),
    deliveryTypeId: integer("delivery_type_id")
      .notNull()
      .references(() => deliveryTypes.deliveryTypeId, { onDelete: "cascade" }),
    vehicleCategoryId: integer("vehicle_category_id")
      .notNull()
      .references(() => vehicleCategories.categoryId, { onDelete: "cascade" }),
    weightTierId: integer("weight_tier_id")
      .notNull()
      .references(() => weightTiers.tierId, { onDelete: "cascade" }),
    baseRateOverride: numeric("base_rate_override", {
      precision: 10,
      scale: 2,
    }),
    perKmRateOverride: numeric("per_km_rate_override", {
      precision: 10,
      scale: 2,
    }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

// Labels
export const labels = pgTable("labels", {
  labelId: serial("label_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayText: varchar("display_text", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }),
  backgroundColor: varchar("background_color", { length: 7 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Delivery Type Labels
export const deliveryTypeLabels = pgTable(
  "delivery_type_labels",
  {
    deliveryTypeId: integer("delivery_type_id")
      .notNull()
      .references(() => deliveryTypes.deliveryTypeId, { onDelete: "cascade" }),
    labelId: integer("label_id")
      .notNull()
      .references(() => labels.labelId, { onDelete: "cascade" }),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

// Pricing Config
export const pricingConfig = pgTable("pricing_config", {
  configId: serial("config_id").primaryKey(),
  configKey: varchar("config_key", { length: 50 }).notNull().unique(),
  configValue: numeric("config_value", { precision: 10, scale: 4 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Vehicle Categories
export const vehicleCategories = pgTable("vehicle_categories", {
  categoryId: serial("category_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  maxWeightKg: numeric("max_weight_kg", { precision: 10, scale: 2 }).notNull(),
  iconUrl: varchar("icon_url", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
