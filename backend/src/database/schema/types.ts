// services/backend/src/database/schema/types.ts
// TypeScript types for JSONB structures used in Drizzle schemas

import { z } from "zod";
import { CoordinatesZ, OrderAddressZ } from "../../schemas/common.zod.js";

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

// ── Delivery attempt (RTO flow) ───────────────────────────────────────────────

export const DeliveryAttemptJSONBZ = z.object({
  arrivedAt: z.iso.datetime(),
  undeliverableAt: z.iso.datetime().optional(),
  returnStartedAt: z.iso.datetime().optional(),
  returnedAt: z.iso.datetime().optional(),
  driverNote: z.string().min(1).optional(),
  photoUrl: z.string().url().optional(),
  gps: CoordinatesZ.optional(),
});
export type DeliveryAttemptJSONB = z.infer<typeof DeliveryAttemptJSONBZ>;

// ── Location meta (speed, bearing, accuracy for dead reckoning) ───────────────

export const LocationMetaJSONBZ = z.object({
  speed: z.number().nonnegative().nullable(),
  bearing: z.number().min(0).max(360).nullable(),
  accuracy: z.number().nonnegative().nullable(),
});
export type LocationMetaJSONB = z.infer<typeof LocationMetaJSONBZ>;

// ── Onboarding (profiles) ───────────────────────────────────────────────────

export const OnboardingJSONBZ = z.object({
  status: z.enum(["incomplete", "pending_review", "approved", "rejected"]),
  stepsCompleted: z.array(z.string()),
  submittedAt: z.iso.datetime().optional(),
  approvedAt: z.iso.datetime().optional(),
  rejectedReason: z.string().optional(),
});
export type OnboardingJSONB = z.infer<typeof OnboardingJSONBZ>;

// ── Business profile (profiles.business_meta) ───────────────────────────────

export const BusinessMetaJSONBZ = z.object({
  businessName: z.string().min(1),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  businessType: z.string().optional(),
  website: z.string().optional(),
  monthlyVolume: z.enum(["0-100", "100-500", "500-2000", "2000+"]).optional(),
});
export type BusinessMetaJSONB = z.infer<typeof BusinessMetaJSONBZ>;

// ── Courier vehicle / KYC (courier_status) ────────────────────────────────────

export const VehicleJSONBZ = z.object({
  vehicleNumber: z.string().min(1),
  model: z.string().optional(),
  year: z.number().int().optional(),
  insuranceExpiry: z.string().optional(),
  registrationDocumentUrl: z.string().optional(),
});
export type VehicleJSONB = z.infer<typeof VehicleJSONBZ>;

const DocMetaJSONBZ = z.object({
  url: z.string(),
  number: z.string().optional(),
  expiresAt: z.iso.datetime().optional(),
  verifiedAt: z.iso.datetime().optional(),
});

export const KycJSONBZ = z.object({
  license: DocMetaJSONBZ,
  insurance: DocMetaJSONBZ,
  vehicleReg: DocMetaJSONBZ,
});
export type KycJSONB = z.infer<typeof KycJSONBZ>;

// ── Proof of delivery (orders.requests.pod) ───────────────────────────────────

export const PodJSONBZ = z.object({
  recipientName: z.string().optional(),
  signatureUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  deliveryNotes: z.string().optional(),
  deliveredAt: z.iso.datetime(),
});
export type PodJSONB = z.infer<typeof PodJSONBZ>;

// ── Post-delivery rating (orders.requests.rating) ────────────────────────────

export const RatingJSONBZ = z.object({
  value: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  isAnonymous: z.boolean(),
  comment: z.string().optional(),
  customerId: z.number().int().positive(),
  createdAt: z.iso.datetime(),
});
export type RatingJSONB = z.infer<typeof RatingJSONBZ>;

// ── Delivery type capability matrix (delivery_types.capabilities) ─────────────

export const DeliveryTypeCapabilityEntryJSONBZ = z.object({
  vehicleCategoryId: z.number().int().positive(),
  weightTierId: z.number().int().positive(),
  baseRateOverride: z.number().optional(),
  perKmRateOverride: z.number().optional(),
});
export type DeliveryTypeCapabilityEntryJSONB = z.infer<
  typeof DeliveryTypeCapabilityEntryJSONBZ
>;

export const DeliveryTypeCapabilitiesJSONBZ = z.array(
  DeliveryTypeCapabilityEntryJSONBZ,
);
export type DeliveryTypeCapabilitiesJSONB = z.infer<
  typeof DeliveryTypeCapabilitiesJSONBZ
>;
