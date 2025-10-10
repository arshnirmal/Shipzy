// services/backend/src/modules/users/users.repository.js
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import usersQueries from "../../database/queries/users.queries.js";

class UsersRepository {
  /**
   * Find user by UUID
   */
  async findByUuid(userUuid) {
    try {
      const result = await db.query(usersQueries.FIND_USER_BY_UUID, [userUuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by UUID", { error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
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
      logger.error("Error updating user profile", { error: error.message });
      throw error;
    }
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId) {
    try {
      const result = await db.query(usersQueries.GET_USER_ADDRESSES, [userId]);
      return result.rows;
    } catch (error) {
      logger.error("Error getting user addresses", { error: error.message });
      throw error;
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(addressId) {
    try {
      const result = await db.query(usersQueries.GET_ADDRESS_BY_ID, [
        addressId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error getting address by ID", { error: error.message });
      throw error;
    }
  }

  /**
   * Save new address
   */
  async saveAddress(userId, addressData) {
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
      logger.error("Error saving address", { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId, userId) {
    try {
      const result = await db.query(usersQueries.DELETE_ADDRESS, [
        addressId,
        userId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error deleting address", { error: error.message });
      throw error;
    }
  }
}

export default new UsersRepository();
