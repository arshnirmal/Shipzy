// services/backend/src/schemas/index.ts

// Common shared schemas
export * from "./common.zod.js";

// Module-specific schemas
export * from "../modules/users/users.zod.js";
export * from "../modules/orders/orders.zod.js";
export * from "../modules/drivers/drivers.zod.js";
export * from "../modules/addresses/addresses.zod.js";
export * from "../modules/ratings/ratings.zod.js";
export * from "../modules/static/static.zod.js";
export * from "../modules/auth/auth.zod.js";
