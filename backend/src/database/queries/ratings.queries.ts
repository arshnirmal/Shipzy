// services/backend/src/database/queries/ratings.queries.ts

/**
 * Driver ratings-related queries
 * Customer feedback per delivered order
 */

export default {
  /**
   * Insert a new driver rating
   */
  INSERT_RATING: `
    INSERT INTO logistics.driver_ratings (
      order_id, driver_id, customer_id, rating, comment
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING
      rating_id AS "ratingId",
      order_id AS "orderId",
      driver_id AS "driverId",
      customer_id AS "customerId",
      rating AS "rating",
      comment AS "comment",
      created_at AS "createdAt"
  `,

  /**
   * Get recent ratings for a driver (last 90 days for aggregation)
   */
  FIND_DRIVER_RATINGS_RECENT: `
    SELECT
      r.rating_id AS "ratingId",
      r.order_id AS "orderId",
      r.driver_id AS "driverId",
      r.customer_id AS "customerId",
      r.is_anonymous AS "isAnonymous",
      r.rating AS "rating",
      r.comment AS "comment",
      r.created_at AS "createdAt",
      o.order_number AS "orderNumber",
      o.delivered_at AS "deliveredAt"
    FROM logistics.driver_ratings r
    JOIN orders.requests o ON r.order_id = o.order_id
    WHERE r.driver_id = $1
      AND r.created_at >= $2
      AND o.status = 'delivered'
    ORDER BY r.created_at DESC
  `,

  /**
   * Check if order belongs to customer (for validation)
   */
  ORDER_BELONGS_TO_CUSTOMER: `
    SELECT 1 FROM orders.requests
    WHERE order_id = $1 AND client_id = $2
    LIMIT 1
  `,

  /**
   * Check if order has a driver assigned (for validation)
   */
  ORDER_HAS_DRIVER: `
    SELECT ca.courier_id AS "courierId" FROM orders.courier_assignments ca
    JOIN orders.requests o ON ca.order_id = o.order_id
    WHERE o.order_id = $1
      AND ca.status = 'delivered'
    LIMIT 1
  `,

  /**
   * Check if order is delivered (for validation)
   */
  ORDER_IS_DELIVERED: `
    SELECT 1 FROM orders.requests
    WHERE order_id = $1
      AND status = 'delivered'
      AND delivered_at IS NOT NULL
    LIMIT 1
  `,

  /**
   * Check if rating already exists for order
   */
  RATING_EXISTS_FOR_ORDER: `
    SELECT 1 FROM logistics.driver_ratings
    WHERE order_id = $1
    LIMIT 1
  `,
};
