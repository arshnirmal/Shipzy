// services/backend/src/modules/auth/auth.repository.js
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import authQueries from "../../database/queries/auth.queries.js";

class AuthRepository {
  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid) {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_FIREBASE_UID, [
        firebaseUid,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by Firebase UID", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find user by UUID
   */
  async findByUuid(userUuid) {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_UUID, [userUuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by UUID", { error: error.message });
      throw error;
    }
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phoneNumber) {
    try {
      const result = await db.query(authQueries.FIND_USER_BY_PHONE, [
        phoneNumber,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by phone", { error: error.message });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const { roleId, firebaseUid, phoneNumber, fullName, email } = userData;

      const result = await db.query(authQueries.CREATE_USER, [
        roleId,
        firebaseUid,
        phoneNumber,
        fullName,
        email || null,
      ]);

      const user = result.rows[0];

      // Initialize courier status if role is courier
      if (userData.roleName === "courier") {
        await db.query(authQueries.INITIALIZE_COURIER_STATUS, [user.user_id]);
      }

      return user;
    } catch (error) {
      logger.error("Error creating user", { error: error.message });
      throw error;
    }
  }

  /**
   * Store JWT token hash
   */
  async storeJwtToken(sessionData) {
    try {
      const {
        userId,
        phoneNumber,
        tokenHash,
        deviceId,
        deviceInfo,
        ipAddress,
      } = sessionData;

      const result = await db.query(authQueries.STORE_JWT_TOKEN, [
        userId,
        phoneNumber,
        tokenHash,
        deviceId || null,
        deviceInfo || null,
        ipAddress || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error("Error storing JWT token", { error: error.message });
      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  async validateJwtToken(tokenHash) {
    try {
      const result = await db.query(authQueries.VALIDATE_JWT_TOKEN, [
        tokenHash,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error validating JWT token", { error: error.message });
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(tokenHash) {
    try {
      await db.query(authQueries.UPDATE_SESSION_ACTIVITY, [tokenHash]);
    } catch (error) {
      logger.error("Error updating session activity", { error: error.message });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Revoke JWT token
   */
  async revokeToken(tokenHash) {
    try {
      const result = await db.query(authQueries.REVOKE_JWT_TOKEN, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error revoking token", { error: error.message });
      throw error;
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId) {
    try {
      await db.query(authQueries.REVOKE_ALL_USER_TOKENS, [userId]);
    } catch (error) {
      logger.error("Error revoking all user tokens", { error: error.message });
      throw error;
    }
  }
}

export default new AuthRepository();
