// services/backend/src/modules/drivers/drivers.service.ts
import logger from "../../config/logger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util";
import driversRepository from "./drivers.repository";

interface DriverProfile {
  userId: number;
  userUuid: string;
  phoneNumber: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  status: {
    isAvailable: boolean;
    isOnline: boolean;
    totalDeliveriesToday: number;
    lastLocationUpdate?: Date;
    currentLocation: {
      latitude: number;
      longitude: number;
    } | null;
  };
  vehicle: {
    vehicleId: number;
    vehicleNumber: string;
    model: string;
    year: number;
    category: string;
    capacity: number;
  } | null;
  earnings: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageOrderValue: number;
    totalDistanceKm: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateProfileData {
  fullName?: string;
  phoneNumber?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

interface UpdateAvailabilityData {
  isAvailable: boolean;
  isOnline?: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

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
        profilePictureUrl: driver.profile_picture_url,
        isVerified: driver.is_verified,
        isActive: driver.is_active,
        status: {
          isAvailable: driver.is_available,
          isOnline: driver.is_online,
          totalDeliveriesToday: driver.total_deliveries_today,
          lastLocationUpdate: driver.last_location_update,
          currentLocation:
            driver.current_latitude && driver.current_longitude
              ? {
                  latitude: Number.parseFloat(driver.current_latitude),
                  longitude: Number.parseFloat(driver.current_longitude),
                }
              : null,
        },
        vehicle: driver.vehicle_id
          ? {
              vehicleId: driver.vehicle_id,
              vehicleNumber: driver.vehicle_number || "",
              model: driver.vehicle_model || "",
              year: driver.vehicle_year || 0,
              category: driver.vehicle_category || "",
              capacity: Number.parseFloat(driver.vehicle_max_weight || "0"),
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
        createdAt: driver.created_at,
        updatedAt: driver.updated_at,
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
  ): Promise<any> {
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
        updatedAt: updatedDriver.updated_at,
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
   * Toggle driver availability
   */
  async updateAvailability(
    userId: number,
    availabilityData: UpdateAvailabilityData,
  ): Promise<any> {
    try {
      const { isAvailable, isOnline = false } = availabilityData;

      const result = await driversRepository.updateAvailability(
        userId,
        isAvailable,
        isOnline,
      );

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
  ): Promise<any> {
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
        latitude: Number.parseFloat(result.latitude),
        longitude: Number.parseFloat(result.longitude),
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
  async getActiveAssignments(userId: number): Promise<any[]> {
    try {
      const assignments = await driversRepository.getActiveAssignments(userId);

      // Calculate earnings for all assignments
      const assignmentsWithEarnings = await Promise.all(
        assignments.map(async (assignment) => ({
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
                minWeightKg: Number.parseFloat(
                  assignment.weight_tier_min || "0",
                ),
                maxWeightKg: Number.parseFloat(
                  assignment.weight_tier_max || "0",
                ),
              }
            : null,
          pickup: {
            address: assignment.pickup_address,
            building: assignment.pickup_building,
            landmark: assignment.pickup_landmark,
            city: assignment.pickup_city,
            state: assignment.pickup_state,
            postalCode: assignment.pickup_postal_code,
            latitude: Number.parseFloat(assignment.pickup_latitude),
            longitude: Number.parseFloat(assignment.pickup_longitude),
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
            latitude: Number.parseFloat(assignment.delivery_latitude),
            longitude: Number.parseFloat(assignment.delivery_longitude),
            contactName: assignment.delivery_contact_name,
            contactPhone: assignment.delivery_contact_phone,
          },
          packageDescription: assignment.package_description,
          specialInstructions: assignment.special_instructions,
          declaredValue: assignment.declared_value
            ? Number.parseFloat(assignment.declared_value)
            : null,
          estimatedDistanceKm: assignment.estimated_distance_km
            ? Number.parseFloat(assignment.estimated_distance_km)
            : null,
          actualDistanceKm: assignment.actual_distance_km
            ? Number.parseFloat(assignment.actual_distance_km)
            : null,
          driverEarnings: await this.calculateDriverEarnings(assignment),
          estimatedDeliveryTime: Math.ceil(
            (Number.parseFloat(assignment.estimated_distance_km || "10") / 25) *
              60,
          ), // Estimate based on 25km/h average speed
          assignedAt: assignment.assigned_at,
          acceptedAt: assignment.accepted_at,
        })),
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
   */
  private async calculateDriverEarnings(assignment: any): Promise<number> {
    try {
      // Import pricing repository for configurable rates
      const pricingRepo = await import("../pricing/pricing.repository").then(
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

      const basePrice = Number.parseFloat(assignment.base_price || "0");
      const distancePrice = Number.parseFloat(assignment.distance_price || "0");
      const weightSurcharge = Number.parseFloat(
        assignment.weight_surcharge || "0",
      );

      // Base earnings using configurable rates
      const basePayout = basePrice * commissionRate;
      const distanceEarning = distancePrice * distanceRate;
      const weightCompensation = weightSurcharge * weightRate;

      // Peak hour bonus
      const pickupTime = new Date(assignment.assigned_at);
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

      // Customer tip (100% to driver)
      const customerTip = Number.parseFloat(assignment.customer_tip || "0");

      const netEarning = Math.round(
        grossEarning - platformCommission + customerTip,
      );

      return netEarning;
    } catch (error) {
      logger.error({
        msg: "Error calculating driver earnings",
        assignmentId: assignment.assignment_id,
        error: (error as Error).message,
      });
      // Fallback to simple calculation
      return Math.round(Number.parseFloat(assignment.total_price) * 0.7);
    }
  }

  /**
   * Get driver earnings summary
   */
  async getEarningsSummary(userId: number): Promise<any> {
    try {
      const earnings = await driversRepository.getEarningsSummary(userId);

      return {
        deliveries: {
          total: Number.parseInt(earnings.total_deliveries),
          today: Number.parseInt(earnings.today_deliveries),
          thisWeek: Number.parseInt(earnings.week_deliveries),
          thisMonth: Number.parseInt(earnings.month_deliveries),
        },
        earnings: {
          total: Number.parseFloat(earnings.total_earnings),
          today: Number.parseFloat(earnings.today_earnings),
          thisWeek: Number.parseFloat(earnings.week_earnings),
          thisMonth: Number.parseFloat(earnings.month_earnings),
          averageOrderValue: Number.parseFloat(earnings.avg_order_value),
        },
        totalDistanceKm: Number.parseFloat(earnings.total_distance_km),
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
