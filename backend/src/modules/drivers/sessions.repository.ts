// services/backend/src/modules/drivers/sessions.repository.ts
import logger from "../../config/logger";
import db from "../../database/db";
import sessionsQueries from "../../database/queries/sessions.queries";

export interface DriverSession {
  session_id: number;
  driver_id: number;
  started_at: Date;
  ended_at?: Date;
  total_online_minutes?: number;
  last_location_lat?: number;
  last_location_lng?: number;
  created_at: Date;
}

interface CreateSessionData {
  driver_id: number;
  started_at: Date;
  last_location_lat?: number;
  last_location_lng?: number;
}

interface EndSessionData {
  session_id: number;
  ended_at: Date;
  last_location_lat?: number;
  last_location_lng?: number;
}

class SessionsRepository {
  /**
   * Create a new driver session
   */
  async createSession(sessionData: CreateSessionData): Promise<DriverSession> {
    try {
      const result = await db.query(sessionsQueries.CREATE_SESSION, [
        sessionData.driver_id,
        sessionData.started_at,
        sessionData.last_location_lat || null,
        sessionData.last_location_lng || null,
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error({
        msg: "Error creating driver session",
        error: (error as Error).message,
        driverId: sessionData.driver_id,
      });
      throw error;
    }
  }

  /**
   * Find active session for a driver
   */
  async findActiveSession(driverId: number): Promise<DriverSession | null> {
    try {
      const result = await db.query(sessionsQueries.FIND_ACTIVE_SESSION, [driverId]);
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
        endData.session_id,
        endData.ended_at,
        endData.last_location_lat || null,
        endData.last_location_lng || null,
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error({
        msg: "Error ending driver session",
        error: (error as Error).message,
        sessionId: endData.session_id,
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
    endDate: Date
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
