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
    today: number;
    thisWeek: number;
    thisMonth: number;
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
        email: driver.email,
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
                  latitude: parseFloat(driver.current_latitude),
                  longitude: parseFloat(driver.current_longitude),
                }
              : null,
        },
        vehicle: driver.vehicle_id
          ? {
              vehicleId: driver.vehicle_id,
              vehicleNumber: driver.vehicle_number,
              model: driver.vehicle_model,
              year: driver.vehicle_year,
              category: driver.vehicle_category,
              maxWeightKg: parseFloat(driver.vehicle_max_weight),
            }
          : null,
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver profile",
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update driver profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData
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
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Toggle driver availability
   */
  async updateAvailability(
    userId: number,
    availabilityData: UpdateAvailabilityData
  ): Promise<any> {
    try {
      const { isAvailable, isOnline } = availabilityData;

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
      logger.error("Error updating driver availability", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update driver location
   */
  async updateLocation(
    userId: number,
    locationData: LocationData
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
        latitude: parseFloat(result.latitude),
        longitude: parseFloat(result.longitude),
        lastLocationUpdate: result.last_location_update,
      };
    } catch (error) {
      logger.error({
        msg: "Error updating driver location",
        error: (error as Error).message
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

      return assignments.map((assignment) => ({
        assignmentId: assignment.assignment_id,
        orderId: assignment.order_id,
        orderUuid: assignment.order_uuid,
        orderNumber: assignment.order_number,
        orderStatus: assignment.order_status,
        assignmentStatus: assignment.assignment_status,
        pickup: {
          address: assignment.pickup_address,
          building: assignment.pickup_building,
          landmark: assignment.pickup_landmark,
          latitude: parseFloat(assignment.pickup_latitude),
          longitude: parseFloat(assignment.pickup_longitude),
          contactName: assignment.pickup_contact_name,
          contactPhone: assignment.pickup_contact_phone,
        },
        delivery: {
          address: assignment.delivery_address,
          building: assignment.delivery_building,
          landmark: assignment.delivery_landmark,
          latitude: parseFloat(assignment.delivery_latitude),
          longitude: parseFloat(assignment.delivery_longitude),
          contactName: assignment.delivery_contact_name,
          contactPhone: assignment.delivery_contact_phone,
        },
        packageDescription: assignment.package_description,
        packageWeightKg: parseFloat(assignment.package_weight_kg),
        totalPrice: parseFloat(assignment.total_price),
        specialInstructions: assignment.special_instructions,
        assignedAt: assignment.assigned_at,
        acceptedAt: assignment.accepted_at,
      }));
    } catch (error) {
      logger.error("Error getting driver assignments", {
        error: error.message,
      });
      throw error;
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
          total: parseInt(earnings.total_deliveries),
          today: parseInt(earnings.today_deliveries),
          thisWeek: parseInt(earnings.week_deliveries),
          thisMonth: parseInt(earnings.month_deliveries),
        },
        earnings: {
          total: parseFloat(earnings.total_earnings),
          today: parseFloat(earnings.today_earnings),
          thisWeek: parseFloat(earnings.week_earnings),
          thisMonth: parseFloat(earnings.month_earnings),
          averageOrderValue: parseFloat(earnings.avg_order_value),
        },
        totalDistanceKm: parseFloat(earnings.total_distance_km),
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver earnings",
        error: (error as Error).message
      });
      throw error;
    }
  }
}

export default new DriversService();
