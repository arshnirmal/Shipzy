// services/backend/src/modules/drivers/drivers.repository.ts
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb, { drizzlePool } from "../../database/drizzle.js";
import driversQueries from "../../database/queries/drivers.queries.js";
import sessionsRepository from "./sessions.repository.js";
import { AppError } from "../../utils/error.util.js";
import { parseDbRow, parseDbRows } from "../../utils/db-parse.util.js";
import type { Coordinates } from "../../schemas/common.zod.js";
import { userProfiles } from "../../database/schema/users.js";
import { courierStatus } from "../../database/schema/logistics.js";

import {
  CourierAssignmentDbZ,
  CourierAvailabilityDbZ,
  CourierDbZ,
  CourierLocationDbZ,
  EarningsSummaryDbZ,
  TripHistoryRowDbZ,
} from "../../types/drivers.js";
import type {
  DbCourier,
  CourierAvailabilityResult,
  CourierLocationResult,
  EarningsSummaryRow,
  CourierAssignmentRow,
  TripHistoryRow,
} from "../../types/drivers.js";

type Courier = DbCourier;

type UpdateProfileData = {
  fullName?: string;
  email?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
};

class DriversRepository {
  /**
   * Find courier by user ID
   */
  async findCourierById(userId: number): Promise<Courier | null> {
    try {
      const result = await drizzlePool.query(
        driversQueries.FIND_COURIER_BY_USER_ID,
        [userId],
      );
      const row = result.rows[0];
      if (!row) return null;

      return parseDbRow(CourierDbZ, row, "courier profile");
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
      const { fullName, email, profilePictureUrl, phoneNumber } = updateData;

      await drizzleDb
        .update(userProfiles)
        .set({
          fullName: fullName ?? undefined,
          email: email ?? undefined,
          profilePictureUrl: profilePictureUrl ?? undefined,
          phoneNumber: phoneNumber ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));

      // Fetch updated courier profile (complex query - keep as raw SQL)
      const result = await drizzlePool.query(
        driversQueries.FIND_COURIER_BY_USER_ID,
        [userId],
      );

      const row = result.rows[0];
      if (!row) {
        throw new AppError("Updated courier profile row not found", 500);
      }

      return parseDbRow(CourierDbZ, row, "updated courier profile");
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
        throw new AppError("Courier availability update returned no row", 500);
      }

      return parseDbRow(CourierAvailabilityDbZ, row, "courier availability");
    } catch (error) {
      logger.error({
        msg: "Error updating courier availability",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update courier location with optional location meta (speed, bearing, accuracy)
   */
  async updateLocation(
    courierId: number,
    latitude: number,
    longitude: number,
    locationMeta?: { speed?: number | null; bearing?: number | null; accuracy?: number | null } | null,
  ): Promise<CourierLocationResult> {
    try {
      const metaJson = locationMeta
        ? JSON.stringify({
            speed: locationMeta.speed ?? null,
            bearing: locationMeta.bearing ?? null,
            accuracy: locationMeta.accuracy ?? null,
          })
        : null;

      const result = await drizzlePool.query(
        driversQueries.UPDATE_COURIER_LOCATION,
        [courierId, longitude, latitude, metaJson],
      );

      return parseDbRow(CourierLocationDbZ, result.rows[0], "courier location");
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
      const result = await drizzlePool.query(
        driversQueries.FIND_COURIER_ACTIVE_ASSIGNMENTS,
        [courierId],
      );

      return parseDbRows(
        CourierAssignmentDbZ,
        result.rows,
        "courier assignment",
      );
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
      const result = await drizzlePool.query(
        driversQueries.GET_COURIER_EARNINGS_SUMMARY,
        [courierId],
      );

      return parseDbRow(
        EarningsSummaryDbZ,
        result.rows[0],
        "courier earnings summary",
      );
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

  /**
   * Mark courier offline if last_location_update is stale (fire-and-forget safe).
   * Returns true if the row was updated (courier was online and went stale).
   */
  async markOfflineIfStale(
    courierId: number,
    staleThresholdMinutes = 10,
  ): Promise<boolean> {
    try {
      const result = await drizzlePool.query(
        driversQueries.MARK_COURIER_OFFLINE_IF_STALE,
        [courierId, staleThresholdMinutes],
      );
      return result.rowCount != null && result.rowCount > 0;
    } catch (error) {
      logger.error({
        msg: "Error in markOfflineIfStale",
        courierId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get paginated trip history for a courier
   */
  async getTripHistory(
    courierId: number,
    limit: number,
    offset: number,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{ rows: TripHistoryRow[]; total: number }> {
    try {
      const result = await drizzlePool.query(
        driversQueries.GET_COURIER_TRIP_HISTORY,
        [courierId, limit, offset, dateFrom ?? null, dateTo ?? null],
      );

      const rows = parseDbRows(TripHistoryRowDbZ, result.rows, "trip history");
      const total = rows.length > 0 ? Number(rows[0]?.totalCount ?? 0) : 0;
      return { rows, total };
    } catch (error) {
      logger.error({
        msg: "Error getting courier trip history",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new DriversRepository();
