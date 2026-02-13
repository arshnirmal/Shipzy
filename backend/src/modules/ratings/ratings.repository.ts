// services/backend/src/modules/ratings/ratings.repository.ts
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import ratingsQueries from "../../database/queries/ratings.queries.js";

interface DriverRating {
  rating_id: number;
  order_id: number;
  driver_id: number;
  customer_id: number;
  rating: number;
  comment?: string;
  created_at: Date;
  order_number?: string;
  delivered_at?: Date;
}

interface CreateRatingData {
  order_id: number;
  driver_id: number;
  customer_id: number;
  rating: number;
  comment?: string;
}

class RatingsRepository {
  /**
   * Create a new driver rating
   */
  async createRating(ratingData: CreateRatingData): Promise<DriverRating> {
    try {
      const result = await db.query(ratingsQueries.INSERT_RATING, [
        ratingData.order_id,
        ratingData.driver_id,
        ratingData.customer_id,
        ratingData.rating,
        ratingData.comment || null,
      ]);
      return result.rows[0];
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
  ): Promise<DriverRating[]> {
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
   * Validate that order belongs to customer
   */
  async orderBelongsToCustomer(
    orderId: number,
    customerId: number,
  ): Promise<boolean> {
    try {
      const result = await db.query(ratingsQueries.ORDER_BELONGS_TO_CUSTOMER, [
        orderId,
        customerId,
      ]);
      return result.rows.length > 0;
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
   * Get driver ID for an order
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
   * Check if order is delivered
   */
  async isOrderDelivered(orderId: number): Promise<boolean> {
    try {
      const result = await db.query(ratingsQueries.ORDER_IS_DELIVERED, [
        orderId,
      ]);
      return result.rows.length > 0;
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
   * Check if rating already exists for order
   */
  async ratingExistsForOrder(orderId: number): Promise<boolean> {
    try {
      const result = await db.query(ratingsQueries.RATING_EXISTS_FOR_ORDER, [
        orderId,
      ]);
      return result.rows.length > 0;
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
