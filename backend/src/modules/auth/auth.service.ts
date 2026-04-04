// services/backend/src/modules/auth/auth.service.ts
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { verifyFirebaseToken } from "../../config/firebase.js";
import logger from "../../config/logger.js";
import {
  AuthenticationError,
  ValidationError,
} from "../../utils/error.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../utils/jwt.util.js";
import {
  toIsoDateTime,
  toIsoDateTimeOrUndefined,
} from "../../utils/datetime.util.js";
import authRepository from "./auth.repository.js";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "./auth.zod.js";
import type { DeviceInfo } from "../../types/index.js";
import type { AuthUser } from "../../types/user.js";

const JWT_ACCESS_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

class AuthService {
  private mapUser(user: AuthUser): AuthResponse["actor"]["user"] {
    return {
      userId: user.userId,
      userUuid: user.userUuid,
      role: user.roleName as "client" | "courier",
      phoneNumber: user.phoneNumber ?? undefined,
      email: user.email ?? undefined,
      fullName: user.fullName,
      profilePictureUrl: user.profilePictureUrl ?? undefined,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: toIsoDateTime(user.createdAt),
      updatedAt: toIsoDateTimeOrUndefined(user.updatedAt),
    };
  }

  private buildAuthResponse(
    user: AuthUser,
    tokens: AuthResponse["auth"]["tokens"],
    method: "email" | "google" | "refresh",
    isNewUser?: boolean,
  ): AuthResponse {
    return {
      actor: {
        user: this.mapUser(user),
      },
      auth: {
        tokens,
        session: {
          method,
          isNewUser,
        },
      },
    };
  }

  /**
   * Refresh JWT access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = verifyToken(refreshToken);

      const user = await authRepository.findByUuid(decoded.userUuid);
      if (!user) throw new AuthenticationError("User not found");
      if (!user.isActive)
        throw new AuthenticationError("User account is inactive");

      if (!user.email) {
        throw new AuthenticationError(
          "Only email-backed accounts are supported for token refresh",
        );
      }

      const newAccessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName,
        email: user.email ?? undefined,
      });

      const tokenHash = crypto
        .createHash("sha256")
        .update(newAccessToken)
        .digest("hex");
      const refreshAuthMethod: "email" | "google" = user.firebaseUid
        ? "google"
        : "email";

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        tokenHash,
        deviceId: null,
        deviceInfo: null,
        ipAddress: null,
        authMethod: refreshAuthMethod,
      });

      return this.buildAuthResponse(
        user,
        {
          accessToken: newAccessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
        "refresh",
      );
    } catch (error) {
      logger.error({
        msg: "Token refresh failed",
        error: (error as Error).message,
      });
      throw new AuthenticationError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user (revoke token)
   */
  async logout(tokenHash: string): Promise<{ message: string }> {
    try {
      const revoked = await authRepository.revokeToken(tokenHash);
      if (!revoked) throw new AuthenticationError("Token not found");

      logger.info({ msg: "User logged out", sessionId: revoked.sessionId });
      return { message: "Logged out successfully" };
    } catch (error) {
      logger.error({ msg: "Logout failed", error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Verify Google ID token and create/login user
   */
  async verifyGoogleAndCreateUser(
    idToken: string,
    userData: { roleName?: string },
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    try {
      const decodedToken = await verifyFirebaseToken(idToken);

      logger.info({
        msg: "Google token verified",
        uid: decodedToken.uid,
        email: decodedToken.email,
      });

      let user = await authRepository.findByFirebaseUid(decodedToken.uid);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;

        const allowedRoles = new Set(["client", "courier"]);
        const rawRole = userData.roleName?.toLowerCase() ?? "client";

        if (!allowedRoles.has(rawRole)) {
          throw new ValidationError("Invalid role for social login");
        }

        const roleName = rawRole as "client" | "courier";

        if (decodedToken.email) {
          const existingByEmail = await authRepository.findByEmail(
            decodedToken.email,
          );
          if (existingByEmail) {
            throw new ValidationError(
              "Email already in use. Please sign in with the existing method or link accounts.",
            );
          }
        }

        if (!decodedToken.email) {
          throw new ValidationError(
            "Google account email is required for registration",
          );
        }

        user = await authRepository.createUser({
          role: roleName,
          firebaseUid: decodedToken.uid,
          phoneNumber: null,
          fullName:
            decodedToken.name ||
            decodedToken.email?.split("@")[0] ||
            "Google User",
          email: decodedToken.email,
          passwordHash: null,
        });

        logger.info({
          msg: "New user created via Google auth",
          userId: user.userId,
        });
      }

      const accessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName,
        email: user.email ?? undefined,
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.userId,
        userUuid: user.userUuid,
      });

      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "google",
      });

      return this.buildAuthResponse(
        user,
        {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
        "google",
        isNewUser,
      );
    } catch (error) {
      logger.error({
        msg: "Google authentication service error",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Register new user with email/password
   */
  async registerWithEmail(
    userData: RegisterRequest,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    try {
      const {
        identity: { fullName, role = "client", phoneNumber },
        credentials: { email, password },
      } = userData;

      if (!fullName || !email || !password) {
        throw new ValidationError(
          "Full name, email, and password are required",
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        throw new ValidationError("Invalid email format");

      if (password.length < 8) {
        throw new ValidationError(
          "Password must be at least 8 characters long",
        );
      }

      const existingUser = await authRepository.findByEmail(email);
      if (existingUser)
        throw new ValidationError("User with this email already exists");

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await authRepository.createEmailUser({
        role,
        fullName,
        email,
        passwordHash,
        phoneNumber,
      });

      logger.info({
        msg: "New user registered with email",
        userId: user.userId,
        email,
      });

      const accessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName || role,
        email: user.email ?? undefined,
      });

      const refreshToken = generateRefreshToken({
        userId: user.userId,
        userUuid: user.userUuid,
      });

      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return this.buildAuthResponse(
        user,
        {
          accessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
        "email",
      );
    } catch (error) {
      logger.error({
        msg: "Email registration failed",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Login with email/password
   */
  async loginWithEmail(
    credentials: LoginRequest,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponse> {
    try {
      const {
        credentials: { email, password },
      } = credentials;

      if (!email || !password)
        throw new ValidationError("Email and password are required");

      const user = await authRepository.findByEmail(email);
      if (!user) throw new AuthenticationError("Invalid email or password");
      if (!user.isActive)
        throw new AuthenticationError("Account is deactivated");
      if (!user.passwordHash) {
        throw new AuthenticationError(
          "Password login is not available for this account",
        );
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash!,
      );
      if (!isPasswordValid)
        throw new AuthenticationError("Invalid email or password");

      logger.info({
        msg: "User logged in with email",
        userId: user.userId,
        email,
      });

      const accessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName,
        email: user.email ?? undefined,
      });

      const refreshToken = generateRefreshToken({
        userId: user.userId,
        userUuid: user.userUuid,
      });

      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return this.buildAuthResponse(
        user,
        {
          accessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
        "email",
      );
    } catch (error) {
      logger.error({
        msg: "Email login failed",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new AuthService();
