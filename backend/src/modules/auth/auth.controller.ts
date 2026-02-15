// services/backend/src/modules/auth/auth.controller.ts
import crypto from "node:crypto";
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import authService from "./auth.service.js";

import type {
  VerifyGoogle,
  RefreshToken,
  Register,
  Login,
} from "./auth.zod.js";
import { VerifyGoogleZ, RefreshTokenZ, RegisterZ, LoginZ } from "./auth.zod.js";

class AuthController {
  /**
   * POST /api/v1/auth/refresh
   * Refresh JWT access token
   */
  async refreshToken(
    request: FastifyRequest<{ Body: RefreshToken }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = RefreshTokenZ.parse(request.body) as RefreshToken;

      const result = await authService.refreshToken(parsed.refreshToken);

      return successResponse(reply, result, "Token refreshed successfully");
    } catch (error) {
      logger.error({
        msg: "Token refresh controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 401,
      );
    }
  }

  /**
   * POST /api/v1/auth/google/verify
   * Verify Google ID token and create/login user
   */
  async verifyGoogle(
    request: FastifyRequest<{ Body: VerifyGoogle }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = VerifyGoogleZ.parse(request.body) as VerifyGoogle;
      const { idToken, role } = parsed;

      // Get device info from request
      const deviceInfo: any = {
        ipAddress: request.ip,
      };
      if (request.headers["x-device-id"] !== undefined)
        deviceInfo.deviceId = request.headers["x-device-id"];
      if (request.headers["user-agent"] !== undefined)
        deviceInfo.userAgent = request.headers["user-agent"];

      const userData: any = {};
      if (role !== undefined) userData.roleName = role;

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
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (revoke token)
   */
  async logout(request: FastifyRequest, reply: FastifyReply): Promise<any> {
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
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/register
   * Register new user with email/password
   */
  async register(
    request: FastifyRequest<{ Body: Register }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = RegisterZ.parse(request.body) as Register;
      const { fullName, email, password, role, phoneNumber } = parsed;

      // Get device info from request
      const deviceInfo: any = {
        ipAddress: request.ip,
      };
      if (request.headers["x-device-id"] !== undefined)
        deviceInfo.deviceId = request.headers["x-device-id"];
      if (request.headers["user-agent"] !== undefined)
        deviceInfo.userAgent = request.headers["user-agent"];

      const registerData: any = { fullName, email, password };
      if (role !== undefined) registerData.role = role;
      if (phoneNumber !== undefined) registerData.phoneNumber = phoneNumber;

      const result = await authService.registerWithEmail(
        registerData,
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
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login with email/password
   */
  async login(
    request: FastifyRequest<{ Body: Login }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = LoginZ.parse(request.body) as Login;
      const { email, password } = parsed;

      // Get device info from request
      const deviceInfo: any = {
        ipAddress: request.ip,
      };
      if (request.headers["x-device-id"] !== undefined)
        deviceInfo.deviceId = request.headers["x-device-id"];
      if (request.headers["user-agent"] !== undefined)
        deviceInfo.userAgent = request.headers["user-agent"];

      const result = await authService.loginWithEmail(
        { email, password },
        deviceInfo,
      );

      return successResponse(reply, result, "User logged in successfully");
    } catch (error) {
      logger.error({
        msg: "Login controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 401,
      );
    }
  }
}

export default new AuthController();
