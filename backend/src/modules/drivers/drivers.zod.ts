// services/backend/src/modules/drivers/drivers.zod.ts
import { z } from "zod";
import {
  DriverUserZ,
  VehicleZ,
  EarningsZ,
  CoordinatesZ,
} from "../../schemas/common.zod.js";
import { OrderDetailsZ } from "../orders/orders.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Update Driver Profile Request
export const UpdateDriverProfileRequestZ = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  profilePictureUrl: z.string().url().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
});
export type UpdateDriverProfileRequest = z.infer<
  typeof UpdateDriverProfileRequestZ
>;

// Update Availability Request
export const UpdateAvailabilityRequestZ = z.object({
  isAvailable: z.boolean(),
  isOnline: z.boolean().optional(),
  currentLocation: CoordinatesZ.optional(),
});
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

// Driver Earnings Response
export const DriverEarningsResponseZ = EarningsZ.extend({
  recentOrders: z
    .array(
      z.object({
        orderId: z.number(),
        orderNumber: z.string(),
        completedAt: z.string().datetime(),
        earnings: z.number().nonnegative(),
        distanceKm: z.number().nonnegative(),
      }),
    )
    .optional(),
});
export type DriverEarningsResponse = z.infer<typeof DriverEarningsResponseZ>;

// Active Assignment Response
export const ActiveAssignmentZ = z.object({
  assignmentId: z.number().int().positive(),
  order: OrderDetailsZ,
  assignedAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable().optional(),
  status: z.string(),
});
export type ActiveAssignment = z.infer<typeof ActiveAssignmentZ>;

// ============================================================================
// LEGACY TYPE EXPORTS (for backward compatibility during migration)
// ============================================================================

export const UpdateDriverProfileZ = UpdateDriverProfileRequestZ;
export type UpdateDriverProfile = UpdateDriverProfileRequest;

export const UpdateAvailabilityZ = UpdateAvailabilityRequestZ;
export type UpdateAvailability = UpdateAvailabilityRequest;

export const UpdateLocationZ = UpdateLocationRequestZ;
export type UpdateLocation = UpdateLocationRequest;
