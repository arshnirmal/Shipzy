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
      o.order_id,
      o.order_uuid,
      o.order_number,
      o.client_id,
      u.full_name AS client_name,
      u.phone_number AS client_phone,
      o.status_id,
      os.name AS status_name,
      o.delivery_type_id,
      dt.name AS delivery_type,
      dt.display_name AS delivery_type_display,
      o.vehicle_category_id,
          vc.name AS vehicle_category, 
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.package_type_id,
          o.special_instructions,
          o.base_price,
          o.distance_price,
          o.weight_surcharge,
          o.platform_fee,
          o.special_handling_fee,
          o.gst_amount,
          o.subtotal_before_tax,
          o.total_price,
          o.estimated_distance_km,
          o.actual_distance_km,
          o.actual_pickup_time,
          o.actual_delivery_time,
          o.payment_method_id,
          pm.name AS payment_method,
          o.created_at,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          o.cancelled_at,
          o.cancellation_reason,
          
          -- Weight tier details
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max,
          
          -- OPTIMIZED: Pickup details from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.pickup_location->>'building' AS pickup_building,
          o.pickup_location->>'floor' AS pickup_floor,
          o.pickup_location->>'flatNumber' AS pickup_flat,
          o.pickup_location->>'landmark' AS pickup_landmark,
          o.pickup_location->>'city' AS pickup_city,
          o.pickup_location->>'state' AS pickup_state,
          o.pickup_location->>'postalCode' AS pickup_postal_code,
          (o.pickup_location->>'latitude')::numeric AS pickup_latitude,
          (o.pickup_location->>'longitude')::numeric AS pickup_longitude,
          o.pickup_location->>'contactName' AS pickup_contact_name,
          o.pickup_location->>'contactPhone' AS pickup_contact_phone,

          -- OPTIMIZED: Delivery details from JSONB
          o.delivery_location->>'fullAddress' AS delivery_address,
          o.delivery_location->>'building' AS delivery_building,
          o.delivery_location->>'floor' AS delivery_floor,
          o.delivery_location->>'flatNumber' AS delivery_flat,
          o.delivery_location->>'landmark' AS delivery_landmark,
          o.delivery_location->>'city' AS delivery_city,
          o.delivery_location->>'state' AS delivery_state,
          o.delivery_location->>'postalCode' AS delivery_postal_code,
          (o.delivery_location->>'latitude')::numeric AS delivery_latitude,
          (o.delivery_location->>'longitude')::numeric AS delivery_longitude,
          o.delivery_location->>'contactName' AS delivery_contact_name,
          o.delivery_location->>'contactPhone' AS delivery_contact_phone,
          
          -- OPTIMIZED: Items and labels from JSONB
          o.items AS order_items,
          o.labels AS order_labels,
          
          -- Courier details (if assigned)
          ca.assignment_id,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.phone_number AS courier_phone,
          cu.profile_picture_url AS courier_photo,
          ca.assignment_status_id,
          ast.name AS assignment_status,
          ca.assigned_at,
          ca.accepted_at AS courier_accepted_at
          
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN payments.payment_methods pm ON o.payment_method_id = pm.method_id
      JOIN users.profiles u ON o.client_id = u.user_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.assignment_statuses ast ON ca.assignment_status_id = ast.status_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.order_id = $1
      AND o.deleted_at IS NULL

  `,

  /**
   * Find orders by client (user's orders) - OPTIMIZED (uses JSONB columns)
   */
  FIND_ORDERS_BY_CLIENT: `
      SELECT
          o.order_id,
          o.order_uuid,
          o.order_number,
          o.status_id,
          os.name AS status_name,
          o.delivery_type_id,
          dt.name AS delivery_type,
          dt.display_name AS delivery_type_display,
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.estimated_distance_km,
          o.actual_distance_km,
          o.total_price,
          o.created_at,
          o.actual_pickup_time,
          o.actual_delivery_time,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          -- OPTIMIZED: Locations from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.delivery_location->>'fullAddress' AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo,
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
  `,

  /**
   * Count total orders for client
   */
  COUNT_ORDERS_BY_CLIENT: `
      SELECT COUNT(*) AS total
      FROM orders.requests
      WHERE client_id = $1
          AND deleted_at IS NULL
  `,

  /**
   * Find available orders for courier (within radius)
   */
  FIND_AVAILABLE_ORDERS_FOR_COURIER: `
      SELECT
          o.order_id,
          o.order_uuid,
          o.order_number,
          o.delivery_type_id,
          dt.name AS delivery_type,
          dt.display_name AS delivery_type_display,
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          o.package_type_id,
          pt.name AS package_type,
          o.weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max,
          -- Pricing details
          o.base_price,
          o.distance_price,
          o.weight_surcharge,
          o.platform_fee,
          o.special_handling_fee,
          o.gst_amount,
          o.subtotal_before_tax,
          o.total_price,

          o.package_description,
          o.special_instructions,
          o.estimated_distance_km,
          o.created_at,

          -- OPTIMIZED: Pickup location from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.pickup_location->>'landmark' AS pickup_landmark,
          o.pickup_location->>'city' AS pickup_city,
          o.pickup_location->>'state' AS pickup_state,
          (o.pickup_location->>'latitude')::numeric AS pickup_latitude,
          (o.pickup_location->>'longitude')::numeric AS pickup_longitude,

          -- OPTIMIZED: Delivery location from JSONB
          o.delivery_location->>'fullAddress' AS delivery_address,
          o.delivery_location->>'landmark' AS delivery_landmark,
          o.delivery_location->>'city' AS delivery_city,
          o.delivery_location->>'state' AS delivery_state,
          o.delivery_location->>'postalCode' AS delivery_postal_code,
          (o.delivery_location->>'latitude')::numeric AS delivery_latitude,
          (o.delivery_location->>'longitude')::numeric AS delivery_longitude,

          -- OPTIMIZED: Distance from courier using computed PostGIS column (pickup_point)
          ROUND(
              ST_Distance(
                  o.pickup_point,
                  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
              )::numeric / 1000, 2
          ) AS distance_from_courier_km

      FROM orders.requests o
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN public.package_types pt ON o.package_type_id = pt.package_type_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'pending')
          AND o.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM orders.courier_assignments ca
              WHERE ca.order_id = o.order_id
                  AND ca.assignment_status_id NOT IN (
                      SELECT status_id FROM public.assignment_statuses
                      WHERE name IN ('rejected', 'cancelled')
                  )
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
          assignment_status_id
      )
      VALUES (
          $1,
          $2,
          (SELECT status_id FROM public.assignment_statuses WHERE name = 'assigned')
      )
      RETURNING assignment_id, order_id, courier_id, assigned_at
  `,

  /**
   * Accept assignment (courier accepts order)
   */
  ACCEPT_ASSIGNMENT: `
      UPDATE orders.courier_assignments
      SET
          assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'accepted'),
          accepted_at = NOW(),
          updated_at = NOW()
      WHERE order_id = $1
          AND courier_id = $2
      RETURNING assignment_id, accepted_at
  `,

  /**
   * Update order status to assigned
   */
  UPDATE_ORDER_STATUS_TO_ASSIGNED: `
      UPDATE orders.requests
      SET
          status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'accepted'),
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
          assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'rejected'),
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
          o.status_id,
          os.name AS order_status,
          ca.assignment_status_id,
          ast.name AS assignment_status,
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
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.assignment_statuses ast ON ca.assignment_status_id = ast.status_id
      WHERE ca.courier_id = $1
          AND ca.assignment_status_id NOT IN (
              SELECT status_id FROM public.assignment_statuses 
              WHERE name IN ('delivered', 'cancelled', 'rejected')
          )
      ORDER BY ca.assigned_at DESC
  `,

  /**
   * Find active orders by client (pending, accepted, picked_up) - OPTIMIZED (uses JSONB)
   */
  FIND_ACTIVE_ORDERS_BY_CLIENT: `
      SELECT
          o.order_id,
          o.order_uuid,
          o.order_number,
          o.status_id,
          os.name AS status_name,
          o.delivery_type_id,
          dt.name AS delivery_type,
          dt.display_name AS delivery_type_display,
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.estimated_distance_km,
          o.actual_distance_km,
          o.total_price,
          o.created_at,
          o.actual_pickup_time,
          o.actual_delivery_time,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          -- OPTIMIZED: Locations from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.delivery_location->>'fullAddress' AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo,
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name IN ('pending', 'accepted', 'picked_up')
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
  `,

  /**
   * Count active orders for client
   */
  COUNT_ACTIVE_ORDERS_BY_CLIENT: `
      SELECT COUNT(*) AS total
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name IN ('pending', 'accepted', 'picked_up')
  `,

  /**
   * Find completed orders by client (delivered)
   */
  FIND_COMPLETED_ORDERS_BY_CLIENT: `
      SELECT
          o.order_id,
          o.order_uuid,
          o.order_number,
          o.status_id,
          os.name AS status_name,
          o.delivery_type_id,
          dt.name AS delivery_type,
          dt.display_name AS delivery_type_display,
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.estimated_distance_km,
          o.actual_distance_km,
          o.total_price,
          o.created_at,
          o.actual_pickup_time,
          o.actual_delivery_time,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          pl.address AS pickup_address,
          dl.address AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo,
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name = 'delivered'
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
  `,

  /**
   * Count completed orders for client
   */
  COUNT_COMPLETED_ORDERS_BY_CLIENT: `
      SELECT COUNT(*) AS total
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name = 'delivered'
  `,

  /**
   * Find cancelled orders by client (cancelled, failed) - OPTIMIZED (uses JSONB)
   */
  FIND_CANCELLED_ORDERS_BY_CLIENT: `
      SELECT
          o.order_id,
          o.order_uuid,
          o.order_number,
          o.status_id,
          os.name AS status_name,
          o.delivery_type_id,
          dt.name AS delivery_type,
          dt.display_name AS delivery_type_display,
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.estimated_distance_km,
          o.actual_distance_km,
          o.total_price,
          o.created_at,
          o.actual_pickup_time,
          o.actual_delivery_time,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          -- OPTIMIZED: Locations from JSONB
          o.pickup_location->>'fullAddress' AS pickup_address,
          o.delivery_location->>'fullAddress' AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo,
          wt.tier_id AS weight_tier_id,
          wt.name AS weight_tier_name,
          wt.min_weight_kg AS weight_tier_min,
          wt.max_weight_kg AS weight_tier_max
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.weight_tiers wt ON o.weight_tier_id = wt.tier_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name IN ('cancelled', 'failed')
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
  `,

  /**
   * Count cancelled orders for client
   */
  COUNT_CANCELLED_ORDERS_BY_CLIENT: `
      SELECT COUNT(*) AS total
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          AND os.name IN ('cancelled', 'failed')
  `,
};
