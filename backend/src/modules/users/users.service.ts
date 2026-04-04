// services/backend/src/modules/users/users.service.ts
import logger from "../../config/logger.js";
import { AuthorizationError, NotFoundError } from "../../utils/error.util.js";
import {
  toIsoDateTime,
  toIsoDateTimeOrUndefined,
} from "../../utils/datetime.util.js";
import usersRepository from "./users.repository.js";

import type {
  UserProfile,
  SavedAddressResponse,
  UpdateProfileRequest as UpdateProfileData,
  SaveAddressRequest as AddressData,
} from "./users.zod.js";

class UsersService {
  private _mapUserProfile(user: {
    userId: number;
    userUuid: string;
    roleName: string;
    phoneNumber?: string | null;
    email?: string | null;
    fullName: string;
    profilePictureUrl?: string | null;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }): UserProfile {
    return {
      userId: user.userId,
      userUuid: user.userUuid,
      role: user.roleName as UserProfile["role"],
      phoneNumber: user.phoneNumber ?? null,
      email: user.email ?? null,
      fullName: user.fullName,
      profilePictureUrl: user.profilePictureUrl ?? null,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: toIsoDateTime(user.createdAt),
      updatedAt: toIsoDateTimeOrUndefined(user.updatedAt),
    };
  }

  private _mapSavedAddress(address: {
    addressId: number;
    addressType?: string | null;
    label?: string | null;
    fullAddress: string;
    building?: string | null;
    floor?: string | null;
    flatNumber?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    postalCode: string;
    latitude: number | string;
    longitude: number | string;
    isDefault: boolean;
    createdAt?: Date;
  }): SavedAddressResponse {
    return {
      addressId: address.addressId,
      addressType:
        (address.addressType as SavedAddressResponse["addressType"]) ??
        undefined,
      label: address.label ?? undefined,
      fullAddress: address.fullAddress,
      building: address.building ?? undefined,
      floor: address.floor ?? undefined,
      flatNumber: address.flatNumber ?? undefined,
      landmark: address.landmark ?? undefined,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      isDefault: address.isDefault,
      createdAt: address.createdAt
        ? toIsoDateTime(address.createdAt)
        : undefined,
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userUuid: string): Promise<UserProfile> {
    try {
      const user = await usersRepository.findByUuid(userUuid);

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return this._mapUserProfile(user);
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
      const updatedUser = await usersRepository.updateProfile(
        userId,
        updateData,
      );

      return this._mapUserProfile(updatedUser);
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
  async getAddresses(userId: number): Promise<SavedAddressResponse[]> {
    try {
      const addresses = await usersRepository.getAddresses(userId);

      return addresses.map((address) => this._mapSavedAddress(address));
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
  ): Promise<SavedAddressResponse> {
    try {
      const savedAddress = await usersRepository.saveAddress(
        userId,
        addressData,
      );

      return this._mapSavedAddress(savedAddress);
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
  ): Promise<{ addressId: number; deleted: true }> {
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

      return { addressId, deleted: true };
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
