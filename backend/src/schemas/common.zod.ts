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
// TIMESTAMPED ENTITY - Common timestamp fields
// ============================================================================

export const TimestampedEntityZ = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});
export type TimestampedEntity = z.infer<typeof TimestampedEntityZ>;

// ============================================================================
// ADDRESSES - Base address fields with specialized extensions
// ============================================================================

// Base address fields shared across all address types
export const BaseAddressZ = z.object({
  fullAddress: z.string().min(5).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  building: z.string().max(100).nullable().optional(),
  floor: z.string().max(10).nullable().optional(),
  flatNumber: z.string().max(10).nullable().optional(),
  landmark: z.string().max(255).nullable().optional(),
});
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
  howToReach: z.string().max(500).nullable().optional(),
  contactName: z.string().min(2).max(100),
  contactPhone: z.string().min(10).max(20),
}).transform((data) => ({
  ...data,
  // Ensure city, state, postalCode are optional as they're nullable in DB
  city: data.city ?? undefined,
  state: data.state ?? undefined,
  postalCode: data.postalCode ?? undefined,
}));
export type OrderAddress = z.infer<typeof OrderAddressZ>;

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
// FARE BREAKDOWN - Pricing details
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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BaseUser = z.infer<typeof BaseUserZ>;

// Client user (no additional fields for now, ready for future expansion)
export const ClientUserZ = BaseUserZ.extend({
  // Future fields can be added here (e.g., preferredPaymentMethod, totalOrders, etc.)
});
export type ClientUser = z.infer<typeof ClientUserZ>;

// Driver user with additional fields
export const DriverUserZ = BaseUserZ.extend({
  status: z.object({
    isAvailable: z.boolean(),
    isOnline: z.boolean(),
    totalDeliveriesToday: z.number().int().nonnegative().optional(),
    currentLocation: CoordinatesZ.nullable().optional(),
    lastLocationUpdate: z.string().datetime().nullable().optional(),
  }),
  vehicle: VehicleZ.nullable().optional(),
  earnings: EarningsZ.optional(),
  rating: z
    .object({
      averageRating: z.number().min(0).max(5),
      totalRatings: z.number().int().nonnegative(),
    })
    .optional(),
});
export type DriverUser = z.infer<typeof DriverUserZ>;

// ============================================================================
// RATINGS - Base rating schema
// ============================================================================

export const BaseRatingZ = z
  .object({
    ratingId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).nullable().optional(),
    isAnonymous: z.boolean().optional().default(false),
  })
  .merge(TimestampedEntityZ);
export type BaseRating = z.infer<typeof BaseRatingZ>;

// ============================================================================
// PAYMENTS - Payment method and transaction schemas
// ============================================================================

export const PaymentMethodZ = z.object({
  paymentMethodId: z.number().int().positive(),
  methodType: z.enum(["cash", "card", "upi", "wallet"]),
  methodName: z.string(),
  isDefault: z.boolean().optional(),
});
export type PaymentMethod = z.infer<typeof PaymentMethodZ>;

export const PaymentTransactionZ = z
  .object({
    transactionId: z.number().int().positive(),
    transactionUuid: z.string().uuid(),
    amount: z.number().nonnegative(),
    status: z.enum(["pending", "completed", "failed", "refunded"]),
    paymentMethod: PaymentMethodZ,
  })
  .merge(TimestampedEntityZ);
export type PaymentTransaction = z.infer<typeof PaymentTransactionZ>;

// ============================================================================
// API RESPONSE PATTERNS - Generic response wrappers
// ============================================================================

// Generic success response wrapper
export const ApiResponseZ = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
    meta: z.record(z.string(), z.any()).optional(),
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
    data: z.array(itemSchema),
    meta: z.object({
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
      filters: z.record(z.string(), z.any()).optional(),
    }),
  });

// ============================================================================
// PAGINATION - Common pagination schema
// ============================================================================

export const PaginationZ = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive(),
  total: z.coerce.number().int().nonnegative(),
  totalPages: z.coerce.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof PaginationZ>;

// ============================================================================
// COMMON QUERY PARAMETERS
// ============================================================================

// Pagination query parameters
export const PaginationQueryZ = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQueryZ>;

// Sorting query parameters
export const SortQueryZ = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type SortQuery = z.infer<typeof SortQueryZ>;

// Combined base query (pagination + sorting)
export const BaseQueryZ = PaginationQueryZ.merge(SortQueryZ);
export type BaseQuery = z.infer<typeof BaseQueryZ>;

// ID parameter
export const IdParamZ = z.object({
  id: z.string().regex(/^[0-9]+$/),
});
export type IdParam = z.infer<typeof IdParamZ>;
