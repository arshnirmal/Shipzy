// services/backend/src/database/schema/ratings.ts
// Ratings schema

import {
  pgSchema,
  bigserial,
  index,
  check,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orderRequests } from "./orders.js";
import { courierStatus } from "./logistics.js";
import { userProfiles } from "./users.js";

const logisticsSchema = pgSchema("logistics");

// Driver Ratings
export const driverRatings = logisticsSchema.table(
  "driver_ratings",
  {
    ratingId: bigserial("rating_id", { mode: "number" }).primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orderRequests.orderId)
      .unique(),
    driverId: integer("driver_id")
      .notNull()
      .references(() => courierStatus.courierId),
    customerId: integer("customer_id")
      .notNull()
      .references(() => userProfiles.userId),
    rating: smallint("rating").notNull(), // 1-5
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("driver_ratings_rating_range_chk", sql`${table.rating} BETWEEN 1 AND 5`),
    index("idx_ratings_driver").on(table.driverId, table.createdAt),
  ],
);
