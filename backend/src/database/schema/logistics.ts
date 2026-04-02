// services/backend/src/database/schema/logistics.ts
// Logistics schema: courier_status, courier_vehicles, driver_sessions

import {
  pgSchema,
  serial,
  index,
  check,
  uniqueIndex,
  varchar,
  boolean,
  integer,
  numeric,
  date,
  bigserial,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userProfiles } from "./users.js";
import { vehicleCategories } from "./public.js";
import { courierAssignments } from "./orders.js";
import { geographyPoint4326 as geography } from "./postgisGeography.js";

const logisticsSchema = pgSchema("logistics");

// Courier Vehicles
export const courierVehicles = logisticsSchema.table(
  "courier_vehicles",
  {
    vehicleId: serial("vehicle_id").primaryKey(),
    courierId: integer("courier_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => vehicleCategories.categoryId),
    vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull(),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    insuranceExpiry: date("insurance_expiry"),
    registrationDocumentUrl: varchar("registration_document_url", {
      length: 255,
    }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_courier_vehicles_primary_per_courier")
      .on(table.courierId)
      .where(sql`${table.isPrimary} = true AND ${table.isActive} = true`),
  ],
);

// Courier Status
export const courierStatus = logisticsSchema.table(
  "courier_status",
  {
    statusId: serial("status_id").primaryKey(),
    courierId: integer("courier_id")
      .notNull()
      .unique()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    isAvailable: boolean("is_available").default(false).notNull(),
    isOnline: boolean("is_online").default(false).notNull(),
    currentLocation: geography("current_location"),
    lastLocationUpdate: timestamp("last_location_update", { withTimezone: true }),
    currentAssignmentId: integer("current_assignment_id").references(
      () => courierAssignments.assignmentId,
      { onDelete: "set null" },
    ),
    totalDeliveriesToday: integer("total_deliveries_today").default(0).notNull(),
    avgRating: numeric("avg_rating", { precision: 3, scale: 2, mode: "number" }),
    totalRatings: integer("total_ratings").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "courier_status_total_deliveries_non_negative_chk",
      sql`${table.totalDeliveriesToday} >= 0`,
    ),
    check(
      "courier_status_avg_rating_range_chk",
      sql`${table.avgRating} IS NULL OR (${table.avgRating} >= 1.00 AND ${table.avgRating} <= 5.00)`,
    ),
    check(
      "courier_status_total_ratings_non_negative_chk",
      sql`${table.totalRatings} >= 0`,
    ),
    index("idx_courier_status_assignment").on(table.currentAssignmentId),
  ],
);

// Driver Sessions
export const driverSessions = logisticsSchema.table("driver_sessions", {
  sessionId: bigserial("session_id", { mode: "number" }).primaryKey(),
  driverId: integer("driver_id")
    .notNull()
    .references(() => userProfiles.userId),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  totalOnlineMinutes: integer("total_online_minutes"),
  lastLocation: geography("last_location"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
