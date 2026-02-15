// services/backend/src/types/orders.ts
import type { FareBreakdown } from "../modules/orders/orders.zod.js";

export interface FareCalculationResult {
  success: boolean;
  fare_breakdown?: FareBreakdown;
  error?: string;
}

export interface OrderCreateResult {
  success: boolean;
  order?: any; // order JSON returned from DB function (kept generic for now)
  error?: string;
}

// Minimal shape for created order returned by `createOrder` service
export type CreatedOrder = {
  orderId?: number;
  orderUuid?: string;
  orderNumber?: string;
  pricing?: { totalPrice?: number } & Record<string, unknown>;
  [k: string]: unknown;
};
