// services/backend/src/schemas/common.zod.ts
import { z } from "zod";

// ============================================================================
// COORDINATES - Standardized latitude/longitude objects
// ============================================================================

export const CoordinatesZ = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesZ>;

// ============================================================================
// ADDRESSES - Base address fields with specialized extensions
// ============================================================================

// Base address fields shared across all address types
export const BaseAddressZ = z
  .object({
    fullAddress: z.string().min(5).max(500),
    building: z.string().max(100).optional(),
    floor: z.string().max(50).optional(),
    flatNumber: z.string().max(50).optional(),
    landmark: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().min(4).max(10),
  })
  .extend(CoordinatesZ.shape);
export type BaseAddress = z.infer<typeof BaseAddressZ>;

// For user-saved addresses
export const SavedAddressZ = BaseAddressZ.extend({
  addressId: z.number(),
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
});
export type SavedAddress = z.infer<typeof SavedAddressZ>;

// For order pickup/delivery locations
export const OrderAddressZ = BaseAddressZ.extend({
  addressId: z.number().int().positive().nullable().optional(),
  howToReach: z.string().nullable().optional(),
  contactName: z.string(),
  contactPhone: z.string(),
});
export type OrderAddress = z.infer<typeof OrderAddressZ>;

// ============================================================================
// USERS - Base user schema with specialized extensions
// ============================================================================

// Base user fields shared across all user types
export const BaseUserZ = z.object({
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
export type BaseUser = z.infer<typeof BaseUserZ>;

// Driver user with additional fields
export const DriverUserZ = BaseUserZ.extend({
  status: z.object({
    isAvailable: z.boolean(),
    isOnline: z.boolean(),
    totalDeliveriesToday: z.number().int().nonnegative().optional(),
    currentLocation: CoordinatesZ.nullable().optional(),
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
export type DriverUser = z.infer<typeof DriverUserZ>;

// ============================================================================
// VEHICLES - Vehicle information schema
// ============================================================================

export const VehicleZ = z.object({
  vehicleId: z.number().optional(),
  categoryId: z.number().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  vehicleNumber: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
});
export type Vehicle = z.infer<typeof VehicleZ>;

// ============================================================================
// EARNINGS - Driver earnings schema
// ============================================================================

export const EarningsZ = z.object({
  total: z.number(),
  today: z.number(),
  thisWeek: z.number(),
  thisMonth: z.number(),
  averageOrderValue: z.number(),
  totalDistanceKm: z.number(),
});
export type Earnings = z.infer<typeof EarningsZ>;

// ============================================================================
// FARE BREAKDOWN - Already exists in orders.zod.ts, keeping here for reference
// ============================================================================

export const FareBreakdownZ = z.object({
  basePrice: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  distancePrice: z.number().nonnegative(),
  weightSurcharge: z.number().nonnegative(),
  platformFee: z.number().nonnegative().optional(),
  subtotalBeforeTax: z.number().nonnegative().optional(),
  gstAmount: z.number().nonnegative().optional(),
  specialHandlingFee: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative(),
  currency: z.string().optional(),
});
export type FareBreakdown = z.infer<typeof FareBreakdownZ>;

// ============================================================================
// API RESPONSE PATTERNS - Generic response wrappers
// ============================================================================

// Generic success response wrapper
export const ApiResponseZ = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

// Generic error response
export const ErrorResponseZ = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z
    .object({
      code: z.string().optional(),
      details: z.any().optional(),
    })
    .optional(),
});

// Paginated response wrapper
export const PaginatedResponseZ = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
  });

// ============================================================================
// PAGINATION - Common pagination schema
// ============================================================================

export const PaginationZ = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type Pagination = z.infer<typeof PaginationZ>;

// ============================================================================
// COMMON QUERY PARAMETERS
// ============================================================================

export const PaginationQueryZ = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const IdParamZ = z.object({
  id: z.string().regex(/^[0-9]+$/),
});
export type IdParam = z.infer<typeof IdParamZ>;
