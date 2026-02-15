// services/backend/src/modules/orders/orders.zod.ts
import { z } from "zod";

export const LatLngZ = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const CalculateFareZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  vehicleCategoryId: z.number().int().positive(),
  weightTierId: z.number().int().positive(),
  // optional package type for more precise fare estimates
  packageTypeId: z.number().int().positive().nullable().optional(),
  pickup: LatLngZ,
  drop: LatLngZ,
});
export type CalculateFare = z.infer<typeof CalculateFareZ>;

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

export const OrderLocationZ = z.object({
  addressId: z.number().int().positive().nullable().optional(),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  howToReach: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  flatNumber: z.string().nullable().optional(),
  contactName: z.string(),
  contactPhone: z.string(),
});
export type OrderLocation = z.infer<typeof OrderLocationZ>;

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
  pickup: OrderLocationZ,
  delivery: OrderLocationZ,
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
