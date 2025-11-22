// services/backend/src/database/queries/orders.queries.js

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
      SELECT orders.calculate_fare($1, $2, $3, $4) AS result
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
   * Find order by ID with full details
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
          o.vehicle_category_id,
          vc.name AS vehicle_category, 
          vc.display_name AS vehicle_category_display,
          o.package_description,
          o.package_weight_kg,
          o.package_dimensions,
          o.special_instructions,
          o.base_price,
          o.distance_price,
          o.weight_surcharge,
          o.total_price,
          o.payment_method_id,
          pm.name AS payment_method,
          o.created_at,
          o.accepted_at,
          o.picked_up_at,
          o.delivered_at,
          o.cancelled_at,
          o.cancellation_reason,
          
          -- Pickup details
          pl.location_id AS pickup_location_id,
          pl.building_name AS pickup_building,
          pl.floor_number AS pickup_floor,
          pl.room_number AS pickup_flat,
          pl.address AS pickup_address,
          pl.landmark AS pickup_landmark,
          pl.city AS pickup_city,
          pl.state AS pickup_state,
          pl.postal_code AS pickup_postal_code,
          ST_Y(pl.location::geometry) AS pickup_latitude,
          ST_X(pl.location::geometry) AS pickup_longitude,
          o.pickup_contact_name,
          o.pickup_contact_phone,

          -- Delivery details
          dl.location_id AS delivery_location_id,
          dl.building_name AS delivery_building,
          dl.floor_number AS delivery_floor,
          dl.room_number AS delivery_flat,
          dl.address AS delivery_address,
          dl.landmark AS delivery_landmark,
          dl.city AS delivery_city,
          dl.state AS delivery_state,
          dl.postal_code AS delivery_postal_code,
          ST_Y(dl.location::geometry) AS delivery_latitude,
          ST_X(dl.location::geometry) AS delivery_longitude,
          o.delivery_contact_name,
          o.delivery_contact_phone,
          
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
      JOIN public.payment_methods pm ON o.payment_method_id = pm.method_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      JOIN users.profiles u ON o.client_id = u.user_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      LEFT JOIN public.assignment_statuses ast ON ca.assignment_status_id = ast.status_id
      WHERE o.order_id = $1
      AND o.deleted_at IS NULL

  `,

  /**
   * Find orders by client (user's orders)
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
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          o.package_description,
          o.total_price,
          o.created_at,
          pl.address AS pickup_address,
          dl.address AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
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
          o.total_price,
          o.package_description,
          o.package_weight_kg,
          o.created_at,

          -- Pickup location
          pl.address AS pickup_address,
          pl.landmark AS pickup_landmark,
          ST_Y(pl.location::geometry) AS pickup_latitude,
          ST_X(pl.location::geometry) AS pickup_longitude,

          -- Delivery location
          dl.address AS delivery_address,

          -- Distance from courier
          ROUND(
              ST_Distance(
                  pl.location,
                  ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
              )::numeric / 1000, 2
          ) AS distance_from_courier_km,

          -- Estimated distance between pickup and delivery
          o.estimated_distance_km

      FROM orders.requests o
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
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
          AND ST_DWithin(
              pl.location,
              ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
              $4 * 1000
          )
      ORDER BY o.created_at ASC
      LIMIT $5
  `,

  // ============ ORDER STATUS UPDATES ============

  /**
   * Update order status
   */
  UPDATE_ORDER_STATUS: `
      UPDATE orders.requests
      SET 
          status_id = $2,
          updated_at = NOW()
      WHERE order_id = $1
      RETURNING order_id, status_id, updated_at
  `,

  /**
   * Mark order as picked up
   */
  MARK_ORDER_PICKED_UP: `
      UPDATE orders.requests
      SET 
          status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'picked_up'),
          actual_pickup_time = NOW(),
          picked_up_at = NOW(),
          updated_at = NOW()
      WHERE order_id = $1
      RETURNING order_id, picked_up_at
  `,

  /**
   * Mark order as delivered
   */
  MARK_ORDER_DELIVERED: `
      UPDATE orders.requests
      SET 
          status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'delivered'),
          actual_delivery_time = NOW(),
          delivered_at = NOW(),
          updated_at = NOW()
      WHERE order_id = $1
      RETURNING order_id, delivered_at
  `,

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
          status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'assigned'),
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
   * Find courier's active assignments
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
          pl.address AS pickup_address,
          ST_Y(pl.location::geometry) AS pickup_latitude,
          ST_X(pl.location::geometry) AS pickup_longitude,
          dl.address AS delivery_address,
          ST_Y(dl.location::geometry) AS delivery_latitude,
          ST_X(dl.location::geometry) AS delivery_longitude,
          o.total_price,
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

  /**
   * Find active orders by client (pending, accepted, picked_up)
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
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          o.package_description,
          o.total_price,
          o.created_at,
          pl.address AS pickup_address,
          dl.address AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
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
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          o.package_description,
          o.total_price,
          o.created_at,
          pl.address AS pickup_address,
          dl.address AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
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
   * Find cancelled orders by client (cancelled, failed)
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
          o.vehicle_category_id,
          vc.name AS vehicle_category,
          o.package_description,
          o.total_price,
          o.created_at,
          pl.address AS pickup_address,
          dl.address AS delivery_address,
          ca.courier_id,
          cu.full_name AS courier_name,
          cu.profile_picture_url AS courier_photo
      FROM orders.requests o
      JOIN public.order_statuses os ON o.status_id = os.status_id
      JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
      JOIN public.vehicle_categories vc ON o.vehicle_category_id = vc.category_id
      JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
      JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
      LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
      LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
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
