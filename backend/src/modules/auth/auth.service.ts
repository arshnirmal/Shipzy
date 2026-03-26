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
import { DeviceInfo } from "../../types/index.js";
import { getRoleId } from "../../utils/roles.utils.js";

interface UserData {
  fullName?: string;
  roleName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role?: string;
  phoneNumber?: string;
}

interface AuthResult {
  user: import("../../types/user.js").UserProfile;
  accessToken?: string;
  refreshToken?: string;
  isNewUser?: boolean;
  expiresIn?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

class AuthService {
  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // 1. Verify refresh token
      const decoded = verifyToken(refreshToken);

      // 2. Find user by UUID
      const user = await authRepository.findByUuid(decoded.userUuid);

      if (!user) {
        throw new AuthenticationError("User not found");
      }

      if (!user.is_active) {
        throw new AuthenticationError("User account is inactive");
      }

      // 3. Generate new access token
      const tokenPayload = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name,
        email: user.email,
        phoneNumber: user.phone_number,
      };

      const newAccessToken = generateAccessToken(tokenPayload);

      // 4. Store new token hash
      const tokenHash = crypto
        .createHash("sha256")
        .update(newAccessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.user_id,
        email: user.email,
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: null,
        deviceInfo: null,
        ipAddress: null,
        authMethod: "refresh",
      });

      const mappedUser: import("../../types/user.js").UserProfile = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name,
        phoneNumber: user.phone_number,
        email: user.email,
        fullName: user.full_name,
        profilePictureUrl: user.profile_picture_url,
        isVerified: user.is_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return {
        user: mappedUser,
        tokens: {
          accessToken: newAccessToken,
          refreshToken,
          expiresIn: "7d",
        },
      };
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
      const result = await authRepository.revokeToken(tokenHash);

      if (!result) {
        throw new AuthenticationError("Token not found");
      }

      logger.info({ msg: "User logged out", sessionId: result.session_id });

      return { message: "Logged out successfully" };
    } catch (error) {
      logger.error({
        msg: "Logout failed",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Verify Google ID token and create/login user
   */
  async verifyGoogleAndCreateUser(
    idToken: string,
    userData: UserData,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResult> {
    try {
      // 1. Verify Firebase ID token (Google uses Firebase Auth)
      const decodedToken = await verifyFirebaseToken(idToken);

      logger.info({
        msg: "Google token verified",
        uid: decodedToken.uid,
        email: decodedToken.email,
      });

      // 2. Check if user exists by Firebase UID
      let user = await authRepository.findByFirebaseUid(decodedToken.uid);

      let isNewUser = false;

      // 3. If user doesn't exist, create new user
      if (!user) {
        isNewUser = true;

        // Determine role for new social users using a strict allowlist
        const allowedSocialRoles = new Set(["client", "courier", "business"]);
        const requestedRole = userData.roleName?.toLowerCase();
        const roleName = requestedRole ?? "client";

        if (!allowedSocialRoles.has(roleName)) {
          throw new ValidationError("Invalid role for social login");
        }

        // Prevent email collisions with existing accounts
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

        // Get role ID
        const roleId = getRoleId(roleName);

        // Create user with Google profile data
        user = await authRepository.createUser({
          roleId,
          firebaseUid: decodedToken.uid,
          phoneNumber: null, // Google auth doesn't provide phone
          fullName:
            decodedToken.name ||
            decodedToken.email?.split("@")[0] ||
            "Google User",
          email: decodedToken.email,
          passwordHash: null, // Social auth doesn't require password
          roleName,
        });

        logger.info({
          msg: "New user created via Google auth",
          userId: user.user_id,
        });
      }

      // 4. Create JWT tokens
      const accessToken = generateAccessToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name,
        phoneNumber: user.phone_number,
      });

      const refreshToken = generateRefreshToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
      });

      // 5. Store token hash in database
      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.user_id,
        email: user.email,
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "google",
      });

      // 6. Return user data and tokens
      const mappedUser: import("../../types/user.js").UserProfile = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name,
        phoneNumber: user.phone_number,
        email: user.email,
        fullName: user.full_name,
        profilePictureUrl: user.profile_picture_url,
        isVerified: user.is_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      return {
        user: mappedUser,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d",
        },
        isNewUser,
      };
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
    userData: RegisterData,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResult> {
    try {
      const {
        fullName,
        email,
        password,
        role = "client",
        phoneNumber,
      } = userData;

      // Validate required fields
      if (!fullName || !email || !password) {
        throw new ValidationError(
          "Full name, email, and password are required",
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }

      // Validate password strength
      if (password.length < 8) {
        throw new ValidationError(
          "Password must be at least 8 characters long",
        );
      }

      // Check if user already exists by email
      const existingUserByEmail = await authRepository.findByEmail(email);
      if (existingUserByEmail) {
        throw new ValidationError("User with this email already exists");
      }

      // Get role ID
      const roleId = getRoleId(role);

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await authRepository.createEmailUser({
        roleId,
        fullName,
        email,
        passwordHash,
        phoneNumber,
        roleName: role,
      });

      logger.info({
        msg: "New user registered with email",
        userId: user.user_id,
        email,
      });

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name || role,
        email: user.email,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
      });

      // Store token hash in database
      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.user_id,
        email: user.email,
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return {
        user: {
          userId: user.user_id,
          userUuid: user.user_uuid,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          role: user.role_name,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d",
        },
      };
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
    credentials: LoginCredentials,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Validate required fields
      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      // Find user by email
      const user = await authRepository.findByEmail(email);
      if (!user) {
        throw new AuthenticationError("Invalid email or password");
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AuthenticationError("Account is deactivated");
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash!,
      );
      if (!isPasswordValid) {
        throw new AuthenticationError("Invalid email or password");
      }

      logger.info({
        msg: "User logged in with email",
        userId: user.user_id,
        email,
      });

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name,
        email: user.email,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken({
        userId: user.user_id,
        userUuid: user.user_uuid,
      });

      // Store token hash in database
      const tokenHash = crypto
        .createHash("sha256")
        .update(accessToken)
        .digest("hex");

      await authRepository.storeJwtToken({
        userId: user.user_id,
        email: user.email,
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
        authMethod: "email",
      });

      return {
        user: {
          userId: user.user_id,
          userUuid: user.user_uuid,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          role: user.role_name,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d",
        },
      };
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
function _getRoleId(roleName: string) {
  throw new Error("Function not implemented.");
}
