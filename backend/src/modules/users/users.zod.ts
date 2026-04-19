// services/backend/src/modules/users/users.zod.ts
import { z } from "zod";
import {
  SavedAddressZ,
  BaseUserZ,
  BaseAddressZ,
} from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Update Profile Request
export const UpdateProfileRequestZ = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    phoneNumber: z.string().min(10).max(20).optional(),
  })
  .strict();
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestZ>;

// Save Address Request
export const SaveAddressRequestZ = BaseAddressZ.extend({
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
}).strict();
export type SaveAddressRequest = z.infer<typeof SaveAddressRequestZ>;

// Delete Address Params
export const DeleteAddressParamsZ = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();
export type DeleteAddressParams = z.infer<typeof DeleteAddressParamsZ>;

// Register Device Token Request
export const RegisterDeviceTokenRequestZ = z
  .object({
    deviceToken: z.string().min(10).max(4096),
    deviceType: z.enum(["android", "ios", "web"]),
    deviceInfo: z.record(z.string(), z.any()).optional(),
  })
  .strict();
export type RegisterDeviceTokenRequest = z.infer<
  typeof RegisterDeviceTokenRequestZ
>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Internal payloads used across service/controller boundaries
export const UserProfileZ = BaseUserZ;
export type UserProfile = z.infer<typeof UserProfileZ>;

export const SavedAddressResponseZ = SavedAddressZ;
export type SavedAddressResponse = z.infer<typeof SavedAddressResponseZ>;

export const AddressesArrayResponseZ = z.array(SavedAddressResponseZ);
export type AddressesArrayResponse = z.infer<typeof AddressesArrayResponseZ>;

// Standardized API response payloads
export const UserProfileResponseZ = z
  .object({
    profile: UserProfileZ,
  })
  .strict();
export type UserProfileResponse = z.infer<typeof UserProfileResponseZ>;

export const UserAddressesResponseZ = z
  .object({
    addresses: AddressesArrayResponseZ,
    total: z.number().int().nonnegative(),
  })
  .strict();
export type UserAddressesResponse = z.infer<typeof UserAddressesResponseZ>;

export const SaveAddressResponseZ = z
  .object({
    address: SavedAddressResponseZ,
  })
  .strict();
export type SaveAddressResponse = z.infer<typeof SaveAddressResponseZ>;

export const DeleteAddressResponseZ = z
  .object({
    deletion: z
      .object({
        addressId: z.number().int().positive(),
        deleted: z.literal(true),
      })
      .strict(),
  })
  .strict();
export type DeleteAddressResponse = z.infer<typeof DeleteAddressResponseZ>;

export const RegisterDeviceTokenResponseZ = z
  .object({
    deviceToken: z
      .object({
        tokenId: z.number().int().positive(),
        registered: z.literal(true),
      })
      .strict(),
  })
  .strict();
export type RegisterDeviceTokenResponse = z.infer<
  typeof RegisterDeviceTokenResponseZ
>;
