// services/backend/src/modules/orders/orders.routes.ts
import { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import ordersController from "./orders.controller.js";
import {
  acceptOrderSchema,
  calculateFareSchema,
  cancelOrderSchema,
  createOrderSchema,
  getAvailableOrdersSchema,
  getOrderByIdSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
  rateOrderSchema,
} from "./orders.schema.js";

async function ordersRoutes(fastify: FastifyInstance, options: any) {
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

  // GET /api/v1/orders - List user's orders (clients only)
  fastify.get(
    "/",
    {
      schema: listOrdersSchema,
      onRequest: [authorize("client")],
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
    { schema: getOrderByIdSchema },
    ordersController.getOrderById.bind(ordersController),
  );

  // POST /api/v1/orders/:id/cancel - Cancel order
  fastify.post(
    "/:id/cancel",
    { schema: cancelOrderSchema },
    ordersController.cancelOrder.bind(ordersController),
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

  // PUT /api/v1/orders/:id/status - Update order status (couriers only)
  fastify.put(
    "/:id/status",
    {
      schema: updateOrderStatusSchema,
      onRequest: [authorize("courier")],
    },
    ordersController.updateOrderStatus.bind(ordersController) as any,
  );

  // POST /api/v1/orders/:id/rate - Rate delivered order (clients only)
  fastify.post(
    "/:id/rate",
    {
      schema: rateOrderSchema,
      onRequest: [authorize("client")],
    },
    ordersController.rateOrder.bind(ordersController) as any,
  );
}

export default ordersRoutes;
