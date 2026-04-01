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

  // ============ ORDER RETRIEVAL ============

  /**
   * Find order by ID with full details (OPTIMIZED - uses JSONB columns)
   */
  FIND_ORDER_BY_ID: `
    SELECT
            o.order_id AS "orderId",
            o.order_uuid AS "orderUuid",
            o.order_number AS "orderNumber",
            o.client_id AS "clientId",
            u.full_name AS "clientName",
            u.phone_number AS "clientPhone",
            CASE o.status
              WHEN 'pending' THEN 1
              WHEN 'accepted' THEN 2
              WHEN 'picked_up' THEN 3
              WHEN 'in_transit' THEN 4
              WHEN 'delivered' THEN 5
              WHEN 'cancelled' THEN 6
              WHEN 'undeliverable' THEN 7
              WHEN 'returned' THEN 8
            END AS "statusId",
            o.status AS "statusName",
            o.delivery_type_id AS "deliveryTypeId",
            dt.name AS "deliveryType",
            dt.display_name AS "deliveryTypeDisplay",
            o.vehicle_category_id AS "vehicleCategoryId",
            vc.name AS "vehicleCategory",
            vc.display_name AS "vehicleCategoryDisplay",
            o.package_description AS "packageDescription",
            o.package_type_id AS "packageTypeId",
            o.special_instructions AS "specialInstructions",
            o.base_price AS "basePrice",
            o.distance_price AS "distancePrice",
            o.weight_surcharge AS "weightSurcharge",
            o.platform_fee AS "platformFee",
            o.special_handling_fee AS "specialHandlingFee",
            o.gst_amount AS "gstAmount",
            o.subtotal_before_tax AS "subtotalBeforeTax",
            o.total_price AS "totalPrice",
            o.estimated_distance_km AS "estimatedDistanceKm",
            o.actual_distance_km AS "actualDistanceKm",
            o.actual_pickup_time AS "actualPickupTime",
            o.actual_delivery_time AS "actualDeliveryTime",
            o.payment_method_id AS "paymentMethodId",
            pm.name AS "paymentMethod",
            o.created_at AS "createdAt",
            o.accepted_at AS "acceptedAt",
            o.picked_up_at AS "pickedUpAt",
            o.delivered_at AS "deliveredAt",
            o.cancelled_at AS "cancelledAt",
            o.cancellation_reason AS "cancellationReason",

          -- Weight tier details
      wt.tier_id AS "weightTierId",
      wt.name AS "weightTierName",
      wt.min_weight_kg AS "weightTierMin",
      wt.max_weight_kg AS "weightTierMax",

          -- OPTIMIZED: Pickup details from JSONB
      o.pickup_location->>'fullAddress' AS "pickupAddress",
      o.pickup_location->>'building' AS "pickupBuilding",
      o.pickup_location->>'floor' AS "pickupFloor",
      o.pickup_location->>'flatNumber' AS "pickupFlat",
      o.pickup_location->>'landmark' AS "pickupLandmark",
      o.pickup_location->>'city' AS "pickupCity",
      o.pickup_location->>'state' AS "pickupState",
      o.pickup_location->>'postalCode' AS "pickupPostalCode",
      (o.pickup_location->>'latitude')::numeric AS "pickupLatitude",
      (o.pickup_location->>'longitude')::numeric AS "pickupLongitude",
      o.pickup_location->>'contactName' AS "pickupContactName",
      o.pickup_location->>'contactPhone' AS "pickupContactPhone",

          -- OPTIMIZED: Delivery details from JSONB
      o.delivery_location->>'fullAddress' AS "deliveryAddress",
      o.delivery_location->>'building' AS "deliveryBuilding",
      o.delivery_location->>'floor' AS "deliveryFloor",
      o.delivery_location->>'flatNumber' AS "deliveryFlat",
      o.delivery_location->>'landmark' AS "deliveryLandmark",
      o.delivery_location->>'city' AS "deliveryCity",
      o.delivery_location->>'state' AS "deliveryState",
      o.delivery_location->>'postalCode' AS "deliveryPostalCode",
      (o.delivery_location->>'latitude')::numeric AS "deliveryLatitude",
      (o.delivery_location->>'longitude')::numeric AS "deliveryLongitude",
      o.delivery_location->>'contactName' AS "deliveryContactName",
      o.delivery_location->>'contactPhone' AS "deliveryContactPhone",

          -- OPTIMIZED: Items and labels from JSONB
      o.items AS "orderItems",
      o.labels AS "orderLabels",

          -- Courier details (if assigned)
      ca.assignment_id AS "assignmentId",
      ca.courier_id AS "courierId",
      cu.full_name AS "courierName",
      cu.phone_number AS "courierPhone",
      cu.profile_picture_url AS "courierPhoto",
      CASE ca.status
        WHEN 'assigned' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'rejected' THEN 3
        WHEN 'picked_up' THEN 4
        WHEN 'in_transit' THEN 5
        WHEN 'delivered' THEN 6
        WHEN 'cancelled' THEN 7
        WHEN 'returned' THEN 8
      END AS "assignmentStatusId",
      ca.status AS "assignmentStatus",
      ca.assigned_at AS "assignedAt",
      ca.accepted_at AS "courierAcceptedAt"

      FROM orders.requests o
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN payments.payment_methods pm ON o.payment_method_id = pm.method_id
      JOIN users.profiles u ON o.client_id = u.user_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.order_id = $1
      AND o.deleted_at IS NULL

  `,

  /**
   * Find available orders for courier (within radius)
   */
  FIND_AVAILABLE_ORDERS_FOR_COURIER: `
      SELECT
          o.order_id AS "orderId",
          o.order_uuid AS "orderUuid",
          o.order_number AS "orderNumber",
          o.delivery_type_id AS "deliveryTypeId",
          dt.name AS "deliveryType",
          dt.display_name AS "deliveryTypeDisplay",
          o.vehicle_category_id AS "vehicleCategoryId",
          vc.name AS "vehicleCategory",
          vc.display_name AS "vehicleCategoryDisplay",
          o.package_type_id AS "packageTypeId",
          pt.name AS "packageType",
          o.weight_tier_id AS "weightTierId",
          wt.name AS "weightTierName",
          wt.min_weight_kg AS "weightTierMin",
          wt.max_weight_kg AS "weightTierMax",
          -- Pricing details
          o.base_price AS "basePrice",
          o.distance_price AS "distancePrice",
          o.weight_surcharge AS "weightSurcharge",
          o.platform_fee AS "platformFee",
          o.special_handling_fee AS "specialHandlingFee",
          o.gst_amount AS "gstAmount",
          o.subtotal_before_tax AS "subtotalBeforeTax",
          o.total_price AS "totalPrice",

          o.package_description AS "packageDescription",
          o.special_instructions AS "specialInstructions",
          o.estimated_distance_km AS "estimatedDistanceKm",
          o.created_at AS "createdAt",

          -- OPTIMIZED: Pickup location from JSONB
          o.pickup_location->>'fullAddress' AS "pickupAddress",
          o.pickup_location->>'landmark' AS "pickupLandmark",
          o.pickup_location->>'city' AS "pickupCity",
          o.pickup_location->>'state' AS "pickupState",
          (o.pickup_location->>'latitude')::numeric AS "pickupLatitude",
          (o.pickup_location->>'longitude')::numeric AS "pickupLongitude",

          -- OPTIMIZED: Delivery location from JSONB
          o.delivery_location->>'fullAddress' AS "deliveryAddress",
          o.delivery_location->>'landmark' AS "deliveryLandmark",
          o.delivery_location->>'city' AS "deliveryCity",
          o.delivery_location->>'state' AS "deliveryState",
          o.delivery_location->>'postalCode' AS "deliveryPostalCode",
          (o.delivery_location->>'latitude')::numeric AS "deliveryLatitude",
          (o.delivery_location->>'longitude')::numeric AS "deliveryLongitude",

          -- OPTIMIZED: Distance from courier using computed PostGIS column (pickup_point)
          ROUND(
              ST_Distance(
                  o.pickup_point,
                  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
              )::numeric / 1000, 2
          ) AS "distanceFromCourierKm"

      FROM orders.requests o
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN public.package_types pt ON o.package_type_id = pt.package_type_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.status = 'pending'
          AND o.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM orders.courier_assignments ca
              WHERE ca.order_id = o.order_id
                  AND ca.status NOT IN ('rejected', 'cancelled')
          )
          -- OPTIMIZED: Use computed pickup_point column for spatial query
          AND ST_DWithin(
              o.pickup_point,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              $3 * 1000
          )
      ORDER BY o.created_at ASC
      LIMIT $4
  `,

  // ============ ORDER STATUS UPDATES ============

  // NOTE: UPDATE_ORDER_STATUS, MARK_ORDER_PICKED_UP, and MARK_ORDER_DELIVERED
  // have been removed - these are now handled by Drizzle ORM in orders.repository.ts

  // ============ COURIER ASSIGNMENTS ============

  /**
   * Create courier assignment
   */
  CREATE_COURIER_ASSIGNMENT: `
      INSERT INTO orders.courier_assignments (
          order_id,
          courier_id,
          status
      )
      VALUES (
          $1,
          $2,
          'assigned'
      )
      RETURNING
          assignment_id AS "assignmentId",
          order_id AS "orderId",
          courier_id AS "courierId",
          assigned_at AS "assignedAt"
  `,

  /**
   * Accept assignment (courier accepts order)
   */
  ACCEPT_ASSIGNMENT: `
      UPDATE orders.courier_assignments
      SET
          status = 'accepted',
          accepted_at = NOW(),
          updated_at = NOW()
      WHERE order_id = $1
          AND courier_id = $2
      RETURNING
          assignment_id AS "assignmentId",
          accepted_at AS "acceptedAt"
  `,

  /**
   * Update order status to assigned
   */
  UPDATE_ORDER_STATUS_TO_ASSIGNED: `
      UPDATE orders.requests
      SET
          status = 'accepted',
          accepted_at = NOW(),
          updated_at = NOW()
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
          is_available = false,
          updated_at = NOW()
      WHERE courier_id = $1
  `,

  /**
   * Reject assignment
   */
  REJECT_ASSIGNMENT: `
      UPDATE orders.courier_assignments
      SET
          status = 'rejected',
          rejected_at = NOW(),
          rejection_reason = $3,
          updated_at = NOW()
      WHERE assignment_id = $1
          AND courier_id = $2
      RETURNING assignment_id, rejected_at
  `,

  /**
   * Find courier's active assignments (OPTIMIZED - uses JSONB columns)
   */
  FIND_COURIER_ACTIVE_ASSIGNMENTS: `
      SELECT
          ca.assignment_id,
          ca.order_id,
          o.order_uuid,
          CASE o.status
            WHEN 'pending' THEN 1
            WHEN 'accepted' THEN 2
            WHEN 'picked_up' THEN 3
            WHEN 'in_transit' THEN 4
            WHEN 'delivered' THEN 5
            WHEN 'cancelled' THEN 6
            WHEN 'undeliverable' THEN 7
            WHEN 'returned' THEN 8
          END AS status_id,
          o.status AS order_status,
          CASE ca.status
            WHEN 'assigned' THEN 1
            WHEN 'accepted' THEN 2
            WHEN 'rejected' THEN 3
            WHEN 'picked_up' THEN 4
            WHEN 'in_transit' THEN 5
            WHEN 'delivered' THEN 6
            WHEN 'cancelled' THEN 7
            WHEN 'returned' THEN 8
          END AS assignment_status_id,
          ca.status AS assignment_status,
          -- OPTIMIZED: Pickup location from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          (o.pickup_location->>'latitude')::numeric AS pickup_latitude,
          (o.pickup_location->>'longitude')::numeric AS pickup_longitude,
          -- OPTIMIZED: Delivery location from JSONB
          o.delivery_location->>'fullAddress' AS delivery_address,
          (o.delivery_location->>'latitude')::numeric AS delivery_latitude,
          (o.delivery_location->>'longitude')::numeric AS delivery_longitude,
          o.total_price,
          ca.assigned_at,
          ca.accepted_at
      FROM orders.courier_assignments ca
      JOIN orders.requests o ON ca.order_id = o.order_id
      WHERE ca.courier_id = $1
          AND ca.status NOT IN ('delivered', 'cancelled', 'rejected')
      ORDER BY ca.assigned_at DESC
  `,

};
