// services/backend/src/database/schema/tracking.ts
// Tracking events (OPTIMIZED - removed redundant latitude/longitude columns)

import {
  pgTable,
  pgSchema,
  bigserial,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { courierAssignments, orderRequests } from "./orders.js";
import { userProfiles } from "./users.js";
import { geographyPoint4326 as geography } from "./postgisGeography.js";
import { trackingEventTypeEnum } from "./public.js";

const trackingSchema = pgSchema("tracking");

// Tracking Events (optimized - no redundant lat/lng)
export const trackingEvents = trackingSchema.table("events", {
  eventId: bigserial("event_id", { mode: "number" }).primaryKey(),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => courierAssignments.assignmentId, {
      onDelete: "cascade",
    }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orderRequests.orderId, { onDelete: "cascade" }),
  courierId: integer("courier_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  eventType: trackingEventTypeEnum("event_type").notNull(),
  location: geography("location"),
  // OPTIMIZED: Removed redundant latitude and longitude columns
  // Extract coordinates with: ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude
  accuracyMeters: numeric("accuracy_meters", { precision: 6, scale: 2 }),
  speedKmph: numeric("speed_kmph", { precision: 5, scale: 2 }),
  bearingDegrees: numeric("bearing_degrees", { precision: 5, scale: 2 }),
  eventDescription: text("event_description"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
