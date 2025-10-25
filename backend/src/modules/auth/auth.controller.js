// services/backend/src/modules/auth/auth.controller.js
import crypto from "crypto";
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import authService from "./auth.service.js";

class AuthController {
  /**
   * POST /api/v1/auth/firebase/verify
   * Verify Firebase ID token and create/login user
   */
  async verifyFirebase(request, reply) {
    try {
      const { idToken, fullName, role } = request.body;

      // Get device info from request
      const deviceInfo = {
        deviceId: request.headers["x-device-id"],
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      };

      const result = await authService.verifyFirebaseAndCreateUser(
        idToken,
        { fullName, roleName: role },
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
      logger.error("Firebase verification controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh JWT access token
   */
  async refreshToken(request, reply) {
    try {
      const { refreshToken } = request.body;

      const result = await authService.refreshToken(refreshToken);

      return successResponse(reply, result, "Token refreshed successfully");
    } catch (error) {
      logger.error("Token refresh controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 401);
    }
  }

  /**
   * POST /api/v1/auth/google/verify
   * Verify Google ID token and create/login user
   */
  async verifyGoogle(request, reply) {
    try {
      const { idToken, role } = request.body;

      // Get device info from request
      const deviceInfo = {
        deviceId: request.headers["x-device-id"],
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      };

      const result = await authService.verifyGoogleAndCreateUser(
        idToken,
        { roleName: role },
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
      logger.error("Google verification controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (revoke token)
   */
  async logout(request, reply) {
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
      logger.error("Logout controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new AuthController();
