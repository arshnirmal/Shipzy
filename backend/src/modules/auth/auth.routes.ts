// services/backend/src/modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import authController from "./auth.controller.js";
import {
  refreshTokenSchema,
  verifyGoogleSchema,
  registerSchema,
  loginSchema,
} from "./auth.schema.js";

async function authRoutes(fastify: FastifyInstance, _options: unknown) {
  // POST /api/v1/auth/google/verify
  fastify.post(
    "/google/verify",
    {
      schema: verifyGoogleSchema,
    },
    authController.verifyGoogle.bind(authController),
  );

  // POST /api/v1/auth/refresh
  fastify.post(
    "/refresh",
    {
      schema: refreshTokenSchema,
    },
    authController.refreshToken.bind(authController),
  );

  // POST /api/v1/auth/register
  fastify.post(
    "/register",
    {
      schema: registerSchema,
    },
    authController.register.bind(authController),
  );

  // POST /api/v1/auth/login
  fastify.post(
    "/login",
    {
      schema: loginSchema,
    },
    authController.login.bind(authController),
  );

  // POST /api/v1/auth/logout
  fastify.post(
    "/logout",
    {
      onRequest: [fastify.authenticate], // Requires authentication
    },
    authController.logout.bind(authController),
  );
}

export default authRoutes;
