// services/backend/src/modules/ratings/ratings.repository.ts
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import logger from "../../config/logger.js";
import drizzleDb, { drizzlePool } from "../../database/drizzle.js";
import ratingsQueries from "../../database/queries/ratings.queries.js";
import { driverRatings } from "../../database/schema/ratings.js";
import { orderRequests } from "../../database/schema/orders.js";
import { courierStatus } from "../../database/schema/logistics.js";
import { AppError } from "../../utils/error.util.js";
import { parseDbRow, parseDbRows } from "../../utils/db-parse.util.js";

import { RatingRowDbZ, type RatingRow } from "../../types/ratings.js";

const OrderCourierIdRowZ = z
  .object({
    courierId: z.number().int().positive(),
  })
  .strict();

class RatingsRepository {
  /**
   * Create a new driver rating (migrated to Drizzle)
   */
  async createRating(ratingData: {
    orderId: number;
    driverId: number;
    customerId: number;
    rating: number;
    isAnonymous?: boolean;
    comment?: string | null;
  }): Promise<RatingRow> {
    try {
      const insertedRating = await drizzleDb.transaction(async (tx) => {
        const result = await tx
          .insert(driverRatings)
          .values({
            orderId: ratingData.orderId,
            driverId: ratingData.driverId,
            customerId: ratingData.customerId,
            rating: ratingData.rating,
            isAnonymous: ratingData.isAnonymous ?? false,
            comment: ratingData.comment || undefined,
          })
          .returning();

        const row = result[0];
        if (!row) {
          throw new AppError("Rating insert returned no row", 500);
        }

        const updatedCourier = await tx
          .update(courierStatus)
          .set({
            avgRating: sql`ROUND(((COALESCE(${courierStatus.avgRating}, 0)::numeric * ${courierStatus.totalRatings}::numeric + ${ratingData.rating}::numeric) / (${courierStatus.totalRatings} + 1)::numeric), 2)`,
            totalRatings: sql`${courierStatus.totalRatings} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(courierStatus.courierId, ratingData.driverId))
          .returning({ courierId: courierStatus.courierId });

        if (updatedCourier.length === 0) {
          throw new AppError(
            `Courier status not found for driver ${ratingData.driverId}`,
            500,
          );
        }

        return row;
      });

      return parseDbRow(RatingRowDbZ, insertedRating, "created rating");
    } catch (error) {
      logger.error({
        msg: "Error creating driver rating",
        error: (error as Error).message,
        orderId: ratingData.orderId,
        driverId: ratingData.driverId,
      });
      throw error;
    }
  }

  /**
   * Get recent ratings for a driver (last 90 days)
   */
  async getDriverRatingsRecent(
    driverId: number,
    since: Date,
  ): Promise<RatingRow[]> {
    try {
      const result = await drizzlePool.query(
        ratingsQueries.FIND_DRIVER_RATINGS_RECENT,
        [driverId, since],
      );
      return parseDbRows(RatingRowDbZ, result.rows, "driver recent ratings");
    } catch (error) {
      logger.error({
        msg: "Error getting driver ratings",
        error: (error as Error).message,
        driverId,
      });
      throw error;
    }
  }

  /**
   * Validate that order belongs to customer (migrated to Drizzle)
   */
  async orderBelongsToCustomer(
    orderId: number,
    customerId: number,
  ): Promise<boolean> {
    try {
      const result = await drizzleDb
        .select()
        .from(orderRequests)
        .where(
          and(
            eq(orderRequests.orderId, orderId),
            eq(orderRequests.clientId, customerId),
          ),
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      logger.error({
        msg: "Error checking order ownership",
        error: (error as Error).message,
        orderId,
        customerId,
      });
      throw error;
    }
  }

  /**
   * Get driver ID for an order (complex query - keep as raw SQL for now)
   */
  async getDriverForOrder(orderId: number): Promise<number | null> {
    try {
      const result = await drizzlePool.query(ratingsQueries.ORDER_HAS_DRIVER, [
        orderId,
      ]);
      const row = result.rows[0];
      if (!row) return null;

      const parsed = parseDbRow(OrderCourierIdRowZ, row, "order courier");
      return parsed.courierId;
    } catch (error) {
      logger.error({
        msg: "Error getting driver for order",
        error: (error as Error).message,
        orderId,
      });
      throw error;
    }
  }

  /**
   * Check if order is delivered (migrated to Drizzle)
   */
  async isOrderDelivered(orderId: number): Promise<boolean> {
    try {
      const result = await drizzleDb
        .select()
        .from(orderRequests)
        .where(
          and(
            eq(orderRequests.orderId, orderId),
            eq(orderRequests.status, "delivered"),
            isNotNull(orderRequests.deliveredAt),
          ),
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      logger.error({
        msg: "Error checking if order is delivered",
        error: (error as Error).message,
        orderId,
      });
      throw error;
    }
  }

  /**
   * Check if rating already exists for order (migrated to Drizzle)
   */
  async ratingExistsForOrder(orderId: number): Promise<boolean> {
    try {
      const result = await drizzleDb
        .select()
        .from(driverRatings)
        .where(eq(driverRatings.orderId, orderId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      logger.error({
        msg: "Error checking if rating exists",
        error: (error as Error).message,
        orderId,
      });
      throw error;
    }
  }
}

export default new RatingsRepository();
