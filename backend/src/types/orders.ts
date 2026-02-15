// services/backend/src/types/orders.ts
import type { FareBreakdown } from "../schemas/common.zod.js";
import type { CreatedOrder as ZCreatedOrder } from "../modules/orders/orders.zod.js";

export interface FareCalculationResult {
  success: boolean;
  fare_breakdown?: FareBreakdown;
  error?: string;
}

export interface OrderCreateResult {
  success: boolean;
  order?: ZCreatedOrder | any; // order JSON returned from DB function (kept generic while DB return shape exists)
  error?: string;
}

// Re-export the Zod-inferred CreatedOrder type as the canonical CreatedOrder
export type CreatedOrder = ZCreatedOrder;
