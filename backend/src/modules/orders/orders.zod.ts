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
  status: z.string(),
  deliveryTypeId: z.number().int().positive(),
  deliveryTypeDisplay: z.string().optional(),
  vehicleCategoryId: z.number().int().positive(),
  vehicleCategoryDisplay: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().optional(),
}).strict();
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
}).strict();
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
  scheduledPickupTime: z.iso.datetime().nullable().optional(),
  scheduledDeliveryTime: z.iso.datetime().nullable().optional(),
  declaredValue: z.number().nonnegative().nullable().optional(),
  notifyRecipientSms: z.boolean().optional().default(false),
  couponCode: z.string().max(50).nullable().optional(),
  fareBreakdown: FareBreakdownZ,
  pickup: OrderAddressZ,
  delivery: OrderAddressZ,
}).strict();
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestZ>;

// Cancel Order Request
export const CancelOrderRequestZ = z.object({
  cancellationReason: z.string().min(5).max(500),
}).strict();
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestZ>;

// Update Order Status Request
export const UpdateOrderStatusRequestZ = z.object({
  status: z.enum(["picked_up", "in_transit", "delivered"]),
}).strict();
export type UpdateOrderStatusRequest = z.infer<
  typeof UpdateOrderStatusRequestZ
>;

// Rate Order Request
export const RateOrderRequestZ = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
  anonymous: z.boolean().optional(),
}).strict();
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
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
}).strict();
export type ListOrdersQuery = z.infer<typeof ListOrdersQueryZ>;

// Available Orders Query (for drivers)
export const AvailableOrdersQueryZ = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().optional().default(10),
  limit: z.coerce.number().int().positive().optional().default(20),
}).strict();
export type AvailableOrdersQuery = z.infer<typeof AvailableOrdersQueryZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Calculate Fare Response
export const CalculateFareResponseZ = FareBreakdownZ.extend({
  estimatedDurationMins: z.number().nonnegative().optional(),
}).strict();
export type CalculateFareResponse = z.infer<typeof CalculateFareResponseZ>;

// Stored function result (camelCase) - used internally
export const FareCalculationResultZ = z.object({
  success: z.boolean(),
  fareBreakdown: FareBreakdownZ.optional(),
  error: z.string().optional(),
}).strict();
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
  createdAt: z.iso.datetime(),
}).strict();
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
    createdAt: z.iso.datetime(),
  })
  .passthrough();
export type CreatedOrderRow = z.infer<typeof CreatedOrderRowZ>;

// Stored function result (camelCase) - used internally
export const OrderCreateResultZ = z.object({
  success: z.boolean(),
  order: CreatedOrderRowZ.optional(),
  error: z.string().optional(),
}).strict();
export type OrderCreateResult = z.infer<typeof OrderCreateResultZ>;

// Order List Item (minimal info for lists)
export const OrderListItemZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string().nullable().optional(),
  status: z.string(),
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
  createdAt: z.iso.datetime(),
  pickup: z
    .object({
      address: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
    })
    .strict(),
  delivery: z
    .object({
      address: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
    })
    .strict(),
  courier: z
    .object({
      name: z.string().nullable().optional(),
      photo: z.string().nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
}).strict();
export type OrderListItem = z.infer<typeof OrderListItemZ>;

// Order Details (full info for get by ID)
export const OrderDetailsZ = BaseOrderZ.extend({
  packageDescription: z.string().nullable().optional(),
  packageTypeId: z.number().nullable().optional(),
  weightTierId: z.number().nullable().optional(),
  weightTierDisplay: z.string().nullable().optional(),
  specialInstructions: z.string().nullable().optional(),

  pickup: z
    .object({
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
    })
    .strict(),
  delivery: z
    .object({
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
    })
    .strict(),

  fareBreakdown: FareBreakdownZ,

  client: z
    .object({
      userId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      profilePictureUrl: z.string().url().nullable().optional(),
    })
    .strict()
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
        .strict()
        .optional(),
    })
    .strict()
    .nullable()
    .optional(),

  timeline: z
    .object({
      confirmedAt: z.iso.datetime(),
      assignedAt: z.iso.datetime().nullable().optional(),
      pickedUpAt: z.iso.datetime().nullable().optional(),
      deliveredAt: z.iso.datetime().nullable().optional(),
      cancelledAt: z.iso.datetime().nullable().optional(),
    })
    .strict(),

  estimatedDistanceKm: z.number().nullable().optional(),
  actualDistanceKm: z.number().nullable().optional(),
  actualDurationMins: z.number().nullable().optional(),
}).strict();
export type OrderDetails = z.infer<typeof OrderDetailsZ>;

