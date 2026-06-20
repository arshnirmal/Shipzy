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
            NULL::int AS "vehicleId",
            cs.vehicle->>'vehicleNumber' AS "vehicleNumber",
            cs.vehicle->>'model' AS "vehicleModel",
            (cs.vehicle->>'year')::int AS "vehicleYear",
            cs.vehicle_category_id AS "vehicleCategoryId",
            vc.name AS "vehicleCategory",
            vc.max_weight_kg AS "vehicleMaxWeight",
            (cs.vehicle IS NOT NULL) AS "vehicleIsActive",
            u.onboarding AS "onboarding",
            cs.kyc AS "kyc",
                        u.created_at AS "createdAt",
                        u.updated_at AS "updatedAt"
      FROM users.profiles u
      LEFT JOIN logistics.courier_status cs ON u.user_id = cs.courier_id
      LEFT JOIN public.vehicle_categories vc ON cs.vehicle_category_id = vc.category_id
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
          COALESCE(SUM(COALESCE(ca.net_earnings, o.total_price * 0.7)), 0) AS "totalEarnings",
          COALESCE(SUM(CASE WHEN o.created_at::date = CURRENT_DATE THEN COALESCE(ca.net_earnings, o.total_price * 0.7) END), 0) AS "todayEarnings",
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN COALESCE(ca.net_earnings, o.total_price * 0.7) END), 0) AS "weekEarnings",
          COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN COALESCE(ca.net_earnings, o.total_price * 0.7) END), 0) AS "monthEarnings",
          COALESCE(ROUND(AVG(COALESCE(ca.net_earnings, o.total_price * 0.7)), 2), 0) AS "avgOrderValue",
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
          location_meta = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE location_meta END,
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
      o.payment_mode          AS "paymentMode",
      pt.status               AS "paymentStatus",

      ca.assigned_at       AS "assignedAt",
      ca.timeline          AS "timeline"

    FROM orders.courier_assignments ca
    JOIN orders.requests o ON ca.order_id = o.order_id
    LEFT JOIN payments.transactions pt ON o.order_id = pt.order_id
    WHERE ca.courier_id = $1
      AND ca.status NOT IN ('delivered', 'cancelled', 'rejected', 'returned')
    ORDER BY ca.assigned_at DESC
  `,

  // ============ AVAILABILITY / STALE DETECTION ============

  /**
   * Mark a courier offline if their last location update is older than $2 minutes.
   * No-op if already offline or location is fresh. Returns updated row or nothing.
   * $1=courierId $2=staleThresholdMinutes
   */
  MARK_COURIER_OFFLINE_IF_STALE: `
    UPDATE logistics.courier_status
    SET
      is_online    = false,
      is_available = false,
      updated_at   = NOW()
    WHERE courier_id = $1
      AND is_online  = true
      AND (
        last_location_update IS NULL
        OR last_location_update < NOW() - ($2 || ' minutes')::interval
      )
    RETURNING courier_id AS "courierId"
  `,

  // ============ TRIP HISTORY ============

  /**
   * Paginated completed/returned/cancelled assignments for a courier
   * $1=courierId $2=limit $3=offset $4=dateFrom(nullable) $5=dateTo(nullable)
   */
  GET_COURIER_TRIP_HISTORY: `
    SELECT
      ca.assignment_id                                        AS "assignmentId",
      ca.order_id                                             AS "orderId",
      o.order_uuid                                            AS "orderUuid",
      o.order_number                                          AS "orderNumber",
      o.status                                                AS "orderStatus",
      ca.status                                               AS "assignmentStatus",
      o.pickup_location                                       AS "pickup",
      o.delivery_location                                     AS "delivery",
      o.actual_distance_km                                    AS "actualDistanceKm",
      o.total_price                                           AS "totalPrice",
      COALESCE(ca.net_earnings, o.total_price * 0.7)         AS "netEarning",
      o.snapshot                                              AS "snapshot",
      ca.assigned_at                                          AS "assignedAt",
      o.delivered_at                                          AS "deliveredAt",
      o.cancelled_at                                          AS "cancelledAt",
      COUNT(*) OVER ()                                        AS "totalCount"
    FROM orders.courier_assignments ca
    JOIN orders.requests o ON ca.order_id = o.order_id
    WHERE ca.courier_id = $1
      AND o.status IN ('delivered', 'returned', 'cancelled')
      AND o.deleted_at IS NULL
      AND ($4::timestamptz IS NULL OR o.created_at >= $4)
      AND ($5::timestamptz IS NULL OR o.created_at <= $5)
    ORDER BY ca.assigned_at DESC
    LIMIT $2 OFFSET $3
  `,

  // ============ FUNCTION CALLS ============

  /**
   * Call stored function: Find nearby couriers
   */
  CALL_FIND_NEARBY_COURIERS: `
      SELECT * FROM logistics.find_nearby_couriers($1, $2, $3, $4)
  `,
};
