// services/backend/src/modules/drivers/sessions.repository.ts
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import sessionsQueries from "../../database/queries/sessions.queries.js";

export interface DriverSession {
  sessionId: number;
  driverId: number;
  startedAt: Date;
  endedAt?: Date;
  totalOnlineMinutes?: number;
  lastLocationLat?: number;
  lastLocationLng?: number;
  createdAt: Date;
}

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
   * Create a new driver session
   */
  async createSession(sessionData: CreateSessionData): Promise<DriverSession> {
    try {
      const result = await db.query(sessionsQueries.CREATE_SESSION, [
        sessionData.driverId,
        sessionData.startedAt,
        sessionData.lastLocationLat || null,
        sessionData.lastLocationLng || null,
      ]);
      return result.rows[0];
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
      const result = await db.query(sessionsQueries.FIND_ACTIVE_SESSION, [
        driverId,
      ]);
      return result.rows[0] || null;
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
      const result = await db.query(sessionsQueries.END_SESSION, [
        endData.sessionId,
        endData.endedAt,
        endData.lastLocationLat || null,
        endData.lastLocationLng || null,
      ]);
      return result.rows[0];
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
      const result = await db.query(sessionsQueries.GET_SESSIONS_IN_RANGE, [
        driverId,
        startDate,
        endDate,
      ]);
      return result.rows;
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
