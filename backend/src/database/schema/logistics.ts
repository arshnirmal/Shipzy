// services/backend/src/database/schema/logistics.ts
// Logistics schema: locations (for couriers), courier_status, courier_vehicles, driver_sessions

import {
  pgSchema,
  serial,
  varchar,
  text,
  boolean,
  integer,
  date,
  numeric,
  bigserial,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./users.js";
import { vehicleCategories } from "./public.js";
import { courierAssignments } from "./orders.js";

const logisticsSchema = pgSchema("logistics");

// Custom type for PostGIS geography
const geography = customType<{ data: { lat: number; lng: number } }>({
  dataType: () => "geography(POINT, 4326)",
});

// Locations (for courier current locations - kept separate for spatial indexing)
export const locations = logisticsSchema.table("locations", {
  locationId: serial("location_id").primaryKey(),
  buildingName: varchar("building_name", { length: 100 }),
  floorNumber: varchar("floor_number", { length: 10 }),
  flatNumber: varchar("flat_number", { length: 10 }),
  address: text("address").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 11, scale: 8 }).notNull(),
  location: geography("location").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }).default("India").notNull(),
  landmark: varchar("landmark", { length: 255 }),
  howToReach: text("how_to_reach"),
  contactName: varchar("contact_name", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Courier Vehicles
export const courierVehicles = logisticsSchema.table("courier_vehicles", {
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
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Courier Status
export const courierStatus = logisticsSchema.table("courier_status", {
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Driver Sessions
export const driverSessions = logisticsSchema.table("driver_sessions", {
  sessionId: bigserial("session_id", { mode: "number" }).primaryKey(),
  driverId: integer("driver_id")
    .notNull()
    .references(() => courierStatus.courierId),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  totalOnlineMinutes: integer("total_online_minutes"),
  lastLocationLat: numeric("last_location_lat", { precision: 10, scale: 8 }),
  lastLocationLng: numeric("last_location_lng", {
    precision: 11,
    scale: 8,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
