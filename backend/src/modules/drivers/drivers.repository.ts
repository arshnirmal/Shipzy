// services/backend/src/modules/drivers/drivers.repository.ts
import { eq, and, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import db from "../../database/db.js";
import driversQueries from "../../database/queries/drivers.queries.js";
import sessionsRepository, { DriverSession } from "./sessions.repository.js";
import type { Coordinates } from "../../schemas/common.zod.js";
import { userProfiles } from "../../database/schema/users.js";
import { courierStatus } from "../../database/schema/logistics.js";

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
   * Update courier profile (migrated to Drizzle)
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData,
  ): Promise<Courier> {
    try {
      const { fullName, email, profilePictureUrl } = updateData;

      await drizzleDb
        .update(userProfiles)
        .set({
          fullName: fullName || undefined,
          email: email || undefined,
          profilePictureUrl: profilePictureUrl || undefined,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));

      // Fetch updated courier profile (complex query - keep as raw SQL)
      const result = await db.query(driversQueries.FIND_COURIER_BY_USER_ID, [
        userId,
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
   * Update courier availability (migrated to Drizzle)
   */
  async updateAvailability(
    courierId: number,
    isAvailable: boolean,
    isOnline: boolean,
  ): Promise<CourierAvailabilityResult> {
    try {
      const result = await drizzleDb
        .update(courierStatus)
        .set({
          isAvailable,
          isOnline,
          updatedAt: new Date(),
        })
        .where(eq(courierStatus.courierId, courierId))
        .returning({
          courierId: courierStatus.courierId,
          isAvailable: courierStatus.isAvailable,
          isOnline: courierStatus.isOnline,
          updatedAt: courierStatus.updatedAt,
        });

      const row = result[0];
      if (!row) {
        throw new Error("Courier availability update returned no row");
      }

      return row as CourierAvailabilityResult;
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
  async createSession(driverId: number, location?: Coordinates) {
    return sessionsRepository.createSession({
      driverId: driverId,
      startedAt: new Date(),
      lastLocationLat: location?.latitude,
      lastLocationLng: location?.longitude,
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
      sessionId: activeSession.sessionId,
      endedAt: new Date(),
      lastLocationLat: location?.lat,
      lastLocationLng: location?.lng,
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
