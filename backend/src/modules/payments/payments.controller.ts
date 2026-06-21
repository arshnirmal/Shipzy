// services/backend/src/modules/payments/payments.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import {
  errorResponse,
  successResponse,
} from "../../utils/response.util.js";
import paymentsService from "./payments.service.js";
import type {
  CreatePaymentOrderRequest,
  VerifyPaymentRequest,
  GenerateQRRequest,
  RefundRequest,
  PaymentParams,
  OrderPaymentParams,
  DriverEarningsQuery,
  DriverPayoutsQuery,
} from "./payments.zod.js";

class PaymentsController {
  /**
   * POST /api/v1/payments/create-order
   * Create a Razorpay order for prepaid checkout
   */
  async createPaymentOrder(
    request: FastifyRequest<{ Body: CreatePaymentOrderRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.body;
      const result = await paymentsService.initiatePayment(
        orderId,
        request.user!.userId,
      );

      logger.info({
        msg: "POST /api/v1/payments/create-order",
        orderId,
        providerOrderId: result.providerOrderId,
      });

      return successResponse(
        reply,
        result,
        "Payment order created successfully",
        201,
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/payments/verify
   * Verify payment after Razorpay Checkout completion
   */
  async verifyPayment(
    request: FastifyRequest<{ Body: VerifyPaymentRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = request.body;

      const result = await paymentsService.verifyPayment(
        orderId,
        request.user!.userId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );

      logger.info({
        msg: "POST /api/v1/payments/verify",
        orderId,
        verified: result.verified,
      });

      return successResponse(reply, result, "Payment verified successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/payments/generate-qr
   * Generate UPI QR code for collect-on-delivery
   */
  async generateQR(
    request: FastifyRequest<{ Body: GenerateQRRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.body;

      const result = await paymentsService.generateCollectionQR(
        orderId,
        request.user!.userId,
      );

      logger.info({
        msg: "POST /api/v1/payments/generate-qr",
        orderId,
        qrId: result.qrId,
      });

      return successResponse(
        reply,
        result,
        "QR code generated successfully",
        201,
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/payments/order/:orderId/status
   * Get payment status for an order
   */
  async getPaymentStatus(
    request: FastifyRequest<{ Params: OrderPaymentParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderId } = request.params;

      const result = await paymentsService.getPaymentStatusForCaller(
        orderId,
        request.user!,
      );

      return successResponse(
        reply,
        result,
        "Payment status retrieved successfully",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/payments/webhook/:provider
   * Provider webhook handler — no auth, verified via raw-body signature
   */
  async handleWebhook(
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const rawBody = (request as unknown as { rawBody?: string }).rawBody ?? "";
      const outcome = await paymentsService.processWebhook(
        request.params.provider,
        rawBody,
        request.headers as Record<string, string>,
      );
      return reply.status(outcome.statusCode).send({ status: outcome.status });
    } catch (error) {
      logger.error({
        msg: "Webhook processing error",
        error: (error as Error).message,
      });
      // Signature/validation failures are permanent (AppError 4xx) — return that
      // status so the provider does not retry. Unexpected errors are transient →
      // 500 so the provider retries (idempotency makes retries safe).
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ status: "error" });
      }
      return reply.status(500).send({ status: "error" });
    }
  }

  /**
   * POST /api/v1/payments/:transactionId/refund
   * Admin initiates a refund for a completed transaction
   */
  async refund(
    request: FastifyRequest<{ Params: PaymentParams; Body: RefundRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { transactionId } = request.params;
      const { reason } = request.body;
      const result = await paymentsService.refund(transactionId, reason);
      return successResponse(reply, result, "Refund processed successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/payments/driver/earnings
   * Get driver earnings summary
   */
  async getDriverEarnings(
    request: FastifyRequest<{ Querystring: DriverEarningsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const { period } = request.query;

      const result = await paymentsService.getDriverEarnings(userId, period);

      return successResponse(
        reply,
        result,
        "Earnings retrieved successfully",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/payments/driver/payouts
   * Get driver payout history
   */
  async getDriverPayouts(
    request: FastifyRequest<{ Querystring: DriverPayoutsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const { page, limit } = request.query;

      const result = await paymentsService.getDriverPayouts(
        userId,
        page,
        limit,
      );

      return successResponse(
        reply,
        result,
        "Payouts retrieved successfully",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new PaymentsController();
