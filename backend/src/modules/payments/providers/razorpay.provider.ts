// services/backend/src/modules/payments/providers/razorpay.provider.ts
// Razorpay capability bundle — implements CollectionProvider, QRProvider,
// RefundProvider, PayoutProvider, and WebhookProvider capabilities.

import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../../../config/env.js";
import logger from "../../../config/logger.js";
import { AppError } from "../../../utils/error.util.js";
import type {
  CreatePaymentOrderParams,
  PaymentOrderResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  GenerateQRParams,
  QRCodeResult,
  RefundParams,
  RefundResult,
  PayoutParams,
  PayoutResult,
  BatchPayoutParams,
  BatchPayoutResult,
  PayoutStatusResult,
} from "../payment-provider.interface.js";
import type { ProviderCapabilities, WebhookEvent } from "../capabilities.js";

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

// Singleton Razorpay SDK client
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// ---------------------------------------------------------------------------
// Collection capability
// ---------------------------------------------------------------------------

/**
 * Create a Razorpay order for prepaid checkout.
 * The order_id is used to open Razorpay Checkout on the client side.
 */
async function createPaymentOrder(
  params: CreatePaymentOrderParams,
): Promise<PaymentOrderResult> {
  try {
    const order = (await razorpay.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes || {},
    })) as unknown as RazorpayOrder;

    logger.info({
      msg: "Razorpay order created",
      orderId: params.orderId,
      providerOrderId: order.id,
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
async function verifyPayment(
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
      const payment = await razorpay.payments.fetch(params.providerPaymentId);
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

// ---------------------------------------------------------------------------
// QR capability
// ---------------------------------------------------------------------------

/**
 * Generate a dynamic UPI QR code for collect-on-delivery.
 * Single-use, fixed-amount QR that expires after a configured window.
 */
async function generateQRCode(params: GenerateQRParams): Promise<QRCodeResult> {
  try {
    const closeBy = Math.floor(Date.now() / 1000) + params.expiryMinutes * 60;

    const qr = (await razorpay.qrCode.create({
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

// ---------------------------------------------------------------------------
// Refund capability
// ---------------------------------------------------------------------------

/**
 * Initiate a refund via Razorpay.
 */
async function initiateRefund(params: RefundParams): Promise<RefundResult> {
  try {
    const refund = (await razorpay.payments.refund(
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

// ---------------------------------------------------------------------------
// Payout capability
// ---------------------------------------------------------------------------

/**
 * Initiate a single payout to a driver via RazorpayX Payouts API.
 * Uses direct HTTP call since the razorpay npm package doesn't cover RazorpayX.
 */
async function initiatePayout(params: PayoutParams): Promise<PayoutResult> {
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
async function batchPayout(params: BatchPayoutParams): Promise<BatchPayoutResult> {
  const results: BatchPayoutResult["results"] = [];

  for (const payout of params.payouts) {
    try {
      const result = await initiatePayout(payout);
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
 * Get payout status from RazorpayX.
 */
async function getPayoutStatus(payoutId: string): Promise<PayoutStatusResult> {
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

// ---------------------------------------------------------------------------
// Webhook capability
// ---------------------------------------------------------------------------

/**
 * Verify the X-Razorpay-Signature and parse the raw webhook body into a
 * normalised WebhookEvent. Throws AppError(400) on missing/invalid signature.
 *
 * Verification is performed over the raw request string — NOT re-serialised JSON —
 * so the caller MUST pass the original body bytes as a string.
 */
async function verifyAndParse(
  rawBody: string,
  headers: Record<string, string>,
): Promise<WebhookEvent> {
  const signature = headers["x-razorpay-signature"];
  if (!signature) {
    throw new AppError("Missing X-Razorpay-Signature header", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new AppError("Invalid webhook signature", 400);
  }

  const payload = JSON.parse(rawBody) as any;
  const eventType = payload.event as string;
  // Razorpay sends a top-level event id; fall back to payment entity id
  const eventId: string =
    payload.id ??
    payload.payload?.payment?.entity?.id ??
    "";

  const paymentEntity = payload.payload?.payment?.entity;
  const qrEntity = payload.payload?.qr_code?.entity;
  const refundEntity = payload.payload?.refund?.entity;
  const payoutEntity = payload.payload?.payout?.entity;

  logger.info({
    msg: "Razorpay webhook received",
    event: eventType,
    eventId,
    paymentId: paymentEntity?.id,
    qrCodeId: qrEntity?.id,
  });

  switch (eventType) {
    case "payment.captured":
      return {
        handled: true,
        eventId,
        eventType,
        status: "captured",
        providerPaymentId: paymentEntity?.id,
        providerOrderId: paymentEntity?.order_id,
        amount: paymentEntity?.amount,
        vpa: paymentEntity?.vpa,
        raw: payload,
      };

    case "payment.failed":
      return {
        handled: true,
        eventId,
        eventType,
        status: "failed",
        providerPaymentId: paymentEntity?.id,
        providerOrderId: paymentEntity?.order_id,
        amount: paymentEntity?.amount,
        raw: payload,
      };

    case "qr_code.credited": {
      const qrPaymentEntity = payload.payload?.payment?.entity;
      return {
        handled: true,
        eventId,
        eventType,
        status: "qr_credited",
        qrCodeId: qrEntity?.id,
        providerPaymentId: qrPaymentEntity?.id,
        amount: qrPaymentEntity?.amount,
        vpa: qrPaymentEntity?.vpa,
        raw: payload,
      };
    }

    case "refund.processed":
      return {
        handled: true,
        eventId,
        eventType,
        status: "refunded",
        providerPaymentId: refundEntity?.payment_id,
        amount: refundEntity?.amount,
        raw: payload,
      };

    case "payout.processed":
      return {
        handled: true,
        eventId,
        eventType,
        status: "payout_processed",
        providerPayoutId: payoutEntity?.id,
        raw: payload,
      };

    case "payout.failed":
      return {
        handled: true,
        eventId,
        eventType,
        status: "payout_failed",
        providerPayoutId: payoutEntity?.id,
        raw: payload,
      };

    default:
      logger.debug({ msg: "Unhandled webhook event", eventType });
      return {
        handled: false,
        eventId,
        eventType,
        status: "captured" as WebhookEvent["status"],
        raw: payload,
      };
  }
}

// ---------------------------------------------------------------------------
// Exported capability bundle
// ---------------------------------------------------------------------------

export const razorpayProvider: ProviderCapabilities = {
  name: "razorpay",
  collection: { createPaymentOrder, verifyPayment },
  qr: { generateQRCode },
  refund: { initiateRefund },
  payout: { initiatePayout, batchPayout, getPayoutStatus },
  webhook: { verifyAndParse },
};

export default razorpayProvider;
