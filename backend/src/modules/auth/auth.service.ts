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
import authRepository from "./auth.repository.js";
import { getRoleId } from "../../utils/roles.utils.js";
import type { LoginRequest, RegisterRequest, AuthResponse } from "./auth.zod.js";
import type { DeviceInfo } from "../../types/index.js";

const JWT_ACCESS_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

class AuthService {
  /**
   * Refresh JWT access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = verifyToken(refreshToken);

      const user = await authRepository.findByUuid(decoded.userUuid);
      if (!user) throw new AuthenticationError("User not found");
      if (!user.isActive) throw new AuthenticationError("User account is inactive");

      const newAccessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName,
        email: user.email ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
      });

      const tokenHash = crypto.createHash("sha256").update(newAccessToken).digest("hex");
      const refreshAuthMethod: "email" | "phone" | "google" | "firebase" =
        user.firebaseUid
          ? "firebase"
          : user.email
            ? "email"
            : "phone";

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        tokenHash,
        deviceId: null,
        deviceInfo: null,
        ipAddress: null,
        authMethod: refreshAuthMethod,
      });

      return {
        user: {
          userId: user.userId,
          userUuid: user.userUuid,
          role: user.roleName as "client" | "courier",
          phoneNumber: user.phoneNumber ?? undefined,
          email: user.email ?? undefined,
          fullName: user.fullName,
          profilePictureUrl: user.profilePictureUrl ?? undefined,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        },
        tokens: {
          accessToken: newAccessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
      };
    } catch (error) {
      logger.error({ msg: "Token refresh failed", error: (error as Error).message });
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

      logger.info({ msg: "Google token verified", uid: decodedToken.uid, email: decodedToken.email });

      let user = await authRepository.findByFirebaseUid(decodedToken.uid);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;

        const allowedRoles = new Set(["client", "courier", "business"]);
        const roleName = userData.roleName?.toLowerCase() ?? "client";

        if (!allowedRoles.has(roleName)) {
          throw new ValidationError("Invalid role for social login");
        }

        if (decodedToken.email) {
          const existingByEmail = await authRepository.findByEmail(decodedToken.email);
          if (existingByEmail) {
            throw new ValidationError(
              "Email already in use. Please sign in with the existing method or link accounts.",
            );
          }
        }

        const roleId = getRoleId(roleName);

        user = await authRepository.createUser({
          roleId,
          firebaseUid: decodedToken.uid,
          phoneNumber: null,
          fullName: decodedToken.name || decodedToken.email?.split("@")[0] || "Google User",
          email: decodedToken.email,
          passwordHash: null,
          roleName,
        });

        logger.info({ msg: "New user created via Google auth", userId: user.userId });
      }

      const accessToken = generateAccessToken({
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName,
        phoneNumber: user.phoneNumber ?? undefined,
      });

      const newRefreshToken = generateRefreshToken({
        userId: user.userId,
        userUuid: user.userUuid,
      });

      const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "google",
      });

      return {
        user: {
          userId: user.userId,
          userUuid: user.userUuid,
          role: user.roleName as "client" | "courier",
          phoneNumber: user.phoneNumber ?? undefined,
          email: user.email ?? undefined,
          fullName: user.fullName,
          profilePictureUrl: user.profilePictureUrl ?? undefined,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
        isNewUser,
      };
    } catch (error) {
      logger.error({ msg: "Google authentication service error", error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Register new user with email/password
   */
  async registerWithEmail(userData: RegisterRequest, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    try {
      const { fullName, email, password, role = "client", phoneNumber } = userData;

      if (!fullName || !email || !password) {
        throw new ValidationError("Full name, email, and password are required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new ValidationError("Invalid email format");

      if (password.length < 8) {
        throw new ValidationError("Password must be at least 8 characters long");
      }

      const existingUser = await authRepository.findByEmail(email);
      if (existingUser) throw new ValidationError("User with this email already exists");

      const roleId = getRoleId(role);
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await authRepository.createEmailUser({
        roleId,
        fullName,
        email,
        passwordHash,
        phoneNumber,
        roleName: role,
      });

      logger.info({ msg: "New user registered with email", userId: user.userId, email });

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

      const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return {
        user: {
          userId: user.userId,
          userUuid: user.userUuid,
          role: (user.roleName || role) as "client" | "courier",
          phoneNumber: user.phoneNumber ?? undefined,
          email: user.email ?? undefined,
          fullName: user.fullName,
          profilePictureUrl: user.profilePictureUrl ?? undefined,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
      };
    } catch (error) {
      logger.error({ msg: "Email registration failed", error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Login with email/password
   */
  async loginWithEmail(credentials: LoginRequest, deviceInfo: DeviceInfo): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      if (!email || !password) throw new ValidationError("Email and password are required");

      const user = await authRepository.findByEmail(email);
      if (!user) throw new AuthenticationError("Invalid email or password");
      if (!user.isActive) throw new AuthenticationError("Account is deactivated");

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
      if (!isPasswordValid) throw new AuthenticationError("Invalid email or password");

      logger.info({ msg: "User logged in with email", userId: user.userId, email });

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

      const tokenHash = crypto.createHash("sha256").update(accessToken).digest("hex");

      await authRepository.storeJwtToken({
        userId: user.userId,
        email: user.email ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return {
        user: {
          userId: user.userId,
          userUuid: user.userUuid,
          role: user.roleName as "client" | "courier",
          phoneNumber: user.phoneNumber ?? undefined,
          email: user.email ?? undefined,
          fullName: user.fullName,
          profilePictureUrl: user.profilePictureUrl ?? undefined,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt?.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_ACCESS_EXPIRES_IN,
          tokenType: "Bearer",
        },
      };
    } catch (error) {
      logger.error({ msg: "Email login failed", error: (error as Error).message });
      throw error;
    }
  }
}

export default new AuthService();
