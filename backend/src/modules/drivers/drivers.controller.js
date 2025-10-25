// services/backend/src/modules/drivers/drivers.controller.js
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import driversService from "./drivers.service.js";

class DriversController {
  /**
   * GET /api/v1/drivers/me
   * Get driver profile
   */
  async getDriverProfile(request, reply) {
    try {
      const { userId } = request.user;

      const driver = await driversService.getDriverProfile(userId);

      return successResponse(
        reply,
        driver,
        "Driver profile retrieved successfully",
      );
    } catch (error) {
      logger.error("Get driver profile controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/drivers/me
   * Update driver profile
   */
  async updateProfile(request, reply) {
    try {
      const { userId } = request.user;
      const updateData = request.body;

      const updatedDriver = await driversService.updateProfile(
        userId,
        updateData,
      );

      return successResponse(
        reply,
        updatedDriver,
        "Driver profile updated successfully",
      );
    } catch (error) {
      logger.error("Update driver profile controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/drivers/me/availability
   * Toggle driver availability
   */
  async updateAvailability(request, reply) {
    try {
      const { userId } = request.user;
      const availabilityData = request.body;

      const result = await driversService.updateAvailability(
        userId,
        availabilityData,
      );

      return successResponse(
        reply,
        result,
        "Availability updated successfully",
      );
    } catch (error) {
      logger.error("Update availability controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/drivers/me/location
   * Update driver location
   */
  async updateLocation(request, reply) {
    try {
      const { userId } = request.user;
      const locationData = request.body;

      const result = await driversService.updateLocation(userId, locationData);

      return successResponse(reply, result, "Location updated successfully");
    } catch (error) {
      logger.error("Update location controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/drivers/me/assignments
   * Get active assignments
   */
  async getActiveAssignments(request, reply) {
    try {
      const { userId } = request.user;

      const assignments = await driversService.getActiveAssignments(userId);

      return successResponse(
        reply,
        assignments,
        "Active assignments retrieved successfully",
      );
    } catch (error) {
      logger.error("Get assignments controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/drivers/me/earnings
   * Get earnings summary
   */
  async getEarnings(request, reply) {
    try {
      const { userId } = request.user;

      const earnings = await driversService.getEarningsSummary(userId);

      return successResponse(
        reply,
        earnings,
        "Earnings retrieved successfully",
      );
    } catch (error) {
      logger.error("Get earnings controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new DriversController();
