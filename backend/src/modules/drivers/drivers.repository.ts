// services/backend/src/modules/drivers/drivers.repository.ts
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import driversQueries from "../../database/queries/drivers.queries.js";
import sessionsRepository, { DriverSession } from "./sessions.repository.js";

import type {
  DbCourier,
  CourierAvailabilityResult,
  CourierLocationResult,
  EarningsSummaryRow,
  CourierAssignmentRow,
} from "../../types/drivers.js";

type Courier = DbCourier;

type UpdateProfileData = {
  fullName?: string;
  email?: string;
  profilePictureUrl?: string;
};

class DriversRepository {
  /**
   * Find courier by user ID
   */
  async findCourierById(userId: number): Promise<Courier | null> {
    try {
      const result = await db.query(driversQueries.FIND_COURIER_BY_USER_ID, [
        userId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding courier by ID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update courier profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData,
  ): Promise<Courier> {
    try {
      const { fullName, email, profilePictureUrl } = updateData;

      const result = await db.query(driversQueries.UPDATE_COURIER_PROFILE, [
        userId,
        fullName || null,
        email || null,
        profilePictureUrl || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error({
        msg: "Error updating courier profile",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update courier availability
   */
  async updateAvailability(
    courierId: number,
    isAvailable: boolean,
    isOnline: boolean,
  ): Promise<CourierAvailabilityResult> {
    try {
      const result = await db.query(
        driversQueries.UPDATE_COURIER_AVAILABILITY,
        [courierId, isAvailable, isOnline],
      );

      return result.rows[0] as CourierAvailabilityResult;
    } catch (error) {
      logger.error({
        msg: "Error updating courier availability",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update courier location
   */
  async updateLocation(
    courierId: number,
    latitude: number,
    longitude: number,
  ): Promise<CourierLocationResult> {
    try {
      const result = await db.query(driversQueries.UPDATE_COURIER_LOCATION, [
        courierId,
        longitude,
        latitude,
      ]);

      return result.rows[0] as CourierLocationResult;
    } catch (error) {
      logger.error({
        msg: "Error updating courier location",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get courier active assignments
   */
  async getActiveAssignments(
    courierId: number,
  ): Promise<CourierAssignmentRow[]> {
    try {
      const result = await db.query(
        driversQueries.FIND_COURIER_ACTIVE_ASSIGNMENTS,
        [courierId],
      );
      return result.rows as CourierAssignmentRow[];
    } catch (error) {
      logger.error({
        msg: "Error getting courier assignments",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get courier earnings summary
   */
  async getEarningsSummary(courierId: number): Promise<EarningsSummaryRow> {
    try {
      const result = await db.query(
        driversQueries.GET_COURIER_EARNINGS_SUMMARY,
        [courierId],
      );
      return result.rows[0] as EarningsSummaryRow;
    } catch (error) {
      logger.error({
        msg: "Error getting courier earnings",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // ============ SESSION MANAGEMENT ============

  /**
   * Create a new driver session
   */
  async createSession(
    driverId: number,
    location?: { lat: number; lng: number },
  ) {
    return sessionsRepository.createSession({
      driver_id: driverId,
      started_at: new Date(),
      last_location_lat: location?.lat,
      last_location_lng: location?.lng,
    });
  }

  /**
   * Find active session for driver
   */
  async findActiveSession(driverId: number) {
    return sessionsRepository.findActiveSession(driverId);
  }

  /**
   * End active session for driver
   */
  async endActiveSession(
    driverId: number,
    location?: { lat: number; lng: number },
  ) {
    const activeSession = await sessionsRepository.findActiveSession(driverId);
    if (!activeSession) return null;

    return sessionsRepository.endSession({
      session_id: activeSession.session_id,
      ended_at: new Date(),
      last_location_lat: location?.lat,
      last_location_lng: location?.lng,
    });
  }

  /**
   * Get sessions for aggregation
   */
  async getSessionsInRange(driverId: number, startDate: Date, endDate: Date) {
    return sessionsRepository.getSessionsInRange(driverId, startDate, endDate);
  }
}

export default new DriversRepository();
