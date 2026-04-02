// services/backend/src/database/schema/public.ts
// Master data and reference tables in public schema

import {
  pgTable,
  pgEnum,
  serial,
  index,
  uniqueIndex,
  check,
  varchar,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
export const weightTiers = pgTable(
  "weight_tiers",
  {
    tierId: serial("tier_id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    minWeightKg: numeric("min_weight_kg", { precision: 10, scale: 2, mode: "number" }).notNull(),
    maxWeightKg: numeric("max_weight_kg", { precision: 10, scale: 2, mode: "number" }).notNull(),
    additionalCharge: numeric("additional_charge", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "weight_tiers_min_weight_non_negative_chk",
      sql`${table.minWeightKg} >= 0`,
    ),
    check(
      "weight_tiers_max_gt_min_chk",
      sql`${table.maxWeightKg} > ${table.minWeightKg}`,
    ),
    check(
      "weight_tiers_additional_charge_non_negative_chk",
      sql`${table.additionalCharge} >= 0`,
    ),
    uniqueIndex("uq_weight_tiers_name_range").on(
      table.name,
      table.minWeightKg,
      table.maxWeightKg,
    ),
  ],
);

// Delivery Types
export const deliveryTypes = pgTable(
  "delivery_types",
  {
    deliveryTypeId: serial("delivery_type_id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    description: text("description"),
    baseRate: numeric("base_rate", { precision: 10, scale: 2, mode: "number" }).notNull(),
    perKmRate: numeric("per_km_rate", { precision: 10, scale: 2, mode: "number" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("delivery_types_base_rate_non_negative_chk", sql`${table.baseRate} >= 0`),
    check("delivery_types_per_km_rate_non_negative_chk", sql`${table.perKmRate} >= 0`),
  ],
);

// Package Types
export const packageTypes = pgTable(
  "package_types",
  {
    packageTypeId: serial("package_type_id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    specialHandlingFee: numeric("special_handling_fee", {
      precision: 10,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),
    requiresSpecialHandling: boolean("requires_special_handling")
      .default(false)
      .notNull(),
    handlingDescription: text("handling_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "package_types_special_handling_fee_non_negative_chk",
      sql`${table.specialHandlingFee} >= 0`,
    ),
  ],
);

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
      mode: "number",
    }),
    perKmRateOverride: numeric("per_km_rate_override", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_delivery_type_vehicle_weight").on(
      table.deliveryTypeId,
      table.vehicleCategoryId,
      table.weightTierId,
    ),
  ],
);

// Pricing Config
export const pricingConfig = pgTable(
  "pricing_config",
  {
    configId: serial("config_id").primaryKey(),
    configKey: varchar("config_key", { length: 50 }).notNull().unique(),
    configValue: numeric("config_value", { precision: 10, scale: 4, mode: "number" }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    updatedBy: integer("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("pricing_config_value_non_negative_chk", sql`${table.configValue} >= 0`),
    index("idx_pricing_config_active_key").on(table.configKey).where(
      sql`${table.isActive} = true`,
    ),
  ],
);

// Vehicle Categories
export const vehicleCategories = pgTable(
  "vehicle_categories",
  {
    categoryId: serial("category_id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    description: text("description"),
    maxWeightKg: numeric("max_weight_kg", { precision: 10, scale: 2, mode: "number" }).notNull(),
    iconUrl: varchar("icon_url", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "vehicle_categories_max_weight_non_negative_chk",
      sql`${table.maxWeightKg} >= 0`,
    ),
  ],
);
