// services/backend/src/modules/auth/auth.service.js
import crypto from "crypto";
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

class AuthService {
  /**
   * Verify Firebase ID token and create/login user
   */
  async verifyFirebaseAndCreateUser(idToken, userData, deviceInfo) {
    try {
      // 1. Verify Firebase ID token
      const decodedToken = await verifyFirebaseToken(idToken);

      logger.info("Firebase token verified", {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
      });

      // 2. Check if user exists by Firebase UID
      let user = await authRepository.findByFirebaseUid(decodedToken.uid);

      let isNewUser = false;

      // 3. If user doesn't exist, create new user
      if (!user) {
        isNewUser = true;

        // Validate required fields for new user
        if (!userData.fullName || !userData.roleName) {
          throw new ValidationError(
            "Full name and role are required for new users",
          );
        }

        // Get role ID
        const roleId = await this._getRoleId(userData.roleName);

        // Create user
        user = await authRepository.createUser({
          roleId,
          firebaseUid: decodedToken.uid,
          phoneNumber: decodedToken.phone_number,
          fullName: userData.fullName,
          email: decodedToken.email || null,
          roleName: userData.roleName,
        });

        logger.info("New user created", { userId: user.user_id });
      } else {
        logger.info("Existing user logged in", { userId: user.user_id });
      }

      // 4. Generate JWT tokens
      const tokenPayload = {
        userId: user.user_id,
        userUuid: user.user_uuid,
        role: user.role_name || userData.roleName,
        phoneNumber: user.phone_number,
      };

      const accessToken = generateAccessToken(tokenPayload);
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
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: deviceInfo?.deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: deviceInfo?.ipAddress,
      });

      // 6. Return response
      return {
        isNewUser,
        user: {
          userId: user.user_id,
          userUuid: user.user_uuid,
          firebaseUid: user.firebase_uid,
          phoneNumber: user.phone_number,
          fullName: user.full_name,
          email: user.email,
          role: user.role_name || userData.roleName,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: "7d",
        },
      };
    } catch (error) {
      logger.error("Firebase verification failed", { error: error.message });

      if (error.code === "auth/id-token-expired") {
        throw new AuthenticationError("Firebase token expired");
      }

      if (error.code === "auth/invalid-id-token") {
        throw new AuthenticationError("Invalid Firebase token");
      }

      throw error;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken) {
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
        phoneNumber: user.phone_number,
        tokenHash,
        deviceId: null,
        deviceInfo: null,
        ipAddress: null,
      });

      return {
        accessToken: newAccessToken,
        expiresIn: "7d",
      };
    } catch (error) {
      logger.error("Token refresh failed", { error: error.message });
      throw new AuthenticationError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user (revoke token)
   */
  async logout(tokenHash) {
    try {
      const result = await authRepository.revokeToken(tokenHash);

      if (!result) {
        throw new AuthenticationError("Token not found");
      }

      logger.info("User logged out", { sessionId: result.session_id });

      return { message: "Logged out successfully" };
    } catch (error) {
      logger.error("Logout failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Get role ID by role name
   */
  async _getRoleId(roleName) {
    const roleMap = {
      client: 1,
      courier: 2,
      admin: 3,
    };

    const roleId = roleMap[roleName.toLowerCase()];

    if (!roleId) {
      throw new ValidationError("Invalid role name");
    }

    return roleId;
  }

  /**
   * Verify Google ID token and create/login user
   */
  async verifyGoogleAndCreateUser(idToken, userData, deviceInfo) {
    try {
      // 1. Verify Firebase ID token (Google uses Firebase Auth)
      const decodedToken = await verifyFirebaseToken(idToken);

      logger.info("Google token verified", {
        uid: decodedToken.uid,
        email: decodedToken.email,
      });

      // 2. Check if user exists by Firebase UID
      let user = await authRepository.findByFirebaseUid(decodedToken.uid);

      let isNewUser = false;

      // 3. If user doesn't exist, create new user
      if (!user) {
        isNewUser = true;

        // Validate required fields for new user
        if (!userData.roleName) {
          throw new ValidationError("Role is required for new users");
        }

        // Get role ID
        const roleId = await this._getRoleId(userData.roleName);

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
          roleName: userData.roleName,
        });

        logger.info("New user created via Google auth", {
          userId: user.user_id,
        });
      }

      // 4. Create JWT tokens
      const accessToken = generateAccessToken({
        userId: user.user_id,
        roleId: user.role_id,
        roleName: user.role_name,
      });

      const refreshToken = generateRefreshToken({
        userId: user.user_id,
      });

      // 5. Hash refresh token and store session
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await authRepository.createSession({
        userId: user.user_id,
        tokenHash: refreshTokenHash,
        deviceInfo,
      });

      // 6. Return user data and tokens
      return {
        user: {
          userId: user.user_id,
          fullName: user.full_name,
          email: user.email,
          role: user.role_name,
          profileComplete: user.profile_complete,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
        isNewUser,
      };
    } catch (error) {
      logger.error("Google authentication service error", {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new AuthService();
