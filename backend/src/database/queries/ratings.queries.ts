// services/backend/src/database/queries/ratings.queries.ts

/**
 * Driver ratings-related queries
 * Customer feedback per delivered order
 */

export default {
  /**
   * Get recent ratings for a driver (last 90 days for aggregation)
   */
  FIND_DRIVER_RATINGS_RECENT: `
    SELECT
      o.order_id AS "ratingId",
      o.order_id AS "orderId",
      ca.courier_id AS "driverId",
      (o.rating->>'customerId')::int AS "customerId",
      (o.rating->>'isAnonymous')::boolean AS "isAnonymous",
      (o.rating->>'value')::int AS "rating",
      o.rating->>'comment' AS "comment",
      (o.rating->>'createdAt')::timestamptz AS "createdAt",
      o.order_number AS "orderNumber",
      o.delivered_at AS "deliveredAt"
    FROM orders.requests o
    JOIN orders.courier_assignments ca
      ON ca.order_id = o.order_id AND ca.status = 'delivered'
    WHERE ca.courier_id = $1
      AND o.rating IS NOT NULL
      AND (o.rating->>'createdAt')::timestamptz >= $2
      AND o.status = 'delivered'
    ORDER BY (o.rating->>'createdAt')::timestamptz DESC
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
    SELECT 1 FROM orders.requests
    WHERE order_id = $1
      AND rating IS NOT NULL
    LIMIT 1
  `,
};
