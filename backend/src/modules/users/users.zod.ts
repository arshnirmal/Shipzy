// services/backend/src/modules/users/users.zod.ts
import { z } from "zod";
import { SavedAddressZ, BaseUserZ } from "../../schemas/common.zod.js";

export const UpdateProfileZ = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profilePictureUrl: z.string().url().optional(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileZ>;

export const SaveAddressZ = SavedAddressZ;
export type SaveAddress = z.infer<typeof SaveAddressZ>;

export const DeleteAddressParamsZ = z.object({
  id: z.string().regex(/^[0-9]+$/),
});
export type DeleteAddressParams = z.infer<typeof DeleteAddressParamsZ>;

export const UserResponseZ = BaseUserZ;
export type UserResponse = z.infer<typeof UserResponseZ>;

export const AddressResponseZ = SavedAddressZ;
export type AddressResponse = z.infer<typeof AddressResponseZ>;

export const AddressesArrayZ = z.array(AddressResponseZ);
export type AddressesArray = z.infer<typeof AddressesArrayZ>;
