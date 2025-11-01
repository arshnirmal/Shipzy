// services/backend/src/app.ts
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { FastifyInstance } from "fastify";
import config from "./config/env";
import logger from "./config/logger";
import { authenticate } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import {
  authRateLimitConfig,
  rateLimitConfig,
} from "./middleware/ratelimit.middleware";

declare module "fastify" {
  interface FastifyInstance {
    logger: typeof logger;
  }
}

// Import routes
import addressesRoutes from "./modules/addresses/addresses.routes";
import authRoutes from "./modules/auth/auth.routes";
import driversRoutes from "./modules/drivers/drivers.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import staticRoutes from "./modules/static/static.routes";
import usersRoutes from "./modules/users/users.routes";

/**
 * Build Fastify application
 */
export const buildApp = async (
  opts: Record<string, any> = {},
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: false, // Disable built-in logger, we'll use our own
    trustProxy: true,
    requestIdHeader: "x-request-id",
    requestIdLogLabel: "reqId",
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        removeAdditional: "all",
        coerceTypes: true,
        useDefaults: true,
      },
    },
    ...opts,
  });

  // ============ PLUGINS ============

  // CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Device-Id",
      "X-Request-Id",
    ],
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  // Rate limiting
  await app.register(rateLimit, rateLimitConfig);

  // ============ DECORATORS ============

  // Add logger decorator
  app.decorate("logger", logger);

  // Add authentication decorator
  app.decorate("authenticate", authenticate);

  // ============ HOOKS ============

  // Request logging
  app.addHook("onRequest", async (request, reply) => {
    app.logger.info(
      {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      },
      "Incoming request",
    );
  });

  // Response logging
  app.addHook("onResponse", async (request, reply) => {
    app.logger.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      "Request completed",
    );
  });

  // ============ ROUTES ============

  // Health check
  app.get("/health", async (request, reply) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    };
  });

  // API version
  app.get("/api/v1", async (request, reply) => {
    return {
      name: "Shipzy API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  });

  // Register module routes
  await app.register(authRoutes, {
    prefix: "/api/v1/auth",
    config: authRateLimitConfig, // Stricter rate limit for auth
  });

  await app.register(addressesRoutes, { prefix: "/api/v1/addresses" });
  await app.register(usersRoutes, { prefix: "/api/v1/users" });
  await app.register(driversRoutes, { prefix: "/api/v1/drivers" });
  await app.register(ordersRoutes, { prefix: "/api/v1/orders" });
  await app.register(staticRoutes, { prefix: "/api/v1/static" });

  // ============ ERROR HANDLERS ============

  // 404 handler
  app.setNotFoundHandler(notFoundHandler as any);

  // Global error handler
  app.setErrorHandler(errorHandler as any);

  return app;
};

export default buildApp;
