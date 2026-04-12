// services/backend/src/middleware/error.middleware.ts
import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import logger from "../config/logger.js";
import { AppError } from "../utils/error.util.js";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // Log error
  logger.error({
    msg: "Error occurred",
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    statusCode: error.statusCode,
  });

  // Operational errors (expected errors)
  if (error instanceof AppError && error.isOperational) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      errors: (error as any).errors || null,
      timestamp: new Date().toISOString(),
    });
  }

  // Validation errors from Fastify/AJV
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: "Validation error",
      errors: error.validation.map((err) => ({
        field: err.instancePath.replace("/", "") || err.params.missingProperty,
        message: err.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // Database constraint errors (23xxx)
  if (error.code && error.code.startsWith("23")) {
    let message = "Database constraint violation";

    if (error.code === "23505") {
      message = "Resource already exists";
    } else if (error.code === "23503") {
      message = "Referenced resource not found";
    }

    return reply.status(409).send({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // Database semantic/schema errors (42xxx) — query construction bugs, never leak internals
  if (error.code && error.code.startsWith("42")) {
    return reply.status(500).send({
      success: false,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return reply.status(401).send({
      success: false,
      message: "Invalid token",
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === "TokenExpiredError") {
    return reply.status(401).send({
      success: false,
      message: "Token expired",
      timestamp: new Date().toISOString(),
    });
  }

  // Firebase errors
  if (error.code && error.code.startsWith("auth/")) {
    return reply.status(401).send({
      success: false,
      message: "Authentication failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Rate limit errors (from @fastify/rate-limit)
  if (
    error.statusCode === 429 ||
    (error as any).code === "FST_ERR_RATE_LIMIT"
  ) {
    return reply.status(429).send({
      success: false,
      message: "Rate limit exceeded",
      retryAfter: (error as any).after ?? (error as any).retryAfter ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic 500 error
  return reply.status(500).send({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply.status(404).send({
    success: false,
    message: "Route not found",
    path: request.url,
    timestamp: new Date().toISOString(),
  });
};
