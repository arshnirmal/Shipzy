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
    reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      errors: (error as any).errors || null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validation errors from Fastify/AJV
  if (error.validation) {
    reply.status(400).send({
      success: false,
      message: "Validation error",
      errors: error.validation.map((err) => ({
        field: err.instancePath.replace("/", "") || err.params.missingProperty,
        message: err.message,
      })),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Database constraint errors (23xxx)
  if (error.code && error.code.startsWith("23")) {
    let message = "Database constraint violation";

    if (error.code === "23505") {
      message = "Resource already exists";
    } else if (error.code === "23503") {
      message = "Referenced resource not found";
    }

    reply.status(409).send({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Database semantic/schema errors (42xxx) — query construction bugs, never leak internals
  if (error.code && error.code.startsWith("42")) {
    reply.status(500).send({
      success: false,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    reply.status(401).send({
      success: false,
      message: "Invalid token",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error.name === "TokenExpiredError") {
    reply.status(401).send({
      success: false,
      message: "Token expired",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Firebase errors
  if (error.code && error.code.startsWith("auth/")) {
    reply.status(401).send({
      success: false,
      message: "Authentication failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Rate limit errors (from @fastify/rate-limit)
  if (
    error.statusCode === 429 ||
    (error as any).code === "FST_ERR_RATE_LIMIT"
  ) {
    reply.status(429).send({
      success: false,
      message: "Rate limit exceeded",
      retryAfter: (error as any).after ?? (error as any).retryAfter ?? null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Generic 500 error
  reply.status(500).send({
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
  reply.status(404).send({
    success: false,
    message: "Route not found",
    path: request.url,
    timestamp: new Date().toISOString(),
  });
};
