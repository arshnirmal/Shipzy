// services/backend/src/modules/users/users.repository.ts
import { eq, and, isNull } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import db from "../../database/db.js";
import usersQueries from "../../database/queries/users.queries.js";
import { userProfiles } from "../../database/schema/users.js";
import { userRoles } from "../../database/schema/public.js";
import { userAddresses } from "../../database/schema/users.js";

import type { DbUser } from "../../types/user.js";

type User = DbUser;

function mapProfileRowToDbUser(row: {
  userId: number;
  userUuid: string;
  roleId: number;
  roleName: string;
  phoneNumber: string | null;
  email: string | null;
  fullName: string;
  profilePictureUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
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
  };
}

interface Address {
  addressId: number;
  userId?: number;
  label: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType?: string;
  building?: string;
  floor?: string;
  flatNumber?: string;
  landmark?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

import type { UpdateProfileRequest, SaveAddressRequest } from "./users.zod.js";

type UpdateProfileData = UpdateProfileRequest;
type AddressData = SaveAddressRequest;

class UsersRepository {
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
        .innerJoin(userRoles, eq(userProfiles.roleId, userRoles.roleId))
        .where(
          and(
            eq(userProfiles.userUuid, userUuid),
            isNull(userProfiles.deletedAt),
          ),
        )
        .limit(1);

      const row = result[0];
      return row ? mapProfileRowToDbUser(row) : null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by UUID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update user profile (migrated to Drizzle)
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData,
  ): Promise<User> {
    try {
      const { fullName, email, profilePictureUrl } = updateData;

      const result = await drizzleDb
        .update(userProfiles)
        .set({
          fullName: fullName || undefined,
          email: email || undefined,
          profilePictureUrl: profilePictureUrl || undefined,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

      const updatedRow = result[0];
      if (!updatedRow) {
        throw new Error("User update returned no row");
      }

      // Fetch full user with role for return type compatibility
      const updatedUser = await this.findByUuid(updatedRow.userUuid);
      if (!updatedUser) {
        throw new Error("User not found after update");
      }
      return updatedUser;
    } catch (error) {
      logger.error({
        msg: "Error updating user profile",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId: number): Promise<Address[]> {
    try {
      const result = await db.query(usersQueries.GET_USER_ADDRESSES, [userId]);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting user addresses",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(addressId: number): Promise<Address | null> {
    try {
      const result = await db.query(usersQueries.GET_ADDRESS_BY_ID, [
        addressId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error getting address by ID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Save new address
   */
  async saveAddress(
    userId: number,
    addressData: AddressData,
  ): Promise<Address> {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // If this address is set as default, unset other defaults
      if (addressData.isDefault) {
        await client.query(usersQueries.UNSET_DEFAULT_ADDRESSES, [userId]);
      }

      // Insert new address
      const result = await client.query(usersQueries.SAVE_ADDRESS, [
        userId,
        addressData.addressType || "other",
        addressData.label,
        addressData.fullAddress,
        addressData.building || null,
        addressData.floor || null,
        addressData.flatNumber || null,
        addressData.landmark || null,
        addressData.city,
        addressData.state,
        addressData.postalCode,
        addressData.latitude,
        addressData.longitude,
        addressData.isDefault || false,
      ]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error({
        msg: "Error saving address",
        error: (error as Error).message,
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete address (migrated to Drizzle)
   */
  async deleteAddress(
    addressId: number,
    userId: number,
  ): Promise<{ addressId: number } | null> {
    try {
      const result = await drizzleDb
        .delete(userAddresses)
        .where(
          and(
            eq(userAddresses.addressId, addressId),
            eq(userAddresses.userId, userId),
          ),
        )
        .returning({ addressId: userAddresses.addressId });

      return result[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error deleting address",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new UsersRepository();
