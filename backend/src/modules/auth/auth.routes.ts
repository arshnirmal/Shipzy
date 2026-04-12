// services/backend/src/modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import authController from "./auth.controller.js";
import {
  businessRegisterSchema,
  refreshTokenSchema,
  verifyGoogleSchema,
  registerSchema,
  loginSchema,
} from "./auth.schema.js";

// Keep login-sensitive endpoints strict.
const AUTH_STRICT_RATE_LIMIT = { max: 10, timeWindow: "15 minutes" };
// Registration is intentionally higher to support onboarding and seed flows.
const AUTH_REGISTER_RATE_LIMIT = { max: 30, timeWindow: "15 minutes" };

async function authRoutes(fastify: FastifyInstance, _options: unknown) {
  // POST /api/v1/auth/google/verify
  fastify.post(
    "/google/verify",
    {
      schema: verifyGoogleSchema,
      config: { rateLimit: AUTH_STRICT_RATE_LIMIT },
    },
    authController.verifyGoogle.bind(authController),
  );

  // POST /api/v1/auth/refresh
  fastify.post(
    "/refresh",
    {
      schema: refreshTokenSchema,
      config: { rateLimit: AUTH_STRICT_RATE_LIMIT },
    },
    authController.refreshToken.bind(authController),
  );

  // POST /api/v1/auth/register
  fastify.post(
    "/register",
    {
      schema: registerSchema,
      config: { rateLimit: AUTH_REGISTER_RATE_LIMIT },
    },
    authController.register.bind(authController),
  );

  // POST /api/v1/auth/login
  fastify.post(
    "/login",
    {
      schema: loginSchema,
      config: { rateLimit: AUTH_STRICT_RATE_LIMIT },
    },
    authController.login.bind(authController),
  );

  // POST /api/v1/auth/register/business
  fastify.post(
    "/register/business",
    {
      schema: businessRegisterSchema,
      config: { rateLimit: AUTH_REGISTER_RATE_LIMIT },
    },
    authController.registerBusiness.bind(authController),
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
