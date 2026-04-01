// services/backend/src/modules/orders/orders.zod.ts
import { z } from "zod";
import {
  CoordinatesZ,
  OrderAddressZ,
  FareBreakdownZ,
  BaseQueryZ,
  VehicleZ,
} from "../../schemas/common.zod.js";

// ============================================================================
// BASE ORDER SCHEMA - Common fields across all order representations
// ============================================================================

export const BaseOrderZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string().optional(),
  status: z.string().optional(),
  statusId: z.number().int().positive(),
  deliveryTypeId: z.number().int().positive(),
  deliveryTypeDisplay: z.string().optional(),
  vehicleCategoryId: z.number().int().positive(),
  vehicleCategoryDisplay: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});
export type BaseOrder = z.infer<typeof BaseOrderZ>;

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Calculate Fare Request
export const CalculateFareRequestZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  vehicleCategoryId: z.number().int().positive(),
  weightTierId: z.number().int().positive(),
  packageTypeId: z.number().int().positive().nullable().optional(),
  pickup: CoordinatesZ,
  drop: CoordinatesZ,
});
export type CalculateFareRequest = z.infer<typeof CalculateFareRequestZ>;

// Create Order Request
export const CreateOrderRequestZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  vehicleCategoryId: z.number().int().positive(),
  weightTierId: z.number().int().positive(),
  packageTypeId: z.number().int().positive().nullable().optional(),
  paymentMethodId: z.number().int().positive(),
  packageDescription: z.string().max(500).nullable().optional(),
  specialInstructions: z.string().max(1000).nullable().optional(),
  scheduledPickupTime: z.string().datetime().nullable().optional(),
  scheduledDeliveryTime: z.string().datetime().nullable().optional(),
  declaredValue: z.number().nonnegative().nullable().optional(),
  notifyRecipientSms: z.boolean().optional().default(false),
  couponCode: z.string().max(50).nullable().optional(),
  fareBreakdown: FareBreakdownZ,
  pickup: OrderAddressZ,
  delivery: OrderAddressZ,
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestZ>;

// Cancel Order Request
export const CancelOrderRequestZ = z.object({
  cancellationReason: z.string().min(5).max(500),
});
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestZ>;

// Update Order Status Request
export const UpdateOrderStatusRequestZ = z.object({
  status: z.enum(["picked_up", "in_transit", "delivered"]),
});
export type UpdateOrderStatusRequest = z.infer<
  typeof UpdateOrderStatusRequestZ
>;

// Rate Order Request
export const RateOrderRequestZ = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
  anonymous: z.boolean().optional(),
});
export type RateOrderRequest = z.infer<typeof RateOrderRequestZ>;

// Cancel Order Result (stored function response)
export const CancelOrderResultZ = z.object({
  success: z.boolean(),
  orderId: z.number().int().positive().optional(),
  status: z.string().optional(),
  refundAmount: z.number().nonnegative().optional(),
  refundStatus: z.string().optional(),
  error: z.string().optional(),
}).passthrough();
export type CancelOrderResult = z.infer<typeof CancelOrderResultZ>;

// ============================================================================
// QUERY SCHEMAS - API query parameters
// ============================================================================

// List Orders Query
export const ListOrdersQueryZ = BaseQueryZ.extend({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQueryZ>;

// Available Orders Query (for drivers)
export const AvailableOrdersQueryZ = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().optional().default(10),
  limit: z.coerce.number().int().positive().optional().default(20),
});
export type AvailableOrdersQuery = z.infer<typeof AvailableOrdersQueryZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Calculate Fare Response
export const CalculateFareResponseZ = FareBreakdownZ.extend({
  estimatedDurationMins: z.number().nonnegative().optional(),
});
export type CalculateFareResponse = z.infer<typeof CalculateFareResponseZ>;

// Stored function result (camelCase) - used internally
export const FareCalculationResultZ = z.object({
  success: z.boolean(),
  fareBreakdown: FareBreakdownZ.optional(),
  error: z.string().optional(),
});
export type FareCalculationResult = z.infer<typeof FareCalculationResultZ>;

// Create Order Response
export const CreateOrderResponseZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string(),
  status: z.string(),
  fareBreakdown: FareBreakdownZ,
  estimatedDistanceKm: z.number().nonnegative(),
  estimatedDurationMins: z.number().nonnegative().optional(),
  createdAt: z.string().datetime(),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseZ>;

