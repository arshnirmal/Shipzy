// services/backend/src/database/queries/orders.queries.ts

/**
 * Order management queries
 * Covers order CRUD, courier assignments, and order tracking
 */

export default {
  // ============ FUNCTION CALLS ============

  /**
   * Call stored function: Calculate fare
   */
  CALL_CALCULATE_FARE: `
    SELECT orders.calculate_fare($1, $2, $3, $4, $5) AS result
  `,

  /**
   * Call stored function: Create order with locations
   */
  CALL_CREATE_ORDER: `
    SELECT orders.create_order_with_locations($1) AS result
  `,

  /**
   * Call stored function: Cancel order with refund
   */
  CALL_CANCEL_ORDER_WITH_REFUND: `
    SELECT orders.cancel_order_with_refund($1, $2, $3) AS result
  `,

  /**
   * Call stored function: Assign order to courier atomically
   */
  CALL_ASSIGN_ORDER_TO_COURIER: `
    SELECT orders.assign_order_to_courier($1, $2) AS result
  `,

  /**
   * Call stored function: Deliver order and release courier atomically
   */
  CALL_DELIVER_ORDER: `
    SELECT orders.deliver_order($1, $2) AS result
  `,

  // ============ ORDER RETRIEVAL ============

  /**
   * Find order by ID with full details
   * JOINs: only client + courier profiles (master data comes from snapshot JSONB)
   */
  FIND_ORDER_BY_ID: `
    SELECT
      o.order_id             AS "orderId",
      o.order_uuid           AS "orderUuid",
      o.order_number         AS "orderNumber",
      o.client_id            AS "clientId",
      u.full_name            AS "clientName",
      u.phone_number         AS "clientPhone",
      o.status               AS "status",

      -- FK columns kept for integrity/filtering
      o.delivery_type_id     AS "deliveryTypeId",
      o.vehicle_category_id  AS "vehicleCategoryId",
      o.weight_tier_id       AS "weightTierId",
      o.package_type_id      AS "packageTypeId",
      o.payment_method_id    AS "paymentMethodId",
      o.payment_mode         AS "paymentMode",

      -- Operational scalars
      o.total_price          AS "totalPrice",
      o.estimated_distance_km AS "estimatedDistanceKm",
      o.actual_distance_km   AS "actualDistanceKm",
      o.coupon_code          AS "couponCode",

      -- JSONB value objects
      o.pickup_location      AS "pickup",
      o.delivery_location    AS "delivery",
      o.items                AS "orderItems",
      o.pricing              AS "pricing",
      o.schedule             AS "schedule",
      o.actual               AS "actual",
      o.package              AS "package",
      o.snapshot             AS "snapshot",

      -- Status timeline
      o.created_at           AS "createdAt",
      o.accepted_at          AS "acceptedAt",
      o.picked_up_at         AS "pickedUpAt",
      o.in_transit_at        AS "inTransitAt",
      o.delivered_at         AS "deliveredAt",
      o.cancelled_at         AS "cancelledAt",
      o.cancellation_reason  AS "cancellationReason",

      -- Courier details (if assigned)
      ca.assignment_id       AS "assignmentId",
      ca.courier_id          AS "courierId",
      cu.full_name           AS "courierName",
      cu.phone_number        AS "courierPhone",
      cu.profile_picture_url AS "courierPhoto",
      ca.status              AS "assignmentStatus",
      ca.assigned_at         AS "assignedAt",
      ca.timeline            AS "assignmentTimeline",
      o.delivery_attempt     AS "deliveryAttempt"

    FROM orders.requests o
    JOIN users.profiles u ON o.client_id = u.user_id
    LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
    LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
    WHERE o.order_id = $1
      AND o.deleted_at IS NULL
  `,

  /**
   * Find available orders for courier (within radius)
   * JOINs: none — delivery type, vehicle category, weight tier all in snapshot JSONB
   */
  FIND_AVAILABLE_ORDERS_FOR_COURIER: `
    SELECT
      o.order_id              AS "orderId",
      o.order_uuid            AS "orderUuid",
      o.order_number          AS "orderNumber",
      o.status                AS "status",

      -- FK columns for client-side matching
      o.delivery_type_id      AS "deliveryTypeId",
      o.vehicle_category_id   AS "vehicleCategoryId",
      o.weight_tier_id        AS "weightTierId",
      o.package_type_id       AS "packageTypeId",
      o.payment_method_id     AS "paymentMethodId",
      o.payment_mode          AS "paymentMode",

      -- Operational scalars
      o.total_price           AS "totalPrice",
      o.estimated_distance_km AS "estimatedDistanceKm",
      o.created_at            AS "createdAt",

      -- JSONB value objects
      o.pickup_location       AS "pickup",
      o.delivery_location     AS "delivery",
      o.pricing               AS "pricing",
      o.package               AS "package",
      o.snapshot              AS "snapshot",

      -- OPTIMIZED: Distance from courier using computed PostGIS column
      ROUND(
          ST_Distance(
              o.pickup_point,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          )::numeric / 1000, 2
      ) AS "distanceFromCourierKm"

    FROM orders.requests o
    WHERE o.status = 'pending'
      AND o.deleted_at IS NULL
      -- Freshness guard: only surface pending orders created within the last 30 minutes.
      -- Prevents drivers from seeing stale orders in the absence of a TTL worker (B6).
      AND o.created_at > NOW() - INTERVAL '30 minutes'
      AND NOT EXISTS (
          SELECT 1 FROM orders.courier_assignments ca
          WHERE ca.order_id = o.order_id
            AND ca.status NOT IN ('rejected', 'cancelled')
      )
      AND ST_DWithin(
          o.pickup_point,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
      )
    ORDER BY o.created_at ASC
    LIMIT $4
  `,

  // ============ STATUS HISTORY ============

  /**
   * Insert status history record
   */
  INSERT_STATUS_HISTORY: `
    INSERT INTO orders.status_history (order_id, status, previous_status, changed_by, notes)
    VALUES ($1, $2, $3, $4, $5)
  `,

  // ============ COURIER ASSIGNMENTS ============

  /**
   * Create courier assignment
   */
  CREATE_COURIER_ASSIGNMENT: `
    INSERT INTO orders.courier_assignments (order_id, courier_id, status)
    VALUES ($1, $2, 'assigned')
    RETURNING
      assignment_id AS "assignmentId",
      order_id      AS "orderId",
      courier_id    AS "courierId",
      assigned_at   AS "assignedAt"
  `,

  /**
   * Accept assignment (courier accepts order)
   */
  ACCEPT_ASSIGNMENT: `
    UPDATE orders.courier_assignments
    SET
      timeline   = jsonb_build_object('acceptedAt', NOW()::TEXT, 'rejectedAt', NULL),
      updated_at = NOW()
    WHERE order_id  = $1
      AND courier_id = $2
    RETURNING
      assignment_id AS "assignmentId",
      timeline      AS "timeline"
  `,

  /**
   * Update order status to accepted
   */
  UPDATE_ORDER_STATUS_TO_ASSIGNED: `
    UPDATE orders.requests
    SET
      status      = 'accepted',
      accepted_at = NOW(),
      updated_at  = NOW()
    WHERE order_id = $1
    RETURNING order_id
  `,

  /**
   * Update courier status with current assignment
   */
  UPDATE_COURIER_CURRENT_ASSIGNMENT: `
    UPDATE logistics.courier_status
    SET
      current_assignment_id = $2,
      is_available          = FALSE,
      updated_at            = NOW()
    WHERE courier_id = $1
  `,

  /**
   * Reject assignment
   */
  REJECT_ASSIGNMENT: `
    UPDATE orders.courier_assignments
    SET
      status           = 'rejected',
      timeline         = jsonb_build_object('acceptedAt', NULL, 'rejectedAt', NOW()::TEXT),
      rejection_reason = $3,
      updated_at       = NOW()
    WHERE assignment_id = $1
      AND courier_id    = $2
    RETURNING assignment_id, timeline
  `,

  // ============ DRIVER ORDER ACTIONS ============

  /**
   * Call stored function: Return order and release courier atomically
   */
  CALL_RETURN_ORDER: `
    SELECT orders.return_order($1, $2) AS result
  `,

  /**
   * Patch delivery_attempt JSONB (merge into existing)
   * $1 = orderId, $2 = JSONB patch object
   */
  UPDATE_DELIVERY_ATTEMPT: `
    UPDATE orders.requests
    SET delivery_attempt = COALESCE(delivery_attempt, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
    WHERE order_id = $1 AND deleted_at IS NULL
    RETURNING delivery_attempt AS "deliveryAttempt"
  `,

  /**
   * Read delivery_attempt JSONB for an order
   */
  GET_DELIVERY_ATTEMPT: `
    SELECT delivery_attempt AS "deliveryAttempt"
    FROM orders.requests
    WHERE order_id = $1 AND deleted_at IS NULL
  `,

  /**
   * Persist proof of delivery on the order row (1:1 JSONB)
   */
  INSERT_PROOF_OF_DELIVERY: `
    UPDATE orders.requests
    SET
      pod = jsonb_build_object(
        'recipientName', $2::text,
        'photoUrl', $3::text,
        'signatureUrl', $4::text,
        'deliveryNotes', $5::text,
        'deliveredAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      updated_at = NOW()
    WHERE order_id = $1
      AND deleted_at IS NULL
    RETURNING
      order_id AS "orderId",
      (pod->>'deliveredAt')::timestamptz AS "deliveredAt"
  `,

  /**
   * Get order tracking data: live courier location + milestones + delivery attempt
   */
  GET_ORDER_TRACKING: `
    SELECT
      o.order_id                             AS "orderId",
      o.status                               AS "status",
      o.delivery_attempt                     AS "deliveryAttempt",
      ST_Y(cs.current_location::geometry)    AS "driverLatitude",
      ST_X(cs.current_location::geometry)    AS "driverLongitude",
      cs.location_meta                       AS "locationMeta",
      cs.last_location_update                AS "lastLocationUpdate",
      ca.courier_id                          AS "courierId",
      ca.assignment_id                       AS "assignmentId",
      o.client_id                            AS "clientId"
    FROM orders.requests o
    LEFT JOIN orders.courier_assignments ca
      ON o.order_id = ca.order_id
      AND ca.status NOT IN ('rejected', 'cancelled')
    LEFT JOIN logistics.courier_status cs
      ON ca.courier_id = cs.courier_id
    WHERE o.order_id = $1
      AND o.deleted_at IS NULL
  `,

  /**
   * Get milestone events for an order (ordered chronologically)
   */
  GET_ORDER_MILESTONES: `
    SELECT
      te.event_type                         AS "eventType",
      te.event_description                  AS "description",
      ST_Y(te.location::geometry)           AS "lat",
      ST_X(te.location::geometry)           AS "lng",
      te.timestamp                          AS "timestamp"
    FROM tracking.events te
    WHERE te.order_id = $1
    ORDER BY te.timestamp ASC
  `,

  /**
   * Insert a milestone tracking event
   */
  INSERT_MILESTONE_EVENT: `
    INSERT INTO tracking.events (
      assignment_id, order_id, courier_id,
      event_type, event_description, location
    )
    VALUES (
      $1, $2, $3, $4, $5,
      CASE WHEN $6::numeric IS NOT NULL AND $7::numeric IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography
        ELSE NULL
      END
    )
    RETURNING event_id AS "eventId", timestamp AS "timestamp"
  `,

  /**
   * Get order gross amount from pricing JSONB (used for driver earnings calculation)
   */
  GET_ORDER_GROSS_AMOUNT: `
    SELECT (pricing->>'totalPrice')::numeric AS "totalPrice"
    FROM orders.requests WHERE order_id = $1
  `,
};
