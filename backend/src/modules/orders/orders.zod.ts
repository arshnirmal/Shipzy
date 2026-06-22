import { z } from "zod";
import {
  CoordinatesZ,
  FareBreakdownZ,
  BaseQueryZ,
  VehicleZ,
} from "../../schemas/common.zod.js";
import {
  AssignmentTimelineJSONBZ,
  DeliveryAttemptJSONBZ,
  OrderActualJSONBZ,
  OrderItemJSONBZ,
  OrderLocationJSONBZ,
  OrderPackageJSONBZ,
  OrderPricingJSONBZ,
  OrderScheduleJSONBZ,
  OrderSnapshotJSONBZ,
} from "../../database/schema/types.js";

// ============================================================================
// BASE ORDER SCHEMAS
// ============================================================================

export const OrderLifecycleStatusZ = z.enum([
  "pending",
  "scheduled",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "undeliverable",
  "returning",
  "returned",
]);

export const AssignmentStatusZ = z.enum([
  "assigned",
  "accepted",
  "rejected",
  "picked_up",
  "in_transit",
  "returning",
  "delivered",
  "cancelled",
  "returned",
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusZ>;

export const OrderIdentifiersZ = z
  .object({
    orderId: z.number().int().positive(),
    orderUuid: z.string().uuid(),
    orderNumber: z.string().nullable().optional(),
  })
  .strict();

export const OrderFulfillmentZ = z
  .object({
    deliveryTypeId: z.number().int().positive(),
    vehicleCategoryId: z.number().int().positive(),
    weightTierId: z.number().int().positive().nullable().optional(),
    packageTypeId: z.number().int().positive().nullable().optional(),
    paymentMethodId: z.number().int().positive(),
    paymentMode: z.enum(["prepaid", "collect_on_delivery"]).optional(),
    paymentStatus: z.string().optional(),
  })
  .strict();

export const OrderLocationsZ = z
  .object({
    pickup: OrderLocationJSONBZ,
    delivery: OrderLocationJSONBZ,
  })
  .strict();

export const OrderMetricsZ = z
  .object({
    estimatedDistanceKm: z.number().nonnegative().nullable().optional(),
    actualDistanceKm: z.number().nonnegative().nullable().optional(),
    actualDurationMins: z.number().int().nonnegative().nullable().optional(),
    totalPrice: z.number().nonnegative(),
  })
  .strict();

export const OrderTimelineZ = z
  .object({
    createdAt: z.iso.datetime(),
    acceptedAt: z.iso.datetime().nullable().optional(),
    pickedUpAt: z.iso.datetime().nullable().optional(),
    inTransitAt: z.iso.datetime().nullable().optional(),
    deliveredAt: z.iso.datetime().nullable().optional(),
    cancelledAt: z.iso.datetime().nullable().optional(),
  })
  .strict();

export const BaseOrderCoreZ = z
  .object({
    fulfillment: OrderFulfillmentZ,
    locations: OrderLocationsZ,
    package: OrderPackageJSONBZ.default({ notifyRecipientSms: false }),
    schedule: OrderScheduleJSONBZ.default({}),
    pricing: OrderPricingJSONBZ,
    couponCode: z.string().max(50).nullable().optional(),
    items: z.array(OrderItemJSONBZ).optional().default([]),
  })
  .strict();

export type BaseOrderCore = z.infer<typeof BaseOrderCoreZ>;

export const BaseOrderZ = BaseOrderCoreZ.extend({
  identifiers: OrderIdentifiersZ,
  status: OrderLifecycleStatusZ,
  metrics: OrderMetricsZ,
  timeline: OrderTimelineZ,
  snapshot: OrderSnapshotJSONBZ.optional(),
  actual: OrderActualJSONBZ.optional(),
}).strict();

export type BaseOrder = z.infer<typeof BaseOrderZ>;

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const CalculateFareRequestZ = z
  .object({
    fulfillment: z
      .object({
        deliveryTypeId: z.number().int().positive(),
        vehicleCategoryId: z.number().int().positive(),
        weightTierId: z.number().int().positive(),
        packageTypeId: z.number().int().positive().nullable().optional(),
      })
      .strict(),
    locations: z
      .object({
        pickup: CoordinatesZ,
        delivery: CoordinatesZ,
      })
      .strict(),
  })
  .strict();
export type CalculateFareRequest = z.infer<typeof CalculateFareRequestZ>;

export const CreateOrderRequestZ = BaseOrderCoreZ.extend({
  fulfillment: z
    .object({
      deliveryTypeId: z.number().int().positive(),
      vehicleCategoryId: z.number().int().positive(),
      weightTierId: z.number().int().positive(),
      packageTypeId: z.number().int().positive().nullable().optional(),
      paymentMethodId: z.number().int().positive(),
      paymentMode: z.enum(["prepaid", "collect_on_delivery"]).optional().default("prepaid"),
    })
    .strict(),
  package: OrderPackageJSONBZ,
}).strict();
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestZ>;

export const CancelOrderRequestZ = z
  .object({
    cancellation: z
      .object({
        reason: z.string().min(5).max(500),
      })
      .strict(),
  })
  .strict();
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestZ>;

export const UpdateOrderStatusRequestZ = z
  .object({
    transition: z
      .object({
        status: z.enum(["picked_up", "in_transit", "delivered"]),
      })
      .strict(),
  })
  .strict();
export type UpdateOrderStatusRequest = z.infer<
  typeof UpdateOrderStatusRequestZ
>;

export const RateOrderRequestZ = z
  .object({
    feedback: z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).nullable().optional(),
        anonymous: z.boolean().optional(),
      })
      .strict(),
  })
  .strict();
