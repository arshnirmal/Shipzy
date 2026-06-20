// services/backend/src/modules/payments/providers/razorpay.provider.ts
// Razorpay payment provider implementation

import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../../../config/env.js";
import logger from "../../../config/logger.js";
import type {
  PaymentProvider,
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  GenerateQRParams,
  QRCodeResult,
  WebhookResult,
  RefundParams,
  RefundResult,
  PayoutParams,
  PayoutResult,
  BatchPayoutParams,
  BatchPayoutResult,
  PayoutStatusResult,
} from "../payment-provider.interface.js";

// Razorpay SDK types are loosely typed, define minimal interfaces for clarity
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayQRCode {
  id: string;
  image_url: string;
  close_by: number;
}

interface RazorpayRefund {
  id: string;
  amount: number;
  status: string;
}

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  /**
   * Create a Razorpay order for prepaid checkout
   * The order_id is used to open Razorpay Checkout on the client side
   */
  async createPaymentOrder(
    params: CreatePaymentOrderParams,
  ): Promise<PaymentOrderResult> {
    try {
      const order = (await this.razorpay.orders.create({
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes || {},
      })) as unknown as RazorpayOrder;

      logger.info({
        msg: "Razorpay order created",
        orderId: params.orderId,
        razorpayOrderId: order.id,
        amount: order.amount,
      });

      return {
        success: true,
        providerOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      };
    } catch (error) {
      logger.error({
        msg: "Failed to create Razorpay order",
        orderId: params.orderId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Verify payment signature after Razorpay Checkout completion.
   * Uses HMAC SHA256 to validate: razorpay_order_id|razorpay_payment_id
   */
  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<PaymentVerificationResult> {
    const body = `${params.providerOrderId}|${params.providerPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");

    const verified = expectedSignature === params.signature;

    if (verified) {
      // Fetch payment details to get method info
      try {
        const payment = await this.razorpay.payments.fetch(
          params.providerPaymentId,
        );
        return {
          verified: true,
          providerPaymentId: params.providerPaymentId,
          providerOrderId: params.providerOrderId,
          method: (payment as any).method,
          vpa: (payment as any).vpa,
        };
      } catch {
        // If fetch fails, still return verified — we have the signature
        return {
          verified: true,
          providerPaymentId: params.providerPaymentId,
          providerOrderId: params.providerOrderId,
        };
      }
    }

    logger.warn({
      msg: "Payment signature verification failed",
      providerOrderId: params.providerOrderId,
    });

    return {
      verified: false,
      providerPaymentId: params.providerPaymentId,
      providerOrderId: params.providerOrderId,
    };
  }

  /**
   * Generate a dynamic UPI QR code for collect-on-delivery.
   * Single-use, fixed-amount QR that expires after a configured window.
   */
  async generateQRCode(params: GenerateQRParams): Promise<QRCodeResult> {
    try {
      const closeBy = Math.floor(Date.now() / 1000) + params.expiryMinutes * 60;

      const qr = (await this.razorpay.qrCode.create({
        type: "upi_qr",
        name: `Order #${params.orderId}`,
        usage: "single_use",
        fixed_amount: true,
        payment_amount: params.amount,
        description: params.description,
        close_by: closeBy,
        notes: params.notes || {},
      })) as unknown as RazorpayQRCode;

      logger.info({
        msg: "Razorpay QR code created",
        orderId: params.orderId,
        qrId: qr.id,
        expiryMinutes: params.expiryMinutes,
      });

      return {
        success: true,
        qrId: qr.id,
        imageUrl: qr.image_url,
        expiresAt: new Date(closeBy * 1000),
      };
    } catch (error) {
      logger.error({
        msg: "Failed to create Razorpay QR code",
        orderId: params.orderId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Validate and parse Razorpay webhook payload.
   * Verifies X-Razorpay-Signature header using HMAC SHA256.
   *
   * Handles events:
   * - payment.captured → prepaid payment confirmed
   * - payment.failed → payment failed
   * - qr_code.credited → collect-on-delivery QR payment received
   * - refund.processed → refund completed
   */
  async handleWebhook(
    body: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult> {
    const signature = headers["x-razorpay-signature"];
    if (!signature) {
      throw new Error("Missing X-Razorpay-Signature header");
    }

    // Verify webhook signature
    const bodyString =
      typeof body === "string" ? body : JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(bodyString)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid webhook signature");
    }

    const payload = typeof body === "string" ? JSON.parse(body) : body;
    const event = (payload as any).event as string;
    const entity = (payload as any).payload?.payment?.entity;
    const qrEntity = (payload as any).payload?.qr_code?.entity;

    logger.info({
      msg: "Razorpay webhook received",
      event,
      paymentId: entity?.id,
      qrCodeId: qrEntity?.id,
    });

    switch (event) {
      case "payment.captured":
        return {
          handled: true,
          event,
          providerPaymentId: entity.id,
          providerOrderId: entity.order_id,
          status: "captured",
          amount: entity.amount,
          method: entity.method,
          vpa: entity.vpa,
        };

      case "payment.failed":
        return {
          handled: true,
          event,
          providerPaymentId: entity.id,
          providerOrderId: entity.order_id,
          status: "failed",
          amount: entity.amount,
        };

      case "qr_code.credited": {
        // QR payment — the payment entity is nested under qr_code payload
        const qrPayment = (payload as any).payload?.payment?.entity;
        return {
          handled: true,
          event,
          qrCodeId: qrEntity?.id,
          providerPaymentId: qrPayment?.id,
          status: "qr_credited",
          amount: qrPayment?.amount,
          method: qrPayment?.method,
          vpa: qrPayment?.vpa,
        };
      }

      case "refund.processed": {
        const refundEntity = (payload as any).payload?.refund?.entity;
        return {
          handled: true,
          event,
          providerPaymentId: refundEntity?.payment_id,
          status: "refunded",
          amount: refundEntity?.amount,
        };
      }

      default:
        logger.debug({ msg: "Unhandled webhook event", event });
        return {
          handled: false,
          event,
          status: "captured",
        };
    }
  }

  /**
   * Initiate a refund via Razorpay
   */
  async initiateRefund(params: RefundParams): Promise<RefundResult> {
    try {
      const refund = (await this.razorpay.payments.refund(
        params.providerPaymentId,
        {
          amount: params.amount,
          notes: {
            reason: params.reason,
            ...(params.notes || {}),
          },
        },
      )) as unknown as RazorpayRefund;

      logger.info({
        msg: "Razorpay refund initiated",
        paymentId: params.providerPaymentId,
        refundId: refund.id,
        amount: refund.amount,
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      logger.error({
        msg: "Failed to initiate Razorpay refund",
        paymentId: params.providerPaymentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Initiate a single payout to a driver via RazorpayX Payouts API.
   * Uses direct HTTP call since the razorpay npm package doesn't cover RazorpayX.
   */
  async initiatePayout(params: PayoutParams): Promise<PayoutResult> {
    try {
      const credentials = Buffer.from(
        `${config.razorpay.keyId}:${config.razorpay.keySecret}`,
      ).toString("base64");

      const response = await fetch("https://api.razorpay.com/v1/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          account_number: config.razorpay.accountNumber,
          fund_account: {
            account_type: "vpa",
            vpa: {
              address: params.upiId,
            },
            contact: {
              name: `Driver ${params.driverId}`,
              type: "vendor",
              reference_id: `driver_${params.driverId}`,
            },
          },
          amount: params.amount,
          currency: "INR",
          mode: "UPI",
          purpose: "payout",
          queue_if_low_balance: true,
          reference_id: params.referenceId,
          narration: params.narration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error({
          msg: "RazorpayX payout failed",
          driverId: params.driverId,
          error: data,
        });
        return {
          success: false,
          payoutId: "",
          status: "failed",
        };
      }

      logger.info({
        msg: "RazorpayX payout initiated",
        driverId: params.driverId,
        payoutId: (data as any).id,
        amount: params.amount,
      });

      return {
        success: true,
        payoutId: (data as any).id,
        status: (data as any).status,
        utr: (data as any).utr,
      };
    } catch (error) {
      logger.error({
        msg: "RazorpayX payout error",
        driverId: params.driverId,
        error: (error as Error).message,
      });
      return {
        success: false,
        payoutId: "",
        status: "failed",
      };
    }
  }

  /**
   * Process batch payouts for multiple drivers.
   * Calls initiatePayout sequentially to avoid overwhelming the API.
   */
  async batchPayout(params: BatchPayoutParams): Promise<BatchPayoutResult> {
    const results: BatchPayoutResult["results"] = [];

    for (const payout of params.payouts) {
      try {
        const result = await this.initiatePayout(payout);
        results.push({
          driverId: payout.driverId,
          success: result.success,
          payoutId: result.payoutId,
        });
      } catch (error) {
        results.push({
          driverId: payout.driverId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return { results };
  }

  /**
   * Get payout status from RazorpayX
   */
  async getPayoutStatus(payoutId: string): Promise<PayoutStatusResult> {
    try {
      const credentials = Buffer.from(
        `${config.razorpay.keyId}:${config.razorpay.keySecret}`,
      ).toString("base64");

      const response = await fetch(
        `https://api.razorpay.com/v1/payouts/${payoutId}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      );

      const data = (await response.json()) as any;

      return {
        payoutId: data.id,
        status: data.status,
        utr: data.utr,
        completedAt: data.processed_at
          ? new Date(data.processed_at * 1000)
          : undefined,
        failureReason: data.failure_reason,
      };
    } catch (error) {
      logger.error({
        msg: "Failed to fetch payout status",
        payoutId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

// Singleton instance
export const razorpayProvider = new RazorpayProvider();
export default razorpayProvider;
