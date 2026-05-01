import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import adminController from "./admin.controller.js";
import { driverOnboardingReviewSchema } from "./admin.schema.js";

const ADMIN_MUTATION_RATE_LIMIT = { max: 120, timeWindow: "15 minutes" };

async function adminRoutes(fastify: FastifyInstance, _options: unknown) {
  const asRouteHandler = (handler: unknown): RouteHandlerMethod =>
    handler as RouteHandlerMethod;

  fastify.post(
    "/drivers/:userId/onboarding-review",
    {
      schema: driverOnboardingReviewSchema,
      preHandler: [fastify.authenticate, authorize("admin")],
      config: { rateLimit: ADMIN_MUTATION_RATE_LIMIT },
    },
    asRouteHandler(
      adminController.reviewDriverOnboarding.bind(adminController),
    ),
  );
}

export default adminRoutes;
