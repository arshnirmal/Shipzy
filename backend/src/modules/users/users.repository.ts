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

interface Address {
  address_id: number;
  user_id: number;
  label: string;
  full_address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  address_type?: string;
  // DB may return snake_case or camelCase keys depending on query mapping
  building?: string;
  building_name?: string;
  floor?: string;
  floor_number?: string;
  flat_number?: string;
  room_number?: string;
  landmark?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

import type { UpdateProfile, SaveAddress } from "./users.zod.js";

type UpdateProfileData = UpdateProfile;
type AddressData = SaveAddress;

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

      // Fetch full user with role for return type compatibility
      const updatedUser = await this.findByUuid(result[0].userUuid);
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
  ): Promise<{ address_id: number } | null> {
    try {
      const result = await drizzleDb
        .delete(userAddresses)
        .where(
          and(
            eq(userAddresses.addressId, addressId),
            eq(userAddresses.userId, userId),
          ),
        )
        .returning({ address_id: userAddresses.addressId });

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
