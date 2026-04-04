// services/backend/src/modules/static/static.zod.ts
import { z } from "zod";

export const WeightTierZ = z
  .object({
    tierId: z.number().int().positive(),
    name: z.string(),
    minWeightKg: z.number().nonnegative(),
    maxWeightKg: z.number().positive(),
    additionalCharge: z.number().nonnegative(),
  })
  .strict();
export type WeightTier = z.infer<typeof WeightTierZ>;

export const SupportedVehicleZ = z
  .object({
    categoryId: z.number().int().positive(),
    name: z.string(),
    displayName: z.string().nullable().optional(),
    maxWeightKg: z.number().nonnegative(),
    iconUrl: z.string().nullable().optional(),
    weightTiers: z.array(WeightTierZ),
  })
  .strict();
export type SupportedVehicle = z.infer<typeof SupportedVehicleZ>;

export const DeliveryTypeZ = z
  .object({
    deliveryTypeId: z.number().int().positive(),
    name: z.string(),
    displayName: z.string().optional(),
    description: z.string().nullable().optional(),
    pricing: z
      .object({
        baseRate: z.number().nonnegative(),
        perKmRate: z.number().nonnegative(),
      })
      .strict(),
    supportedVehicles: z.array(SupportedVehicleZ),
    sortOrder: z.number().int().nonnegative(),
    isActive: z.boolean(),
  })
  .strict();
export type DeliveryType = z.infer<typeof DeliveryTypeZ>;

export const VehicleCategoryZ = z
  .object({
    categoryId: z.number().int().positive(),
    name: z.string(),
    displayName: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    maxWeightKg: z.number().nonnegative(),
    iconUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
  })
  .strict();
export type VehicleCategory = z.infer<typeof VehicleCategoryZ>;

export const PackageTypeZ = z
  .object({
    packageTypeId: z.number().int().positive(),
    name: z.string(),
    description: z.string().nullable().optional(),
  })
  .strict();
export type PackageType = z.infer<typeof PackageTypeZ>;

export const StaticPaymentMethodZ = z
  .object({
    methodId: z.number().int().positive(),
    name: z.string(),
    displayName: z.string().optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean(),
  })
  .strict();
export type StaticPaymentMethod = z.infer<typeof StaticPaymentMethodZ>;

export const CreateOrderDataZ = z
  .object({
    deliveryTypes: z.array(DeliveryTypeZ),
    packageTypes: z.array(PackageTypeZ),
    paymentMethods: z.array(StaticPaymentMethodZ),
  })
  .strict();
export type CreateOrderData = z.infer<typeof CreateOrderDataZ>;

export const OrderStatusZ = z.string().min(1);
export type OrderStatus = z.infer<typeof OrderStatusZ>;

export const DeliveryTypesResponseZ = z
  .object({
    deliveryTypes: z.array(DeliveryTypeZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type DeliveryTypesResponse = z.infer<typeof DeliveryTypesResponseZ>;

export const WeightTiersResponseZ = z
  .object({
    weightTiers: z.array(WeightTierZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type WeightTiersResponse = z.infer<typeof WeightTiersResponseZ>;

export const VehicleCategoriesResponseZ = z
  .object({
    vehicleCategories: z.array(VehicleCategoryZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type VehicleCategoriesResponse = z.infer<
  typeof VehicleCategoriesResponseZ
>;

export const PackageTypesResponseZ = z
  .object({
    packageTypes: z.array(PackageTypeZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type PackageTypesResponse = z.infer<typeof PackageTypesResponseZ>;

export const PaymentMethodsResponseZ = z
  .object({
    paymentMethods: z.array(StaticPaymentMethodZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type PaymentMethodsResponse = z.infer<typeof PaymentMethodsResponseZ>;

export const CreateOrderDataResponseZ = z
  .object({
    createOrder: CreateOrderDataZ,
  })
  .strict();
export type CreateOrderDataResponse = z.infer<typeof CreateOrderDataResponseZ>;

export const OrderStatusesResponseZ = z
  .object({
    orderStatuses: z.array(OrderStatusZ),
    total: z.number().int().nonnegative(),
  })
  .strict();
export type OrderStatusesResponse = z.infer<typeof OrderStatusesResponseZ>;
