import { z } from "zod";

// ============================================================================
// DB ROW SCHEMAS - Internal camelCase row shapes
// ============================================================================

export const UserProfileDbZ = z.object({
  userId: z.number().int().positive(),
  userUuid: z.string(),
  roleName: z.string(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  fullName: z.string(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserProfileDb = z.infer<typeof UserProfileDbZ>;

export const AuthUserDbZ = UserProfileDbZ.extend({
  firebaseUid: z.string().nullable().optional(),
  profileComplete: z.boolean().optional(),
  passwordHash: z.string().nullable().optional(),
});
export type AuthUserDb = z.infer<typeof AuthUserDbZ>;

export const RequestUserZ = z.object({
  userId: z.number().int().positive(),
  userUuid: z.string(),
  role: z.string(),
  phoneNumber: z.string().nullable().optional(),
});
export type RequestUser = z.infer<typeof RequestUserZ>;

export const CourierDbZ = z.object({
  courierId: z.number().int().positive(),
  userId: z.number().int().positive(),
  userUuid: z.string(),
  fullName: z.string(),
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  isOnline: z.boolean(),
  currentLatitude: z.union([z.number(), z.string()]).nullable().optional(),
  currentLongitude: z.union([z.number(), z.string()]).nullable().optional(),
  lastLocationUpdate: z.date().nullable().optional(),
  totalDeliveriesToday: z.number().int().nonnegative(),
  vehicleId: z.number().int().positive().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  vehicleModel: z.string().nullable().optional(),
  vehicleYear: z.number().int().nullable().optional(),
  vehicleCategoryId: z.number().int().nullable().optional(),
  vehicleCategory: z.string().nullable().optional(),
  vehicleIsActive: z.boolean().nullable().optional(),
  vehicleMaxWeight: z.union([z.number(), z.string()]).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleName: z.string().optional(),
});
export type CourierDb = z.infer<typeof CourierDbZ>;

export const CourierAvailabilityDbZ = z.object({
  courierId: z.number().int().positive(),
  isAvailable: z.boolean(),
  isOnline: z.boolean(),
  updatedAt: z.date(),
});
export type CourierAvailabilityDb = z.infer<typeof CourierAvailabilityDbZ>;

export const CourierLocationDbZ = z.object({
  courierId: z.number().int().positive(),
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
  lastLocationUpdate: z.date(),
});
export type CourierLocationDb = z.infer<typeof CourierLocationDbZ>;

export const EarningsSummaryDbZ = z.object({
  totalDeliveries: z.union([z.number(), z.string()]),
  todayDeliveries: z.union([z.number(), z.string()]),
  weekDeliveries: z.union([z.number(), z.string()]),
  monthDeliveries: z.union([z.number(), z.string()]),
  totalEarnings: z.union([z.number(), z.string()]),
  todayEarnings: z.union([z.number(), z.string()]),
  weekEarnings: z.union([z.number(), z.string()]),
  monthEarnings: z.union([z.number(), z.string()]),
  avgOrderValue: z.union([z.number(), z.string()]),
  totalDistanceKm: z.union([z.number(), z.string()]),
});
export type EarningsSummaryDb = z.infer<typeof EarningsSummaryDbZ>;

export const CourierAssignmentDbZ = z
  .object({
    assignmentId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    orderUuid: z.string().uuid().nullable().optional(),
    orderNumber: z.string().nullable().optional(),
    orderStatus: z.string().nullable().optional(),
    assignmentStatusId: z.number().int().nullable().optional(),
    assignmentStatus: z.string().nullable().optional(),
    vehicleCategory: z.string().nullable().optional(),
    vehicleCategoryDisplay: z.string().nullable().optional(),
    packageType: z.string().nullable().optional(),
    weightTierId: z.number().int().nullable().optional(),
    weightTierName: z.string().nullable().optional(),
    weightTierMin: z.union([z.number(), z.string()]).nullable().optional(),
    weightTierMax: z.union([z.number(), z.string()]).nullable().optional(),
    pickupAddress: z.string().nullable().optional(),
    pickupBuilding: z.string().nullable().optional(),
    pickupLandmark: z.string().nullable().optional(),
    pickupCity: z.string().nullable().optional(),
    pickupState: z.string().nullable().optional(),
    pickupPostalCode: z.string().nullable().optional(),
    pickupLatitude: z.union([z.number(), z.string()]).nullable().optional(),
    pickupLongitude: z.union([z.number(), z.string()]).nullable().optional(),
    pickupContactName: z.string().nullable().optional(),
    pickupContactPhone: z.string().nullable().optional(),
    deliveryAddress: z.string().nullable().optional(),
    deliveryBuilding: z.string().nullable().optional(),
    deliveryLandmark: z.string().nullable().optional(),
    deliveryCity: z.string().nullable().optional(),
    deliveryState: z.string().nullable().optional(),
    deliveryPostalCode: z.string().nullable().optional(),
    deliveryLatitude: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryLongitude: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryContactName: z.string().nullable().optional(),
    deliveryContactPhone: z.string().nullable().optional(),
    packageDescription: z.string().nullable().optional(),
    specialInstructions: z.string().nullable().optional(),
    declaredValue: z.union([z.number(), z.string()]).nullable().optional(),
    estimatedDistanceKm: z
      .union([z.number(), z.string()])
      .nullable()
      .optional(),
    actualDistanceKm: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryType: z.string().nullable().optional(),
    basePrice: z.union([z.number(), z.string()]).nullable().optional(),
    distancePrice: z.union([z.number(), z.string()]).nullable().optional(),
    weightSurcharge: z.union([z.number(), z.string()]).nullable().optional(),
    platformFee: z.union([z.number(), z.string()]).nullable().optional(),
    specialHandlingFee: z.union([z.number(), z.string()]).nullable().optional(),
    gstAmount: z.union([z.number(), z.string()]).nullable().optional(),
    subtotalBeforeTax: z.union([z.number(), z.string()]).nullable().optional(),
    totalPrice: z.union([z.number(), z.string()]).nullable().optional(),
    assignedAt: z.date().nullable().optional(),
    acceptedAt: z.date().nullable().optional(),
  })
  .passthrough();
export type CourierAssignmentDb = z.infer<typeof CourierAssignmentDbZ>;
