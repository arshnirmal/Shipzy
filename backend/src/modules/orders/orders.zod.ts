// services/backend/src/modules/orders/orders.zod.ts
import { z } from "zod";
import {
  CoordinatesZ,
  OrderAddressZ,
  FareBreakdownZ,
} from "../../schemas/common.zod.js";

export const CalculateFareZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  vehicleCategoryId: z.number().int().positive(),
  weightTierId: z.number().int().positive(),
  // optional package type for more precise fare estimates
  packageTypeId: z.number().int().positive().nullable().optional(),
  pickup: CoordinatesZ,
  drop: CoordinatesZ,
});
export type CalculateFare = z.infer<typeof CalculateFareZ>;

export const CreateOrderZ = z.object({
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
  fareBreakdown: FareBreakdownZ,
  pickup: OrderAddressZ,
  delivery: OrderAddressZ,
});
export type CreateOrder = z.infer<typeof CreateOrderZ>;

export const RateOrderZ = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
  anonymous: z.boolean().optional(),
});
export type RateOrder = z.infer<typeof RateOrderZ>;

// Cancel order (request body)
export const CancelOrderZ = z.object({
  cancellationReason: z.string().min(5).max(500),
});
export type CancelOrder = z.infer<typeof CancelOrderZ>;

// Update order status (request body)
export const UpdateOrderStatusZ = z.object({
  status: z.enum(["picked_up", "delivered"]),
});
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusZ>;

// Route params
export const OrderParamsZ = z.object({
  id: z.string().regex(/^[0-9]+$/),
});
export type OrderParams = z.infer<typeof OrderParamsZ>;

// Query strings
export const ListOrdersQueryZ = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQueryZ>;

export const GetAvailableOrdersQueryZ = z.object({
  latitude: z.string(),
  longitude: z.string(),
  radius: z.string().optional(),
  limit: z.string().optional(),
});
export type GetAvailableOrdersQuery = z.infer<typeof GetAvailableOrdersQueryZ>;

// -------------------------
// Response Schemas (single source-of-truth for DTOs)
// -------------------------

export const AvailableOrderItemZ = z.object({
  orderId: z.number(),
  orderUuid: z.string().optional(),
  orderNumber: z.string().optional(),
  deliveryType: z.string().optional(),
  deliveryTypeDisplay: z.string().optional(),
  vehicleCategory: z.string().optional(),
  vehicleCategoryDisplay: z.string().optional(),
  packageType: z.string().nullable().optional(),
  weightTier: z
    .object({
      id: z.number().optional(),
      name: z.string().optional(),
      minWeightKg: z.number().optional(),
      maxWeightKg: z.number().optional(),
    })
    .nullable()
    .optional(),
  pricing: z
    .object({
      basePrice: z.number().nonnegative().optional(),
      distanceKm: z.number().nonnegative().optional(),
      distancePrice: z.number().nonnegative().optional(),
      weightSurcharge: z.number().nonnegative().optional(),
      platformFee: z.number().nonnegative().optional(),
      specialHandlingFee: z.number().nonnegative().optional(),
      gstAmount: z.number().nonnegative().optional(),
      subtotalBeforeTax: z.number().nonnegative().optional(),
      totalPrice: z.number().nonnegative().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  packageDescription: z.string().nullable().optional(),
  specialInstructions: z.string().nullable().optional(),
  estimatedDistanceKm: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  pickup: z.object({
    address: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  }),
  delivery: z.object({
    address: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  }),
  distanceFromCourierKm: z.number().optional(),
});
export type AvailableOrderItem = z.infer<typeof AvailableOrderItemZ>;

export const CreatedOrderZ = z.object({
  orderId: z.number().optional(),
  orderUuid: z.string().optional(),
  orderNumber: z.string().optional(),
  pricing: FareBreakdownZ.optional(),
  totalFare: z.number().optional(),
  estimatedDistance: z.number().optional(),
  estimatedDuration: z.number().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
});
export type CreatedOrder = z.infer<typeof CreatedOrderZ>;

export const OrderDetailsZ = z.object({
  orderId: z.number(),
  orderUuid: z.string().optional(),
  orderNumber: z.string().optional(),
  status: z.string().optional(),
  statusId: z.number().optional(),
  deliveryTypeId: z.number().optional(),
  deliveryTypeDisplay: z.string().optional(),
  vehicleCategoryId: z.number().optional(),
  vehicleCategoryDisplay: z.string().optional(),
  packageDescription: z.string().nullable().optional(),
  packageTypeId: z.number().nullable().optional(),
  weightTierId: z.number().nullable().optional(),
  weightTierDisplay: z.string().nullable().optional(),
  estimatedDistanceKm: z.number().nullable().optional(),
  actualDistanceKm: z.number().nullable().optional(),
  actualDurationMins: z.number().nullable().optional(),
  createdAt: z.string().optional(),
  statusTimestamp: z.any().optional(),
  acceptedAt: z.any().nullable().optional(),
  pickedUpAt: z.any().nullable().optional(),
  deliveredAt: z.any().nullable().optional(),
  cancelledAt: z.any().nullable().optional(),
  pickup: z.object({
    locationId: z.number().nullable().optional(),
    address: z.string().nullable().optional(),
    building: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
    flat: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    contactName: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
  }),
  delivery: z.object({
    locationId: z.number().nullable().optional(),
    address: z.string().nullable().optional(),
    building: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
    flat: z.string().nullable().optional(),
    landmark: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    contactName: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
  }),
  payment: z
    .object({
      paymentMethod: z.string().nullable().optional(),
      fareBreakdown: FareBreakdownZ,
    })
    .optional(),
  basePrice: z.number().optional(),
  distancePrice: z.number().optional(),
  weightSurcharge: z.number().optional(),
  platformFee: z.number().optional(),
  specialHandlingFee: z.number().optional(),
  gstAmount: z.number().optional(),
  subtotalBeforeTax: z.number().optional(),
  currency: z.string().optional(),
  totalPrice: z.number().optional(),
  client: z
    .object({
      name: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    })
    .optional(),
  specialInstructions: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
  courier: z
    .object({
      id: z.number().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
      photo: z.string().nullable().optional(),
      assignmentStatus: z.string().nullable().optional(),
      assignedAt: z.any().nullable().optional(),
      acceptedAt: z.any().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type OrderDetails = z.infer<typeof OrderDetailsZ>;

export const ListOrderItemZ = z.object({
  orderId: z.number(),
  orderUuid: z.string().optional(),
  orderNumber: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.any().optional(),
  estimatedDeliveryTime: z.any().optional(),
  pickup: z.object({ address: z.string().optional() }).optional(),
  delivery: z.object({ address: z.string().optional() }).optional(),
  totalPrice: z.number().optional(),
});
export type ListOrderItem = z.infer<typeof ListOrderItemZ>;
