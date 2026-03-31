// services/backend/src/database/queries/sessions.queries.ts

/**
 * Driver sessions-related queries
 * Tracks online time when drivers are available and online
 */

export default {
  /**
   * Create a new driver session
   */
  CREATE_SESSION: `
    INSERT INTO logistics.driver_sessions (
      driver_id, started_at, last_location_lat, last_location_lng
    ) VALUES ($1, $2, $3, $4)
    RETURNING
      session_id AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      last_location_lat AS "lastLocationLat",
      last_location_lng AS "lastLocationLng",
      created_at AS "createdAt"
  `,

  /**
   * Find active session for a driver (no ended_at)
   */
  FIND_ACTIVE_SESSION: `
    SELECT
      session_id AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      last_location_lat AS "lastLocationLat",
      last_location_lng AS "lastLocationLng",
      created_at AS "createdAt"
    FROM logistics.driver_sessions
    WHERE driver_id = $1 AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
  `,

  /**
   * End a driver session and calculate total minutes
   */
  END_SESSION: `
    UPDATE logistics.driver_sessions
    SET
      ended_at = $2,
      total_online_minutes = EXTRACT(EPOCH FROM ($2 - started_at)) / 60,
      last_location_lat = COALESCE($3, last_location_lat),
      last_location_lng = COALESCE($4, last_location_lng)
    WHERE session_id = $1
    RETURNING
      session_id AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes"
  `,

  /**
   * Get sessions for a driver in date range (for aggregation)
   */
  GET_SESSIONS_IN_RANGE: `
    SELECT
      session_id AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes",
      last_location_lat AS "lastLocationLat",
      last_location_lng AS "lastLocationLng",
      created_at AS "createdAt"
    FROM logistics.driver_sessions
    WHERE driver_id = $1
      AND started_at >= $2
      AND started_at <= $3
    ORDER BY started_at DESC
  `,
};
