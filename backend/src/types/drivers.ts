// services/backend/src/types/drivers.ts
import type { z } from "zod";
import {
  CourierAssignmentDbZ,
  CourierAvailabilityDbZ,
  CourierDbZ,
  CourierLocationDbZ,
  EarningsSummaryDbZ,
  TripHistoryRowDbZ,
} from "../schemas/db.zod.js";

export type DbCourier = z.infer<typeof CourierDbZ>;
export type CourierAvailabilityResult = z.infer<typeof CourierAvailabilityDbZ>;
export type CourierLocationResult = z.infer<typeof CourierLocationDbZ>;
export type EarningsSummaryRow = z.infer<typeof EarningsSummaryDbZ>;
export type CourierAssignmentRow = z.infer<typeof CourierAssignmentDbZ>;
export type TripHistoryRow = z.infer<typeof TripHistoryRowDbZ>;

export {
  CourierAssignmentDbZ,
  CourierAvailabilityDbZ,
  CourierDbZ,
  CourierLocationDbZ,
  EarningsSummaryDbZ,
  TripHistoryRowDbZ,
};