export type RateOrderRequest = z.infer<typeof RateOrderRequestZ>;

// ── Driver order action request schemas ────────────────────────────────────────

export const ArriveRequestZ = z
  .object({
    gps: CoordinatesZ,
  })
  .strict();
export type ArriveRequest = z.infer<typeof ArriveRequestZ>;

export const UndeliverableRequestZ = z
  .object({
    driverNote: z.string().min(1).max(1000),
    photoUrl: z.string().url().optional(),
  })
  .strict();
export type UndeliverableRequest = z.infer<typeof UndeliverableRequestZ>;

export const ProofOfDeliveryRequestZ = z
  .object({
    recipientName: z.string().max(100).optional(),
    photoUrl: z.string().url().optional(),
    recipientSignatureUrl: z.string().url().optional(),
    deliveryNotes: z.string().max(500).optional(),
  })
  .strict();
export type ProofOfDeliveryRequest = z.infer<typeof ProofOfDeliveryRequestZ>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const ListOrdersQueryZ = BaseQueryZ.extend({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
  sortBy: z
    .enum(["createdAt", "totalPrice", "deliveredAt", "pickedUpAt"])
    .optional(),
  search: z.string().max(200).optional(),
  deliveryTypeId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
}).strict();
export type ListOrdersQuery = z.infer<typeof ListOrdersQueryZ>;

export const BulkCancelRequestZ = z
  .object({
    orders: z
      .object({
        ids: z.array(z.number().int().positive()).min(1).max(100),
        reason: z.string().min(5).max(500),
      })
      .strict(),
  })
  .strict();
export type BulkCancelRequest = z.infer<typeof BulkCancelRequestZ>;

