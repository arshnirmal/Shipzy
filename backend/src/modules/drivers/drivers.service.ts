// services/backend/src/modules/drivers/drivers.service.ts
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import {
  toIsoDateTime,
  toIsoDateTimeOrNull,
} from "../../utils/datetime.util.js";
import driversRepository from "./drivers.repository.js";

import type {
  ActiveAssignmentsResponse,
  ActiveAssignment,
  DriverAvailabilityResponse,
  DriverEarningsSummary,
  EarningsPeriodQuery,
  DriverLocationResponse,
  DriverProfileMutationResponse,
  DriverProfileResponse,
  UpdateDriverProfileRequest,
  UpdateLocationRequest,
} from "./drivers.zod.js";

type UpdateProfileData = UpdateDriverProfileRequest["profile"];
type UpdateAvailabilityData =
  import("./drivers.zod.js").UpdateAvailabilityRequest;
type LocationData = UpdateLocationRequest["location"]["current"];

type DriverProfile = DriverProfileResponse["driver"];

class DriversService {
  private mapDriverCore(
    driver: import("../../types/drivers.js").DbCourier,
  ): DriverProfileMutationResponse["driver"] {
    const hasCurrentLocation =
      driver.currentLatitude != null && driver.currentLongitude != null;

    return {
      userId: driver.userId,
      userUuid: driver.userUuid,
      phoneNumber: driver.phoneNumber ?? null,
      fullName: driver.fullName,
      email: driver.email ?? null,
      role: "courier",
      profilePictureUrl: driver.profilePictureUrl ?? null,
      isVerified: driver.isVerified,
      isActive: driver.isActive,
      status: {
        isAvailable: driver.isAvailable,
        isOnline: driver.isOnline,
        totalDeliveriesToday: driver.totalDeliveriesToday,
        currentLocation: hasCurrentLocation
          ? {
              latitude: Number(driver.currentLatitude),
              longitude: Number(driver.currentLongitude),
            }
          : null,
        lastLocationUpdate: toIsoDateTimeOrNull(driver.lastLocationUpdate),
      },
      vehicle: driver.vehicleId
        ? {
            vehicleId: driver.vehicleId,
            categoryId: driver.vehicleCategoryId ?? undefined,
            category: driver.vehicleCategory || "",
            isActive: Boolean(driver.vehicleIsActive),
            vehicleNumber: driver.vehicleNumber || "",
            model: driver.vehicleModel || "",
            year: driver.vehicleYear || 0,
          }
        : null,
      createdAt: toIsoDateTime(driver.createdAt),
      updatedAt: toIsoDateTime(driver.updatedAt),
    };
  }

