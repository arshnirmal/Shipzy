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
    INSERT INTO public.driver_ratings (
      order_id, driver_id, customer_id, rating, comment
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING rating_id, order_id, driver_id, customer_id, rating, comment, created_at
  `,

  /**
   * Get recent ratings for a driver (last 90 days for aggregation)
   */
  FIND_DRIVER_RATINGS_RECENT: `
    SELECT r.rating_id, r.order_id, r.customer_id, r.rating, r.comment, r.created_at,
           o.order_number, o.delivered_at
    FROM public.driver_ratings r
    JOIN orders.requests o ON r.order_id = o.order_id
    WHERE r.driver_id = $1
      AND r.created_at >= $2
      AND o.status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'delivered')
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
    SELECT ca.courier_id FROM orders.courier_assignments ca
    JOIN orders.requests o ON ca.order_id = o.order_id
    WHERE o.order_id = $1
      AND ca.assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'delivered')
    LIMIT 1
  `,

  /**
   * Check if order is delivered (for validation)
   */
  ORDER_IS_DELIVERED: `
    SELECT 1 FROM orders.requests
    WHERE order_id = $1
      AND status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'delivered')
      AND delivered_at IS NOT NULL
    LIMIT 1
  `,

  /**
   * Check if rating already exists for order
   */
  RATING_EXISTS_FOR_ORDER: `
    SELECT 1 FROM public.driver_ratings
    WHERE order_id = $1
    LIMIT 1
  `,
};
