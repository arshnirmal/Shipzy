// services/backend/src/database/schema/logistics.ts
// Logistics schema: courier_status, driver_sessions

import {
  pgSchema,
  serial,
  index,
  check,
  varchar,
  boolean,
  integer,
  numeric,
  bigserial,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userProfiles } from "./users.js";
import { vehicleCategories } from "./public.js";
import { courierAssignments } from "./orders.js";
import { geographyPoint4326 as geography } from "./postgisGeography.js";
import type { LocationMetaJSONB, VehicleJSONB, KycJSONB } from "./types.js";

const logisticsSchema = pgSchema("logistics");

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
    locationMeta: jsonb("location_meta").$type<LocationMetaJSONB>(),
    lastLocationUpdate: timestamp("last_location_update", { withTimezone: true }),
    currentAssignmentId: integer("current_assignment_id").references(
      () => courierAssignments.assignmentId,
      { onDelete: "set null" },
    ),
    totalDeliveriesToday: integer("total_deliveries_today").default(0).notNull(),
    avgRating: numeric("avg_rating", { precision: 3, scale: 2, mode: "number" }),
    totalRatings: integer("total_ratings").default(0).notNull(),
    vehicle: jsonb("vehicle").$type<VehicleJSONB>(),
    kyc: jsonb("kyc").$type<KycJSONB>(),
    vehicleCategoryId: integer("vehicle_category_id").references(
      () => vehicleCategories.categoryId,
    ),
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
    index("idx_courier_status_vehicle_category").on(table.vehicleCategoryId),
    // GIST index on current_location is created by src/database/functions/spatial.sql
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
