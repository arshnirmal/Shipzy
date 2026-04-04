import type { z } from "zod";
import {
  PackageHandlingFeeDbZ,
  PricingConfigRowDbZ,
} from "../schemas/db.zod.js";

export type PricingConfigRow = z.infer<typeof PricingConfigRowDbZ>;
export type PackageHandlingFeeRow = z.infer<typeof PackageHandlingFeeDbZ>;

export { PackageHandlingFeeDbZ, PricingConfigRowDbZ };
