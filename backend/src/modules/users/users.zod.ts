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
export const UpdateProfileRequestZ = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profilePictureUrl: z.string().url().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
}).strict();
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestZ>;

// Save Address Request
export const SaveAddressRequestZ = BaseAddressZ.extend({
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
}).strict();
export type SaveAddressRequest = z.infer<typeof SaveAddressRequestZ>;

// Delete Address Params
export const DeleteAddressParamsZ = z.object({
  id: z.string().regex(/^\d+$/),
}).strict();
export type DeleteAddressParams = z.infer<typeof DeleteAddressParamsZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// User Profile Response
export const UserProfileResponseZ = BaseUserZ;
export type UserProfileResponse = z.infer<typeof UserProfileResponseZ>;

// Saved Address Response
export const SavedAddressResponseZ = SavedAddressZ;
export type SavedAddressResponse = z.infer<typeof SavedAddressResponseZ>;

// Addresses Array Response
export const AddressesArrayResponseZ = z.array(SavedAddressResponseZ);
export type AddressesArrayResponse = z.infer<typeof AddressesArrayResponseZ>;
