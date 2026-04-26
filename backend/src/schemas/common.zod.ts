// services/backend/src/schemas/common.zod.ts
import { z } from "zod";

// ============================================================================
// COORDINATES - Standardized latitude/longitude objects
// ============================================================================

export const CoordinatesZ = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).strict();
export type Coordinates = z.infer<typeof CoordinatesZ>;

// ============================================================================
// TIMESTAMPED ENTITY - Common timestamp fields
// ============================================================================

export const TimestampedEntityZ = z.object({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().optional(),
  deletedAt: z.iso.datetime().nullable().optional(),
}).strict();
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
}).strict();
export type BaseAddress = z.infer<typeof BaseAddressZ>;

// For user-saved addresses
export const SavedAddressZ = BaseAddressZ.extend({
  addressId: z.number().int().positive(),
  addressType: z.enum(["home", "work", "other"]).optional(),
  label: z.string().max(100).optional(),
  isDefault: z.boolean().optional(),
  createdAt: z.iso.datetime().optional(),
}).strict();
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
  vehicleId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  vehicleNumber: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
}).strict();
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
}).strict();
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
}).strict();
export type FareBreakdown = z.infer<typeof FareBreakdownZ>;

// ============================================================================
// USERS - Base user schema with specialized extensions
// ============================================================================

// Base user fields shared across all user types
export const BaseUserZ = z.object({
  userId: z.number().int().positive(),
  userUuid: z.string().uuid(),
  role: z.enum(["client", "courier", "business", "admin"]),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  fullName: z.string().min(2).max(100),
  profilePictureUrl: z.string().url().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
}).strict();
export type BaseUser = z.infer<typeof BaseUserZ>;

// Client user (no additional fields for now, ready for future expansion)
export const ClientUserZ = BaseUserZ.extend({
  // Future fields can be added here (e.g., preferredPaymentMethod, totalOrders, etc.)
}).strict();
export type ClientUser = z.infer<typeof ClientUserZ>;

// Driver user with additional fields
export const DriverUserZ = BaseUserZ.extend({
  status: z
    .object({
      isAvailable: z.boolean(),
      isOnline: z.boolean(),
      totalDeliveriesToday: z.number().int().nonnegative().optional(),
      currentLocation: CoordinatesZ.nullable().optional(),
      lastLocationUpdate: z.iso.datetime().nullable().optional(),
    })
    .strict(),
  vehicle: VehicleZ.nullable().optional(),
  earnings: EarningsZ.optional(),
  rating: z
    .object({
      averageRating: z.number().min(0).max(5),
      totalRatings: z.number().int().nonnegative(),
    })
    .strict()
    .optional(),
}).strict();
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
}).strict();
export type PaymentMethod = z.infer<typeof PaymentMethodZ>;

export const PaymentTransactionZ = z
  .object({
    transactionId: z.number().int().positive(),
    transactionUuid: z.string().uuid(),
    amount: z.number().nonnegative(),
    status: z.enum(["pending", "completed", "failed", "refunded", "cancelled"]),
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
    meta: z.record(z.string(), z.unknown()).optional(),
  }).strict();

// Generic error response
export const ErrorResponseZ = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z
    .object({
      code: z.string().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
}).strict();

// Paginated response wrapper
export const PaginatedResponseZ = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.array(itemSchema),
    meta: z
      .object({
        pagination: z
          .object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          })
          .strict(),
        filters: z.record(z.string(), z.unknown()).optional(),
      })
      .strict(),
  }).strict();

// ============================================================================
// PAGINATION - Common pagination schema
// ============================================================================

export const PaginationZ = z.object({
  page: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive(),
  total: z.coerce.number().int().nonnegative(),
  totalPages: z.coerce.number().int().nonnegative(),
}).strict();
export type Pagination = z.infer<typeof PaginationZ>;

// ============================================================================
// COMMON QUERY PARAMETERS
// ============================================================================

// Pagination query parameters
export const PaginationQueryZ = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
}).strict();
export type PaginationQuery = z.infer<typeof PaginationQueryZ>;

// Sorting query parameters
export const SortQueryZ = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
}).strict();
export type SortQuery = z.infer<typeof SortQueryZ>;

// Combined base query (pagination + sorting)
export const BaseQueryZ = PaginationQueryZ.merge(SortQueryZ).strict();
export type BaseQuery = z.infer<typeof BaseQueryZ>;

// ID parameter
export const IdParamZ = z.object({
  id: z.coerce.number().int().positive(),
}).strict();
export type IdParam = z.infer<typeof IdParamZ>;
