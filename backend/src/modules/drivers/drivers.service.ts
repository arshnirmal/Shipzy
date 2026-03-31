// services/backend/src/modules/drivers/drivers.service.ts
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import driversRepository from "./drivers.repository.js";

import type { DriverProfileResponse } from "./drivers.zod.js";

type UpdateProfileData = import("./drivers.zod.js").UpdateDriverProfileRequest;
type UpdateAvailabilityData =
  import("./drivers.zod.js").UpdateAvailabilityRequest;
type LocationData = import("./drivers.zod.js").UpdateLocationRequest;

type DriverProfile = DriverProfileResponse;

// API return shape for earnings summary (used by `getEarningsSummary`)
type EarningsSummary = {
  deliveries: {
    today?: number;
    total?: number;
    thisWeek?: number;
    thisMonth?: number;
  };
  earnings: {
    today?: number;
    total?: number;
    thisWeek?: number;
    thisMonth?: number;
    averageOrderValue?: number;
  };
  totalDistanceKm: number;
};

// API return shape for active assignments (frontend-friendly)
type ActiveAssignment = {
  assignmentId: number;
  orderId: number;
  orderUuid?: string;
  orderNumber?: string;
  orderStatus?: string;
  assignmentStatus?: string;
  vehicleCategory?: string | null;
  vehicleCategoryDisplay?: string | null;
  packageType?: string | null;
  weightTier?: {
    id?: number;
    name?: string;
    minWeightKg?: number;
    maxWeightKg?: number;
  } | null;
  pickup: {
    address?: string | null;
    building?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  delivery: {
    address?: string | null;
    building?: string | null;
    landmark?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  packageDescription?: string | null;
  specialInstructions?: string | null;
  declaredValue?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  driverEarnings: number;
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
  estimatedDeliveryTime: number;
  assignedAt?: Date | null;
  acceptedAt?: Date | null;
};

class DriversService {
  /**
   * Get driver profile
   */
  async getDriverProfile(userId: number): Promise<DriverProfile> {
    try {
      const driver = await driversRepository.findCourierById(userId);

      if (!driver) {
        throw new NotFoundError("Driver profile not found");
      }

      return {
        userId: driver.userId,
        userUuid: driver.userUuid,
        phoneNumber: driver.phoneNumber ?? null,
        fullName: driver.fullName,
        email: driver.email || "",
        role: driver.roleName || "courier",
        profilePictureUrl: driver.profilePictureUrl ?? null,
        isVerified: driver.isVerified,
        isActive: driver.isActive,
        status: {
          isAvailable: driver.isAvailable,
          isOnline: driver.isOnline,
          totalDeliveriesToday: driver.totalDeliveriesToday,
          currentLocation:
            driver.currentLatitude && driver.currentLongitude
              ? {
                  latitude: Number(driver.currentLatitude),
                  longitude: Number(driver.currentLongitude),
                }
              : null,
          lastLocationUpdate: driver.lastLocationUpdate
            ? new Date(driver.lastLocationUpdate).toISOString()
            : null,
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
        earnings: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          averageOrderValue: 0,
          totalDistanceKm: 0,
        },
        createdAt: driver.createdAt.toISOString(),
        updatedAt: driver.updatedAt.toISOString(),
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
  ): Promise<
    Pick<
      DriverProfileResponse,
      "userId" | "fullName" | "email" | "profilePictureUrl" | "updatedAt"
    >
  > {
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
        userId: updatedDriver.userId,
        fullName: updatedDriver.fullName,
        email: updatedDriver.email ?? null,
        profilePictureUrl: updatedDriver.profilePictureUrl ?? null,
        updatedAt: updatedDriver.updatedAt.toISOString(),
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
  ): Promise<{
    courierId: number;
    isAvailable: boolean;
    isOnline: boolean;
    updatedAt: Date;
  }> {
    try {
      const {
        isAvailable,
        isOnline = false,
        currentLocation,
      } = availabilityData;

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
        courierId: result.courierId,
        isAvailable: result.isAvailable,
        isOnline: result.isOnline,
        updatedAt: result.updatedAt,
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
  ): Promise<{
    courierId: number;
    latitude: number;
    longitude: number;
    lastLocationUpdate: Date;
  }> {
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
        courierId: result.courierId,
        latitude: Number(result.latitude),
        longitude: Number(result.longitude),
        lastLocationUpdate: result.lastLocationUpdate,
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
  async getActiveAssignments(userId: number): Promise<ActiveAssignment[]> {
    try {
      const assignments = await driversRepository.getActiveAssignments(userId);

      // Calculate earnings for all assignments
      const assignmentsWithEarnings = await Promise.all(
        assignments.map(async (assignment) => {
          const earnings = await this.calculateDriverEarnings(assignment);
          return {
            assignmentId: assignment.assignmentId,
            orderId: assignment.orderId,
            orderUuid: assignment.orderUuid,
            orderNumber: assignment.orderNumber,
            orderStatus: assignment.orderStatus,
            assignmentStatus: assignment.assignmentStatus,
            vehicleCategory: assignment.vehicleCategory,
            vehicleCategoryDisplay: assignment.vehicleCategoryDisplay,
            packageType: assignment.packageType,
            weightTier: assignment.weightTierName
              ? {
                  id: assignment.weightTierId,
                  name: assignment.weightTierName,
                  minWeightKg: Number(assignment.weightTierMin || 0),
                  maxWeightKg: Number(assignment.weightTierMax || 0),
                }
              : null,
            pickup: {
              address: assignment.pickupAddress,
              building: assignment.pickupBuilding,
              landmark: assignment.pickupLandmark,
              city: assignment.pickupCity,
              state: assignment.pickupState,
              postalCode: assignment.pickupPostalCode,
              latitude: Number(assignment.pickupLatitude),
              longitude: Number(assignment.pickupLongitude),
              contactName: assignment.pickupContactName,
              contactPhone: assignment.pickupContactPhone,
            },
            delivery: {
              address: assignment.deliveryAddress,
              building: assignment.deliveryBuilding,
              landmark: assignment.deliveryLandmark,
              city: assignment.deliveryCity,
              state: assignment.deliveryState,
              postalCode: assignment.deliveryPostalCode,
              latitude: Number(assignment.deliveryLatitude),
              longitude: Number(assignment.deliveryLongitude),
              contactName: assignment.deliveryContactName,
              contactPhone: assignment.deliveryContactPhone,
            },
            packageDescription: assignment.packageDescription,
            specialInstructions: assignment.specialInstructions,
            declaredValue: assignment.declaredValue
              ? Number(assignment.declaredValue)
              : null,
            estimatedDistanceKm: assignment.estimatedDistanceKm
              ? Number(assignment.estimatedDistanceKm)
              : null,
            actualDistanceKm: assignment.actualDistanceKm
              ? Number(assignment.actualDistanceKm)
              : null,
            driverEarnings: earnings.netEarning,
            earningsBreakdown: earnings.earningsBreakdown,
            estimatedDeliveryTime: Math.ceil(
              (Number(assignment.estimatedDistanceKm || 10) / 25) * 60,
            ), // Estimate based on 25km/h average speed
            assignedAt: assignment.assignedAt,
            acceptedAt: assignment.acceptedAt,
          };
        }),
      );

      return assignmentsWithEarnings;
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

      const basePrice = Number(assignment.basePrice || 0);
      const distancePrice = Number(assignment.distancePrice || 0);
      const weightSurcharge = Number(assignment.weightSurcharge || 0);

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
        assignment.deliveryType === "deliver_now" ? urgencyBonusAmount : 0;

      // On-time delivery bonus (simplified)
      const onTimeBonus =
        Math.random() > 0.7 ? basePayout * onTimeBonusRate : 0;

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
    period: string = "today",
  ): Promise<EarningsSummary> {
    try {
      const earnings = await driversRepository.getEarningsSummary(userId);

      // For home screen (today only) - lightweight response
      if (period === "today") {
        return {
          deliveries: {
            today: Number(earnings.todayDeliveries),
          },
          earnings: {
            today: Number(earnings.todayEarnings),
          },
          totalDistanceKm: Number(earnings.totalDistanceKm),
        };
      }

      // For detailed screens - full response
      return {
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
        totalDistanceKm: Number(earnings.totalDistanceKm),
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
