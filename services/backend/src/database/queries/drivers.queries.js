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
  FIND_COURIER_BY_ID: `
      SELECT 
          u.user_id,
          u.user_uuid,
          u.phone_number,
          u.full_name,
          u.email,
          u.profile_picture_url,
          u.is_verified,
          u.is_active,
          cs.is_available,
          cs.is_online,
          cs.total_deliveries_today,
          cs.last_location_update,
          cv.vehicle_number,
          cv.model AS vehicle_model,
          vc.name AS vehicle_category
      FROM users.profiles u
      LEFT JOIN logistics.courier_status cs ON u.user_id = cs.courier_id
      LEFT JOIN logistics.courier_vehicles cv ON u.user_id = cv.courier_id AND cv.is_active = true
      LEFT JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
      WHERE u.user_id = $1
          AND u.role_id = (SELECT role_id FROM public.user_roles WHERE name = 'courier')
          AND u.deleted_at IS NULL
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
  
  /**
   * Toggle courier online/offline
   */
  TOGGLE_COURIER_ONLINE_STATUS: `
      UPDATE logistics.courier_status
      SET 
          is_online = NOT is_online,
          updated_at = NOW()
      WHERE courier_id = $1
      RETURNING courier_id, is_online, updated_at
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
  
  // ============ FUNCTION CALLS ============
  
  /**
   * Call stored function: Find nearby couriers
   */
  CALL_FIND_NEARBY_COURIERS: `
      SELECT * FROM logistics.find_nearby_couriers($1, $2, $3, $4)
  `,
};
