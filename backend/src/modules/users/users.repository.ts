// services/backend/src/modules/users/users.repository.ts
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import usersQueries from "../../database/queries/users.queries.js";

interface User {
  user_id: number;
  user_uuid: string;
  full_name: string;
  email?: string;
  phone_number: string;
  profile_picture_url?: string;
  role_name: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  building?: string;
  floor?: string;
  flat_number?: string;
  landmark?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  profilePictureUrl?: string;
}

interface AddressData {
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
  isDefault?: boolean;
}

class UsersRepository {
  /**
   * Find user by UUID
   */
  async findByUuid(userUuid: string): Promise<User | null> {
    try {
      const result = await db.query(usersQueries.FIND_USER_BY_UUID, [userUuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding user by UUID",
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData
  ): Promise<User> {
    try {
      const { fullName, email, profilePictureUrl } = updateData;

      const result = await db.query(usersQueries.UPDATE_USER_PROFILE, [
        userId,
        fullName || null,
        email || null,
        profilePictureUrl || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error({
        msg: "Error updating user profile",
        error: (error as Error).message
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
        error: (error as Error).message
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
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Save new address
   */
  async saveAddress(
    userId: number,
    addressData: AddressData
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
        error: (error as Error).message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: number, userId: number): Promise<any> {
    try {
      const result = await db.query(usersQueries.DELETE_ADDRESS, [
        addressId,
        userId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error deleting address",
        error: (error as Error).message
      });
      throw error;
    }
  }
}

export default new UsersRepository();
