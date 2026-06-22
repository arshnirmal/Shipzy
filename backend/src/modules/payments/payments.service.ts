// src/modules/payments/payments.service.ts
// Payment orchestration service — coordinates between providers, DB, and order flow

import config from "../../config/env.js";
import logger from "../../config/logger.js";
import { AppError, NotFoundError } from "../../utils/error.util.js";
import registry from "./provider-registry.js";
import paymentsRepository from "./payments.repository.js";
import orderDispatchService from "../orders/order-dispatch.service.js";
import type {
  PaymentOrderResponse,
  PaymentVerifyResponse,
  QRCodeResponse,
  PaymentStatusResponse,
  RefundResponse,
  DriverEarningsResponse,
  DriverPayoutsResponse,
} from "./payments.zod.js";

// Internal default payment method id (UPI). Never sourced from the client.
const DEFAULT_PAYMENT_METHOD_ID = 1;

class PaymentsService {
  /**
   * Ensure the caller is the business/client that owns the order.
   */
  private async assertBusinessOwnsOrder(
    orderId: number,
    userId: number,
  ): Promise<void> {
    const ownerId = await paymentsRepository.getOrderOwner(orderId);
    if (ownerId === null) throw new NotFoundError("Order not found");
    if (ownerId !== userId) {
      throw new AppError("Not authorized for this order", 403);
    }
  }

  /**
   * Ensure the caller is the courier currently assigned to the order.
   */
  private async assertCourierAssigned(
    orderId: number,
    userId: number,
  ): Promise<void> {
    const courierId = await paymentsRepository.getAssignedCourier(orderId);
    if (courierId !== userId) {
      throw new AppError("Not authorized for this order", 403);
    }
  }

  /**
   * Fetch the broadcast inputs for an order and notify nearby couriers that it
   * is now ready for pickup. Fire-and-forget: failures are logged, never thrown,
   * so a broadcast hiccup can't fail payment completion.
   */
  private async broadcastOrderToFleet(orderId: number): Promise<void> {
    const row = await paymentsRepository.getOrderForBroadcast(orderId);
    if (!row) {
      logger.warn({
        msg: "Cannot broadcast order: not found",
        orderId,
      });
      return;
    }
    void orderDispatchService
      .broadcastNewOrder({
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        pickupLat: row.pickupLat,
        pickupLng: row.pickupLng,
        totalPrice: Number(row.totalPrice),
      })
      .catch((err: unknown) => {
        logger.error({
          msg: "Failed to broadcast order to fleet after payment completion",
          orderId,
          error: (err as Error).message,
        });
      });
  }

  /**
   * Initiate a prepaid payment order.
   * Creates a Razorpay order and records it in payments.transactions.
   * The amount is sourced server-side from the order — never from the client.
   */
  async initiatePayment(
    orderId: number,
    businessUserId: number,
  ): Promise<PaymentOrderResponse> {
    await this.assertBusinessOwnsOrder(orderId, businessUserId);

    const orderRow = await paymentsRepository.getOrderAmount(orderId);
    if (!orderRow) {
      throw new NotFoundError("Order not found");
    }
    const amount = Number(orderRow.totalPrice);
    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 100) {
      throw new AppError("Order amount too small for online payment", 400);
    }

    // Idempotency: if a reusable pending transaction already exists for this
    // order (a pending txn with a provider order id), return it instead of
    // creating a fresh provider order + transaction on every retry.
    const existing = await paymentsRepository.getPaymentByOrder(orderId);
    if (existing && existing.paymentStatus === "pending" && existing.razorpayOrderId) {
      return {
        providerOrderId: existing.razorpayOrderId,
        amount,
        currency: "INR",
        publishableKey: config.razorpay.keyId,
        orderId,
      };
    }

    const provider = registry.collection();

    const result = await provider.createPaymentOrder({
      orderId,
      amount: amountPaise,
      currency: "INR",
      receipt: `order_${orderId}`,
      notes: { orderId: String(orderId) },
    });

