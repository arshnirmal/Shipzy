// services/backend/src/modules/users/users.service.ts
import logger from "../../config/logger.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.util.js";
import {
  toIsoDateTime,
  toIsoDateTimeOrUndefined,
} from "../../utils/datetime.util.js";
import usersRepository from "./users.repository.js";

import type { UserProfileResponse } from "./users.zod.js";
import type {
  UpdateProfileRequest as UpdateProfileData,
  SaveAddressRequest as AddressData,
} from "./users.zod.js";

class UsersService {
  /**
   * Get current user profile
   */
  async getCurrentUser(userUuid: string): Promise<UserProfileResponse> {
    try {
      const user = await usersRepository.findByUuid(userUuid);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return {
        userId: user.userId,
        userUuid: user.userUuid,
        role: user.roleName as UserProfileResponse["role"],
        phoneNumber: user.phoneNumber ?? null,
        email: user.email ?? null,
        fullName: user.fullName,
        profilePictureUrl: user.profilePictureUrl ?? null,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: toIsoDateTime(user.createdAt),
        updatedAt: toIsoDateTimeOrUndefined(user.updatedAt),
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
  ): Promise<UserProfileResponse> {
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
        userId: updatedUser.userId,
        userUuid: updatedUser.userUuid,
        fullName: updatedUser.fullName,
        email: updatedUser.email ?? null,
        profilePictureUrl: updatedUser.profilePictureUrl ?? null,
        role: updatedUser.roleName as UserProfileResponse["role"],
        phoneNumber: updatedUser.phoneNumber ?? null,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        createdAt: toIsoDateTime(updatedUser.createdAt),
        updatedAt: toIsoDateTimeOrUndefined(updatedUser.updatedAt),
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
  async getAddresses(
    userId: number,
  ): Promise<import("./users.zod.js").SavedAddressResponse[]> {
    try {
      const addresses = await usersRepository.getAddresses(userId);

      return addresses.map((addr) => ({
        addressId: addr.addressId,
        addressType:
          addr.addressType as import("./users.zod.js").SavedAddressResponse["addressType"],
        label: addr.label,
        fullAddress: addr.fullAddress,
        building: addr.building || undefined,
        floor: addr.floor || undefined,
        flatNumber: addr.flatNumber || undefined,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        isDefault: addr.isDefault,
        createdAt: toIsoDateTime(addr.createdAt),
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
  async saveAddress(
    userId: number,
    addressData: AddressData,
  ): Promise<import("./users.zod.js").SavedAddressResponse> {
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
      const missingFields = requiredFields.filter((field) => {
        const v = (addressData as unknown as Record<string, unknown>)[field];
        return v === undefined || v === null || v === "";
      });

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
        addressId: savedAddress.addressId,
        addressType:
          savedAddress.addressType as import("./users.zod.js").SavedAddressResponse["addressType"],
        label: savedAddress.label,
        fullAddress: savedAddress.fullAddress,
        building: savedAddress.building || undefined,
        floor: savedAddress.floor || undefined,
        flatNumber: savedAddress.flatNumber || undefined,
        landmark: savedAddress.landmark || undefined,
        city: savedAddress.city,
        state: savedAddress.state,
        postalCode: savedAddress.postalCode,
        latitude: savedAddress.latitude,
        longitude: savedAddress.longitude,
        isDefault: savedAddress.isDefault,
        createdAt: toIsoDateTime(savedAddress.createdAt),
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
  async deleteAddress(
    addressId: number,
    userId: number,
  ): Promise<{ message: string }> {
    try {
      // Verify address belongs to user
      const address = await usersRepository.getAddressById(addressId);

      if (!address) {
        throw new NotFoundError("Address not found");
      }

      if (address.userId !== userId) {
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
