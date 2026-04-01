// services/backend/src/database/schema/types.ts
// TypeScript types for JSONB structures used in Drizzle schemas

import { z } from "zod";
import { OrderAddressZ } from "../../schemas/common.zod.js";

// JSONB structure schemas + types
export const OrderLocationJSONBZ = OrderAddressZ;
export type OrderLocationJSONB = z.infer<typeof OrderLocationJSONBZ>;

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

export const OrderMetadataJSONBZ = z
  .object({})
  .catchall(z.unknown());
export type OrderMetadataJSONB = z.infer<typeof OrderMetadataJSONBZ>;
