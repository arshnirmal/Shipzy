// services/backend/src/modules/users/users.service.ts
import logger from "../../config/logger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util";
import usersRepository from "./users.repository";

interface UserProfile {
  userId: number;
  userUuid: string;
  role: string;
  phoneNumber: string;
  email?: string;
  fullName: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  addressType?: "home" | "work" | "other";
  building?: string;
  floor?: string;
  flatNumber?: string;
  landmark?: string;
  isDefault?: boolean;
  [key: string]: any;
}

class UsersService {
  /**
   * Get current user profile
   */
  async getCurrentUser(userUuid: string): Promise<UserProfile> {
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
      logger.error({
        msg: "Error getting current user",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updateData: UpdateProfileData,
  ): Promise<UserProfile> {
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
        role: updatedUser.role_name,
        phoneNumber: updatedUser.phone_number,
        isVerified: updatedUser.is_verified,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      };
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
  async getAddresses(userId: number): Promise<any[]> {
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
        latitude: addr.latitude,
        longitude: addr.longitude,
        isDefault: addr.is_default,
        createdAt: addr.created_at,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting user addresses",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Save new address
   */
  async saveAddress(userId: number, addressData: AddressData): Promise<any> {
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
      logger.error({
        msg: "Error saving address",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: number, userId: number): Promise<any> {
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
      logger.error({
        msg: "Error deleting address",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new UsersService();
