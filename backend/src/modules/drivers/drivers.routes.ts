// services/backend/src/modules/drivers/drivers.routes.js
import { authorize } from "../../middleware/auth.middleware.js";
import { FastifyInstance } from "fastify";
import driversController from "./drivers.controller.js";
import {
  getEarningsSchema,
  getActiveAssignmentsSchema,
  getDriverProfileSchema,
  getDriverRatingSchema,
  getTripHistorySchema,
  submitKycSchema,
  updateAvailabilitySchema,
  updateDriverProfileSchema,
  updateLocationSchema,
} from "./drivers.schema.js";

async function driversRoutes(fastify: FastifyInstance, _options: unknown) {
  // All routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // All routes require courier role
  fastify.addHook("preHandler", authorize("courier"));

  // GET /api/v1/drivers/me - Get driver profile
  fastify.get(
    "/me",
    { schema: getDriverProfileSchema },
    driversController.getDriverProfile.bind(driversController),
  );

  // PUT /api/v1/drivers/me - Update driver profile
  fastify.patch(
    "/me",
    { schema: updateDriverProfileSchema },
    driversController.updateProfile.bind(driversController),
  );

  fastify.post(
    "/me/kyc",
    { schema: submitKycSchema },
    driversController.submitKyc.bind(driversController),
  );

  // PUT /api/v1/drivers/me/availability - Toggle availability
  fastify.patch(
    "/me/availability",
    { schema: updateAvailabilitySchema },
    driversController.updateAvailability.bind(driversController),
  );

  // PUT /api/v1/drivers/me/location - Update location
  fastify.patch(
    "/me/location",
    { schema: updateLocationSchema },
    driversController.updateLocation.bind(driversController),
  );

  // GET /api/v1/drivers/me/assignments - Get active assignments
  fastify.get(
    "/me/assignments",
    { schema: getActiveAssignmentsSchema },
    driversController.getActiveAssignments.bind(driversController),
  );

  // GET /api/v1/drivers/me/earnings - Get earnings summary
  fastify.get(
    "/me/earnings",
    { schema: getEarningsSchema },
    driversController.getEarnings.bind(driversController),
  );

  // GET /api/v1/drivers/me/rating - Get driver rating stats
  fastify.get(
    "/me/rating",
    { schema: getDriverRatingSchema },
    driversController.getRating.bind(driversController),
  );

  // GET /api/v1/drivers/me/trips - Get paginated trip history
  fastify.get(
    "/me/trips",
    { schema: getTripHistorySchema },
    driversController.getTripHistory.bind(driversController),
  );
}

export default driversRoutes;
