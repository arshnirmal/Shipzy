import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import ratingsService from "./ratings.service.js";
import type {
  CreateRatingParams,
  CreateRatingRequest,
  DriverRatingParams,
} from "./ratings.zod.js";

class RatingsController {
  /**
   * POST /api/v1/ratings/orders/:orderId
   * Create a customer rating for a delivered order
   */
  async createRating(
    request: FastifyRequest<{
      Params: CreateRatingParams;
      Body: CreateRatingRequest;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { orderId } = request.params;
      const {
        feedback: { score, anonymous, comment },
      } = request.body;

      const rating = await ratingsService.createRating({
        orderId,
        customerId: userId,
        rating: score,
        isAnonymous: anonymous ?? false,
        comment: comment ?? undefined,
      });

      return successResponse(
        reply,
        { rating },
        "Rating created successfully",
        201,
      );
    } catch (error) {
      logger.error({
        msg: "Create rating controller error",
        error: (error as Error).message,
      });

      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * GET /api/v1/ratings/drivers/:driverId
   * Get driver rating statistics
   */
  async getDriverRatingStats(
    request: FastifyRequest<{ Params: DriverRatingParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { driverId } = request.params;
      const stats = await ratingsService.getDriverRatingStats(driverId);

      return successResponse(
        reply,
        {
          rating: {
            summary: {
              average: stats.averageRating,
              total: stats.totalRatings,
            },
            distribution: stats.ratingDistribution,
            recent: stats.recentRatings,
            lastUpdated: stats.lastUpdated,
          },
        },
        "Driver rating stats retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get driver rating stats controller error",
        error: (error as Error).message,
      });

      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }
}

export default new RatingsController();
