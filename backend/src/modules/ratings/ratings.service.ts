// services/backend/src/modules/ratings/ratings.service.ts
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import { toIsoDateTime } from "../../utils/datetime.util.js";
import ratingsRepository from "./ratings.repository.js";

import type { DriverRatingStats, RatingResponse } from "./ratings.zod.js";

interface CreateRatingInput {
  orderId: number;
  customerId: number;
  rating: number;
  isAnonymous?: boolean;
  comment?: string | null;
}

class RatingsService {
  /**
   * Create a new driver rating
   */
  async createRating(ratingData: CreateRatingInput): Promise<RatingResponse> {
    try {
      const { orderId, customerId, rating, isAnonymous, comment } = ratingData;

      // Check if order belongs to customer
      const orderBelongsToCustomer =
        await ratingsRepository.orderBelongsToCustomer(orderId, customerId);
      if (!orderBelongsToCustomer) {
        throw new AuthorizationError("You can only rate your own orders");
      }

      // Check if order is delivered
      const isDelivered = await ratingsRepository.isOrderDelivered(orderId);
      if (!isDelivered) {
        throw new ValidationError("You can only rate delivered orders");
      }

      // Check if rating already exists
      const ratingExists =
        await ratingsRepository.ratingExistsForOrder(orderId);
      if (ratingExists) {
        throw new ValidationError("Rating already exists for this order");
      }

      // Get driver for the order
      const driverId = await ratingsRepository.getDriverForOrder(orderId);
      if (!driverId) {
        throw new NotFoundError("Driver not found for this order");
      }

      // Create the rating
      const newRating = await ratingsRepository.createRating({
        orderId,
        driverId,
        customerId,
        rating,
        isAnonymous,
        comment,
      });

      return {
        ratingId: newRating.ratingId,
        orderId: newRating.orderId,
        driverId: newRating.driverId,
        customerId: newRating.customerId,
        rating: newRating.rating,
        isAnonymous: newRating.isAnonymous ?? false,
        comment: newRating.comment,
        createdAt: toIsoDateTime(newRating.createdAt),
      };
    } catch (error) {
      logger.error({
        msg: "Error creating driver rating",
        error: (error as Error).message,
        orderId: ratingData.orderId,
      });
      throw error;
    }
  }

  /**
   * Get driver rating stats (compute on read)
   */
  async getDriverRatingStats(driverId: number): Promise<DriverRatingStats> {
    try {
      // Get ratings from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const ratings = await ratingsRepository.getDriverRatingsRecent(
        driverId,
        ninetyDaysAgo,
      );

      if (ratings.length === 0) {
        return {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentRatings: [],
          lastUpdated: toIsoDateTime(new Date()),
        };
      }

      // Calculate distribution using only valid rating rows
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalScore = 0;
      let validRatingsCount = 0;

      ratings.forEach((rating) => {
        if (
          rating &&
          rating.rating &&
          typeof rating.rating === "number" &&
          rating.rating >= 1 &&
          rating.rating <= 5
        ) {
          const ratingValue = rating.rating;
          distribution[ratingValue as keyof typeof distribution]++;
          totalScore += ratingValue;
          validRatingsCount++;
        }
      });

      const averageRating =
        validRatingsCount > 0
          ? Math.round((totalScore / validRatingsCount) * 10) / 10
          : 0;

      // Find the most recent rating date
      let lastUpdated = new Date();
      if (ratings.length > 0) {
        const firstRating = ratings[0];
        if (firstRating && firstRating.createdAt) {
          lastUpdated = firstRating.createdAt;
        }
      }

      const recentRatings = ratings.slice(0, 5).map((entry) => ({
        rating: entry.rating,
        comment: entry.comment ?? null,
        createdAt: toIsoDateTime(entry.createdAt),
      }));

      return {
        averageRating,
        totalRatings: validRatingsCount,
        ratingDistribution: distribution,
        recentRatings,
        lastUpdated: toIsoDateTime(lastUpdated),
      };
    } catch (error) {
      logger.error({
        msg: "Error getting driver rating stats",
        error: (error as Error).message,
        driverId,
      });
      throw error;
    }
  }
}

export default new RatingsService();
