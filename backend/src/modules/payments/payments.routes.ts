// services/backend/src/modules/payments/payments.routes.ts
import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import paymentsController from "./payments.controller.js";
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  generateQRSchema,
  getPaymentStatusSchema,
  driverEarningsSchema,
  driverPayoutsSchema,
} from "./payments.schema.js";

async function paymentsRoutes(fastify: FastifyInstance, _options: unknown) {
  const asRouteHandler = (handler: unknown): RouteHandlerMethod => {
    return handler as RouteHandlerMethod;
  };

  // ─── Webhook (no auth — verified via signature) ─────────────────────────

  // POST /api/v1/payments/webhook/:provider
  // No auth — verified via provider signature on raw body
  fastify.post(
    "/webhook/:provider",
    { config: { rawBody: true } },
    asRouteHandler(paymentsController.handleWebhook.bind(paymentsController)),
  );

  // ─── Authenticated routes ───────────────────────────────────────────────

  // All routes below require authentication
  fastify.addHook("preHandler", fastify.authenticate);

  // POST /api/v1/payments/create-order — Business creates a Razorpay order for prepaid checkout
  fastify.post(
    "/create-order",
    {
      schema: createPaymentOrderSchema,
      preHandler: [authorize("client", "business")],
    },
    asRouteHandler(
      paymentsController.createPaymentOrder.bind(paymentsController),
    ),
  );

  // POST /api/v1/payments/verify — Business verifies payment after checkout
  fastify.post(
    "/verify",
    {
      schema: verifyPaymentSchema,
      preHandler: [authorize("client", "business")],
    },
    asRouteHandler(
      paymentsController.verifyPayment.bind(paymentsController),
    ),
  );

  // POST /api/v1/payments/generate-qr — Driver generates UPI QR for collect-on-delivery
  fastify.post(
    "/generate-qr",
    {
      schema: generateQRSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(
      paymentsController.generateQR.bind(paymentsController),
    ),
  );

  // GET /api/v1/payments/order/:orderId/status — Get payment status for an order
  fastify.get(
    "/order/:orderId/status",
    {
      schema: getPaymentStatusSchema,
      preHandler: [authorize("client", "courier", "business", "admin")],
    },
    asRouteHandler(
      paymentsController.getPaymentStatus.bind(paymentsController),
    ),
  );

  // GET /api/v1/payments/driver/earnings — Driver's earnings summary
  fastify.get(
    "/driver/earnings",
    {
      schema: driverEarningsSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(
      paymentsController.getDriverEarnings.bind(paymentsController),
    ),
  );

  // GET /api/v1/payments/driver/payouts — Driver's payout history
  fastify.get(
    "/driver/payouts",
    {
      schema: driverPayoutsSchema,
      preHandler: [authorize("courier")],
    },
    asRouteHandler(
      paymentsController.getDriverPayouts.bind(paymentsController),
    ),
  );
}

export default paymentsRoutes;
