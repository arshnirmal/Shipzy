// services/backend/src/modules/auth/auth.repository.ts
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import db from "../../database/db.js";
import authQueries from "../../database/queries/auth.queries.js";
import { getUserRoleName } from "../../utils/roles.utils.js";
import { userProfiles } from "../../database/schema/users.js";
import { userRoles } from "../../database/schema/public.js";
import { authSessions } from "../../database/schema/users.js";
import { courierStatus } from "../../database/schema/logistics.js";

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
   * Find user by Firebase UID (migrated to Drizzle)
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    try {
      const result = await drizzleDb
        .select({
          userId: userProfiles.userId,
          userUuid: userProfiles.userUuid,
          roleId: userProfiles.roleId,
          roleName: userRoles.name,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
        })
        .from(userProfiles)
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(
            eq(userProfiles.firebaseUid, firebaseUid),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      return (result[0] as User) || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by Firebase UID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by UUID (migrated to Drizzle)
   */
  async findByUuid(userUuid: string): Promise<User | null> {
    try {
      const result = await drizzleDb
        .select({
          userId: userProfiles.userId,
          userUuid: userProfiles.userUuid,
          roleId: userProfiles.roleId,
          roleName: userRoles.name,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
        })
        .from(userProfiles)
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(
            eq(userProfiles.userUuid, userUuid),
            eq(userProfiles.isActive, true),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      return (result[0] as User) || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by UUID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by phone number (migrated to Drizzle)
   */
  async findByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const result = await drizzleDb
        .select({
          userId: userProfiles.userId,
          userUuid: userProfiles.userUuid,
          roleId: userProfiles.roleId,
          roleName: userRoles.name,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          passwordHash: userProfiles.passwordHash,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
        })
        .from(userProfiles)
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(
            eq(userProfiles.phoneNumber, phoneNumber),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      return (result[0] as User) || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by phone",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find user by email (migrated to Drizzle)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await drizzleDb
        .select({
          userId: userProfiles.userId,
          userUuid: userProfiles.userUuid,
          roleId: userProfiles.roleId,
          roleName: userRoles.name,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          passwordHash: userProfiles.passwordHash,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
        })
        .from(userProfiles)
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(eq(userProfiles.email, email), isNull(userProfiles.deletedAt)),
        )
        .limit(1);

      return (result[0] as User) || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by email",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new user (for social/OTP auth - migrated to Drizzle)
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

      const result = await drizzleDb
        .insert(userProfiles)
        .values({
          roleId,
          firebaseUid: firebaseUid || undefined,
          phoneNumber: phoneNumber || undefined,
          fullName,
          email: email || undefined,
          passwordHash: passwordHash || undefined,
          isVerified: true,
        })
        .returning();

      const createdUser = result[0];
      const roleName = getUserRoleName(roleId);

      // Initialize courier status if role is courier (keep as raw SQL for ON CONFLICT)
      if (userData.roleName === "courier") {
        await db.query(authQueries.INITIALIZE_COURIER_STATUS, [
          createdUser.userId,
        ]);
      }

      // Fetch full user with role for return type compatibility
      const user = await this.findByUuid(createdUser.userUuid);
      if (!user) {
        throw new Error("User not found after creation");
      }

      return { ...user, role_name: roleName } as User;
    } catch (error) {
      logger.error({
        msg: "Error creating user",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create new user for email/password registration (migrated to Drizzle)
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

      const result = await drizzleDb
        .insert(userProfiles)
        .values({
          roleId,
          fullName,
          email,
          passwordHash,
          phoneNumber: phoneNumber || undefined,
          isVerified: false,
        })
        .returning();

      const createdUser = result[0];
      const roleName = getUserRoleName(roleId);

      // Initialize courier status if role is courier (keep as raw SQL for ON CONFLICT)
      if (userData.roleName === "courier") {
        await db.query(authQueries.INITIALIZE_COURIER_STATUS, [
          createdUser.userId,
        ]);
      }

      // Fetch full user with role for return type compatibility
      const user = await this.findByUuid(createdUser.userUuid);
      if (!user) {
        throw new Error("User not found after creation");
      }

      return { ...user, role_name: roleName } as User;
    } catch (error) {
      logger.error({
        msg: "Error creating email user",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Store JWT token hash (migrated to Drizzle)
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

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const result = await drizzleDb
        .insert(authSessions)
        .values({
          userId,
          email: email || "",
          phoneNumber: phoneNumber || undefined,
          jwtTokenHash: tokenHash,
          deviceId: deviceId || undefined,
          deviceInfo: deviceInfo || undefined,
          ipAddress: ipAddress || undefined,
          authMethod,
          isVerified: true,
          verifiedAt: new Date(),
          expiresAt,
          lastActivityAt: new Date(),
        })
        .returning({
          session_id: authSessions.sessionId,
          expires_at: authSessions.expiresAt,
        });

      return {
        session_id: result[0].session_id,
        user_id: userId,
        token_hash: tokenHash,
        expires_at: result[0].expires_at,
        is_revoked: false,
        created_at: new Date(),
        last_activity_at: new Date(),
      } as Session;
    } catch (error) {
      logger.error({
        msg: "Error storing JWT token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate JWT token (migrated to Drizzle)
   */
  async validateJwtToken(tokenHash: string): Promise<Session | null> {
    try {
      const result = await drizzleDb
        .select({
          session_id: authSessions.sessionId,
          user_id: authSessions.userId,
          phone_number: authSessions.phoneNumber,
          expires_at: authSessions.expiresAt,
          last_activity_at: authSessions.lastActivityAt,
          user_uuid: userProfiles.userUuid,
          full_name: userProfiles.fullName,
          role_id: userProfiles.roleId,
          role_name: userRoles.name,
          is_active: userProfiles.isActive,
          is_verified: userProfiles.isVerified,
        })
        .from(authSessions)
        .innerJoin(userProfiles, eq(authSessions.userId, userProfiles.userId))
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(
            eq(authSessions.jwtTokenHash, tokenHash),
            gt(authSessions.expiresAt, sql`NOW()`),
            eq(userProfiles.isActive, true),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      if (!result[0]) {
        return null;
      }

      return {
        session_id: result[0].session_id,
        user_id: result[0].user_id,
        token_hash: tokenHash,
        expires_at: result[0].expires_at,
        is_revoked: false,
        created_at: new Date(),
        last_activity_at: result[0].last_activity_at || undefined,
      } as Session;
    } catch (error) {
      logger.error({
        msg: "Error validating JWT token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update session activity (migrated to Drizzle)
   */
  async updateSessionActivity(tokenHash: string): Promise<void> {
    try {
      await drizzleDb
        .update(authSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(authSessions.jwtTokenHash, tokenHash));
    } catch (error) {
      logger.error({
        msg: "Error updating session activity",
        error: (error as Error).message,
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Revoke JWT token (migrated to Drizzle)
   */
  async revokeToken(tokenHash: string): Promise<Session | null> {
    try {
      const result = await drizzleDb
        .update(authSessions)
        .set({ expiresAt: new Date() })
        .where(eq(authSessions.jwtTokenHash, tokenHash))
        .returning({ session_id: authSessions.sessionId });

      return result[0]
        ? ({
            session_id: result[0].session_id,
          } as Session)
        : null;
    } catch (error) {
      logger.error({
        msg: "Error revoking token",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Revoke all user tokens (migrated to Drizzle)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    try {
      await drizzleDb
        .update(authSessions)
        .set({ expiresAt: new Date() })
        .where(
          and(
            eq(authSessions.userId, userId),
            gt(authSessions.expiresAt, sql`NOW()`),
          ),
        );
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
