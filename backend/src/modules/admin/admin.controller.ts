import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import adminService from "./admin.service.js";
import type {
  DriverOnboardingReviewBody,
  DriverOnboardingReviewParams,
} from "./admin.zod.js";

class AdminController {
  async reviewDriverOnboarding(
    request: FastifyRequest<{
      Params: DriverOnboardingReviewParams;
      Body: DriverOnboardingReviewBody;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const actorUserId = request.user!.userId;
      const courierUserId = request.params.userId;

      const result = await adminService.reviewDriverOnboarding(
        actorUserId,
        courierUserId,
        request.body,
      );

      return successResponse(
        reply,
        result,
        request.body.decision === "approve"
          ? "Driver onboarding approved"
          : "Driver onboarding rejected",
      );
    } catch (error) {
      logger.error({
        msg: "Admin review driver onboarding controller error",
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new AdminController();
