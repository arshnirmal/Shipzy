// services/backend/src/modules/drivers/drivers.routes.js
import { authorize } from "../../middleware/auth.middleware.js";
import { FastifyInstance } from "fastify";
import driversController from "./drivers.controller.js";
import {
  updateAvailabilitySchema,
  updateDriverProfileSchema,
  updateLocationSchema,
} from "./drivers.schema.js";

async function driversRoutes(fastify: FastifyInstance, options: any) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // All routes require courier role
  fastify.addHook("onRequest", authorize("courier"));

  // GET /api/v1/drivers/me - Get driver profile
  fastify.get(
    "/me",
    driversController.getDriverProfile.bind(driversController),
  );

  // PUT /api/v1/drivers/me - Update driver profile
  fastify.put(
    "/me",
    { schema: updateDriverProfileSchema },
    driversController.updateProfile.bind(driversController),
  );

  // PUT /api/v1/drivers/me/availability - Toggle availability
  fastify.put(
    "/me/availability",
    { schema: updateAvailabilitySchema },
    driversController.updateAvailability.bind(driversController),
  );

  // PUT /api/v1/drivers/me/location - Update location
  fastify.put(
    "/me/location",
    { schema: updateLocationSchema },
    driversController.updateLocation.bind(driversController),
  );

  // GET /api/v1/drivers/me/assignments - Get active assignments
  fastify.get(
    "/me/assignments",
    driversController.getActiveAssignments.bind(driversController),
  );

  // GET /api/v1/drivers/me/earnings - Get earnings summary
  fastify.get(
    "/me/earnings",
    driversController.getEarnings.bind(driversController),
  );

  // GET /api/v1/drivers/me/rating - Get driver rating stats
  fastify.get(
    "/me/rating",
    driversController.getRating.bind(driversController),
  );
}

export default driversRoutes;