    // Record transaction in DB (amount stored in rupees)
    const txn = await paymentsRepository.createTransaction([
      orderId,
      DEFAULT_PAYMENT_METHOD_ID,
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
    businessUserId: number,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<PaymentVerifyResponse> {
    await this.assertBusinessOwnsOrder(orderId, businessUserId);

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

    // Only the transition pending → completed should sync the order's payment
    // status and broadcast. If the webhook already completed this txn, skip the
    // duplicate side effects (avoids a double-broadcast on the webhook+verify race).
    const wasPending = txnRow.status === "pending";

    // Mark as completed
    await paymentsRepository.markCompleted(transactionId);

    // Update with Razorpay payment details
    await paymentsRepository.updatePaymentDetails(
      transactionId,
      razorpayPaymentId,
      verification.vpa || null,
    );

    if (wasPending) {
      // Prepaid order becomes visible to the fleet only now that it is paid.
      await paymentsRepository.setOrderPaymentStatus(orderId, "completed");
      await this.broadcastOrderToFleet(orderId);
    }

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
    courierUserId: number,
  ): Promise<QRCodeResponse> {
    await this.assertCourierAssigned(orderId, courierUserId);

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
        DEFAULT_PAYMENT_METHOD_ID,
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
   * Get payment status for an order, enforcing caller authorization.
   * Admins may view any order; couriers must be assigned; everyone else
   * (client/business) must own the order. Internal callers use the
   * unguarded getPaymentStatus instead.
   */
  async getPaymentStatusForCaller(
    orderId: number,
    caller: { userId: number; role: string },
  ): Promise<PaymentStatusResponse> {
    if (caller.role === "admin") {
      // no ownership restriction
    } else if (caller.role === "courier") {
      await this.assertCourierAssigned(orderId, caller.userId);
    } else {
      await this.assertBusinessOwnsOrder(orderId, caller.userId);
    }
    return this.getPaymentStatus(orderId);
  }

  /**
   * Process a provider webhook event.
   * Idempotent — safe to call multiple times for the same event.
   * Deduplicates by event_id before applying amount-guarded completion.
   */
  async processWebhook(
    provider: string,
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<{ statusCode: number; status: string }> {
    // Throws AppError(400) on bad signature — bubbles to controller as-is
    const event = await registry.webhook(provider).verifyAndParse(rawBody, headers);

    if (!event.handled) {
      return { statusCode: 200, status: "ignored" };
    }

    const isNew = await paymentsRepository.insertWebhookEventIfNew(
      provider,
      event.eventId,
      event.eventType,
      JSON.stringify(event.raw),
    );
    if (!isNew) {
      return { statusCode: 200, status: "duplicate" };
    }

    const result = await paymentsRepository.applyWebhookEvent(event);
    await paymentsRepository.markWebhookProcessed(event.eventId);

    // Sync the order's denormalized payment_status and, for newly-paid prepaid
    // orders, broadcast to the fleet. FCM/broadcast logic lives here in the
    // service, never inside the repository transaction.
    switch (result.kind) {
      case "prepaid_completed":
        await paymentsRepository.setOrderPaymentStatus(result.orderId, "completed");
        await this.broadcastOrderToFleet(result.orderId);
        break;
      case "cod_completed":
        // COD orders are already visible to the fleet — sync status, no broadcast.
        await paymentsRepository.setOrderPaymentStatus(result.orderId, "completed");
        break;
      case "failed":
        await paymentsRepository.setOrderPaymentStatus(result.orderId, "failed");
        break;
      case "none":
      default:
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
   * Initiate a refund for a completed transaction. Admin-only.
   * Creates a refund row, calls the provider, and on success marks both
   * the refund and the parent transaction as completed/refunded.
   */
  async refund(
    transactionId: number,
    reason: string,
  ): Promise<RefundResponse> {
    const txn = await paymentsRepository.getTransactionById(transactionId);
    if (!txn) throw new NotFoundError("Transaction not found");

    if (txn.status !== "completed") {
      throw new AppError("Only completed payments can be refunded", 400);
    }

    if (!txn.externalTransactionId) {
      throw new AppError("No provider payment id on this transaction", 400);
    }

    const amount = Number(txn.amount);
    const amountPaise = Math.round(amount * 100);

    // Create the refund row in 'pending' status
    const refundRow = await paymentsRepository.createRefund(
      transactionId,
      txn.orderId,
      amount,
      reason,
      "pending",
    );
    const refundId = refundRow.refundId;

    // Call the provider
    const result = await registry.refund().initiateRefund({
      providerPaymentId: txn.externalTransactionId,
      amount: amountPaise,
      reason,
    });

    let status: string;
    if (result.success) {
      await paymentsRepository.markRefundProcessed(refundId, result.refundId);
      await paymentsRepository.markTransactionRefunded(transactionId);
      await paymentsRepository.setOrderPaymentStatus(txn.orderId, "refunded");
      status = "completed";
    } else {
      status = "pending";
    }

    logger.info({
      msg: "Refund processed",
      transactionId,
      refundId,
      amount,
      success: result.success,
    });

    return { refundId, transactionId, amount, status };
  }

  /**
   * Expire all pending QR-based transactions that are past their expiry time.
   * Called by the QR expiry sweep scheduler every 5 minutes.
   */
  async expireStaleQRs(): Promise<void> {
    const count = await paymentsRepository.expireStaleQRs();
    if (count > 0) {
      logger.info({
        msg: "Expired stale QR transactions",
        count,
      });
    }
  }

  /**
   * Process daily payouts for all drivers with unsettled earnings.
   * Called by the payout scheduler at 11 PM IST.
   *
   * Crash-safety: earnings are marked 'processing' (linked to the payout record)
   * BEFORE any provider call. If the process crashes after the provider call but
   * before we update the DB, earnings stay 'processing' and are NOT re-queued
   * for the next run. The webhook reconciliation (applyWebhookEvent) settles or
   * reverts them when RazorpayX delivers the payout_processed / payout_failed event.
   *
   * Concurrency: a PostgreSQL advisory lock ensures only one scheduler instance
   * runs at a time across all pods/workers.
   */
  async processDailyPayouts(): Promise<void> {
    logger.info({ msg: "Starting daily payout processing" });

    await paymentsRepository.runWithPayoutLock(async () => {
      // Only pick up pending earnings — 'processing' rows belong to an
      // in-flight payout already and will be reconciled by the webhook.
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

        let payoutId: number | undefined;

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

          // 1. Create payout record first so we have an id to link earnings to.
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
          payoutId = payoutResult!.payoutId;

          // 2. Atomically claim earnings BEFORE any provider call.
          //    If a crash happens between step 2 and 4, earnings stay 'processing'
          //    and are reconciled by the webhook — no double-pay.
          const claimed = await paymentsRepository.markEarningsProcessing(driverId, payoutId);
          if (claimed === 0) {
            // No earnings to settle for this driver (race: another run claimed them).
            await paymentsRepository.failPayout(payoutId, "No pending earnings");
            logger.warn({ msg: "No pending earnings to claim for driver", driverId, payoutId });
            continue;
          }

          // 3. Initiate payout via provider.
          const amountPaise = Math.round(Number(netTotal) * 100);
          const payoutResponse = await payoutProvider.initiatePayout({
            driverId: Number(driverId),
            amount: amountPaise,
            upiId,
            referenceId: `payout_${payoutId}_${today}`,
            narration: `Shipzy earnings for ${today}`,
          });

          // 4. Record provider result. On success, leave earnings as 'processing'
          //    — the webhook (payout_processed) will settle them atomically.
          //    On provider failure, revert earnings to 'pending' for the next run.
          if (payoutResponse.success) {
            await paymentsRepository.updatePayoutExternalId(
              payoutId,
              payoutResponse.payoutId,
              "processing",
              null,
            );
            // Earnings remain 'processing' until webhook fires.
          } else {
            await paymentsRepository.updatePayoutExternalId(
              payoutId,
              "",
              "failed",
              "Provider returned failure",
            );
            await paymentsRepository.revertProcessingEarnings(payoutId);
          }

          logger.info({
            msg: "Driver payout initiated",
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
          // Best-effort: revert earnings so they're included in the next run.
          if (payoutId !== undefined) {
            try {
              await paymentsRepository.revertProcessingEarnings(payoutId);
            } catch (revertErr) {
              logger.error({
                msg: "Failed to revert processing earnings after payout error",
                driverId,
                payoutId,
                error: (revertErr as Error).message,
              });
            }
          }
        }
      }

      logger.info({ msg: "Daily payout processing completed" });
    });
  }
}

export default new PaymentsService();
