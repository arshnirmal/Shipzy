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
        1, // default UPI payment method
        0, // amount will be fetched from order
      );

      logger.info({
        msg: "POST /api/v1/payments/create-order",
        orderId,
        razorpayOrderId: result.razorpayOrderId,
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

      const result = await paymentsService.generateCollectionQR(orderId);

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

      const result = await paymentsService.getPaymentStatus(orderId);

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
   * POST /api/v1/payments/webhook/razorpay
   * Razorpay webhook handler — no auth, verified via signature
   */
  async handleWebhook(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      await paymentsService.processWebhook(
        request.body,
        request.headers as Record<string, string>,
      );

      // Razorpay expects 200 OK
      return reply.status(200).send({ status: "ok" });
    } catch (error) {
      logger.error({
        msg: "Webhook processing error",
        error: (error as Error).message,
      });
      // Still return 200 to prevent Razorpay retries for signature failures
      return reply.status(200).send({ status: "error" });
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
