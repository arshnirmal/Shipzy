// services/backend/src/database/queries/drivers.queries.ts

/**
 * Driver/Courier-related queries
 * Covers courier profiles, availability, and location
 */

export default {
  // ============ COURIER PROFILE ============

  /**
   * Get courier profile with status and vehicle
   */
  FIND_COURIER_BY_USER_ID: `
    SELECT
      u.user_id,
      u.user_uuid,
      u.phone_number,
      u.full_name,
      u.email,
          u.profile_picture_url,
          u.is_verified,
          u.is_active,
          cs.status_id AS courier_status_id,
          cs.is_available,
          cs.is_online,
          cs.total_deliveries_today,
          cs.last_location_update,
          ST_Y(cs.current_location::geometry) AS current_latitude,
          ST_X(cs.current_location::geometry) AS current_longitude,
          cv.vehicle_id,
          cv.vehicle_number,
          cv.model AS vehicle_model,
          cv.year AS vehicle_year,
          vc.category_id AS vehicle_category_id,
          vc.name AS vehicle_category,
          vc.max_weight_kg AS vehicle_max_weight,
          cv.is_active AS vehicle_is_active,
          cs.created_at,
          cs.updated_at
      FROM users.profiles u
      LEFT JOIN logistics.courier_status cs ON u.user_id = cs.courier_id
      LEFT JOIN logistics.courier_vehicles cv ON u.user_id = cv.courier_id AND cv.is_active = true
      LEFT JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
      WHERE u.user_id = $1
          AND u.role_id = (SELECT role_id FROM public.user_roles WHERE name = 'courier')
          AND u.deleted_at IS NULL
  `,

  /**
   * Update courier profile
   */
  UPDATE_COURIER_PROFILE: `
      UPDATE users.profiles
      SET
          full_name = COALESCE($2, full_name),
          email = COALESCE($3, email),
          profile_picture_url = COALESCE($4, profile_picture_url),
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING user_id, full_name, email, profile_picture_url, updated_at
  `,

  // NOTE: TOGGLE_COURIER_ONLINE_STATUS removed - not used anywhere, can be done via Drizzle if needed

  /**
   * Get courier earnings summary
   */
  GET_COURIER_EARNINGS_SUMMARY: `
      SELECT
          COUNT(DISTINCT o.order_id) AS total_deliveries,
          COUNT(DISTINCT CASE WHEN o.created_at::date = CURRENT_DATE THEN o.order_id END) AS today_deliveries,
          COUNT(DISTINCT CASE WHEN o.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN o.order_id END) AS week_deliveries,
          COUNT(DISTINCT CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN o.order_id END) AS month_deliveries,
          COALESCE(SUM(o.total_price), 0) AS total_earnings,
          COALESCE(SUM(CASE WHEN o.created_at::date = CURRENT_DATE THEN o.total_price END), 0) AS today_earnings,
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN o.total_price END), 0) AS week_earnings,
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN o.total_price END), 0) AS month_earnings,
          COALESCE(ROUND(AVG(o.total_price), 2), 0) AS avg_order_value,
          COALESCE(ROUND(SUM(o.actual_distance_km), 2), 0) AS total_distance_km
      FROM orders.requests o
      JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      WHERE ca.courier_id = $1
          AND o.status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'delivered')
  `,

  // ============ COURIER AVAILABILITY ============

  /**
   * Update courier availability status
   */
  UPDATE_COURIER_AVAILABILITY: `
      UPDATE logistics.courier_status
      SET 
          is_available = $2,
          is_online = $3,
          updated_at = NOW()
      WHERE courier_id = $1
      RETURNING courier_id, is_available, is_online, updated_at
  `,

  // ============ COURIER LOCATION ============

  /**
   * Update courier location
   */
  UPDATE_COURIER_LOCATION: `
      UPDATE logistics.courier_status
      SET 
          current_location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          last_location_update = NOW(),
          updated_at = NOW()
      WHERE courier_id = $1
      RETURNING 
          courier_id,
          ST_Y(current_location::geometry) AS latitude,
          ST_X(current_location::geometry) AS longitude,
          last_location_update
  `,

  // NOTE: GET_COURIER_LOCATION, GET_COURIER_VEHICLE, UPDATE_COURIER_VEHICLE removed - not used anywhere
  // These can be implemented via Drizzle ORM if needed in the future

  // ============ COURIER ASSIGNMENTS ============

  /**
   * Find courier's active assignments (OPTIMIZED - uses JSONB columns)
   */
  FIND_COURIER_ACTIVE_ASSIGNMENTS: `
      SELECT
          ca.assignment_id,
          ca.order_id,
          o.order_uuid,
          o.order_number,
          o.status_id,
          os.name AS order_status,
          ca.assignment_status_id,
          ast.name AS assignment_status,

          -- Vehicle and package info
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          pt.name AS package_type,
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max,

          -- OPTIMIZED: Pickup location from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.pickup_location->>'building' AS pickup_building,
          o.pickup_location->>'landmark' AS pickup_landmark,
          o.pickup_location->>'city' AS pickup_city,
          o.pickup_location->>'state' AS pickup_state,
          o.pickup_location->>'postalCode' AS pickup_postal_code,
          (o.pickup_location->>'latitude')::numeric AS pickup_latitude,
          (o.pickup_location->>'longitude')::numeric AS pickup_longitude,
          o.pickup_location->>'contactName' AS pickup_contact_name,
          o.pickup_location->>'contactPhone' AS pickup_contact_phone,

          -- OPTIMIZED: Delivery location from JSONB
          o.delivery_location->>'fullAddress' AS delivery_address,
          o.delivery_location->>'building' AS delivery_building,
          o.delivery_location->>'landmark' AS delivery_landmark,
          o.delivery_location->>'city' AS delivery_city,
          o.delivery_location->>'state' AS delivery_state,
          o.delivery_location->>'postalCode' AS delivery_postal_code,
          (o.delivery_location->>'latitude')::numeric AS delivery_latitude,
          (o.delivery_location->>'longitude')::numeric AS delivery_longitude,
          o.delivery_location->>'contactName' AS delivery_contact_name,
          o.delivery_location->>'contactPhone' AS delivery_contact_phone,

          o.package_description,
          o.special_instructions,
          o.declared_value,
          o.estimated_distance_km,
          o.actual_distance_km,
          -- Delivery type (needed for earnings calculation)
          dt.name AS delivery_type,
          -- Complete pricing breakdown
          o.base_price,
          o.distance_price,
          o.weight_surcharge,
          o.platform_fee,
          o.special_handling_fee,
          o.gst_amount,
          o.subtotal_before_tax,
          o.total_price,
          ca.assigned_at,
          ca.accepted_at
      FROM orders.courier_assignments ca
      JOIN orders.requests o ON ca.order_id = o.order_id
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.assignment_statuses ast ON ca.assignment_status_id = ast.status_id
      LEFT JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      LEFT JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN public.package_types pt ON o.package_type_id = pt.package_type_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE ca.courier_id = $1
          AND ca.assignment_status_id NOT IN (
              SELECT status_id FROM public.assignment_statuses
              WHERE name IN ('delivered', 'cancelled', 'rejected')
          )
      ORDER BY ca.assigned_at DESC
  `,

  // ============ FUNCTION CALLS ============

  /**
   * Call stored function: Find nearby couriers
   */
  CALL_FIND_NEARBY_COURIERS: `
      SELECT * FROM logistics.find_nearby_couriers($1, $2, $3, $4)
  `,
};
