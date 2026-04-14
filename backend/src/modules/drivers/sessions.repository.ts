// services/backend/src/modules/drivers/sessions.repository.ts
import logger from "../../config/logger.js";
import { drizzlePool } from "../../database/drizzle.js";
import sessionsQueries from "../../database/queries/sessions.queries.js";
import {
  DriverSessionDbZ,
  type DriverSessionDb,
} from "../../schemas/db.zod.js";
import { parseDbRow, parseDbRows } from "../../utils/db-parse.util.js";

export type DriverSession = DriverSessionDb;

interface CreateSessionData {
  driverId: number;
  startedAt: Date;
  lastLocationLat?: number;
  lastLocationLng?: number;
}

interface EndSessionData {
  sessionId: number;
  endedAt: Date;
  lastLocationLat?: number;
  lastLocationLng?: number;
}

class SessionsRepository {
  /**
   * Create a new driver session.
   * Resets total_deliveries_today if the last session was before today.
   */
  async createSession(sessionData: CreateSessionData): Promise<DriverSession> {
    try {
      // Reset daily counter if no session started today
      const lastSession = await this.findActiveSession(sessionData.driverId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If no active session and we need to check the last ended one
      if (!lastSession) {
        // Reset total_deliveries_today on new day (non-blocking)
        await drizzlePool.query(
          `UPDATE logistics.courier_status
           SET total_deliveries_today = 0, updated_at = NOW()
           WHERE courier_id = $1
             AND NOT EXISTS (
               SELECT 1 FROM logistics.driver_sessions
               WHERE driver_id = $1 AND started_at::date = CURRENT_DATE
             )`,
          [sessionData.driverId],
        ).catch((err) => {
          logger.warn({
            msg: "Failed to reset daily deliveries counter",
            error: (err as Error).message,
            driverId: sessionData.driverId,
          });
        });
      }

      const result = await drizzlePool.query(sessionsQueries.CREATE_SESSION, [
        sessionData.driverId,
        sessionData.startedAt,
        sessionData.lastLocationLat ?? null,
        sessionData.lastLocationLng ?? null,
      ]);
      return parseDbRow(DriverSessionDbZ, result.rows[0], "driver session");
    } catch (error) {
      logger.error({
        msg: "Error creating driver session",
        error: (error as Error).message,
        driverId: sessionData.driverId,
      });
      throw error;
    }
  }

  /**
   * Find active session for a driver
   */
  async findActiveSession(driverId: number): Promise<DriverSession | null> {
    try {
      const result = await drizzlePool.query(
        sessionsQueries.FIND_ACTIVE_SESSION,
        [driverId],
      );
      const row = result.rows[0];
      if (!row) return null;

      return parseDbRow(DriverSessionDbZ, row, "active driver session");
    } catch (error) {
      logger.error({
        msg: "Error finding active session",
        error: (error as Error).message,
        driverId,
      });
      throw error;
    }
  }

  /**
   * End a driver session
   */
  async endSession(endData: EndSessionData): Promise<DriverSession> {
    try {
      const result = await drizzlePool.query(sessionsQueries.END_SESSION, [
        endData.sessionId,
        endData.endedAt,
        endData.lastLocationLat ?? null,
        endData.lastLocationLng ?? null,
      ]);
      return parseDbRow(
        DriverSessionDbZ,
        result.rows[0],
        "ended driver session",
      );
    } catch (error) {
      logger.error({
        msg: "Error ending driver session",
        error: (error as Error).message,
        sessionId: endData.sessionId,
      });
      throw error;
    }
  }

  /**
   * Get sessions in date range for aggregation
   */
  async getSessionsInRange(
    driverId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<DriverSession[]> {
    try {
      const result = await drizzlePool.query(
        sessionsQueries.GET_SESSIONS_IN_RANGE,
        [driverId, startDate, endDate],
      );

      return parseDbRows(DriverSessionDbZ, result.rows, "driver session range");
    } catch (error) {
      logger.error({
        msg: "Error getting sessions in range",
        error: (error as Error).message,
        driverId,
        startDate,
        endDate,
      });
      throw error;
    }
  }
}

export default new SessionsRepository();
