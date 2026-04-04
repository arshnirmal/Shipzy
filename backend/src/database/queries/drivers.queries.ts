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
                        u.user_id AS "courierId",
            u.user_id AS "userId",
            u.user_uuid AS "userUuid",
            u.phone_number AS "phoneNumber",
            u.full_name AS "fullName",
            u.email AS "email",
            u.profile_picture_url AS "profilePictureUrl",
            u.is_verified AS "isVerified",
            u.is_active AS "isActive",
            cs.status_id AS "courierStatusId",
                        COALESCE(cs.is_available, false) AS "isAvailable",
                        COALESCE(cs.is_online, false) AS "isOnline",
                        COALESCE(cs.total_deliveries_today, 0) AS "totalDeliveriesToday",
            cs.last_location_update AS "lastLocationUpdate",
            ST_Y(cs.current_location::geometry) AS "currentLatitude",
            ST_X(cs.current_location::geometry) AS "currentLongitude",
                        cs.avg_rating AS "avgRating",
                        COALESCE(cs.total_ratings, 0) AS "totalRatings",
            cv.vehicle_id AS "vehicleId",
            cv.vehicle_number AS "vehicleNumber",
            cv.model AS "vehicleModel",
            cv.year AS "vehicleYear",
            vc.category_id AS "vehicleCategoryId",
            vc.name AS "vehicleCategory",
            vc.max_weight_kg AS "vehicleMaxWeight",
            cv.is_active AS "vehicleIsActive",
                        u.created_at AS "createdAt",
                        u.updated_at AS "updatedAt"
      FROM users.profiles u
      LEFT JOIN logistics.courier_status cs ON u.user_id = cs.courier_id
      LEFT JOIN logistics.courier_vehicles cv ON u.user_id = cv.courier_id AND cv.is_active = true
      LEFT JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
      WHERE u.user_id = $1
          AND u.role = 'courier'
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
      RETURNING
          user_id AS "userId",
          full_name AS "fullName",
          email AS "email",
          profile_picture_url AS "profilePictureUrl",
          updated_at AS "updatedAt"
  `,

  // NOTE: TOGGLE_COURIER_ONLINE_STATUS removed - not used anywhere, can be done via Drizzle if needed

  /**
   * Get courier earnings summary
   */
  GET_COURIER_EARNINGS_SUMMARY: `
      SELECT
          COUNT(DISTINCT o.order_id) AS "totalDeliveries",
          COUNT(DISTINCT CASE WHEN o.created_at::date = CURRENT_DATE THEN o.order_id END) AS "todayDeliveries",
          COUNT(DISTINCT CASE WHEN o.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN o.order_id END) AS "weekDeliveries",
          COUNT(DISTINCT CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN o.order_id END) AS "monthDeliveries",
          COALESCE(SUM(o.total_price), 0) AS "totalEarnings",
          COALESCE(SUM(CASE WHEN o.created_at::date = CURRENT_DATE THEN o.total_price END), 0) AS "todayEarnings",
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN o.total_price END), 0) AS "weekEarnings",
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN o.total_price END), 0) AS "monthEarnings",
          COALESCE(ROUND(AVG(o.total_price), 2), 0) AS "avgOrderValue",
          COALESCE(ROUND(SUM(o.actual_distance_km), 2), 0) AS "totalDistanceKm"
      FROM orders.requests o
      JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      WHERE ca.courier_id = $1
          AND o.status = 'delivered'
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
      RETURNING
          courier_id AS "courierId",
          is_available AS "isAvailable",
          is_online AS "isOnline",
          updated_at AS "updatedAt"
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
          courier_id AS "courierId",
          ST_Y(current_location::geometry) AS "latitude",
          ST_X(current_location::geometry) AS "longitude",
          last_location_update AS "lastLocationUpdate"
  `,

  // NOTE: GET_COURIER_LOCATION, GET_COURIER_VEHICLE, UPDATE_COURIER_VEHICLE removed - not used anywhere
  // These can be implemented via Drizzle ORM if needed in the future

  // ============ COURIER ASSIGNMENTS ============

  /**
   * Find courier's active assignments
   * No master-table JOINs — delivery type, vehicle category, weight tier all in snapshot JSONB
   */
  FIND_COURIER_ACTIVE_ASSIGNMENTS: `
    SELECT
      ca.assignment_id     AS "assignmentId",
      ca.order_id          AS "orderId",
      o.order_uuid         AS "orderUuid",
      o.order_number       AS "orderNumber",
      o.status             AS "orderStatus",
      ca.status            AS "assignmentStatus",

      -- Whole JSONB location objects
      o.pickup_location    AS "pickup",
      o.delivery_location  AS "delivery",

      -- JSONB value objects (master data + pricing — no JOINs needed)
      o.pricing            AS "pricing",
      o.snapshot           AS "snapshot",
      o.package            AS "package",

      o.total_price        AS "totalPrice",
      o.estimated_distance_km AS "estimatedDistanceKm",
      o.actual_distance_km    AS "actualDistanceKm",

      ca.assigned_at       AS "assignedAt",
      ca.timeline          AS "timeline"

    FROM orders.courier_assignments ca
    JOIN orders.requests o ON ca.order_id = o.order_id
    WHERE ca.courier_id = $1
      AND ca.status NOT IN ('delivered', 'cancelled', 'rejected')
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
