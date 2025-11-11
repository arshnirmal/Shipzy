// services/backend/src/database/queries/drivers.queries.js

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
          vc.name AS vehicle_category,
          vc.max_weight_kg AS vehicle_max_weight
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

  /**
   * Toggle courier online status
   */
  TOGGLE_COURIER_ONLINE_STATUS: `
      UPDATE logistics.courier_status
      SET
          is_online = NOT is_online,
          is_available = CASE WHEN is_online = true THEN false ELSE is_available END,
          updated_at = NOW()
      WHERE courier_id = $1
      RETURNING courier_id, is_online, is_available, updated_at
  `,

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

  /**
   * Get courier current location
   */
  GET_COURIER_LOCATION: `
      SELECT 
          courier_id,
          ST_Y(current_location::geometry) AS latitude,
          ST_X(current_location::geometry) AS longitude,
          last_location_update,
          is_online,
          is_available
      FROM logistics.courier_status
      WHERE courier_id = $1
  `,

  // ============ COURIER VEHICLE ============

  /**
   * Get courier active vehicle
   */
  GET_COURIER_VEHICLE: `
      SELECT 
          cv.vehicle_id,
          cv.vehicle_number,
          cv.model,
          cv.year,
          vc.name AS category,
          cv.insurance_expiry,
          cv.is_active
      FROM logistics.courier_vehicles cv
      JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
      WHERE cv.courier_id = $1
          AND cv.is_active = true
      LIMIT 1
  `,

  /**
   * Update courier vehicle
   */
  UPDATE_COURIER_VEHICLE: `
      UPDATE logistics.courier_vehicles
      SET
          vehicle_number = COALESCE($2, vehicle_number),
          model = COALESCE($3, model),
          year = COALESCE($4, year),
          category_id = COALESCE($5, category_id),
          updated_at = NOW()
      WHERE courier_id = $1
          AND is_active = true
      RETURNING vehicle_id, vehicle_number, model, updated_at
  `,

  // ============ COURIER ASSIGNMENTS ============

  /**
   * Find courier's active assignments
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

          -- Pickup location
          pl.address AS pickup_address,
          pl.building AS pickup_building,
          pl.landmark AS pickup_landmark,
          ST_Y(pl.location::geometry) AS pickup_latitude,
          ST_X(pl.location::geometry) AS pickup_longitude,
          o.pickup_contact_name,
          o.pickup_contact_phone,

          -- Delivery location
          dl.address AS delivery_address,
          dl.building AS delivery_building,
          dl.landmark AS delivery_landmark,
          ST_Y(dl.location::geometry) AS delivery_latitude,
          ST_X(dl.location::geometry) AS delivery_longitude,
          o.delivery_contact_name,
          o.delivery_contact_phone,

          o.package_description,
          o.package_weight_kg,
          o.total_price,
          o.special_instructions,
          ca.assigned_at,
          ca.accepted_at
      FROM orders.courier_assignments ca
      JOIN orders.requests o ON ca.order_id = o.order_id
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.assignment_statuses ast ON ca.assignment_status_id = ast.status_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
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
