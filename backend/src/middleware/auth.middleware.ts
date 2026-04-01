// services/backend/src/middleware/auth.middleware.ts
import crypto from "node:crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../config/logger.js";
import authRepository from "../modules/auth/auth.repository.js";
import {
  AuthenticationError,
  AuthorizationError,
} from "../utils/error.util.js";
import { verifyToken } from "../utils/jwt.util.js";

import type { RequestUser } from "../types/user.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: RequestUser;
  }
}

/**
 * JWT authentication middleware
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.substring(7);

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Hash token for database lookup
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 4. Validate token in database (check if revoked)
    const isValid = await authRepository.validateJwtToken(tokenHash);

    if (!isValid) {
      throw new AuthenticationError("Invalid or revoked token");
    }

    // 5. Update last activity (async, non-blocking)
    authRepository.updateSessionActivity(tokenHash).catch((err) => {
      logger.warn({
        msg: "Failed to update session activity",
        error: (err as Error).message,
      });
    });

    // 6. Attach user info to request
    request.user = {
      userId: decoded.userId,
      userUuid: decoded.userUuid,
      role: decoded.role,
      phoneNumber: decoded.phoneNumber,
    };
  } catch (error) {
    logger.error({
      msg: "Authentication failed",
      error: (error as Error).message,
    });
    throw new AuthenticationError(
      (error as Error).message || "Authentication failed",
    );
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError("Not authenticated");
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AuthorizationError("Insufficient permissions");
    }
  };
};
