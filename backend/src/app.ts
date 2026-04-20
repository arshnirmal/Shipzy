// services/backend/src/app.ts
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { FastifyInstance } from "fastify";
import config from "./config/env.js";
import logger from "./config/logger.js";
import { drizzlePool } from "./database/drizzle.js";
import { authenticate } from "./middleware/auth.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { rateLimitConfig } from "./middleware/ratelimit.middleware.js";
import { startScheduler } from "./utils/scheduler.js";

declare module "fastify" {
  interface FastifyInstance {
    logger: typeof logger;
  }
}

// Import routes
import addressesRoutes from "./modules/addresses/addresses.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import businessRoutes from "./modules/business/business.routes.js";
import driversRoutes from "./modules/drivers/drivers.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import ratingsRoutes from "./modules/ratings/ratings.routes.js";
import staticRoutes from "./modules/static/static.routes.js";
import usersRoutes from "./modules/users/users.routes.js";

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

  // OpenAPI / Swagger (optional - register only if plugin is installed)
  try {
    const swagger = await import("@fastify/swagger");
    const swaggerUi = await import("@fastify/swagger-ui");

    await app.register(swagger.default, {
      openapi: {
        info: {
          title: "Shipzy API",
          version: "1.0.0",
          description: "Shipzy hyperlocal delivery API",
        },
        servers: [{ url: `http://${config.host}:${config.port}/api/v1` }],
      },
      hideUntagged: false,
    });

    await app.register(swaggerUi.default, {
      routePrefix: "/docs",
      uiConfig: { docExpansion: "list", deepLinking: false },
      staticCSP: true,
    });
  } catch (err) {
    // swagger packages not installed — continue without interactive docs
    app.log?.debug?.("Swagger plugins not available");
  }

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

  // Public health check — minimal info only (no internals exposed)
  app.get("/health", async (request, reply) => {
    try {
      await drizzlePool.query("SELECT 1");
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch {
      return reply.status(503).send({
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Internal health check — detailed diagnostics, should be protected by infra-level auth
  // (e.g., accessible only from internal network / load balancer health probe path)
  app.get("/_internal/health", async (request, reply) => {
    try {
      const dbTest = await drizzlePool.query("SELECT 1 as test");
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbTest.rows.length > 0,
          pool: {
            totalConnections: (drizzlePool as any)?.totalCount || 0,
            idleConnections: (drizzlePool as any)?.idleCount || 0,
            waitingConnections: (drizzlePool as any)?.waitingCount || 0,
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      };
    } catch (error) {
      logger.error({
        msg: "Health check failed",
        error: (error as Error).message,
      });
      return reply.status(503).send({
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
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
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(businessRoutes, { prefix: "/api/v1/business" });

  await app.register(addressesRoutes, { prefix: "/api/v1/addresses" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });
  await app.register(usersRoutes, { prefix: "/api/v1/users" });
  await app.register(driversRoutes, { prefix: "/api/v1/drivers" });
  await app.register(ordersRoutes, { prefix: "/api/v1/orders" });
  await app.register(ratingsRoutes, { prefix: "/api/v1/ratings" });
  await app.register(staticRoutes, { prefix: "/api/v1/static" });

  // ============ ERROR HANDLERS ============

  // 404 handler
  app.setNotFoundHandler(notFoundHandler as any);

  // Global error handler
  app.setErrorHandler(errorHandler as any);

  app.ready((err) => {
    if (err) throw err;
    startScheduler(app);
  });

  return app;
};

export default buildApp;
