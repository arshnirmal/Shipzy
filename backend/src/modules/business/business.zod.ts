import { z } from "zod";
import {
  OrderLocationJSONBZ,
  OrderPackageJSONBZ,
  OrderItemJSONBZ,
  OrderPricingJSONBZ,
} from "../../database/schema/types.js";
import { BaseQueryZ } from "../../schemas/common.zod.js";

// ============================================================================
// DRAFTS
// ============================================================================

export const DraftStateZ = z.enum(["incomplete", "ready", "submitted"]);

export const DraftFulfillmentZ = z
  .object({
    deliveryTypeId: z.number().int().positive(),
    vehicleCategoryId: z.number().int().positive(),
    weightTierId: z.number().int().positive().nullable().optional(),
    packageTypeId: z.number().int().positive().nullable().optional(),
    paymentMethodId: z.number().int().positive(),
  })
  .strict();

export const DraftResponseZ = z.object({
  draftId: z.number().int().positive(),
  draftUuid: z.string().uuid(),
  name: z.string().nullable().optional(),
  state: DraftStateZ,
  fulfillment: DraftFulfillmentZ.nullable().optional(),
  pickupLocation: OrderLocationJSONBZ.nullable().optional(),
  deliveryLocation: OrderLocationJSONBZ.nullable().optional(),
  items: z.array(OrderItemJSONBZ),
  package: OrderPackageJSONBZ.nullable().optional(),
  pricing: OrderPricingJSONBZ.nullable().optional(),
  couponCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  templateId: z.number().int().positive().nullable().optional(),
  submittedOrderId: z.number().int().positive().nullable().optional(),
  submittedAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();

export const DraftCreateRequestZ = z.object({
  name: z.string().max(200).optional(),
  fulfillment: DraftFulfillmentZ.optional(),
  pickupLocation: OrderLocationJSONBZ.optional(),
  deliveryLocation: OrderLocationJSONBZ.optional(),
  items: z.array(OrderItemJSONBZ).optional(),
  package: OrderPackageJSONBZ.optional(),
  pricing: OrderPricingJSONBZ.optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().optional(),
  templateId: z.number().int().positive().optional(),
}).strict();

export type DraftCreateRequest = z.infer<typeof DraftCreateRequestZ>;

export const DraftUpdateRequestZ = DraftCreateRequestZ;
export type DraftUpdateRequest = z.infer<typeof DraftUpdateRequestZ>;

export const ListDraftsQueryZ = BaseQueryZ.extend({
  state: DraftStateZ.optional(),
}).strict();
export type ListDraftsQuery = z.infer<typeof ListDraftsQueryZ>;

// ============================================================================
// TEMPLATES
// ============================================================================

export const TemplateResponseZ = z.object({
  templateId: z.number().int().positive(),
  templateUuid: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  fulfillment: DraftFulfillmentZ.nullable().optional(),
  pickupLocation: OrderLocationJSONBZ.nullable().optional(),
  deliveryLocation: OrderLocationJSONBZ.nullable().optional(),
  items: z.array(OrderItemJSONBZ),
  package: OrderPackageJSONBZ.nullable().optional(),
  useCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).strict();

export const TemplateCreateRequestZ = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  fulfillment: DraftFulfillmentZ.optional(),
  pickupLocation: OrderLocationJSONBZ.optional(),
  deliveryLocation: OrderLocationJSONBZ.optional(),
  items: z.array(OrderItemJSONBZ).optional(),
  package: OrderPackageJSONBZ.optional(),
}).strict();
export type TemplateCreateRequest = z.infer<typeof TemplateCreateRequestZ>;

export const TemplateUpdateRequestZ = TemplateCreateRequestZ.partial();
export type TemplateUpdateRequest = z.infer<typeof TemplateUpdateRequestZ>;

export const ListTemplatesQueryZ = BaseQueryZ.extend({
  isActive: z.coerce.boolean().optional().default(true),
}).strict();
export type ListTemplatesQuery = z.infer<typeof ListTemplatesQueryZ>;

// ============================================================================
// BULK ORDERS
// ============================================================================

import { CreateOrderRequestZ } from "../orders/orders.zod.js";

export const BulkOrderCreateRequestZ = z.object({
  orders: z.array(CreateOrderRequestZ).min(1).max(50),
}).strict();
export type BulkOrderCreateRequest = z.infer<typeof BulkOrderCreateRequestZ>;

export const BulkOrderResultZ = z.object({
  bulk: z.object({
    requested: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    results: z.array(
      z.object({
        index: z.number().int().nonnegative(),
        success: z.boolean(),
        orderId: z.number().int().positive().optional(),
        error: z.string().optional(),
      }).strict()
    ),
  }).strict()
}).strict();
export type BulkOrderResult = z.infer<typeof BulkOrderResultZ>;

// ============================================================================
// EXPORT QUERY
// ============================================================================

export const ExportOrdersQueryZ = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  format: z.literal("csv").optional().default("csv"),
}).strict();
export type ExportOrdersQuery = z.infer<typeof ExportOrdersQueryZ>;

// ============================================================================
// ANALYTICS
// ============================================================================

export const AnalyticsQueryZ = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
}).strict();
export type AnalyticsQuery = z.infer<typeof AnalyticsQueryZ>;

export const AnalyticsResponseZ = z.object({
  analytics: z.object({
    period: z.object({
      from: z.string(),
      to: z.string()
    }),
    orders: z.object({
      total: z.number().int().nonnegative(),
      delivered: z.number().int().nonnegative(),
      cancelled: z.number().int().nonnegative(),
      active: z.number().int().nonnegative(),
      successRate: z.number().nonnegative()
    }),
    spend: z.object({
      total: z.number().nonnegative(),
      average: z.number().nonnegative(),
      currency: z.string()
    }),
    delivery: z.object({
      avgDurationMins: z.number().nonnegative()
    })
  }).strict()
}).strict();
export type AnalyticsResponse = z.infer<typeof AnalyticsResponseZ>;
