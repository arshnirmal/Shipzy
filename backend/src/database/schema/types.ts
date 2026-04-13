// services/backend/src/database/schema/types.ts
// TypeScript types for JSONB structures used in Drizzle schemas

import { z } from "zod";
import { OrderAddressZ } from "../../schemas/common.zod.js";

// ── Location ─────────────────────────────────────────────────────────────────

export const OrderLocationJSONBZ = OrderAddressZ;
export type OrderLocationJSONB = z.infer<typeof OrderLocationJSONBZ>;

// ── Items ─────────────────────────────────────────────────────────────────────

export const OrderItemJSONBZ = z.object({
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  weightKg: z.number().nonnegative().nullable().optional(),
  dimensions: z
    .object({
      length: z.number().nonnegative().optional(),
      width: z.number().nonnegative().optional(),
      height: z.number().nonnegative().optional(),
    })
    .nullable()
    .optional(),
  description: z.string().max(500).nullable().optional(),
  value: z.number().nonnegative().nullable().optional(),
});
export type OrderItemJSONB = z.infer<typeof OrderItemJSONBZ>;

export const OrderMetadataJSONBZ = z.object({}).catchall(z.unknown());
export type OrderMetadataJSONB = z.infer<typeof OrderMetadataJSONBZ>;

// ── Pricing breakdown ─────────────────────────────────────────────────────────

export const OrderPricingJSONBZ = z.object({
  basePrice: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  distancePrice: z.number().nonnegative(),
  weightSurcharge: z.number().nonnegative(),
  platformFee: z.number().nonnegative(),
  specialHandlingFee: z.number().nonnegative(),
  subtotalBeforeTax: z.number().nonnegative(),
  gstAmount: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  currency: z.string().optional(),
  discountPct: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
});
export type OrderPricingJSONB = z.infer<typeof OrderPricingJSONBZ>;

// ── Scheduling ────────────────────────────────────────────────────────────────

export const OrderScheduleJSONBZ = z.object({
  pickupAt: z.iso.datetime().nullable().optional(),
  deliveryAt: z.iso.datetime().nullable().optional(),
});
export type OrderScheduleJSONB = z.infer<typeof OrderScheduleJSONBZ>;

export const OrderActualJSONBZ = z.object({
  pickupAt: z.iso.datetime().nullable().optional(),
  deliveryAt: z.iso.datetime().nullable().optional(),
});
export type OrderActualJSONB = z.infer<typeof OrderActualJSONBZ>;

// ── Package metadata ──────────────────────────────────────────────────────────

export const OrderPackageJSONBZ = z.object({
  description: z.string().nullable().optional(),
  specialInstructions: z.string().nullable().optional(),
  declaredValue: z.number().nonnegative().nullable().optional(),
  notifyRecipientSms: z.boolean().optional().default(false),
});
export type OrderPackageJSONB = z.infer<typeof OrderPackageJSONBZ>;

// ── Master data snapshot (denormalized at order creation) ─────────────────────

export const OrderSnapshotJSONBZ = z.object({
  deliveryType: z.object({
    id: z.number(),
    name: z.string(),
    displayName: z.string(),
  }),
  vehicleCategory: z.object({
    id: z.number(),
    name: z.string(),
    displayName: z.string(),
    maxWeightKg: z.number().nullable().optional(),
  }),
  weightTier: z
    .object({
      id: z.number(),
      name: z.string(),
      minWeightKg: z.number(),
      maxWeightKg: z.number(),
      additionalCharge: z.number(),
    })
    .nullable()
    .optional(),
  packageType: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  paymentMethod: z.object({
    id: z.number(),
    name: z.string(),
  }),
});
export type OrderSnapshotJSONB = z.infer<typeof OrderSnapshotJSONBZ>;

// ── Assignment timeline ───────────────────────────────────────────────────────

export const AssignmentTimelineJSONBZ = z.object({
  acceptedAt: z.iso.datetime().nullable().optional(),
  rejectedAt: z.iso.datetime().nullable().optional(),
});
export type AssignmentTimelineJSONB = z.infer<typeof AssignmentTimelineJSONBZ>;
