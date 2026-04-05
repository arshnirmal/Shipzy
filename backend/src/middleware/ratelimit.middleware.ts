// services/backend/src/middleware/ratelimit.middleware.ts
import { FastifyRequest } from "fastify";
import config from "../config/env.js";

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  global: true,
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow,
  cache: 10000,
  allowList: ["127.0.0.1"],
  redis: null, // Add Redis connection here if using Redis
  nameSpace: "shipzy-rate-limit:",
  continueExceeding: true,
  skipOnError: true,

  keyGenerator: (request: FastifyRequest): string => {
    return (
      (request.headers["x-forwarded-for"] as string) ||
      (request.headers["x-real-ip"] as string) ||
      request.ip
    );
  },

  errorResponseBuilder: (request: FastifyRequest, context: any) => {
    return {
      success: false,
      message: "Rate limit exceeded",
      retryAfter: context.after,
      timestamp: new Date().toISOString(),
    };
  },
};

