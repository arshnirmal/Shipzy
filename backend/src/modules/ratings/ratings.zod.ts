// services/backend/src/modules/ratings/ratings.zod.ts
import { z } from "zod";
import { BaseRatingZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Create Rating Request
export const CreateRatingRequestZ = z.object({
  orderId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
  isAnonymous: z.boolean().optional().default(false),
}).strict();
export type CreateRatingRequest = z.infer<typeof CreateRatingRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Rating Response
export const RatingResponseZ = z.object({
  ratingId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  isAnonymous: z.boolean().optional(),
  comment: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
}).strict();
export type RatingResponse = z.infer<typeof RatingResponseZ>;

// Driver Rating Stats Response
export const DriverRatingStatsZ = z.object({
  averageRating: z.number().min(0).max(5),
  totalRatings: z.number().int().nonnegative(),
  ratingDistribution: z.object({
    1: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
    4: z.number().int().nonnegative(),
    5: z.number().int().nonnegative(),
  }),
  recentRatings: z
    .array(
      z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().nullable().optional(),
        createdAt: z.iso.datetime(),
      }).strict(),
    )
    .optional(),
  lastUpdated: z.iso.datetime(),
}).strict();
export type DriverRatingStats = z.infer<typeof DriverRatingStatsZ>;
