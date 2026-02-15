// services/backend/src/modules/static/static.routes.ts
import { FastifyInstance } from "fastify";
import staticController from "./static.controller.js";
import {
  getDeliveryTypesSchema,
  getWeightTiersSchema,
  getVehicleCategoriesSchema,
  getPackageTypesSchema,
  getPaymentMethodsSchema,
  getCreateOrderDataSchema,
  getOrderStatusesSchema,
} from "./static.schema.js";

async function staticRoutes(fastify: FastifyInstance, options: any) {
  // Public routes - no authentication required for static data

  // GET /api/v1/static/delivery-types
  fastify.get(
    "/delivery-types",
    { schema: getDeliveryTypesSchema },
    staticController.getDeliveryTypes.bind(staticController),
  );

  // GET /api/v1/static/weight-tiers
  fastify.get(
    "/weight-tiers",
    { schema: getWeightTiersSchema },
    staticController.getWeightTiers.bind(staticController),
  );

  // GET /api/v1/static/vehicle-categories
  fastify.get(
    "/vehicle-categories",
    { schema: getVehicleCategoriesSchema },
    staticController.getVehicleCategories.bind(staticController),
  );

  // GET /api/v1/static/package-types
  fastify.get(
    "/package-types",
    { schema: getPackageTypesSchema },
    staticController.getPackageTypes.bind(staticController),
  );

  // GET /api/v1/static/payment-methods
  fastify.get(
    "/payment-methods",
    { schema: getPaymentMethodsSchema },
    staticController.getPaymentMethods.bind(staticController),
  );

  // GET /api/v1/static/create-order-data - All data needed for create order screen
  fastify.get(
    "/create-order-data",
    { schema: getCreateOrderDataSchema },
    staticController.getCreateOrderData.bind(staticController),
  );

  // GET /api/v1/static/order-statuses
  fastify.get(
    "/order-statuses",
    { schema: getOrderStatusesSchema },
    staticController.getOrderStatuses.bind(staticController),
  );
}

export default staticRoutes;
