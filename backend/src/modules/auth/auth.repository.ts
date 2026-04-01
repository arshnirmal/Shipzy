// services/backend/src/modules/auth/auth.repository.ts
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import { getUserRoleName } from "../../utils/roles.utils.js";
import { userProfiles } from "../../database/schema/users.js";
import { authSessions } from "../../database/schema/users.js";
import { courierStatus } from "../../database/schema/logistics.js";

import type { AuthUser } from "../../types/user.js";

type User = AuthUser;

type ProfileSelectBase = {
  userId: number;
  userUuid: string;
  roleName: string;
  firebaseUid: string | null;
  phoneNumber: string | null;
  email: string | null;
  fullName: string;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapProfileRowToUser(
  row: ProfileSelectBase & { passwordHash?: string | null },
): User {
  return {
    userId: row.userId,
    userUuid: row.userUuid,
    fullName: row.fullName,
    email: row.email ?? undefined,
    phoneNumber: row.phoneNumber ?? undefined,
    profilePictureUrl: row.profilePictureUrl ?? undefined,
    roleName: row.roleName,
    isVerified: row.isVerified,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    firebaseUid: row.firebaseUid ?? undefined,
    passwordHash: row.passwordHash ?? null,
  };
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
  authMethod?: "email" | "phone" | "google" | "firebase" | "refresh";
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
          roleName: userProfiles.role,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.firebaseUid, firebaseUid),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      const row = result[0];
      return row ? mapProfileRowToUser(row) : null;
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
          roleName: userProfiles.role,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.userUuid, userUuid),
            eq(userProfiles.isActive, true),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      const row = result[0];
      return row ? mapProfileRowToUser(row) : null;
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
          roleName: userProfiles.role,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          passwordHash: userProfiles.passwordHash,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .where(
          and(
            eq(userProfiles.phoneNumber, phoneNumber),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      const row = result[0];
      return row ? mapProfileRowToUser(row) : null;
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
          roleName: userProfiles.role,
          firebaseUid: userProfiles.firebaseUid,
          phoneNumber: userProfiles.phoneNumber,
          email: userProfiles.email,
          fullName: userProfiles.fullName,
          profilePictureUrl: userProfiles.profilePictureUrl,
          passwordHash: userProfiles.passwordHash,
          isVerified: userProfiles.isVerified,
          isActive: userProfiles.isActive,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .where(
          and(eq(userProfiles.email, email), isNull(userProfiles.deletedAt)),
        )
        .limit(1);

      const row = result[0];
      return row ? mapProfileRowToUser(row) : null;
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
          role: getUserRoleName(roleId) as
            | "client"
            | "courier"
            | "admin"
            | "business",
          firebaseUid: firebaseUid || undefined,
          phoneNumber: phoneNumber || undefined,
          fullName,
          email: email || undefined,
          passwordHash: passwordHash || undefined,
          isVerified: true,
        })
        .returning();

      const createdUser = result[0];
      if (!createdUser) {
        throw new Error("User insert returned no row");
      }
      const roleName = getUserRoleName(roleId);

      // Initialize courier status if role is courier (keep as raw SQL for ON CONFLICT)
      if (userData.roleName === "courier") {
        await drizzleDb
          .insert(courierStatus)
          .values({
            courierId: createdUser.userId,
            isAvailable: false,
            isOnline: false,
          })
          .onConflictDoNothing({ target: courierStatus.courierId });
      }

      // Fetch full user with role for return type compatibility
      const user = await this.findByUuid(createdUser.userUuid);
      if (!user) {
        throw new Error("User not found after creation");
      }

      return { ...user, roleName } as User;
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
          role: getUserRoleName(roleId) as
            | "client"
            | "courier"
            | "admin"
            | "business",
          fullName,
          email,
          passwordHash,
          phoneNumber: phoneNumber || undefined,
          isVerified: false,
        })
        .returning();

      const createdUser = result[0];
      if (!createdUser) {
        throw new Error("User insert returned no row");
      }
      const roleName = getUserRoleName(roleId);

      // Initialize courier status if role is courier (keep as raw SQL for ON CONFLICT)
      if (userData.roleName === "courier") {
        await drizzleDb
          .insert(courierStatus)
          .values({
            courierId: createdUser.userId,
            isAvailable: false,
            isOnline: false,
          })
          .onConflictDoNothing({ target: courierStatus.courierId });
      }

      // Fetch full user with role for return type compatibility
      const user = await this.findByUuid(createdUser.userUuid);
      if (!user) {
        throw new Error("User not found after creation");
      }

      return { ...user, roleName } as User;
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
  async storeJwtToken(sessionData: StoreJwtTokenData): Promise<void> {
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

      await drizzleDb
        .insert(authSessions)
        .values({
          userId,
          email: email || undefined,
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
        });
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
  async validateJwtToken(tokenHash: string): Promise<boolean> {
    try {
      const result = await drizzleDb
        .select({ sessionId: authSessions.sessionId })
        .from(authSessions)
        .innerJoin(userProfiles, eq(authSessions.userId, userProfiles.userId))
        .where(
          and(
            eq(authSessions.jwtTokenHash, tokenHash),
            gt(authSessions.expiresAt, sql`NOW()`),
            eq(userProfiles.isActive, true),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      return result.length > 0;
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
  async revokeToken(tokenHash: string): Promise<{ sessionId: number } | null> {
    try {
      const result = await drizzleDb
        .update(authSessions)
        .set({ expiresAt: new Date() })
        .where(eq(authSessions.jwtTokenHash, tokenHash))
        .returning({ sessionId: authSessions.sessionId });

      return result[0] ?? null;
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
