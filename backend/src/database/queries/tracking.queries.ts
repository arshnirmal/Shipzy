// services/backend/src/database/queries/tracking.queries.js

/**
 * Tracking and location queries
 */

export default {
  // ============ FUNCTION CALLS ============
  
  /**
   * Call stored function: Get order tracking as GeoJSON
   */
  CALL_GET_TRACKING_GEOJSON: `
      SELECT tracking.get_order_tracking_geojson($1, $2, $3) AS result
  `,
  
  // ============ TRACKING EVENTS ============
  
  /**
   * Add tracking event (location update)
   */
  ADD_TRACKING_EVENT: `
      INSERT INTO tracking.events (
          assignment_id,
          order_id,
          courier_id,
          event_type,
          location,
          latitude,
          longitude,
          accuracy_meters,
          speed_kmph,
          bearing_degrees,
          event_description,
          metadata
      )
      VALUES (
          $1, $2, $3, $4,
          ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography,
          $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING event_id, timestamp
  `,
  
  /**
   * Get latest tracking event for order
   */
  GET_LATEST_TRACKING_EVENT: `
      SELECT 
          te.event_id,
          te.event_type,
          ST_Y(te.location::geometry) AS latitude,
          ST_X(te.location::geometry) AS longitude,
          te.speed_kmph,
          te.bearing_degrees,
          te.timestamp
      FROM tracking.events te
      WHERE te.order_id = $1
      ORDER BY te.timestamp DESC
      LIMIT 1
  `,
  
  /**
   * Get tracking events for order (paginated)
   */
  GET_ORDER_TRACKING_EVENTS: `
      SELECT 
          te.event_id,
          te.event_type,
          ST_Y(te.location::geometry) AS latitude,
          ST_X(te.location::geometry) AS longitude,
          te.speed_kmph,
          te.bearing_degrees,
          te.accuracy_meters,
          te.timestamp
      FROM tracking.events te
      WHERE te.order_id = $1
      ORDER BY te.timestamp DESC
      LIMIT $2 OFFSET $3
  `,
  
  /**
   * Count tracking events for order
   */
  COUNT_TRACKING_EVENTS: `
      SELECT COUNT(*) AS total_events
      FROM tracking.events
      WHERE order_id = $1
  `,
};
