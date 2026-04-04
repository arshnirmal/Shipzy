// services/backend/src/modules/drivers/drivers.zod.ts
import { z } from "zod";
import {
  BaseUserZ,
  CoordinatesZ,
  EarningsZ,
  VehicleZ,
} from "../../schemas/common.zod.js";
import {
  OrderLocationJSONBZ,
  OrderPackageJSONBZ,
  OrderPricingJSONBZ,
  OrderSnapshotJSONBZ,
} from "../../database/schema/types.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

export const DriverProfilePatchZ = z
  .object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().max(100).optional(),
    profilePictureUrl: z.string().url().optional(),
    phoneNumber: z.string().min(10).max(20).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field must be provided",
  });

// Update Driver Profile Request
export const UpdateDriverProfileRequestZ = z
  .object({
    profile: DriverProfilePatchZ,
  })
  .strict();
export type UpdateDriverProfileRequest = z.infer<
  typeof UpdateDriverProfileRequestZ
>;

const DriverAvailabilityToggleZ = z
  .object({
    isAvailable: z.boolean(),
    isOnline: z.boolean().optional(),
  })
  .strict();

// Update Availability Request
export const UpdateAvailabilityRequestZ = z
  .object({
    availability: DriverAvailabilityToggleZ,
    tracking: z
      .object({
        currentLocation: CoordinatesZ.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type UpdateAvailabilityRequest = z.infer<
  typeof UpdateAvailabilityRequestZ
>;

// Update Location Request
export const UpdateLocationRequestZ = z
  .object({
    location: z
      .object({
        current: CoordinatesZ,
      })
      .strict(),
  })
  .strict();
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

export const DriverStatusZ = z
  .object({
    isAvailable: z.boolean(),
    isOnline: z.boolean(),
    totalDeliveriesToday: z.number().int().nonnegative(),
    currentLocation: CoordinatesZ.nullable(),
    lastLocationUpdate: z.iso.datetime().nullable(),
  })
  .strict();

export const DriverPerformanceRatingZ = z
  .object({
    averageRating: z.number().min(0).max(5),
    totalRatings: z.number().int().nonnegative(),
  })
  .strict();

export const BaseDriverCoreZ = BaseUserZ.extend({
  role: z.literal("courier"),
  status: DriverStatusZ,
  vehicle: VehicleZ.nullable(),
}).strict();

export const BaseDriverZ = BaseDriverCoreZ.extend({
  earnings: EarningsZ,
  rating: DriverPerformanceRatingZ,
}).strict();

export const DriverProfileResponseZ = z
  .object({
    driver: BaseDriverZ,
  })
  .strict();
export type DriverProfileResponse = z.infer<typeof DriverProfileResponseZ>;

export const DriverProfileMutationResponseZ = z
  .object({
    driver: BaseDriverCoreZ,
  })
  .strict();
export type DriverProfileMutationResponse = z.infer<
  typeof DriverProfileMutationResponseZ
>;

const WeightTierZ = z
  .object({
    id: z.number().int().positive().optional(),
    name: z.string().optional(),
    minWeightKg: z.number().nonnegative().optional(),
    maxWeightKg: z.number().nonnegative().optional(),
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
    assignment: z
      .object({
        assignmentId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        orderUuid: z.string().uuid().nullable().optional(),
        orderNumber: z.string().nullable().optional(),
      })
      .strict(),
    status: z
      .object({
        order: z.string().nullable().optional(),
        assignment: z.string().nullable().optional(),
      })
      .strict(),
    routing: z
      .object({
        pickup: OrderLocationJSONBZ.nullable().optional(),
        delivery: OrderLocationJSONBZ.nullable().optional(),
        estimatedDistanceKm: z.number().nullable().optional(),
        actualDistanceKm: z.number().nullable().optional(),
        estimatedDeliveryMinutes: z.number().int().positive(),
      })
      .strict(),
    snapshot: z
      .object({
        deliveryType: OrderSnapshotJSONBZ.shape.deliveryType.optional(),
        vehicleCategory: OrderSnapshotJSONBZ.shape.vehicleCategory.optional(),
        packageType: OrderSnapshotJSONBZ.shape.packageType.optional(),
        weightTier: WeightTierZ.nullable().optional(),
      })
      .strict(),
    package: OrderPackageJSONBZ.nullable().optional(),
    pricing: OrderPricingJSONBZ.nullable().optional(),
    earnings: z
      .object({
        net: z.number(),
        breakdown: EarningsBreakdownZ,
      })
      .strict(),
    timeline: z
      .object({
        assignedAt: z.iso.datetime().nullable().optional(),
        acceptedAt: z.iso.datetime().nullable().optional(),
      })
      .strict(),
  })
  .strict();
export type ActiveAssignment = z.infer<typeof ActiveAssignmentZ>;

export const ActiveAssignmentsResponseZ = z
  .object({
    assignments: z.array(ActiveAssignmentZ),
  })
  .strict();
export type ActiveAssignmentsResponse = z.infer<
  typeof ActiveAssignmentsResponseZ
>;

// Driver Earnings Summary Response
export const DriverEarningsSummaryZ = z
  .object({
    scope: z
      .object({
        period: z.enum(["today", "week", "month", "year"]),
      })
      .strict(),
    deliveries: z
      .object({
        today: z.number(),
        total: z.number(),
        thisWeek: z.number(),
        thisMonth: z.number(),
      })
      .strict(),
    earnings: z
      .object({
        today: z.number(),
        total: z.number(),
        thisWeek: z.number(),
        thisMonth: z.number(),
        averageOrderValue: z.number(),
      })
      .strict(),
    activity: z
      .object({
        totalDistanceKm: z.number(),
      })
      .strict(),
  })
  .strict();
export type DriverEarningsSummary = z.infer<typeof DriverEarningsSummaryZ>;

export const DriverEarningsSummaryResponseZ = z
  .object({
    earnings: DriverEarningsSummaryZ,
  })
  .strict();
export type DriverEarningsSummaryResponse = z.infer<
  typeof DriverEarningsSummaryResponseZ
>;

export const DriverRatingResponseZ = z
  .object({
    rating: z
      .object({
        averageRating: z.number().min(0).max(5),
        totalRatings: z.number().int().nonnegative(),
        ratingDistribution: z
          .object({
            1: z.number().int().nonnegative(),
            2: z.number().int().nonnegative(),
            3: z.number().int().nonnegative(),
            4: z.number().int().nonnegative(),
            5: z.number().int().nonnegative(),
          })
          .strict(),
        lastUpdated: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type DriverRatingResponse = z.infer<typeof DriverRatingResponseZ>;

export const DriverAvailabilityResponseZ = z
  .object({
    availability: z
      .object({
        courierId: z.number().int().positive(),
        isAvailable: z.boolean(),
        isOnline: z.boolean(),
        updatedAt: z.iso.datetime(),
      })
      .strict(),
    tracking: z
      .object({
        currentLocation: CoordinatesZ.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type DriverAvailabilityResponse = z.infer<
  typeof DriverAvailabilityResponseZ
>;

export const DriverLocationResponseZ = z
  .object({
    location: z
      .object({
        courierId: z.number().int().positive(),
        current: CoordinatesZ,
        lastLocationUpdate: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type DriverLocationResponse = z.infer<typeof DriverLocationResponseZ>;

export const EarningsPeriodQueryZ = z
  .object({
    period: z.enum(["today", "week", "month", "year"]).default("today"),
  })
  .strict();
export type EarningsPeriodQuery = z.infer<typeof EarningsPeriodQueryZ>;
