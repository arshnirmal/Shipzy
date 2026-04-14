// services/backend/src/modules/orders/orders.routes.ts
import { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import ordersController from "./orders.controller.js";
import {
  acceptOrderSchema,
  arriveSchema,
  calculateFareSchema,
  cancelOrderSchema,
  createOrderSchema,
  getAvailableOrdersSchema,
  getOrderByIdSchema,
  listOrdersSchema,
  proofOfDeliverySchema,
  returnSchema,
  returnedSchema,
  trackingSchema,
  undeliverableSchema,
  updateOrderStatusSchema,
} from "./orders.schema.js";

async function ordersRoutes(fastify: FastifyInstance, _options: unknown) {
  // All routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // POST /api/v1/orders/calculate-fare - Calculate fare (public)
  fastify.post(
    "/calculate-fare",
    { schema: calculateFareSchema },
    ordersController.calculateFare.bind(ordersController),
  );

  // POST /api/v1/orders - Create new order (clients only)
  fastify.post(
    "/",
    {
      schema: createOrderSchema,
      onRequest: [authorize("client")],
    },
    ordersController.createOrder.bind(ordersController) as any,
  );

  // GET /api/v1/orders - List user's orders (clients and business)
  fastify.get(
    "/",
    {
      schema: listOrdersSchema,
      onRequest: [authorize("client", "business")],
    },
    ordersController.listOrders.bind(ordersController) as any,
  );

  // GET /api/v1/orders/available - Get available orders (couriers only)
  fastify.get(
    "/available",
    {
      schema: getAvailableOrdersSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.getAvailableOrders.bind(ordersController) as any,
  );

  // GET /api/v1/orders/:id - Get order details
  fastify.get(
    "/:id",
    {
      schema: getOrderByIdSchema,
      onRequest: [authorize("client", "courier", "business")],
    },
    ordersController.getOrderById.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/cancel - Cancel order (clients and business)
  fastify.post(
    "/:id/cancel",
    {
      schema: cancelOrderSchema,
      onRequest: [authorize("client", "business")],
    },
    ordersController.cancelOrder.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/accept - Accept order (couriers only)
  fastify.post(
    "/:id/accept",
    {
      schema: acceptOrderSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.acceptOrder.bind(ordersController) as any,
  );

  // PATCH /api/v1/orders/:id/status - Update order status (couriers only)
  fastify.patch(
    "/:id/status",
    {
      schema: updateOrderStatusSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.updateOrderStatus.bind(ordersController) as any,
  );

  // ============ DRIVER ORDER ACTIONS ============

  // POST /api/v1/orders/:id/arrive - Record arrival at delivery (couriers only)
  fastify.post(
    "/:id/arrive",
    {
      schema: arriveSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.arriveAtDelivery.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/undeliverable - Mark order undeliverable (couriers only)
  fastify.post(
    "/:id/undeliverable",
    {
      schema: undeliverableSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.markUndeliverable.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/return - Start RTO return (couriers only)
  fastify.post(
    "/:id/return",
    {
      schema: returnSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.startReturn.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/returned - Confirm order returned (couriers only)
  fastify.post(
    "/:id/returned",
    {
      schema: returnedSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.confirmReturned.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/proof-of-delivery - Submit POD (couriers only)
  fastify.post(
    "/:id/proof-of-delivery",
    {
      schema: proofOfDeliverySchema,
      onRequest: [authorize("courier")],
    },
    ordersController.submitProofOfDelivery.bind(ordersController) as any,
  );

  // GET /api/v1/orders/:id/tracking - Get live tracking (clients, couriers, admins)
  fastify.get(
    "/:id/tracking",
    {
      schema: trackingSchema,
      onRequest: [authorize("client", "courier", "admin")],
    },
    ordersController.getOrderTracking.bind(ordersController) as any,
  );

  // Rating endpoint removed — use POST /api/v1/ratings/orders/:orderId (canonical path)
}

export default ordersRoutes;
