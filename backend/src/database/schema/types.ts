// services/backend/src/database/schema/types.ts
// TypeScript types for JSONB structures used in Drizzle schemas

import type { z } from "zod";
import type { OrderAddressZ } from "../../schemas/common.zod.js";

// JSONB structure types
export type OrderLocationJSONB = z.infer<typeof OrderAddressZ>;

export type OrderItemJSONB = {
  itemName: string;
  quantity: number;
  weightKg?: number | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  } | null;
  description?: string | null;
  value?: number | null;
};

export type OrderLabelsJSONB = string[]; // Array of label names: ["new", "fastest", "popular"]

export type OrderMetadataJSONB = {
  couponCode?: string | null;
  notifyRecipientSms?: boolean;
  specialInstructions?: string | null;
  [key: string]: unknown;
};
