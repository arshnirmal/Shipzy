// src/modules/payments/payments.service.ts
// Payment orchestration service — coordinates between providers, DB, and order flow

import config from "../../config/env.js";
import logger from "../../config/logger.js";
import { AppError, NotFoundError } from "../../utils/error.util.js";
import registry from "./provider-registry.js";
import paymentsRepository from "./payments.repository.js";
import type {
  PaymentOrderResponse,
  PaymentVerifyResponse,
  QRCodeResponse,
  PaymentStatusResponse,
  RefundResponse,
  DriverEarningsResponse,
  DriverPayoutsResponse,
} from "./payments.zod.js";

class PaymentsService {
  /**
   * Initiate a prepaid payment order.
   * Creates a Razorpay order and records it in payments.transactions.
   */
  async initiatePayment(
    orderId: number,
    paymentMethodId: number,
    amount: number,
  ): Promise<PaymentOrderResponse> {
    const provider = registry.collection();

    // Create provider order (amount in paise)
    const amountPaise = Math.round(amount * 100);
    const result = await provider.createPaymentOrder({
      orderId,
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId: String(orderId) },
    });

    // Record transaction in DB
    const txn = await paymentsRepository.createTransaction([
      orderId,
      paymentMethodId,
      amount,
      "INR",
      null, // external_transaction_id (set after verification)
      "razorpay",
      null, // upi_vpa
      JSON.stringify({ providerOrderId: result.providerOrderId }),
    ]);

    // Store provider order id on the transaction
    const transactionId = txn?.transactionId;
    if (transactionId) {
      await paymentsRepository.setProviderOrderId(
        transactionId,
        result.providerOrderId,
        "prepaid",
      );
    }

