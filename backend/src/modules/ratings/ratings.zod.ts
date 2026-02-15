// services/backend/src/modules/ratings/ratings.zod.ts
import { z } from "zod";

export const CreateRatingZ = z.object({
  orderId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type CreateRating = z.infer<typeof CreateRatingZ>;

export const RatingResponseZ = z.object({
  ratingId: z.number(),
  orderId: z.number(),
  driverId: z.number(),
  rating: z.number(),
  comment: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type RatingResponse = z.infer<typeof RatingResponseZ>;
