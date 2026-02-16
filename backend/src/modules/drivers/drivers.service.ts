// services/backend/src/modules/drivers/drivers.service.ts
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import driversRepository from "./drivers.repository.js";

import type { DriverProfileResponse } from "./drivers.zod.js";

type UpdateProfileData = import("./drivers.zod.js").UpdateDriverProfile;
type UpdateAvailabilityData = import("./drivers.zod.js").UpdateAvailability;
type LocationData = import("./drivers.zod.js").UpdateLocation;

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
        userId: driver.user_id,
        userUuid: driver.user_uuid,
        phoneNumber: driver.phone_number,
        fullName: driver.full_name,
        email: driver.email || "",
        role: (driver as any).role_name || "courier",
        profilePictureUrl: driver.profile_picture_url,
        isVerified: driver.is_verified,
        isActive: driver.is_active,
        status: {
          isAvailable: driver.is_available,
          isOnline: driver.is_online,
          totalDeliveriesToday: driver.total_deliveries_today,
          currentLocation:
            driver.current_latitude && driver.current_longitude
              ? {
                  latitude: Number(driver.current_latitude),
                  longitude: Number(driver.current_longitude),
                }
              : null,
          lastLocationUpdate: driver.last_location_update
            ? new Date(driver.last_location_update).toISOString()
            : null,
        },
        vehicle: driver.vehicle_id
          ? {
              vehicleId: driver.vehicle_id,
              categoryId: driver.vehicle_category_id,
              category: driver.vehicle_category || "",
              isActive: Boolean(driver.vehicle_is_active),
              vehicleNumber: driver.vehicle_number || "",
              model: driver.vehicle_model || "",
              year: driver.vehicle_year || 0,
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
        createdAt: driver.created_at.toISOString(),
        updatedAt: driver.updated_at.toISOString(),
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
        userId: updatedDriver.user_id,
        fullName: updatedDriver.full_name,
        email: updatedDriver.email,
        profilePictureUrl: updatedDriver.profile_picture_url,
        updatedAt: updatedDriver.updated_at.toISOString(),
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

      const currentIsOnline = currentProfile.is_online;
      const currentIsAvailable = currentProfile.is_available;

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
        courierId: result.courier_id,
        isAvailable: result.is_available,
        isOnline: result.is_online,
        updatedAt: result.updated_at,
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
        courierId: result.courier_id,
        latitude: Number(result.latitude),
        longitude: Number(result.longitude),
        lastLocationUpdate: result.last_location_update,
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
            assignmentId: assignment.assignment_id,
            orderId: assignment.order_id,
            orderUuid: assignment.order_uuid,
            orderNumber: assignment.order_number,
            orderStatus: assignment.order_status,
            assignmentStatus: assignment.assignment_status,
            vehicleCategory: assignment.vehicle_category,
            vehicleCategoryDisplay: assignment.vehicle_category_display,
            packageType: assignment.package_type,
            weightTier: assignment.weight_tier_name
              ? {
                  id: assignment.weight_tier_id,
                  name: assignment.weight_tier_name,
                  minWeightKg: Number(assignment.weight_tier_min || 0),
                  maxWeightKg: Number(assignment.weight_tier_max || 0),
                }
              : null,
            pickup: {
              address: assignment.pickup_address,
              building: assignment.pickup_building,
              landmark: assignment.pickup_landmark,
              city: assignment.pickup_city,
              state: assignment.pickup_state,
              postalCode: assignment.pickup_postal_code,
              latitude: Number(assignment.pickup_latitude),
              longitude: Number(assignment.pickup_longitude),
              contactName: assignment.pickup_contact_name,
              contactPhone: assignment.pickup_contact_phone,
            },
            delivery: {
              address: assignment.delivery_address,
              building: assignment.delivery_building,
              landmark: assignment.delivery_landmark,
              city: assignment.delivery_city,
              state: assignment.delivery_state,
              postalCode: assignment.delivery_postal_code,
              latitude: Number(assignment.delivery_latitude),
              longitude: Number(assignment.delivery_longitude),
              contactName: assignment.delivery_contact_name,
              contactPhone: assignment.delivery_contact_phone,
            },
            packageDescription: assignment.package_description,
            specialInstructions: assignment.special_instructions,
            declaredValue: assignment.declared_value
              ? Number(assignment.declared_value)
              : null,
            estimatedDistanceKm: assignment.estimated_distance_km
              ? Number(assignment.estimated_distance_km)
              : null,
            actualDistanceKm: assignment.actual_distance_km
              ? Number(assignment.actual_distance_km)
              : null,
            driverEarnings: earnings.netEarning,
            earningsBreakdown: earnings.earningsBreakdown,
            estimatedDeliveryTime: Math.ceil(
              (Number(assignment.estimated_distance_km || 10) / 25) * 60,
            ), // Estimate based on 25km/h average speed
            assignedAt: assignment.assigned_at,
            acceptedAt: assignment.accepted_at,
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

      const basePrice = Number(assignment.base_price || 0);
      const distancePrice = Number(assignment.distance_price || 0);
      const weightSurcharge = Number(assignment.weight_surcharge || 0);

      // Base earnings using configurable rates
      const basePayout = basePrice * commissionRate;
      const distanceEarning = distancePrice * distanceRate;
      const weightCompensation = weightSurcharge * weightRate;

      // Peak hour bonus
      const pickupTime = new Date(assignment.assigned_at ?? Date.now());
      const hour = pickupTime.getHours();
      const isPeakHour =
        (hour >= 8 && hour < 10) ||
        (hour >= 12 && hour < 14) ||
        (hour >= 18 && hour < 21);
      const peakHourBonus = isPeakHour ? basePayout * peakHourBonusRate : 0;

      // Urgency bonus for "Deliver Now"
      const urgencyBonus =
        assignment.delivery_type === "deliver_now" ? urgencyBonusAmount : 0;

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
        assignmentId: assignment.assignment_id,
        error: (error as Error).message,
      });
      // Fallback to simple calculation
      const fallbackNetEarning = Math.round(
        Number(assignment.total_price) * 0.7,
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
            today: Number(earnings.today_deliveries),
          },
          earnings: {
            today: Number(earnings.today_earnings),
          },
          totalDistanceKm: Number(earnings.total_distance_km),
        };
      }

      // For detailed screens - full response
      return {
        deliveries: {
          total: Number(earnings.total_deliveries),
          today: Number(earnings.today_deliveries),
          thisWeek: Number(earnings.week_deliveries),
          thisMonth: Number(earnings.month_deliveries),
        },
        earnings: {
          total: Number(earnings.total_earnings),
          today: Number(earnings.today_earnings),
          thisWeek: Number(earnings.week_earnings),
          thisMonth: Number(earnings.month_earnings),
          averageOrderValue: Number(earnings.avg_order_value),
        },
        totalDistanceKm: Number(earnings.total_distance_km),
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