  private mapDriverProfile(
    driver: import("../../types/drivers.js").DbCourier,
  ): DriverProfile {
    const core = this.mapDriverCore(driver);

    return {
      ...core,
      earnings: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        averageOrderValue: 0,
        totalDistanceKm: 0,
      },
      rating: {
        averageRating: driver.avgRating != null ? Number(driver.avgRating) : 0,
        totalRatings: driver.totalRatings ?? 0,
      },
    };
  }

  /**
   * Get driver profile
   */
  async getDriverProfile(userId: number): Promise<DriverProfileResponse> {
    try {
      const driver = await driversRepository.findCourierById(userId);

      if (!driver) {
        throw new NotFoundError("Driver profile not found");
      }

      return {
        driver: this.mapDriverProfile(driver),
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver profile",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update driver profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData,
  ): Promise<DriverProfileMutationResponse> {
    try {
      // Validate role is courier
      const driver = await driversRepository.findCourierById(userId);
      if (!driver) {
        throw new AuthorizationError("Only drivers can update driver profile");
      }

      const updatedDriver = await driversRepository.updateProfile(
        userId,
        updateData,
      );

      return {
        driver: this.mapDriverCore(updatedDriver),
      };
    } catch (error) {
      logger.error({
        msg: "Error updating driver profile",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update driver availability and manage sessions
   */
  async updateAvailability(
    userId: number,
    availabilityData: UpdateAvailabilityData,
  ): Promise<DriverAvailabilityResponse> {
    try {
      const {
        availability: { isAvailable, isOnline = false },
        tracking,
      } = availabilityData;
      const currentLocation = tracking?.currentLocation;

      // Get current status before update
      const currentProfile = await driversRepository.findCourierById(userId);
      if (!currentProfile) {
        throw new NotFoundError("Driver profile not found");
      }

      const currentIsOnline = currentProfile.isOnline;
      const currentIsAvailable = currentProfile.isAvailable;

      // Update availability in database
      const result = await driversRepository.updateAvailability(
        userId,
        isAvailable,
        isOnline,
      );

      // Update location if provided (this updates lastActiveLocation)
      if (currentLocation) {
        // Explicitly cast to prevent potential global Location type collision and use correct args
        const loc = currentLocation as { latitude: number; longitude: number };
        await driversRepository.updateLocation(
          userId,
          loc.latitude,
          loc.longitude,
        );
      }

      // Session management logic:
      // Start session when driver becomes Online AND Available
      if (
        isOnline &&
        isAvailable &&
        (!currentIsOnline || !currentIsAvailable)
      ) {
        const loc = currentLocation as
          | { latitude: number; longitude: number }
          | undefined;
        await driversRepository.createSession(userId, loc);
      }
      // End session when driver goes offline OR becomes unavailable while online
      else if (
        (!isOnline || (currentIsOnline && !isAvailable)) &&
        (currentIsOnline || currentIsAvailable)
      ) {
        const loc = currentLocation as
          | { latitude: number; longitude: number }
          | undefined;
        await driversRepository.endActiveSession(
          userId,
          loc ? { lat: loc.latitude, lng: loc.longitude } : undefined,
        );
      }

      return {
        availability: {
          courierId: result.courierId,
          isAvailable: result.isAvailable,
          isOnline: result.isOnline,
          updatedAt: toIsoDateTime(result.updatedAt),
        },
        tracking: currentLocation
          ? {
              currentLocation,
            }
          : undefined,
      };
    } catch (error) {
      logger.error({
        msg: "Error updating driver availability",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update driver location
   */
  async updateLocation(
    userId: number,
    locationData: LocationData,
  ): Promise<DriverLocationResponse> {
    try {
      const { latitude, longitude } = locationData;

      // Validate coordinates
      if (latitude < -90 || latitude > 90) {
        throw new ValidationError("Invalid latitude");
      }
      if (longitude < -180 || longitude > 180) {
        throw new ValidationError("Invalid longitude");
      }

      const result = await driversRepository.updateLocation(
        userId,
        latitude,
        longitude,
      );

      return {
        location: {
          courierId: result.courierId,
          current: {
            latitude: Number(result.latitude),
            longitude: Number(result.longitude),
          },
          lastLocationUpdate: toIsoDateTime(result.lastLocationUpdate),
        },
      };
    } catch (error) {
      logger.error({
        msg: "Error updating driver location",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get driver active assignments
   */
  async getActiveAssignments(
    userId: number,
  ): Promise<ActiveAssignmentsResponse> {
    try {
      const assignments = await driversRepository.getActiveAssignments(userId);

      // Calculate earnings for all assignments
      const assignmentsWithEarnings: ActiveAssignment[] = await Promise.all(
        assignments.map(async (assignment) => {
          const earnings = await this.calculateDriverEarnings(assignment);
          const snap = assignment.snapshot;
          const estimatedDistanceKm =
            assignment.estimatedDistanceKm != null
              ? Number(assignment.estimatedDistanceKm)
              : null;
          const actualDistanceKm =
            assignment.actualDistanceKm != null
              ? Number(assignment.actualDistanceKm)
              : null;

          return {
            assignment: {
              assignmentId: assignment.assignmentId,
              orderId: assignment.orderId,
              orderUuid: assignment.orderUuid ?? null,
              orderNumber: assignment.orderNumber ?? null,
            },
            status: {
              order: assignment.orderStatus ?? null,
              assignment: assignment.assignmentStatus ?? null,
            },
            routing: {
              pickup: assignment.pickup ?? null,
              delivery: assignment.delivery ?? null,
              estimatedDistanceKm,
              actualDistanceKm,
              estimatedDeliveryMinutes: Math.ceil(
                ((estimatedDistanceKm ?? 10) / 25) * 60,
              ),
            },
            snapshot: {
              deliveryType: snap?.deliveryType,
              vehicleCategory: snap?.vehicleCategory,
              packageType: snap?.packageType,
              weightTier: snap?.weightTier ?? null,
            },
            package: assignment.package ?? null,
            pricing: assignment.pricing ?? null,
            earnings: {
              net: earnings.netEarning,
              breakdown: earnings.earningsBreakdown,
            },
            timeline: {
              assignedAt: toIsoDateTimeOrNull(assignment.assignedAt),
              acceptedAt: assignment.timeline?.acceptedAt ?? null,
            },
          };
        }),
      );

      return {
        assignments: assignmentsWithEarnings,
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver assignments",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Calculate driver earnings for an assignment
   * Returns both net earning and detailed breakdown
   */
  private async calculateDriverEarnings(
    assignment: import("../../types/drivers.js").CourierAssignmentRow,
  ): Promise<{
    netEarning: number;
    earningsBreakdown: {
      basePayout: number;
      distanceEarning: number;
      weightCompensation: number;
      peakHourBonus: number;
      urgencyBonus: number;
      onTimeBonus: number;
      qualityBonus: number;
      platformCommission: number;
      customerTip: number;
      grossEarning: number;
      netEarning: number;
    };
  }> {
    try {
      // Import pricing repository for configurable rates
      const pricingRepo = await import("../pricing/pricing.repository.js").then(
        (m) => m.default,
      );

      // Get configurable rates
      const commissionRate =
        (await pricingRepo.getPricingConfigValue("driver_commission_rate")) ||
        0.7;
      const distanceRate =
        (await pricingRepo.getPricingConfigValue("driver_distance_rate")) ||
        0.65;
      const weightRate =
        (await pricingRepo.getPricingConfigValue("driver_weight_rate")) || 0.6;
      const peakHourBonusRate =
        (await pricingRepo.getPricingConfigValue("peak_hour_bonus_rate")) ||
        0.15;
      const urgencyBonusAmount =
        (await pricingRepo.getPricingConfigValue("urgency_bonus_amount")) ||
        15.0;
      const onTimeBonusRate =
        (await pricingRepo.getPricingConfigValue("on_time_bonus_rate")) || 0.05;
      const qualityBonusAmount =
        (await pricingRepo.getPricingConfigValue("quality_bonus_amount")) ||
        5.0;

      const basePrice = Number(assignment.pricing?.basePrice || 0);
      const distancePrice = Number(assignment.pricing?.distancePrice || 0);
      const weightSurcharge = Number(assignment.pricing?.weightSurcharge || 0);

      // Base earnings using configurable rates
      const basePayout = basePrice * commissionRate;
      const distanceEarning = distancePrice * distanceRate;
      const weightCompensation = weightSurcharge * weightRate;

      // Peak hour bonus
      const pickupTime = new Date(assignment.assignedAt ?? Date.now());
      const hour = pickupTime.getHours();
      const isPeakHour =
        (hour >= 8 && hour < 10) ||
        (hour >= 12 && hour < 14) ||
        (hour >= 18 && hour < 21);
      const peakHourBonus = isPeakHour ? basePayout * peakHourBonusRate : 0;

      // Urgency bonus for "Deliver Now"
      const urgencyBonus =
        assignment.snapshot?.deliveryType?.name === "deliver_now"
          ? urgencyBonusAmount
          : 0;

      // TODO: calculate from actual delivery timing against requested schedule.
      const onTimeBonus = 0;

      // Quality bonus
      const qualityBonus = qualityBonusAmount;

      // Calculate gross earning
      const grossEarning =
        basePayout +
        distanceEarning +
        weightCompensation +
        peakHourBonus +
        urgencyBonus +
        onTimeBonus +
        qualityBonus;

      // Platform commission
      const platformCommission = (basePayout + distanceEarning) * 0.15;

      // Customer tip (100% to driver) - TODO: Implement tips table
      const customerTip = 0; // assignment.customer_tip when implemented

      const netEarning = Math.round(
        grossEarning - platformCommission + customerTip,
      );

      return {
        netEarning,
        earningsBreakdown: {
          basePayout: Math.round(basePayout),
          distanceEarning: Math.round(distanceEarning),
          weightCompensation: Math.round(weightCompensation),
          peakHourBonus: Math.round(peakHourBonus),
          urgencyBonus: Math.round(urgencyBonus),
          onTimeBonus: Math.round(onTimeBonus),
          qualityBonus: Math.round(qualityBonus),
          platformCommission: Math.round(platformCommission),
          customerTip: Math.round(customerTip),
          grossEarning: Math.round(grossEarning),
          netEarning,
        },
      };
    } catch (error) {
      logger.error({
        msg: "Error calculating driver earnings",
        assignmentId: assignment.assignmentId,
        error: (error as Error).message,
      });
      // Fallback to simple calculation
      const fallbackNetEarning = Math.round(
        Number(assignment.totalPrice) * 0.7,
      );
      return {
        netEarning: fallbackNetEarning,
        earningsBreakdown: {
          basePayout: 0,
          distanceEarning: 0,
          weightCompensation: 0,
          peakHourBonus: 0,
          urgencyBonus: 0,
          onTimeBonus: 0,
          qualityBonus: 0,
          platformCommission: 0,
          customerTip: 0,
          grossEarning: fallbackNetEarning,
          netEarning: fallbackNetEarning,
        },
      };
    }
  }

  /**
   * Get driver earnings summary
   * @param period 'today' | 'week' | 'month' | 'year' (default: 'today')
   */
  async getEarningsSummary(
    userId: number,
    period: EarningsPeriodQuery["period"] = "today",
  ): Promise<DriverEarningsSummary> {
    try {
      const earnings = await driversRepository.getEarningsSummary(userId);

      return {
        scope: {
          period,
        },
        deliveries: {
          total: Number(earnings.totalDeliveries),
          today: Number(earnings.todayDeliveries),
          thisWeek: Number(earnings.weekDeliveries),
          thisMonth: Number(earnings.monthDeliveries),
        },
        earnings: {
          total: Number(earnings.totalEarnings),
          today: Number(earnings.todayEarnings),
          thisWeek: Number(earnings.weekEarnings),
          thisMonth: Number(earnings.monthEarnings),
          averageOrderValue: Number(earnings.avgOrderValue),
        },
        activity: {
          totalDistanceKm: Number(earnings.totalDistanceKm),
        },
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver earnings",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new DriversService();