export const BulkCancelResultZ = z
  .object({
    bulk: z
      .object({
        requested: z.number().int().nonnegative(),
        cancelled: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        results: z.array(
          z
            .object({
              orderId: z.number().int().positive(),
              success: z.boolean(),
              error: z.string().optional(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();
export type BulkCancelResult = z.infer<typeof BulkCancelResultZ>;

export const AvailableOrdersQueryZ = z
  .object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().positive().optional().default(10),
    limit: z.coerce.number().int().positive().optional().default(20),
  })
  .strict();
export type AvailableOrdersQuery = z.infer<typeof AvailableOrdersQueryZ>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const CalculateFareResponseZ = z
  .object({
    pricing: FareBreakdownZ,
    estimatedDurationMins: z.number().nonnegative().optional(),
  })
  .strict();
export type CalculateFareResponse = z.infer<typeof CalculateFareResponseZ>;

export const CreateOrderResponseZ = z
  .object({
    order: BaseOrderZ,
    razorpayOrderId: z.string().optional(),
    paymentStatus: z.string().optional(),
  })
  .strict();
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseZ>;

export const OrderListItemZ = z
  .object({
    order: BaseOrderZ,
    courier: z
      .object({
        userId: z.number().int().positive(),
        name: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        profilePictureUrl: z.string().url().nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();
export type OrderListItem = z.infer<typeof OrderListItemZ>;

export const OrderDetailsZ = z
  .object({
    order: BaseOrderZ.extend({
      paymentInfo: z
        .object({
          paymentMode: z.enum(["prepaid", "collect_on_delivery"]).optional(),
          paymentStatus: z.string().optional(),
          transactionId: z.number().nullable().optional(),
          paidAt: z.iso.datetime().nullable().optional(),
        })
        .strict()
        .optional(),
      assignment: z
        .object({
          assignmentId: z.number().int().positive(),
          status: AssignmentStatusZ,
          assignedAt: z.iso.datetime().nullable().optional(),
          timeline: AssignmentTimelineJSONBZ.nullable().optional(),
        })
        .strict()
        .nullable()
        .optional(),
      cancellation: z
        .object({
          reason: z.string().nullable().optional(),
        })
        .strict()
        .optional(),
    }).strict(),
    actors: z
      .object({
        client: z
          .object({
            userId: z.number().int().positive(),
            name: z.string().nullable().optional(),
            phone: z.string().nullable().optional(),
          })
          .strict(),
        courier: z
          .object({
            userId: z.number().int().positive(),
            name: z.string().nullable().optional(),
            phone: z.string().nullable().optional(),
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
      })
      .strict(),
  })
  .strict();
export type OrderDetails = z.infer<typeof OrderDetailsZ>;

export const AvailableOrderItemZ = z
  .object({
    order: BaseOrderZ,
    distanceFromDriverKm: z.number().nonnegative(),
  })
  .strict();
export type AvailableOrderItem = z.infer<typeof AvailableOrderItemZ>;

export const CancelOrderResultZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: z.literal("cancelled"),
        cancelledAt: z.iso.datetime().optional(),
        cancellationReason: z.string().nullable().optional(),
      })
      .strict(),
    refund: z
      .object({
        initiated: z.boolean(),
        amount: z.number().nonnegative(),
        status: z.string().optional(),
      })
      .strict(),
  })
  .strict();
export type CancelOrderResult = z.infer<typeof CancelOrderResultZ>;

export const AcceptOrderResultZ = z
  .object({
    assignment: z
      .object({
        assignmentId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        courierId: z.number().int().positive(),
        status: AssignmentStatusZ,
        assignedAt: z.iso.datetime(),
        acceptedAt: z.iso.datetime().nullable().optional(),
      })
      .strict(),
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: OrderLifecycleStatusZ,
        acceptedAt: z.iso.datetime().nullable().optional(),
      })
      .strict(),
  })
  .strict();
export type AcceptOrderResult = z.infer<typeof AcceptOrderResultZ>;

export const UpdateOrderStatusResponseZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: z.enum(["picked_up", "in_transit", "delivered"]),
        timestamp: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type UpdateOrderStatusResponse = z.infer<
  typeof UpdateOrderStatusResponseZ
>;

// ── Driver order action response schemas ──────────────────────────────────────

export const ArrivePayloadZ = z
  .object({
    arrivedAt: z.iso.datetime(),
    waitUntil: z.iso.datetime(),
    waitMinutes: z.number(),
  })
  .strict();
export type ArrivePayload = z.infer<typeof ArrivePayloadZ>;

export const ArriveResponseZ = z
  .object({
    data: ArrivePayloadZ,
  })
  .strict();
export type ArriveResponse = z.infer<typeof ArriveResponseZ>;

export const UndeliverablePayloadZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: z.literal("undeliverable"),
        undeliverableAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type UndeliverablePayload = z.infer<typeof UndeliverablePayloadZ>;

export const UndeliverableResponseZ = z
  .object({
    data: UndeliverablePayloadZ,
  })
  .strict();
export type UndeliverableResponse = z.infer<typeof UndeliverableResponseZ>;

export const ReturnPayloadZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: z.literal("returning"),
        returnStartedAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type ReturnPayload = z.infer<typeof ReturnPayloadZ>;

export const ReturnResponseZ = z
  .object({
    data: ReturnPayloadZ,
  })
  .strict();
export type ReturnResponse = z.infer<typeof ReturnResponseZ>;

export const ReturnedPayloadZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: z.literal("returned"),
        returnedAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type ReturnedPayload = z.infer<typeof ReturnedPayloadZ>;

export const ReturnedResponseZ = z
  .object({
    data: ReturnedPayloadZ,
  })
  .strict();
export type ReturnedResponse = z.infer<typeof ReturnedResponseZ>;

export const ProofOfDeliveryPayloadZ = z
  .object({
    proof: z
      .object({
        proofId: z.number().int().positive(),
        orderId: z.number().int().positive(),
        deliveredAt: z.iso.datetime(),
      })
      .strict(),
  })
  .strict();
export type ProofOfDeliveryPayload = z.infer<typeof ProofOfDeliveryPayloadZ>;

export const ProofOfDeliveryResponseZ = z
  .object({
    data: ProofOfDeliveryPayloadZ,
  })
  .strict();
export type ProofOfDeliveryResponse = z.infer<typeof ProofOfDeliveryResponseZ>;

export const TrackingMilestoneZ = z
  .object({
    eventType: z.string(),
    description: z.string().nullable().optional(),
    location: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .strict()
      .nullable()
      .optional(),
    timestamp: z.iso.datetime(),
  })
  .strict();

export const LocationMetaResponseZ = z
  .object({
    speed: z.number().nullable().optional(),
    bearing: z.number().nullable().optional(),
    accuracy: z.number().nullable().optional(),
  })
  .strict();

export const TrackingPayloadZ = z
  .object({
    order: z
      .object({
        orderId: z.number().int().positive(),
        status: OrderLifecycleStatusZ,
      })
      .strict(),
    driver: z
      .object({
        location: CoordinatesZ,
        locationMeta: LocationMetaResponseZ,
        lastUpdatedAt: z.iso.datetime(),
      })
      .strict()
      .nullable(),
    milestones: z.array(TrackingMilestoneZ),
    attempt: DeliveryAttemptJSONBZ.nullable(),
  })
  .strict();
export type TrackingPayload = z.infer<typeof TrackingPayloadZ>;

export const TrackingResponseZ = z
  .object({
    data: TrackingPayloadZ,
  })
  .strict();
export type TrackingResponse = z.infer<typeof TrackingResponseZ>;

// Stored function result contracts
export const FareCalculationResultZ = z
  .object({
    success: z.boolean(),
    pricing: FareBreakdownZ.optional(),
    error: z.string().optional(),
  })
  .strict();
export type FareCalculationResult = z.infer<typeof FareCalculationResultZ>;

export const OrderCreateResultZ = z
  .object({
    success: z.boolean(),
    order: BaseOrderZ.optional(),
    error: z.string().optional(),
  })
  .strict();
export type OrderCreateResult = z.infer<typeof OrderCreateResultZ>;

// ============================================================================
// INTERNAL DB ROW TYPES
// ============================================================================

export type OrderLocationJSONB = z.infer<typeof OrderLocationJSONBZ>;
export type OrderPricingJSONB = z.infer<typeof OrderPricingJSONBZ>;
export type OrderScheduleJSONB = z.infer<typeof OrderScheduleJSONBZ>;
export type OrderActualJSONB = z.infer<typeof OrderActualJSONBZ>;
export type OrderPackageJSONB = z.infer<typeof OrderPackageJSONBZ>;
export type OrderSnapshotJSONB = z.infer<typeof OrderSnapshotJSONBZ>;
export type AssignmentTimelineJSONB = z.infer<typeof AssignmentTimelineJSONBZ>;

export type OrderRow = {
  orderId: number;
  orderUuid: string;
  orderNumber: string;
  clientId?: number | null;
  clientName?: string | null;
  clientPhone?: string | null;
  status: z.infer<typeof OrderLifecycleStatusZ>;
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;
  paymentMethodId: number;
  paymentMode?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  couponCode?: string | null;
  cancellationReason?: string | null;
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  orderItems?: unknown[];
  pricing?: OrderPricingJSONB | null;
  schedule?: OrderScheduleJSONB | null;
  actual?: OrderActualJSONB | null;
  package?: OrderPackageJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;
  createdAt: Date;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  inTransitAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  assignmentId?: number | null;
  courierId?: number | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierPhoto?: string | null;
  assignmentStatus?: string | null;
  assignedAt?: string | Date | null;
  assignmentTimeline?: AssignmentTimelineJSONB | null;
  deliveryAttempt?:
    | import("../../database/schema/types.js").DeliveryAttemptJSONB
    | null;
};

export type OrderListRow = {
  orderId: number;
  orderUuid: string;
  orderNumber?: string | null;
  status: z.infer<typeof OrderLifecycleStatusZ>;
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;
  paymentMethodId: number;
  paymentMode?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  actualDistanceKm?: number | null;
  createdAt: Date;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  inTransitAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  package?: OrderPackageJSONB | null;
  pricing?: OrderPricingJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;
  courierId?: number | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierPhoto?: string | null;
};

export type AvailableOrderRow = {
  orderId: number;
  orderUuid: string;
  orderNumber: string;
  status: z.infer<typeof OrderLifecycleStatusZ>;
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;
  paymentMethodId: number;
  paymentMode?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number | null;
  estimatedDistanceKm?: number | null;
  createdAt: Date;
  pickup: OrderLocationJSONB;
  delivery: OrderLocationJSONB;
  pricing?: OrderPricingJSONB | null;
  snapshot?: OrderSnapshotJSONB | null;
  package?: OrderPackageJSONB | null;
  distanceFromCourierKm: number;
};

export type CreateOrderPayload = CreateOrderRequest & {
  clientId: number;
};

// ============================================================================
// ROUTE PARAMS
// ============================================================================

export const OrderParamsZ = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();
export type OrderParams = z.infer<typeof OrderParamsZ>;
