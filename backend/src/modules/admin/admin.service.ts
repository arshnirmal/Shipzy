import logger from "../../config/logger.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
} from "../../utils/error.util.js";
import type { OnboardingJSONB } from "../../database/schema/types.js";
import adminRepository from "./admin.repository.js";
import type {
  DriverOnboardingReviewBody,
  DriverOnboardingReviewResponse,
} from "./admin.zod.js";

class AdminService {
  /**
   * Approve or reject a courier's onboarding after KYC submission.
   * Requires current onboarding.status === pending_review.
   */
  async reviewDriverOnboarding(
    actorUserId: number,
    courierUserId: number,
    body: DriverOnboardingReviewBody,
  ): Promise<DriverOnboardingReviewResponse> {
    const row = await adminRepository.findActiveProfileByUserId(courierUserId);
    if (!row) {
      throw new NotFoundError("User not found");
    }
    if (row.role !== "courier") {
      throw new AppError("Target user is not a courier", 422);
    }

    const current = row.onboarding;
    if (current?.status !== "pending_review") {
      throw new ConflictError(
        "Driver onboarding is not awaiting review (expected status pending_review)",
      );
    }

    const nowIso = new Date().toISOString();
    let next: OnboardingJSONB;
    let isVerified: boolean;

    if (body.decision === "approve") {
      next = {
        status: "approved",
        stepsCompleted: current.stepsCompleted,
        submittedAt: current.submittedAt,
        approvedAt: nowIso,
      };
      isVerified = true;
    } else {
      const reason = body.rejectedReason.trim();
      next = {
        status: "rejected",
        stepsCompleted: current.stepsCompleted,
        submittedAt: current.submittedAt,
        rejectedReason: reason,
      };
      isVerified = false;
    }

    await adminRepository.updateOnboardingAndVerification(
      courierUserId,
      next,
      isVerified,
    );

    logger.info({
      msg: "Driver onboarding reviewed",
      actorUserId,
      courierUserId,
      decision: body.decision,
    });

    return {
      userId: courierUserId,
      isVerified,
      onboarding: next,
    };
  }
}

export default new AdminService();
