// services/backend/src/modules/ratings/ratings.repository.ts
import { eq, and, gte, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import db from "../../database/db.js";
import ratingsQueries from "../../database/queries/ratings.queries.js";
import { driverRatings } from "../../database/schema/ratings.js";
import { orderRequests } from "../../database/schema/orders.js";
import { courierAssignments } from "../../database/schema/orders.js";
import { orderStatuses } from "../../database/schema/public.js";
import { assignmentStatuses } from "../../database/schema/public.js";

import type { RatingRow } from "../../types/ratings.js";

class RatingsRepository {
  /**
   * Create a new driver rating (migrated to Drizzle)
   */
  async createRating(ratingData: {
    order_id: number;
    driver_id: number;
    customer_id: number;
    rating: number;
    comment?: string | null;
  }): Promise<RatingRow> {
    try {
      const result = await drizzleDb
        .insert(driverRatings)
        .values({
          orderId: ratingData.order_id,
          driverId: ratingData.driver_id,
          customerId: ratingData.customer_id,
          rating: ratingData.rating,
          comment: ratingData.comment || undefined,
        })
        .returning();

      return {
        rating_id: result[0].ratingId,
        order_id: result[0].orderId,
        driver_id: result[0].driverId,
        customer_id: result[0].customerId,
        rating: result[0].rating,
        comment: result[0].comment || null,
        created_at: result[0].createdAt,
      } as RatingRow;
    } catch (error) {
      logger.error({
        msg: "Error creating driver rating",
        error: (error as Error).message,
        orderId: ratingData.order_id,
        driverId: ratingData.driver_id,
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
      const result = await db.query(ratingsQueries.FIND_DRIVER_RATINGS_RECENT, [
        driverId,
        since,
      ]);
      return result.rows;
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
      const result = await db.query(ratingsQueries.ORDER_HAS_DRIVER, [orderId]);
      return result.rows[0]?.courier_id || null;
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
      // Get 'delivered' status ID first
      const deliveredStatus = await drizzleDb
        .select({ statusId: orderStatuses.statusId })
        .from(orderStatuses)
        .where(eq(orderStatuses.name, "delivered"))
        .limit(1);

      if (deliveredStatus.length === 0) {
        return false;
      }

      const result = await drizzleDb
        .select()
        .from(orderRequests)
        .where(
          and(
            eq(orderRequests.orderId, orderId),
            eq(orderRequests.statusId, deliveredStatus[0].statusId),
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
