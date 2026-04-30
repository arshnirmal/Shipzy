// services/backend/src/modules/users/users.routes.ts
import { FastifyInstance } from "fastify";
import usersController from "./users.controller.js";
import {
  deleteAddressSchema,
  saveAddressSchema,
  updateProfileSchema,
  getAddressesSchema,
  getCurrentUserSchema,
  registerDeviceTokenSchema,
} from "./users.schema.js";

async function usersRoutes(fastify: FastifyInstance, _options: unknown) {
  // All routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // GET /api/v1/users/me - Get current user profile
  fastify.get(
    "/me",
    { schema: getCurrentUserSchema },
    usersController.getCurrentUser.bind(usersController),
  );

  // PATCH /api/v1/users/me - Partial profile update
  fastify.patch(
    "/me",
    { schema: updateProfileSchema },
    usersController.updateProfile.bind(usersController),
  );

  // GET /api/v1/users/me/addresses - Get saved addresses
  fastify.get(
    "/me/addresses",
    { schema: getAddressesSchema },
    usersController.getAddresses.bind(usersController),
  );

  // POST /api/v1/users/me/addresses - Save new address
  fastify.post(
    "/me/addresses",
    { schema: saveAddressSchema },
    usersController.saveAddress.bind(usersController),
  );

  // DELETE /api/v1/users/me/addresses/:id - Delete address
  fastify.delete(
    "/me/addresses/:id",
    { schema: deleteAddressSchema },
    usersController.deleteAddress.bind(usersController),
  );

  // POST /api/v1/users/me/device-token - Register FCM device token
  fastify.post(
    "/me/device-token",
    { schema: registerDeviceTokenSchema },
    usersController.registerDeviceToken.bind(usersController),
  );
}

export default usersRoutes;
