// services/backend/src/modules/drivers/drivers.zod.ts
import { z } from "zod";
import {
  DriverUserZ,
  VehicleZ,
  EarningsZ,
  CoordinatesZ,
} from "../../schemas/common.zod.js";

export const UpdateDriverProfileZ = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profilePictureUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
});
export type UpdateDriverProfile = z.infer<typeof UpdateDriverProfileZ>;

export const UpdateAvailabilityZ = z.object({
  isAvailable: z.boolean(),
  isOnline: z.boolean().optional(),
  location: CoordinatesZ.optional(),
});
export type UpdateAvailability = z.infer<typeof UpdateAvailabilityZ>;

export const UpdateLocationZ = CoordinatesZ;
export type UpdateLocation = z.infer<typeof UpdateLocationZ>;

export const DriverProfileResponseZ = DriverUserZ.extend({
  status: z.object({
    isAvailable: z.boolean(),
    isOnline: z.boolean(),
    totalDeliveriesToday: z.number().int().nonnegative().optional(),
    currentLocation: z
      .object({
        ...CoordinatesZ.shape,
        updatedAt: z.string(),
      })
      .nullable()
      .optional(),
  }),
  vehicle: VehicleZ.nullable().optional(),
  earnings: EarningsZ.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type DriverProfileResponse = z.infer<typeof DriverProfileResponseZ>;
