// services/backend/src/modules/auth/auth.controller.ts
import crypto from "node:crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import authService from "./auth.service.js";
import type { DeviceInfo } from "../../types/index.js";

import type {
  GoogleAuthRequest,
  RefreshTokenRequest,
  RegisterRequest,
  LoginRequest,
} from "./auth.zod.js";

class AuthController {
  private _getHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    if (typeof value === "string") return value;
    return Array.isArray(value) ? value[0] : undefined;
  }

  private _getDeviceInfo(request: FastifyRequest): DeviceInfo {
    const deviceInfo: DeviceInfo = {
      ipAddress: request.ip,
    };

    const deviceId = this._getHeaderValue(request.headers["x-device-id"]);
    const userAgent = this._getHeaderValue(request.headers["user-agent"]);

    if (deviceId) deviceInfo.deviceId = deviceId;
    if (userAgent) deviceInfo.userAgent = userAgent;

    return deviceInfo;
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh JWT access token
   */
  async refreshToken(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const result = await authService.refreshToken(request.body.refreshToken);

      return successResponse(reply, result, "Token refreshed successfully");
    } catch (error) {
      logger.error({
        msg: "Token refresh controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 401,
      );
    }
  }

  /**
   * POST /api/v1/auth/google/verify
   * Verify Google ID token and create/login user
   */
  async verifyGoogle(
    request: FastifyRequest<{ Body: GoogleAuthRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { idToken, role } = request.body;
      const deviceInfo = this._getDeviceInfo(request);
      const userData: { roleName?: string } = { roleName: role };

      const result = await authService.verifyGoogleAndCreateUser(
        idToken,
        userData,
        deviceInfo,
      );

      return successResponse(
        reply,
        result,
        result.isNewUser
          ? "User registered successfully"
          : "User logged in successfully",
        result.isNewUser ? 201 : 200,
      );
    } catch (error) {
      logger.error({
        msg: "Google verification controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (revoke token)
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      // Get token from Authorization header
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return errorResponse(reply, "No token provided", 401);
      }

      // Hash token
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const result = await authService.logout(tokenHash);

      return successResponse(reply, result, "Logged out successfully");
    } catch (error) {
      logger.error({
        msg: "Logout controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/register
   * Register new user with email/password
   */
  async register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const deviceInfo = this._getDeviceInfo(request);
      const result = await authService.registerWithEmail(
        request.body,
        deviceInfo,
      );

      return successResponse(
        reply,
        result,
        "User registered successfully",
        201,
      );
    } catch (error) {
      logger.error({
        msg: "Registration controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login with email/password
   */
  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const deviceInfo = this._getDeviceInfo(request);
      const result = await authService.loginWithEmail(request.body, deviceInfo);

      return successResponse(reply, result, "User logged in successfully");
    } catch (error) {
      logger.error({
        msg: "Login controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 401,
      );
    }
  }
}

export default new AuthController();
