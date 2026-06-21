// services/backend/src/modules/drivers/drivers.repository.ts
import { and, eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb, { drizzlePool } from "../../database/drizzle.js";
import driversQueries from "../../database/queries/drivers.queries.js";
import sessionsRepository from "./sessions.repository.js";
import { AppError, ValidationError } from "../../utils/error.util.js";
import { parseDbRow, parseDbRows } from "../../utils/db-parse.util.js";
import type { Coordinates } from "../../schemas/common.zod.js";
import { userProfiles } from "../../database/schema/users.js";
import { courierStatus } from "../../database/schema/logistics.js";
import { vehicleCategories } from "../../database/schema/public.js";

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
import type { SubmitKycRequest, UpdateDriverProfileRequest } from "./drivers.zod.js";
import type { KycJSONB, OnboardingJSONB } from "../../database/schema/types.js";

type Courier = DbCourier;

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
   * Update courier profile and/or vehicle (courier_status JSONB + vehicle_category_id)
   */
  async updateProfile(
    userId: number,
    updateData: UpdateDriverProfileRequest,
  ): Promise<Courier> {
    try {
      const profile = updateData.profile;
      const vehicle = updateData.vehicle;

      const hasProfilePatch =
        profile !== undefined && Object.keys(profile).length > 0;

      await drizzleDb.transaction(async (tx) => {
        if (hasProfilePatch) {
          const { fullName, email, profilePictureUrl, phoneNumber } = profile;
          await tx
            .update(userProfiles)
            .set({
              fullName: fullName ?? undefined,
              email: email ?? undefined,
              profilePictureUrl: profilePictureUrl ?? undefined,
              phoneNumber: phoneNumber ?? undefined,
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, userId));
        }

        if (vehicle) {
          const [cat] = await tx
            .select({ categoryId: vehicleCategories.categoryId })
            .from(vehicleCategories)
            .where(
              and(
                eq(vehicleCategories.categoryId, vehicle.categoryId),
                eq(vehicleCategories.isActive, true),
              ),
            )
            .limit(1);

          if (!cat) {
            throw new ValidationError("Invalid or inactive vehicle category");
          }

          const updatedCs = await tx
            .update(courierStatus)
            .set({
              vehicleCategoryId: vehicle.categoryId,
              vehicle: {
                vehicleNumber: vehicle.vehicleNumber,
                model: vehicle.model,
                year: vehicle.year,
                insuranceExpiry: vehicle.insuranceExpiry,
                registrationDocumentUrl: vehicle.registrationDocumentUrl,
              },
              updatedAt: new Date(),
            })
            .where(eq(courierStatus.courierId, userId))
            .returning({ courierId: courierStatus.courierId });

          if (updatedCs.length === 0) {
            throw new AppError("Courier status not found for user", 500);
          }
        }
      });

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
   * Persist KYC document URLs and mark profile onboarding as pending review.
   */
  async submitKyc(
    userId: number,
    docs: SubmitKycRequest,
  ): Promise<{
    status: string;
    stepsCompleted: string[];
    submittedAt: string;
  }> {
    try {
      const now = new Date();
      const kycPayload: KycJSONB = {
        license: { url: docs.license.url },
        insurance: { url: docs.insurance.url },
        vehicleReg: { url: docs.vehicleReg.url },
      };
      const onboardingPayload: OnboardingJSONB = {
        status: "pending_review",
        stepsCompleted: ["vehicle_details", "documents"],
        submittedAt: now.toISOString(),
      };

      await drizzleDb.transaction(async (tx) => {
        await tx
          .update(courierStatus)
          .set({
            kyc: kycPayload,
            updatedAt: now,
          })
          .where(eq(courierStatus.courierId, userId));

        await tx
          .update(userProfiles)
          .set({
            onboarding: onboardingPayload,
            updatedAt: now,
          })
          .where(eq(userProfiles.userId, userId));
      });

      return {
        status: "pending_review",
        stepsCompleted: ["vehicle_details", "documents"],
        submittedAt: now.toISOString(),
      };
    } catch (error) {
      logger.error({
        msg: "Error submitting KYC",
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
   * Find online, idle couriers within a given radius of a pickup point.
   * Returns an array of courier user IDs.
   */
  async findNearbyCouriers(
    lat: number,
    lng: number,
    radiusKm: number,
    limit: number,
  ): Promise<number[]> {
    const result = await drizzlePool.query<{ courier_id: number }>(
      driversQueries.CALL_FIND_NEARBY_COURIERS,
      [lat, lng, radiusKm, limit],
    );
    return result.rows.map((r) => r.courier_id);
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
