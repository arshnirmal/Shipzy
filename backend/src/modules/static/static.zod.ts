// services/backend/src/modules/static/static.zod.ts
import { z } from "zod";

export const DeliveryTypeZ = z.object({
  deliveryTypeId: z.number(),
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().nullable().optional(),
  pricing: z.object({ baseRate: z.number(), perKmRate: z.number() }).optional(),
  labels: z.array(z.string()).optional(),
  supportedVehicles: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});
export type DeliveryType = z.infer<typeof DeliveryTypeZ>;

export const WeightTierZ = z.object({
  tierId: z.number(),
  name: z.string(),
  minWeightKg: z.number(),
  maxWeightKg: z.number(),
  additionalCharge: z.number(),
});
export type WeightTier = z.infer<typeof WeightTierZ>;

export const VehicleCategoryZ = z.object({
  categoryId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  maxWeightKg: z.number().optional(),
  icon: z.string().optional(),
});
export type VehicleCategory = z.infer<typeof VehicleCategoryZ>;

export const PackageTypeZ = z.object({
  packageTypeId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
});
export type PackageType = z.infer<typeof PackageTypeZ>;

export const StaticPaymentMethodZ = z.object({
  methodId: z.number(),
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type StaticPaymentMethod = z.infer<typeof StaticPaymentMethodZ>;

export const CreateOrderDataZ = z.object({
  deliveryTypes: z.array(DeliveryTypeZ),
  packageTypes: z.array(PackageTypeZ),
  paymentMethods: z.array(StaticPaymentMethodZ),
});
export type CreateOrderData = z.infer<typeof CreateOrderDataZ>;

export const OrderStatusZ = z.object({
  statusId: z.number(),
  name: z.string(),
  description: z.string().optional(),
});
export type OrderStatus = z.infer<typeof OrderStatusZ>;
