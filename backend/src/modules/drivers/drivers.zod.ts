// services/backend/src/modules/drivers/drivers.zod.ts
import { z } from "zod";
import { DriverUserZ, CoordinatesZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Update Driver Profile Request
export const UpdateDriverProfileRequestZ = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    phoneNumber: z.string().min(10).max(20).optional(),
  })
  .strict();
export type UpdateDriverProfileRequest = z.infer<
  typeof UpdateDriverProfileRequestZ
>;

// Update Availability Request
export const UpdateAvailabilityRequestZ = z
  .object({
    isAvailable: z.boolean(),
    isOnline: z.boolean().optional(),
    currentLocation: CoordinatesZ.optional(),
  })
  .strict();
export type UpdateAvailabilityRequest = z.infer<
  typeof UpdateAvailabilityRequestZ
>;

// Update Location Request
export const UpdateLocationRequestZ = CoordinatesZ;
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Driver Profile Response
export const DriverProfileResponseZ = DriverUserZ;
export type DriverProfileResponse = z.infer<typeof DriverProfileResponseZ>;

const WeightTierZ = z
  .object({
    id: z.number().int().positive().optional(),
    name: z.string().optional(),
    minWeightKg: z.number().nonnegative().optional(),
    maxWeightKg: z.number().nonnegative().optional(),
  })
  .strict();

const AssignmentAddressZ = z
  .object({
    address: z.string().nullable().optional(),
    building: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    contactName: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
  })
  .strict();

const EarningsBreakdownZ = z
  .object({
    basePayout: z.number(),
    distanceEarning: z.number(),
    weightCompensation: z.number(),
    peakHourBonus: z.number(),
    urgencyBonus: z.number(),
    onTimeBonus: z.number(),
    qualityBonus: z.number(),
    platformCommission: z.number(),
    customerTip: z.number(),
    grossEarning: z.number(),
    netEarning: z.number(),
  })
  .strict();

// Active Assignment Response
export const ActiveAssignmentZ = z
  .object({
    assignmentId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    orderUuid: z.string().uuid().optional(),
    orderNumber: z.string().optional(),
    orderStatus: z.string().optional(),
    assignmentStatus: z.string().optional(),
    vehicleCategory: z.string().nullable().optional(),
    vehicleCategoryDisplay: z.string().nullable().optional(),
    packageType: z.string().nullable().optional(),
    weightTier: WeightTierZ.nullable().optional(),
    pickup: AssignmentAddressZ,
    delivery: AssignmentAddressZ,
    packageDescription: z.string().nullable().optional(),
    specialInstructions: z.string().nullable().optional(),
    declaredValue: z.number().nullable().optional(),
    estimatedDistanceKm: z.number().nullable().optional(),
    actualDistanceKm: z.number().nullable().optional(),
    driverEarnings: z.number(),
    earningsBreakdown: EarningsBreakdownZ,
    estimatedDeliveryTime: z.number(),
    assignedAt: z.iso.datetime().nullable().optional(),
    acceptedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();
export type ActiveAssignment = z.infer<typeof ActiveAssignmentZ>;

// Driver Earnings Summary Response
export const DriverEarningsSummaryZ = z
  .object({
    deliveries: z
      .object({
        today: z.number().optional(),
        total: z.number().optional(),
        thisWeek: z.number().optional(),
        thisMonth: z.number().optional(),
      })
      .strict(),
    earnings: z
      .object({
        today: z.number().optional(),
        total: z.number().optional(),
        thisWeek: z.number().optional(),
        thisMonth: z.number().optional(),
        averageOrderValue: z.number().optional(),
      })
      .strict(),
    totalDistanceKm: z.number(),
  })
  .strict();
export type DriverEarningsSummary = z.infer<typeof DriverEarningsSummaryZ>;

export const EarningsPeriodQueryZ = z
  .object({
    period: z.enum(["today", "week", "month", "year"]).default("today"),
  })
  .strict();
export type EarningsPeriodQuery = z.infer<typeof EarningsPeriodQueryZ>;
