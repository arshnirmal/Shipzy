// services/backend/src/modules/auth/auth.repository.ts
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import authQueries from "../../database/queries/auth.queries.js";
import { getUserRoleName } from "../../utils/roles.utils.js";

import type { DbUser } from "../../types/user.js";

type User = DbUser & {
  firebase_uid?: string;
  profile_complete?: boolean;
  password_hash?: string | null;
};

interface Session {
  session_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  is_revoked: boolean;
  created_at: Date;
  last_activity_at?: Date;
}

interface CreateUserData {
  roleId: number;
  firebaseUid?: string;
  phoneNumber?: string | null;
  fullName: string;
  email?: string;
  passwordHash?: string | null;
  roleName?: string;
}

interface CreateEmailUserData {
  roleId: number;
  fullName: string;
  email: string;
  passwordHash: string;
  phoneNumber?: string | null;
  roleName?: string;
}

interface StoreJwtTokenData {
  userId: number;
  email?: string;
  phoneNumber?: string;
  tokenHash: string;
  deviceId?: string | null;
  deviceInfo?: any;
  ipAddress?: string | null;
  authMethod?: string;
}

class AuthRepository {
  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_FIREBASE_UID, [
        firebaseUid,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by Firebase UID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by UUID
   */
  async findByUuid(userUuid: string): Promise<User | null> {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_UUID, [userUuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by UUID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_PHONE, [
        phoneNumber,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by phone",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_EMAIL, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by email",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new user (for social/OTP auth - backward compatibility)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const {
        roleId,
        firebaseUid,
        phoneNumber,
        fullName,
        email,
        passwordHash = null,
      } = userData;

      const result = await db.query(authQueries.CREATE_USER, [
        roleId,
        firebaseUid,
        phoneNumber,
        fullName,
        email,
        passwordHash,
      ]);

      const user = result.rows[0];

      user.role_name = getUserRoleName(roleId);

      // Initialize courier status if role is courier
      if (userData.roleName === "courier") {
        await db.query(authQueries.INITIALIZE_COURIER_STATUS, [user.user_id]);
      }

      return user;
    } catch (error) {
      logger.error({
        msg: "Error creating user",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new user for email/password registration
   */
  async createEmailUser(userData: CreateEmailUserData): Promise<User> {
    try {
      const {
        roleId,
        fullName,
        email,
        passwordHash,
        phoneNumber = null,
      } = userData;

      const result = await db.query(authQueries.CREATE_EMAIL_USER, [
        roleId,
        fullName,
        email,
        passwordHash,
        phoneNumber,
      ]);

      const user = result.rows[0];

      user.role_name = getUserRoleName(roleId);

      // Initialize courier status if role is courier
      if (userData.roleName === "courier") {
        await db.query(authQueries.INITIALIZE_COURIER_STATUS, [user.user_id]);
      }

      return user;
    } catch (error) {
      logger.error({
        msg: "Error creating email user",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Store JWT token hash
   */
  async storeJwtToken(sessionData: StoreJwtTokenData): Promise<Session> {
    try {
      const {
        userId,
        email,
        phoneNumber,
        tokenHash,
        deviceId,
        deviceInfo,
        ipAddress,
        authMethod = "email",
      } = sessionData;

      const result = await db.query(authQueries.STORE_JWT_TOKEN, [
        userId,
        email,
        phoneNumber,
        tokenHash,
        deviceId || null,
        deviceInfo || null,
        ipAddress || null,
        authMethod,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error({
        msg: "Error storing JWT token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  async validateJwtToken(tokenHash: string): Promise<Session | null> {
    try {
      const result = await db.query(authQueries.VALIDATE_JWT_TOKEN, [
        tokenHash,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error validating JWT token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(tokenHash: string): Promise<void> {
    try {
      await db.query(authQueries.UPDATE_SESSION_ACTIVITY, [tokenHash]);
    } catch (error) {
      logger.error({
        msg: "Error updating session activity",
        error: (error as Error).message,
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Revoke JWT token
   */
  async revokeToken(tokenHash: string): Promise<Session | null> {
    try {
      const result = await db.query(authQueries.REVOKE_JWT_TOKEN, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error revoking token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      await db.query(authQueries.REVOKE_ALL_USER_TOKENS, [userId]);
    } catch (error) {
      logger.error({
        msg: "Error revoking all user tokens",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new AuthRepository();
