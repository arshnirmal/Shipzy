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
      driver_id, started_at, last_location
    ) VALUES (
      $1,
      $2,
      CASE
        WHEN $3::numeric IS NOT NULL AND $4::numeric IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography
        ELSE NULL
      END
    )
    RETURNING
      session_id::int AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes",
      ST_Y(last_location::geometry) AS "lastLocationLat",
      ST_X(last_location::geometry) AS "lastLocationLng",
      created_at AS "createdAt"
  `,

  /**
   * Find active session for a driver (no ended_at)
   */
  FIND_ACTIVE_SESSION: `
    SELECT
      session_id::int AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes",
      ST_Y(last_location::geometry) AS "lastLocationLat",
      ST_X(last_location::geometry) AS "lastLocationLng",
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
      last_location = CASE
        WHEN $3::numeric IS NOT NULL AND $4::numeric IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography
        ELSE last_location
      END
    WHERE session_id = $1
    RETURNING
      session_id::int AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes",
      ST_Y(last_location::geometry) AS "lastLocationLat",
      ST_X(last_location::geometry) AS "lastLocationLng"
      created_at AS "createdAt"
  `,

  /**
   * Get sessions for a driver in date range (for aggregation)
   */
  GET_SESSIONS_IN_RANGE: `
    SELECT
      session_id::int AS "sessionId",
      driver_id AS "driverId",
      started_at AS "startedAt",
      ended_at AS "endedAt",
      total_online_minutes AS "totalOnlineMinutes",
      ST_Y(last_location::geometry) AS "lastLocationLat",
      ST_X(last_location::geometry) AS "lastLocationLng",
      created_at AS "createdAt"
    FROM logistics.driver_sessions
    WHERE driver_id = $1
      AND started_at >= $2
      AND started_at <= $3
    ORDER BY started_at DESC
  `,
};
