// services/backend/src/types/ratings.ts
// RatingRow is derived from the canonical Zod schema — single source of truth.
import { RatingRowDbZ } from "../schemas/db.zod.js";

export type RatingRow = import("zod").infer<typeof RatingRowDbZ>;
export { RatingRowDbZ };