    return {
      providerOrderId: result.providerOrderId,
      amount: amount,
      currency: "INR",
      publishableKey: config.razorpay.keyId,
      orderId,
    };
  }

  /**
   * Verify a prepaid payment after Razorpay Checkout completion.
   * Validates the signature, marks transaction as completed.
   */
  async verifyPayment(
    orderId: number,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<PaymentVerifyResponse> {
    const provider = registry.collection();

    const verification = await provider.verifyPayment({
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!verification.verified) {
      throw new AppError("Payment verification failed", 400);
    }

    // Find the transaction for this order
    const txnRow = await paymentsRepository.getTransactionByProviderOrder(
      razorpayOrderId,
    );

    if (!txnRow) {
      throw new NotFoundError("Transaction not found for this payment");
    }

    const transactionId = txnRow.transactionId;

    // Mark as completed
    await paymentsRepository.markCompleted(transactionId);

    // Update with Razorpay payment details
    await paymentsRepository.updatePaymentDetails(
      transactionId,
      razorpayPaymentId,
      verification.vpa || null,
    );

    logger.info({
      msg: "Payment verified and completed",
      orderId,
      transactionId,
      razorpayPaymentId,
    });

    return {
      verified: true,
      transactionId,
      paymentStatus: "completed",
      orderId,
    };
  }

  /**
   * Generate a UPI QR code for collect-on-delivery.
   * The driver calls this when ready to collect payment from the recipient.
   */
  async generateCollectionQR(
    orderId: number,
    paymentMethodId: number = 1,
  ): Promise<QRCodeResponse> {
    // Get order amount from existing transaction or order
    const existingTxn = await paymentsRepository.getPaymentByOrder(orderId);

    let amount: number;
    let transactionId: number;

    if (existingTxn && existingTxn.paymentStatus === "pending") {
      // Re-use existing pending transaction
      amount = Number(existingTxn.amount);
      transactionId = existingTxn.transactionId;
    } else {
      // Get the order amount to create a new transaction
      const orderRow = await paymentsRepository.getOrderAmount(orderId);
      if (!orderRow) {
        throw new NotFoundError("Order not found");
      }
      amount = Number(orderRow.totalPrice);

      // Create pending transaction
      const txnResult = await paymentsRepository.createTransaction([
        orderId,
        paymentMethodId,
        amount,
        "INR",
        null,
        "razorpay",
        null,
        JSON.stringify({ paymentMode: "collect_on_delivery" }),
      ]);
      transactionId = txnResult!.transactionId;
    }

    const provider = registry.qr();
    const amountPaise = Math.round(amount * 100);

    const qr = await provider.generateQRCode({
      orderId,
      amount: amountPaise,
      description: `Payment for Order #${orderId}`,
      expiryMinutes: config.payments.qrExpiryMinutes,
      notes: { orderId: String(orderId) },
    });

    // Store QR details on the transaction
    await paymentsRepository.updateQrDetails(
      transactionId,
      qr.qrId,
      qr.imageUrl,
      qr.expiresAt.toISOString(),
      "collect_on_delivery",
    );

    logger.info({
      msg: "QR code generated for collect-on-delivery",
      orderId,
      transactionId,
      qrId: qr.qrId,
    });

    return {
      qrId: qr.qrId,
      imageUrl: qr.imageUrl,
      amount,
      expiresAt: qr.expiresAt.toISOString(),
      orderId,
    };
  }

  /**
   * Get payment status for an order.
   */
  async getPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const txn = await paymentsRepository.getPaymentByOrder(orderId);
    const orderRow = await paymentsRepository.getOrderPaymentMode(orderId);
    const paymentMode = (orderRow?.paymentMode || "prepaid") as "prepaid" | "collect_on_delivery";

    if (!txn) {
      return {
        orderId,
        paymentMode,
        paymentStatus: "pending",
        amount: null,
        currency: null,
        paymentMethod: null,
        transactionId: null,
        externalTransactionId: null,
        paidAt: null,
        qrCodeId: null,
        qrImageUrl: null,
        qrExpiresAt: null,
      };
    }

    return {
      orderId,
      paymentMode,
      paymentStatus: txn.paymentStatus,
      amount: Number(txn.amount),
      currency: txn.currency || "INR",
      paymentMethod: txn.paymentMethod,
      transactionId: txn.transactionId,
      externalTransactionId: txn.externalTransactionId,
      paidAt: txn.paymentCompletedAt
        ? new Date(txn.paymentCompletedAt).toISOString()
        : null,
      qrCodeId: txn.qrCodeId || null,
      qrImageUrl: txn.qrImageUrl || null,
      qrExpiresAt: txn.qrExpiresAt
        ? new Date(txn.qrExpiresAt).toISOString()
        : null,
    };
  }

  /**
   * Process a provider webhook event.
   * Idempotent — safe to call multiple times for the same event.
   */
  async processWebhook(
    provider: string,
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<{ statusCode: number; status: string }> {
    const event = await registry.webhook(provider).verifyAndParse(rawBody, headers);

    if (!event.handled) {
      return { statusCode: 200, status: "ignored" };
    }

    switch (event.status) {
      case "captured": {
        // Prepaid payment confirmed — find transaction and mark complete
        if (event.providerOrderId) {
          const txnRow = await paymentsRepository.getTransactionByProviderOrder(
            event.providerOrderId,
          );
          if (txnRow) {
            const tid = txnRow.transactionId;
            // Idempotent — only update if still pending
            if (txnRow.status === "pending") {
              await paymentsRepository.markCompleted(tid);
              if (event.providerPaymentId) {
                await paymentsRepository.updatePaymentDetails(
                  tid,
                  event.providerPaymentId,
                  event.vpa || null,
                );
              }
            }
          }
        }
        break;
      }

      case "qr_credited": {
        // Collect-on-delivery QR payment received
        if (event.qrCodeId) {
          const txnRow = await paymentsRepository.getTransactionByQrCode(
            event.qrCodeId,
          );
          if (txnRow) {
            const tid = txnRow.transactionId;
            if (txnRow.status === "pending") {
              await paymentsRepository.markCompleted(tid);
              if (event.providerPaymentId) {
                await paymentsRepository.updatePaymentDetails(
                  tid,
                  event.providerPaymentId,
                  event.vpa || null,
                );
              }
            }
          }
        }
        break;
      }

      case "failed": {
        if (event.providerOrderId) {
          const txnRow = await paymentsRepository.getTransactionByProviderOrder(
            event.providerOrderId,
          );
          if (txnRow) {
            await paymentsRepository.markFailed(
              txnRow.transactionId,
              "Payment failed via webhook",
            );
          }
        }
        break;
      }

      case "refunded":
        logger.info({ msg: "Refund webhook processed", event });
        break;

      case "payout_processed":
      case "payout_failed":
        logger.info({ msg: "Payout webhook received", event });
        break;
    }

    return { statusCode: 200, status: "ok" };
  }

  /**
   * Create a driver earnings entry after a delivery is completed.
   */
  async createEarningsEntry(
    driverId: number,
    orderId: number,
    assignmentId: number,
    grossAmount: number,
  ): Promise<void> {
    const commissionPct = config.payments.driverCommissionPct;
    const commissionAmt = Number(
      ((grossAmount * commissionPct) / 100).toFixed(2),
    );
    const netAmount = Number((grossAmount - commissionAmt).toFixed(2));

    await paymentsRepository.createEarningsEntry(
      driverId,
      orderId,
      assignmentId,
      grossAmount,
      commissionPct,
      commissionAmt,
      netAmount,
    );

    logger.info({
      msg: "Driver earnings entry created",
      driverId,
      orderId,
      grossAmount,
      netAmount,
    });
  }

  /**
   * Get driver earnings summary for a period.
   */
  async getDriverEarnings(
    driverId: number,
    period: string,
  ): Promise<DriverEarningsResponse> {
    const rows = await paymentsRepository.getDriverEarnings(driverId, period);

    const entries = rows.map((row: any) => ({
      ledgerId: row.ledgerId,
      orderId: row.orderId,
      grossAmount: Number(row.grossAmount),
      commissionPct: Number(row.commissionPct),
      commissionAmt: Number(row.commissionAmt),
      netAmount: Number(row.netAmount),
      status: row.status,
      earnedAt: new Date(row.earnedAt).toISOString(),
    }));

    const totals = entries.reduce(
      (acc: any, e: any) => ({
        grossEarnings: acc.grossEarnings + e.grossAmount,
        totalCommission: acc.totalCommission + e.commissionAmt,
        netEarnings: acc.netEarnings + e.netAmount,
        pendingSettlement:
          acc.pendingSettlement + (e.status === "pending" ? e.netAmount : 0),
      }),
      {
        grossEarnings: 0,
        totalCommission: 0,
        netEarnings: 0,
        pendingSettlement: 0,
      },
    );

    return {
      period,
      totalDeliveries: entries.length,
      ...totals,
      entries,
    };
  }

  /**
   * Get driver payout history.
   */
  async getDriverPayouts(
    driverId: number,
    page: number,
    limit: number,
  ): Promise<DriverPayoutsResponse> {
    const offset = (page - 1) * limit;

    const rows = await paymentsRepository.getDriverPayouts(driverId, limit, offset);
    const total = await paymentsRepository.countDriverPayouts(driverId);

    return {
      payouts: rows.map((row: any) => ({
        payoutId: row.payoutId,
        totalDeliveries: row.totalDeliveries,
        grossAmount: Number(row.grossAmount),
        totalCommission: Number(row.totalCommission),
        netAmount: Number(row.netAmount),
        payoutMethod: row.payoutMethod,
        status: row.status,
        payoutDate: row.payoutDate,
        completedAt: row.completedAt
          ? new Date(row.completedAt).toISOString()
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process daily payouts for all drivers with unsettled earnings.
   * Called by the payout scheduler at 11 PM IST.
   */
  async processDailyPayouts(): Promise<void> {
    logger.info({ msg: "Starting daily payout processing" });

    // Get all drivers with unsettled earnings
    const unsettledRows = await paymentsRepository.getUnsettledEarningsByDriver();

    if (unsettledRows.length === 0) {
      logger.info({ msg: "No unsettled earnings to process" });
      return;
    }

    const payoutProvider = registry.payout();
    const today = new Date().toISOString().split("T")[0] ?? ""; // YYYY-MM-DD

    for (const driverSummary of unsettledRows) {
      const { driverId, totalDeliveries, grossTotal, commissionTotal, netTotal } =
        driverSummary;

      try {
        // Get driver's UPI ID (from profile)
        const driverInfo = await paymentsRepository.getDriverPayoutInfo(driverId);

        const upiId = driverInfo?.upiId;
        if (!upiId) {
          logger.warn({
            msg: "Driver has no UPI ID configured, skipping payout",
            driverId,
          });
          continue;
        }

        // Create payout record
        const payoutResult = await paymentsRepository.createPayoutRecord(
          driverId,
          totalDeliveries,
          grossTotal,
          commissionTotal,
          netTotal,
          "upi",
          upiId as string,
          today,
        );

        const payoutId = payoutResult!.payoutId;

        // Initiate payout via provider
        const amountPaise = Math.round(Number(netTotal) * 100);
        const payoutResponse = await payoutProvider.initiatePayout({
          driverId: Number(driverId),
          amount: amountPaise,
          upiId,
          referenceId: `payout_${payoutId}_${today}`,
          narration: `Shipzy earnings for ${today}`,
        });

        // Update payout record with external ID
        await paymentsRepository.updatePayoutExternalId(
          payoutId,
          payoutResponse.payoutId,
          payoutResponse.success ? "processing" : "failed",
          payoutResponse.success ? null : "Provider returned failure",
        );

        // Mark earnings as settled
        if (payoutResponse.success) {
          await paymentsRepository.settleDriverEarnings(driverId, payoutId);
        }

        logger.info({
          msg: "Driver payout processed",
          driverId,
          payoutId,
          netAmount: netTotal,
          success: payoutResponse.success,
        });
      } catch (error) {
        logger.error({
          msg: "Failed to process payout for driver",
          driverId,
          error: (error as Error).message,
        });
      }
    }

    logger.info({ msg: "Daily payout processing completed" });
  }
}

export default new PaymentsService();
