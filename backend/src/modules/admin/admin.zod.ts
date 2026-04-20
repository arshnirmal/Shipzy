import { z } from "zod";
import { OnboardingJSONBZ } from "../../database/schema/types.js";

export const DriverOnboardingReviewParamsZ = z.object({
  userId: z.coerce.number().int().positive(),
});
export type DriverOnboardingReviewParams = z.infer<
  typeof DriverOnboardingReviewParamsZ
>;

export const DriverOnboardingReviewBodyZ = z.discriminatedUnion(
  "decision",
  [
    z
      .object({
        decision: z.literal("approve"),
      })
      .strict(),
    z
      .object({
        decision: z.literal("reject"),
        rejectedReason: z.string().min(3).max(2000),
      })
      .strict(),
  ],
);
export type DriverOnboardingReviewBody = z.infer<
  typeof DriverOnboardingReviewBodyZ
>;

export const DriverOnboardingReviewResponseZ = z
  .object({
    userId: z.number().int().positive(),
    isVerified: z.boolean(),
    onboarding: OnboardingJSONBZ,
  })
  .strict();
export type DriverOnboardingReviewResponse = z.infer<
  typeof DriverOnboardingReviewResponseZ
>;
