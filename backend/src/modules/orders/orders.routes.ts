// services/backend/src/modules/orders/orders.routes.ts
import { FastifyInstance, RouteHandlerMethod } from "fastify";
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
  const asRouteHandler = (handler: unknown): RouteHandlerMethod => {
    return handler as RouteHandlerMethod;
  };

  // All routes require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // POST /api/v1/orders/calculate-fare - Calculate fare (authenticated)
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
      preHandler: [authorize("client")],
    },
    asRouteHandler(ordersController.createOrder.bind(ordersController)),
  );

  // GET /api/v1/orders - List user's orders (clients and business)
  fastify.get(
    "/",
    {
      schema: listOrdersSchema,
      preHandler: [authorize("client", "business")],
    },
    asRouteHandler(ordersController.listOrders.bind(ordersController)),
  );

  // GET /api/v1/orders/available - Get available orders (couriers only)
  fastify.get(
    "/available",
    {
      schema: getAvailableOrdersSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.getAvailableOrders.bind(ordersController)),
  );

  // GET /api/v1/orders/:id - Get order details
  fastify.get(
    "/:id",
    {
      schema: getOrderByIdSchema,
      preHandler: [authorize("client", "courier", "business")],
    },
    asRouteHandler(ordersController.getOrderById.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/cancel - Cancel order (clients and business)
  fastify.post(
    "/:id/cancel",
    {
      schema: cancelOrderSchema,
      preHandler: [authorize("client", "business")],
    },
    asRouteHandler(ordersController.cancelOrder.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/accept - Accept order (couriers only)
  fastify.post(
    "/:id/accept",
    {
      schema: acceptOrderSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.acceptOrder.bind(ordersController)),
  );

  // PATCH /api/v1/orders/:id/status - Update order status (couriers only)
  fastify.patch(
    "/:id/status",
    {
      schema: updateOrderStatusSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.updateOrderStatus.bind(ordersController)),
  );

  // ============ DRIVER ORDER ACTIONS ============

  // POST /api/v1/orders/:id/arrive - Record arrival at delivery (couriers only)
  fastify.post(
    "/:id/arrive",
    {
      schema: arriveSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.arriveAtDelivery.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/undeliverable - Mark order undeliverable (couriers only)
  fastify.post(
    "/:id/undeliverable",
    {
      schema: undeliverableSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.markUndeliverable.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/return - Start RTO return (couriers only)
  fastify.post(
    "/:id/return",
    {
      schema: returnSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.startReturn.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/returned - Confirm order returned (couriers only)
  fastify.post(
    "/:id/returned",
    {
      schema: returnedSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(ordersController.confirmReturned.bind(ordersController)),
  );

  // POST /api/v1/orders/:id/proof-of-delivery - Submit POD (couriers only)
  fastify.post(
    "/:id/proof-of-delivery",
    {
      schema: proofOfDeliverySchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(
      ordersController.submitProofOfDelivery.bind(ordersController),
    ),
  );

  // GET /api/v1/orders/:id/tracking - Get live tracking (clients, couriers, admins)
  fastify.get(
    "/:id/tracking",
    {
      schema: trackingSchema,
      preHandler: [authorize("client", "courier", "admin")],
    },
    asRouteHandler(ordersController.getOrderTracking.bind(ordersController)),
  );

  // Rating endpoint removed — use POST /api/v1/ratings/orders/:orderId (canonical path)
}

export default ordersRoutes;
