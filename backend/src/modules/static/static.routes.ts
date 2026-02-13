// services/backend/src/modules/static/static.routes.ts
import { FastifyInstance } from "fastify";
import staticController from "./static.controller.js";

async function staticRoutes(fastify: FastifyInstance, options: any) {
  // Public routes - no authentication required for static data

  // GET /api/v1/static/delivery-types
  fastify.get(
    "/delivery-types",
    staticController.getDeliveryTypes.bind(staticController),
  );

  // GET /api/v1/static/weight-tiers
  fastify.get(
    "/weight-tiers",
    staticController.getWeightTiers.bind(staticController),
  );

  // GET /api/v1/static/vehicle-categories
  fastify.get(
    "/vehicle-categories",
    staticController.getVehicleCategories.bind(staticController),
  );

  // GET /api/v1/static/package-types
  fastify.get(
    "/package-types",
    staticController.getPackageTypes.bind(staticController),
  );

  // GET /api/v1/static/payment-methods
  fastify.get(
    "/payment-methods",
    staticController.getPaymentMethods.bind(staticController),
  );

  // GET /api/v1/static/create-order-data - All data needed for create order screen
  fastify.get(
    "/create-order-data",
    staticController.getCreateOrderData.bind(staticController),
  );

  // GET /api/v1/static/order-statuses
  fastify.get(
    "/order-statuses",
    staticController.getOrderStatuses.bind(staticController),
  );
}

export default staticRoutes;
