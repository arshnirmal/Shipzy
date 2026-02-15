// services/backend/src/modules/users/users.zod.ts
import { z } from "zod";

export const UpdateProfileZ = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profilePictureUrl: z.string().url().optional(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileZ>;

export const SaveAddressZ = z.object({
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().min(1).max(50),
  fullAddress: z.string().min(5).max(500),
  building: z.string().max(100).optional(),
  floor: z.string().max(50).optional(),
  flatNumber: z.string().max(50).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isDefault: z.boolean().optional(),
});
export type SaveAddress = z.infer<typeof SaveAddressZ>;

export const DeleteAddressParamsZ = z.object({
  id: z.string().regex(/^[0-9]+$/),
});
export type DeleteAddressParams = z.infer<typeof DeleteAddressParamsZ>;

export const UserResponseZ = z.object({
  userId: z.number(),
  userUuid: z.string(),
  role: z.enum(["client", "courier"]),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  fullName: z.string(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
});
export type UserResponse = z.infer<typeof UserResponseZ>;

export const AddressResponseZ = z.object({
  addressId: z.number(),
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().optional(),
  fullAddress: z.string().optional(),
  buildingName: z.string().nullable().optional(),
  floorNumber: z.string().nullable().optional(),
  roomNumber: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
});
export type AddressResponse = z.infer<typeof AddressResponseZ>;

export const AddressesArrayZ = z.array(AddressResponseZ);
export type AddressesArray = z.infer<typeof AddressesArrayZ>;
