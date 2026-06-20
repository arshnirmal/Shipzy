// services/backend/src/modules/payments/payments.service.ts
// Payment orchestration service — coordinates between providers, DB, and order flow

import config from "../../config/env.js";
import logger from "../../config/logger.js";
import { drizzlePool } from "../../database/drizzle.js";
import paymentQueries from "../../database/queries/payments.queries.js";
import { AppError, NotFoundError } from "../../utils/error.util.js";
import { getPaymentProvider, getPayoutProvider } from "./provider-factory.js";
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
    const provider = getPaymentProvider();

    // Create Razorpay order (amount in paise)
    const amountPaise = Math.round(amount * 100);
    const result = await provider.createPaymentOrder({
      orderId,
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId: String(orderId) },
    });

    // Record transaction in DB
    const txn = await drizzlePool.query(
      paymentQueries.CREATE_PAYMENT_TRANSACTION,
      [
        orderId,
        paymentMethodId,
        amount,
        "INR",
        null, // external_transaction_id (set after verification)
        "razorpay",
        null, // upi_vpa
        JSON.stringify({ razorpayOrderId: result.providerOrderId }),
      ],
    );

    // Store razorpay_order_id on the transaction
    const transactionId = txn.rows[0]?.transactionId;
    if (transactionId) {
      await drizzlePool.query(paymentQueries.UPDATE_RAZORPAY_ORDER_ID, [
        transactionId,
        result.providerOrderId,
        "prepaid",
      ]);
    }

    return {
      razorpayOrderId: result.providerOrderId,
      amount: amount,
      currency: "INR",
      razorpayKeyId: config.razorpay.keyId,
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
    const provider = getPaymentProvider();

    const verification = await provider.verifyPayment({
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!verification.verified) {
      throw new AppError("Payment verification failed", 400);
    }

    // Find the transaction for this order
    const txnResult = await drizzlePool.query(
      paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
      [razorpayOrderId],
    );

    if (txnResult.rows.length === 0) {
      throw new NotFoundError("Transaction not found for this payment");
    }

    const transactionId = txnResult.rows[0].transactionId;

    // Mark as completed
    await drizzlePool.query(paymentQueries.MARK_PAYMENT_COMPLETED, [
      transactionId,
    ]);

    // Update with Razorpay payment details
    await drizzlePool.query(paymentQueries.UPDATE_PAYMENT_DETAILS, [
      transactionId,
      razorpayPaymentId,
      verification.vpa || null,
    ]);

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
    const existingTxn = await drizzlePool.query(
      paymentQueries.GET_PAYMENT_BY_ORDER,
      [orderId],
    );

    let amount: number;
    let transactionId: number;

    if (existingTxn.rows.length > 0 && existingTxn.rows[0].paymentStatus === "pending") {
      // Re-use existing pending transaction
      amount = Number(existingTxn.rows[0].amount);
      transactionId = existingTxn.rows[0].transactionId;
    } else {
      // Get the order amount to create a new transaction
      const orderResult = await drizzlePool.query(
        paymentQueries.GET_ORDER_AMOUNT,
        [orderId],
      );
      if (orderResult.rows.length === 0) {
        throw new NotFoundError("Order not found");
      }
      amount = Number(orderResult.rows[0].totalPrice);

      // Create pending transaction
      const txnResult = await drizzlePool.query(
        paymentQueries.CREATE_PAYMENT_TRANSACTION,
        [
          orderId,
          paymentMethodId,
          amount,
          "INR",
          null,
          "razorpay",
          null,
          JSON.stringify({ paymentMode: "collect_on_delivery" }),
        ],
      );
      transactionId = txnResult.rows[0].transactionId;
    }

    const provider = getPaymentProvider();
    const amountPaise = Math.round(amount * 100);

    const qr = await provider.generateQRCode({
      orderId,
      amount: amountPaise,
      description: `Payment for Order #${orderId}`,
      expiryMinutes: config.payments.qrExpiryMinutes,
      notes: { orderId: String(orderId) },
    });

    // Store QR details on the transaction
    await drizzlePool.query(paymentQueries.UPDATE_QR_DETAILS, [
      transactionId,
      qr.qrId,
      qr.imageUrl,
      qr.expiresAt.toISOString(),
      "collect_on_delivery",
    ]);

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
    const result = await drizzlePool.query(
      paymentQueries.GET_PAYMENT_BY_ORDER,
      [orderId],
    );

    // Get payment mode from order
    const orderResult = await drizzlePool.query(
      paymentQueries.GET_ORDER_PAYMENT_MODE,
      [orderId],
    );

    const paymentMode = orderResult.rows[0]?.paymentMode || "prepaid";

    if (result.rows.length === 0) {
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

    const txn = result.rows[0];
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
   * Process a Razorpay webhook event.
   * Idempotent — safe to call multiple times for the same event.
   */
  async processWebhook(
    body: unknown,
    headers: Record<string, string>,
  ): Promise<void> {
    const provider = getPaymentProvider();
    const result = await provider.handleWebhook(body, headers);

    if (!result.handled) {
      return;
    }

    switch (result.status) {
      case "captured": {
        // Prepaid payment confirmed — find transaction and mark complete
        if (result.providerOrderId) {
          const txn = await drizzlePool.query(
            paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
            [result.providerOrderId],
          );
          if (txn.rows.length > 0) {
            const tid = txn.rows[0].transactionId;
            // Idempotent — only update if still pending
            if (txn.rows[0].status === "pending") {
              await drizzlePool.query(paymentQueries.MARK_PAYMENT_COMPLETED, [tid]);
              if (result.providerPaymentId) {
                await drizzlePool.query(paymentQueries.UPDATE_PAYMENT_DETAILS, [
                  tid,
                  result.providerPaymentId,
                  result.vpa || null,
                ]);
              }
            }
          }
        }
        break;
      }

      case "qr_credited": {
        // Collect-on-delivery QR payment received
        if (result.qrCodeId) {
          const txn = await drizzlePool.query(
            paymentQueries.GET_TRANSACTION_BY_QR_CODE,
            [result.qrCodeId],
          );
          if (txn.rows.length > 0) {
            const tid = txn.rows[0].transactionId;
            if (txn.rows[0].status === "pending") {
              await drizzlePool.query(paymentQueries.MARK_PAYMENT_COMPLETED, [tid]);
              if (result.providerPaymentId) {
                await drizzlePool.query(paymentQueries.UPDATE_PAYMENT_DETAILS, [
                  tid,
                  result.providerPaymentId,
                  result.vpa || null,
                ]);
              }
            }
          }
        }
        break;
      }

      case "failed": {
        if (result.providerOrderId) {
          const txn = await drizzlePool.query(
            paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
            [result.providerOrderId],
          );
          if (txn.rows.length > 0) {
            await drizzlePool.query(paymentQueries.MARK_PAYMENT_FAILED, [
              txn.rows[0].transactionId,
              "Payment failed via webhook",
            ]);
          }
        }
        break;
      }

      case "refunded":
        // Handled by the refund flow
        logger.info({ msg: "Refund webhook processed", result });
        break;
    }
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

    await drizzlePool.query(paymentQueries.CREATE_EARNINGS_ENTRY, [
      driverId,
      orderId,
      assignmentId,
      grossAmount,
      commissionPct,
      commissionAmt,
      netAmount,
    ]);

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
    const result = await drizzlePool.query(
      paymentQueries.GET_DRIVER_EARNINGS,
      [driverId, period],
    );

    const entries = result.rows.map((row: any) => ({
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

    const result = await drizzlePool.query(
      paymentQueries.GET_DRIVER_PAYOUTS,
      [driverId, limit, offset],
    );

    const countResult = await drizzlePool.query(
      paymentQueries.COUNT_DRIVER_PAYOUTS,
      [driverId],
    );

    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    return {
      payouts: result.rows.map((row: any) => ({
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
    const unsettled = await drizzlePool.query(
      paymentQueries.GET_UNSETTLED_EARNINGS_BY_DRIVER,
    );

    if (unsettled.rows.length === 0) {
      logger.info({ msg: "No unsettled earnings to process" });
      return;
    }

    const payoutProvider = getPayoutProvider();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    for (const driverSummary of unsettled.rows) {
      const { driverId, totalDeliveries, grossTotal, commissionTotal, netTotal } =
        driverSummary;

      try {
        // Get driver's UPI ID (from profile)
        const driverInfo = await drizzlePool.query(
          paymentQueries.GET_DRIVER_PAYOUT_INFO,
          [driverId],
        );

        const upiId = driverInfo.rows[0]?.upiId;
        if (!upiId) {
          logger.warn({
            msg: "Driver has no UPI ID configured, skipping payout",
            driverId,
          });
          continue;
        }

        // Create payout record
        const payoutResult = await drizzlePool.query(
          paymentQueries.CREATE_PAYOUT_RECORD,
          [
            driverId,
            totalDeliveries,
            grossTotal,
            commissionTotal,
            netTotal,
            "upi",
            upiId,
            today,
          ],
        );

        const payoutId = payoutResult.rows[0].payoutId;

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
        await drizzlePool.query(paymentQueries.UPDATE_PAYOUT_EXTERNAL_ID, [
          payoutId,
          payoutResponse.payoutId,
          payoutResponse.success ? "processing" : "failed",
          payoutResponse.success ? null : "Provider returned failure",
        ]);

        // Mark earnings as settled
        if (payoutResponse.success) {
          await drizzlePool.query(paymentQueries.SETTLE_DRIVER_EARNINGS, [
            driverId,
            payoutId,
          ]);
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