// Stored function order payload (camelCase) used for normalization
export const CreatedOrderRowZ = z
  .object({
    orderId: z.number().int().positive(),
    orderUuid: z.string().uuid(),
    orderNumber: z.string(),
    status: z.string().optional(),
    pricing: FareBreakdownZ.partial().optional(),
    estimatedDistanceKm: z.number().nonnegative().optional(),
    estimatedDurationMins: z.number().nonnegative().optional(),
    createdAt: z.union([z.string().datetime(), z.date()]),
  })
  .passthrough();
export type CreatedOrderRow = z.infer<typeof CreatedOrderRowZ>;

// Stored function result (camelCase) - used internally
export const OrderCreateResultZ = z.object({
  success: z.boolean(),
  order: CreatedOrderRowZ.optional(),
  error: z.string().optional(),
});
export type OrderCreateResult = z.infer<typeof OrderCreateResultZ>;

// Order List Item (minimal info for lists)
export const OrderListItemZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string().nullable().optional(),
  status: z.string(),
  statusId: z.number().int().positive(),
  deliveryTypeId: z.number().int().positive(),
  deliveryTypeDisplay: z.string().optional(),
  vehicleCategoryId: z.number().int().positive(),
  vehicleCategoryDisplay: z.string().optional(),
  packageDescription: z.string().nullable().optional(),
  weightTierId: z.number().nullable().optional(),
  weightTierDisplay: z.string().nullable().optional(),
  estimatedDistanceKm: z.number().nullable().optional(),
  actualDistanceKm: z.number().nullable().optional(),
  actualDurationMins: z.number().nullable().optional(),
  totalPrice: z.number().nonnegative(),
  createdAt: z.union([z.string().datetime(), z.date()]),
  pickup: z.object({
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }),
  delivery: z.object({
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }),
  courier: z
    .object({
      name: z.string().nullable().optional(),
      photo: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type OrderListItem = z.infer<typeof OrderListItemZ>;

// Order Details (full info for get by ID)
export const OrderDetailsZ = BaseOrderZ.extend({
  packageDescription: z.string().nullable().optional(),
  packageTypeId: z.number().nullable().optional(),
  weightTierId: z.number().nullable().optional(),
  weightTierDisplay: z.string().nullable().optional(),
  specialInstructions: z.string().nullable().optional(),

  pickup: z.object({
    locationId: z.number().optional(),
    address: z.string(),
    building: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
    flat: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
  }),
  delivery: z.object({
    locationId: z.number().optional(),
    address: z.string(),
    building: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
    flat: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
  }),

  fareBreakdown: FareBreakdownZ,

  client: z
    .object({
      userId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      profilePictureUrl: z.string().url().nullable().optional(),
    })
    .optional(),

  courier: z
    .object({
      userId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      profilePictureUrl: z.string().url().nullable().optional(),
      vehicle: VehicleZ.nullable().optional(),
      rating: z
        .object({
          averageRating: z.number().min(0).max(5),
          totalRatings: z.number().int().nonnegative(),
        })
        .optional(),
    })
    .nullable()
    .optional(),

  timeline: z.object({
    confirmedAt: z.string().datetime(),
    assignedAt: z.string().datetime().nullable().optional(),
    pickedUpAt: z.string().datetime().nullable().optional(),
    deliveredAt: z.string().datetime().nullable().optional(),
    cancelledAt: z.string().datetime().nullable().optional(),
  }),

  estimatedDistanceKm: z.number().nullable().optional(),
  actualDistanceKm: z.number().nullable().optional(),
  actualDurationMins: z.number().nullable().optional(),
});
export type OrderDetails = z.infer<typeof OrderDetailsZ>;

// Available Order Item (for drivers)
export const AvailableOrderItemZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string(),
  deliveryTypeDisplay: z.string(),
  vehicleCategoryDisplay: z.string(),
  createdAt: z.string().datetime(),
  pickup: z.object({
    address: z.string(),
    landmark: z.string().nullable().optional(),
    city: z.string(),
    coordinates: CoordinatesZ,
  }),
  delivery: z.object({
    address: z.string(),
    landmark: z.string().nullable().optional(),
    city: z.string(),
    coordinates: CoordinatesZ,
  }),
  fareBreakdown: FareBreakdownZ,
  estimatedDistanceKm: z.number().nonnegative(),
  distanceFromDriverKm: z.number().nonnegative(),
  packageDescription: z.string().nullable().optional(),
});
export type AvailableOrderItem = z.infer<typeof AvailableOrderItemZ>;

// ============================================================================
// ROUTE PARAMS
// ============================================================================

export const OrderParamsZ = z.object({
  id: z.string().regex(/^\d+$/),
});
export type OrderParams = z.infer<typeof OrderParamsZ>;
