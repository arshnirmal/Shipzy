// services/backend/src/modules/drivers/drivers.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger";
import { errorResponse, successResponse } from "../../utils/response.util";
import driversService from "./drivers.service";
import ratingsService from "../ratings/ratings.service";

interface UpdateProfileBody {
  fullName?: string;
  phoneNumber?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

interface UpdateLocationBody {
  latitude: number;
  longitude: number;
}

interface UpdateAvailabilityBody {
  isAvailable: boolean;
}

class DriversController {
  /**
   * GET /api/v1/drivers/me
   * Get driver profile
   */
  async getDriverProfile(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;

      const driver = await driversService.getDriverProfile(userId);

      return successResponse(
        reply,
        driver,
        "Driver profile retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get driver profile controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * PUT /api/v1/drivers/me
   * Update driver profile
   */
  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;
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
      logger.error({
        msg: "Update driver profile controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * PUT /api/v1/drivers/me/availability
   * Toggle driver availability
   */
  async updateAvailability(
    request: FastifyRequest<{ Body: UpdateAvailabilityBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;
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
      logger.error({
        msg: "Update availability controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * PUT /api/v1/drivers/me/location
   * Update driver location
   */
  async updateLocation(
    request: FastifyRequest<{ Body: UpdateLocationBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;
      const locationData = request.body;

      const result = await driversService.updateLocation(userId, locationData);

      return successResponse(reply, result, "Location updated successfully");
    } catch (error) {
      logger.error({
        msg: "Update location controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * GET /api/v1/drivers/me/assignments
   * Get active assignments
   */
  async getActiveAssignments(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;

      const assignments = await driversService.getActiveAssignments(userId);

      return successResponse(
        reply,
        assignments,
        "Active assignments retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get assignments controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * GET /api/v1/drivers/me/earnings
   * Get earnings summary
   * Query params: ?period=today|week|month|year (default: today)
   */
  async getEarnings(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { userId } = request.user!;
      const query = request.query as { period?: string };

      // Default to today for home screen (lightweight)
      const period = query.period || "today";

      const earnings = await driversService.getEarningsSummary(userId, period);

      return successResponse(
        reply,
        earnings,
        "Earnings retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get earnings controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * GET /api/v1/drivers/me/rating
   * Get driver rating stats
   */
  async getRating(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { userId } = request.user!;

      const ratingStats = await ratingsService.getDriverRatingStats(userId);

      return successResponse(
        reply,
        ratingStats,
        "Rating stats retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get rating stats controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }
}

export default new DriversController();
