// services/backend/src/modules/users/users.service.js
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import usersRepository from "./users.repository.js";

class UsersService {
  /**
   * Get current user profile
   */
  async getCurrentUser(userUuid) {
    try {
      const user = await usersRepository.findByUuid(userUuid);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return {
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
    } catch (error) {
      logger.error("Error getting current user", { error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      // Validate email format if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          throw new ValidationError("Invalid email format");
        }
      }

      const updatedUser = await usersRepository.updateProfile(
        userId,
        updateData,
      );

      return {
        userId: updatedUser.user_id,
        userUuid: updatedUser.user_uuid,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        profilePictureUrl: updatedUser.profile_picture_url,
        updatedAt: updatedUser.updated_at,
      };
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
      const addresses = await usersRepository.getAddresses(userId);

      return addresses.map((addr) => ({
        addressId: addr.address_id,
        addressType: addr.address_type,
        label: addr.label,
        fullAddress: addr.full_address,
        building: addr.building,
        floor: addr.floor,
        flatNumber: addr.flat_number,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        latitude: parseFloat(addr.latitude),
        longitude: parseFloat(addr.longitude),
        isDefault: addr.is_default,
        createdAt: addr.created_at,
      }));
    } catch (error) {
      logger.error("Error getting user addresses", { error: error.message });
      throw error;
    }
  }

  /**
   * Save new address
   */
  async saveAddress(userId, addressData) {
    try {
      // Validate required fields
      const requiredFields = [
        "label",
        "fullAddress",
        "city",
        "state",
        "postalCode",
        "latitude",
        "longitude",
      ];
      const missingFields = requiredFields.filter(
        (field) => !addressData[field],
      );

      if (missingFields.length > 0) {
        throw new ValidationError(
          `Missing required fields: ${missingFields.join(", ")}`,
        );
      }

      // Validate coordinates
      if (addressData.latitude < -90 || addressData.latitude > 90) {
        throw new ValidationError("Invalid latitude");
      }
      if (addressData.longitude < -180 || addressData.longitude > 180) {
        throw new ValidationError("Invalid longitude");
      }

      const savedAddress = await usersRepository.saveAddress(
        userId,
        addressData,
      );

      return {
        addressId: savedAddress.address_id,
        label: savedAddress.label,
        fullAddress: savedAddress.full_address,
        isDefault: savedAddress.is_default,
        createdAt: savedAddress.created_at,
      };
    } catch (error) {
      logger.error("Error saving address", { error: error.message });
      throw error;
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId, userId) {
    try {
      // Verify address belongs to user
      const address = await usersRepository.getAddressById(addressId);

      if (!address) {
        throw new NotFoundError("Address not found");
      }

      if (address.user_id !== userId) {
        throw new AuthorizationError("You can only delete your own addresses");
      }

      const result = await usersRepository.deleteAddress(addressId, userId);

      if (!result) {
        throw new NotFoundError("Address not found");
      }

      return { message: "Address deleted successfully" };
    } catch (error) {
      logger.error("Error deleting address", { error: error.message });
      throw error;
    }
  }
}

export default new UsersService();
