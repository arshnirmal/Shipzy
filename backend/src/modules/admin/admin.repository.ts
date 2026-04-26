import { and, eq, isNull } from "drizzle-orm";
import drizzleDb from "../../database/drizzle.js";
import { userProfiles } from "../../database/schema/users.js";
import type { OnboardingJSONB } from "../../database/schema/types.js";

export type ProfileForOnboardingReview = {
  userId: number;
  role: string;
  onboarding: OnboardingJSONB | null;
  isVerified: boolean;
};

class AdminRepository {
  async findActiveProfileByUserId(
    userId: number,
  ): Promise<ProfileForOnboardingReview | null> {
    const rows = await drizzleDb
      .select({
        userId: userProfiles.userId,
        role: userProfiles.role,
        onboarding: userProfiles.onboarding,
        isVerified: userProfiles.isVerified,
      })
      .from(userProfiles)
      .where(
        and(eq(userProfiles.userId, userId), isNull(userProfiles.deletedAt)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async updateOnboardingAndVerification(
    userId: number,
    onboarding: OnboardingJSONB,
    isVerified: boolean,
  ): Promise<void> {
    const now = new Date();
    await drizzleDb
      .update(userProfiles)
      .set({
        onboarding,
        isVerified,
        updatedAt: now,
      })
      .where(eq(userProfiles.userId, userId));
  }
}

export default new AdminRepository();
