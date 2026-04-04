// services/backend/src/modules/ratings/ratings.zod.ts
import { z } from "zod";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

export const RatingScoreZ = z.number().int().min(1).max(5);

export const BaseRatingFeedbackZ = z
  .object({
    score: RatingScoreZ,
    comment: z.string().max(500).nullable().optional(),
    anonymous: z.boolean().optional().default(false),
  })
  .strict();

export const CreateRatingParamsZ = z
  .object({
    orderId: z.coerce.number().int().positive(),
  })
  .strict();
export type CreateRatingParams = z.infer<typeof CreateRatingParamsZ>;

export const DriverRatingParamsZ = z
  .object({
    driverId: z.coerce.number().int().positive(),
  })
  .strict();
export type DriverRatingParams = z.infer<typeof DriverRatingParamsZ>;

export const CreateRatingRequestZ = z
  .object({
    feedback: BaseRatingFeedbackZ,
  })
  .strict();
export type CreateRatingRequest = z.infer<typeof CreateRatingRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

export const BaseDriverRatingZ = z
  .object({
    ratingId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    driverId: z.number().int().positive(),
    customerId: z.number().int().positive(),
    rating: RatingScoreZ,
    isAnonymous: z.boolean().optional(),
    comment: z.string().nullable().optional(),
    createdAt: z.iso.datetime(),
  })
  .strict();

// Internal flat rating shape (used by service callers)
export const RatingResponseZ = BaseDriverRatingZ;
export type RatingResponse = z.infer<typeof RatingResponseZ>;

// API response shape
export const CreateRatingResponseZ = z
  .object({
    rating: BaseDriverRatingZ,
  })
  .strict();
export type CreateRatingResponse = z.infer<typeof CreateRatingResponseZ>;

// Driver Rating Stats Response
export const RatingDistributionZ = z
  .object({
    1: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
    4: z.number().int().nonnegative(),
    5: z.number().int().nonnegative(),
  })
  .strict();

// Internal flat stats shape (used by service callers)
export const DriverRatingStatsZ = z
  .object({
    averageRating: z.number().min(0).max(5),
    totalRatings: z.number().int().nonnegative(),
    ratingDistribution: RatingDistributionZ,
    recentRatings: z
      .array(
        z
          .object({
            rating: RatingScoreZ,
            comment: z.string().nullable().optional(),
            createdAt: z.iso.datetime(),
          })
          .strict(),
      )
      .optional(),
    lastUpdated: z.iso.datetime(),
  })
  .strict();
export type DriverRatingStats = z.infer<typeof DriverRatingStatsZ>;

export const DriverRatingStatsResponseZ = z
  .object({
    rating: z
      .object({
        summary: z
          .object({
            average: z.number().min(0).max(5),
            total: z.number().int().nonnegative(),
          })
          .strict(),
        distribution: RatingDistributionZ,
        recent: DriverRatingStatsZ.shape.recentRatings.optional(),
        lastUpdated: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type DriverRatingStatsResponse = z.infer<
  typeof DriverRatingStatsResponseZ
>;
