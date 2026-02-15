// services/backend/src/modules/drivers/drivers.zod.ts
import { z } from "zod";

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
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});
export type UpdateAvailability = z.infer<typeof UpdateAvailabilityZ>;

export const UpdateLocationZ = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type UpdateLocation = z.infer<typeof UpdateLocationZ>;

export const DriverProfileResponseZ = z.object({
  userId: z.number(),
  userUuid: z.string(),
  phoneNumber: z.string().nullable().optional(),
  fullName: z.string(),
  email: z.string().nullable().optional(),
  role: z.enum(["client", "courier"]).optional(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.object({
    isAvailable: z.boolean(),
    isOnline: z.boolean(),
    totalDeliveriesToday: z.number().int().nonnegative().optional(),
    currentLocation: z
      .object({
        lat: z.number(),
        lng: z.number(),
        updatedAt: z.string(),
      })
      .nullable()
      .optional(),
  }),
  vehicle: z
    .object({
      vehicleId: z.number().optional(),
      categoryId: z.number().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
      vehicleNumber: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
    })
    .nullable()
    .optional(),
  earnings: z
    .object({
      total: z.number(),
      today: z.number(),
      thisWeek: z.number(),
      thisMonth: z.number(),
      averageOrderValue: z.number(),
      totalDistanceKm: z.number(),
    })
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type DriverProfileResponse = z.infer<typeof DriverProfileResponseZ>;
