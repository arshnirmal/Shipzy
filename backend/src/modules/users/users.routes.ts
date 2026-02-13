// services/backend/src/modules/users/users.routes.ts
import { FastifyInstance } from "fastify";
import usersController from "./users.controller.js";
import {
  deleteAddressSchema,
  saveAddressSchema,
  updateProfileSchema,
} from "./users.schema.js";

async function usersRoutes(fastify: FastifyInstance, options: any) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /api/v1/users/me - Get current user profile
  fastify.get("/me", usersController.getCurrentUser.bind(usersController));

  // PUT /api/v1/users/me - Update user profile
  fastify.put(
    "/me",
    { schema: updateProfileSchema },
    usersController.updateProfile.bind(usersController),
  );

  // GET /api/v1/users/me/addresses - Get saved addresses
  fastify.get(
    "/me/addresses",
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
}

export default usersRoutes;
