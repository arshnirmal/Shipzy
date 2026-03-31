// services/backend/src/types/orders.ts
import type { z } from "zod";
import {
  CreateOrderResponseZ,
  FareCalculationResultZ,
  OrderCreateResultZ,
} from "../modules/orders/orders.zod.js";

export type FareCalculationResult = z.infer<typeof FareCalculationResultZ>;
export type OrderCreateResult = z.infer<typeof OrderCreateResultZ>;
export type CreatedOrder = z.infer<typeof CreateOrderResponseZ>;