// Available Order Item (for drivers)
export const AvailableOrderItemZ = z.object({
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid(),
  orderNumber: z.string(),
  deliveryTypeDisplay: z.string(),
  vehicleCategoryDisplay: z.string(),
  createdAt: z.iso.datetime(),
  pickup: z
    .object({
      address: z.string(),
      landmark: z.string().nullable().optional(),
      city: z.string(),
      coordinates: CoordinatesZ,
    })
    .strict(),
  delivery: z
    .object({
      address: z.string(),
      landmark: z.string().nullable().optional(),
      city: z.string(),
      coordinates: CoordinatesZ,
    })
    .strict(),
  fareBreakdown: FareBreakdownZ,
  estimatedDistanceKm: z.number().nonnegative(),
  distanceFromDriverKm: z.number().nonnegative(),
  packageDescription: z.string().nullable().optional(),
}).strict();
export type AvailableOrderItem = z.infer<typeof AvailableOrderItemZ>;

// ============================================================================
// INTERNAL DB ROW TYPES — not API types, used by repository/service
// ============================================================================

import type {
  OrderLocationJSONB,
  OrderPricingJSONB,
  OrderScheduleJSONB,
  OrderActualJSONB,
  OrderPackageJSONB,
  OrderSnapshotJSONB,
  AssignmentTimelineJSONB,
} from "../../database/schema/types.js";

// Row returned by FIND_ORDER_BY_ID
export type OrderRow = {
  orderId: number;
  orderUuid: string;
  orderNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  clientPhone?: string | null;
  status: string;

  // FK columns
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;
  paymentMethodId?: number | null;

  // Operational scalars
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  couponCode?: string | null;
  cancellationReason?: string | null;

  // JSONB value objects
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  orderItems?: unknown[];
  pricing?: OrderPricingJSONB | null;
  schedule?: OrderScheduleJSONB | null;
  actual?: OrderActualJSONB | null;
  package?: OrderPackageJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;

  // Status timeline
  createdAt: Date;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  inTransitAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;

  // Courier assignment
  assignmentId?: number | null;
  courierId?: number | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierPhoto?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | Date | null;
  assignmentTimeline?: AssignmentTimelineJSONB | null;
};

// Row returned by findByClient (list view — fewer fields)
export type OrderListRow = {
  orderId: number;
  orderUuid: string;
  orderNumber?: string | null;
  status: string;

  // FK columns
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;

  // Operational scalars
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  createdAt: Date;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  deliveredAt?: Date | null;

  // JSONB value objects
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  pricing?: OrderPricingJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;

  // Courier info
  courierId?: number | null;
  courierName?: string | null;
  courierPhoto?: string | null;
};

// Row returned by FIND_AVAILABLE_ORDERS_FOR_COURIER
export type AvailableOrderRow = {
  orderId: number;
  orderUuid: string;
  orderNumber: string;

  // FK columns
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;

  // Operational scalars
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  createdAt: Date;
  distanceFromCourierKm: number;

  // JSONB value objects
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  pricing?: OrderPricingJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;
  package?: OrderPackageJSONB | null;
};

// Parameter type for createOrder repository method
export type CreateOrderPayload = {
  clientId: number;
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId: number;
  packageTypeId: number | null;
  paymentMethodId: number;
  notifyRecipientSms: boolean;
  couponCode: string | null;
  pickup: {
    fullAddress: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    postalCode: string;
    howToReach: string | null;
    building: string | null;
    floor: string | null;
    flatNumber: string | null;
    contactName: string;
    contactPhone: string;
  };
  delivery: {
    fullAddress: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    postalCode: string;
    howToReach: string | null;
    building: string | null;
    floor: string | null;
    flatNumber: string | null;
    contactName: string;
    contactPhone: string;
  };
  packageDescription: string | null;
  specialInstructions: string | null;
  declaredValue: number | null;
  scheduledPickupTime: string | null;
  scheduledDeliveryTime: string | null;
  fareBreakdown: {
    basePrice: number;
    distanceKm: number;
    distancePrice: number;
    weightSurcharge: number;
    platformFee: number;
    specialHandlingFee: number;
    subtotalBeforeTax: number;
    gstAmount?: number;
    totalPrice: number;
    currency?: string;
  };
};

// ============================================================================
// ROUTE PARAMS
// ============================================================================

export const OrderParamsZ = z.object({
  id: z.coerce.number().int().positive(),
}).strict();
export type OrderParams = z.infer<typeof OrderParamsZ>;
