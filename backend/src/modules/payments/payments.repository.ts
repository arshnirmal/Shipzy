// src/modules/payments/payments.repository.ts
// Data-access layer for the payments module.
// Each method wraps exactly one parameterized query — no business logic here.

import { drizzlePool } from "../../database/drizzle.js";
import logger from "../../config/logger.js";
import paymentQueries from "../../database/queries/payments.queries.js";
import webhookEventQueries from "../../database/queries/webhook-events.queries.js";
import { rawTransaction } from "../../database/transaction.js";
import type { WebhookEvent } from "./capabilities.js";

class PaymentsRepository {
  /**
   * Insert a new payment transaction in 'pending' status.
   * Returns the new transaction id and payment_initiated_at.
   */
  async createTransaction(params: [
    orderId: number,
    paymentMethodId: number,
    amount: number,
    currency: string,
    externalTransactionId: string | null,
    paymentGateway: string,
    upiVpa: string | null,
    metadata: string,
  ]): Promise<{ transactionId: number; paymentInitiatedAt: string } | undefined> {
    const r = await drizzlePool.query(
      paymentQueries.CREATE_PAYMENT_TRANSACTION,
      params,
    );
    return r.rows[0];
  }

  /**
   * Store the Razorpay order id and payment mode on a transaction.
   */
  async setProviderOrderId(
    transactionId: number,
    providerOrderId: string,
    paymentMode: string,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.UPDATE_RAZORPAY_ORDER_ID, [
      transactionId,
      providerOrderId,
      paymentMode,
    ]);
  }

  /**
   * Look up a transaction by its Razorpay order id.
   */
  async getTransactionByProviderOrder(
    razorpayOrderId: string,
  ): Promise<{ transactionId: number; orderId: number; status: string; amount: string } | undefined> {
    const r = await drizzlePool.query(
      paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
      [razorpayOrderId],
    );
    return r.rows[0];
  }

  /**
   * Mark a transaction as completed.
   */
  async markCompleted(
    transactionId: number,
  ): Promise<{ transactionId: number; paymentCompletedAt: string } | undefined> {
    const r = await drizzlePool.query(paymentQueries.MARK_PAYMENT_COMPLETED, [
      transactionId,
    ]);
    return r.rows[0];
  }

  /**
   * Set external payment id and UPI VPA after provider confirmation.
   */
  async updatePaymentDetails(
    transactionId: number,
    externalPaymentId: string,
    upiVpa: string | null,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.UPDATE_PAYMENT_DETAILS, [
      transactionId,
      externalPaymentId,
      upiVpa,
    ]);
  }

  /**
   * Retrieve the most-recent transaction for an order.
   */
  async getPaymentByOrder(orderId: number): Promise<any> {
    const r = await drizzlePool.query(paymentQueries.GET_PAYMENT_BY_ORDER, [
      orderId,
    ]);
    return r.rows[0];
  }

  /**
   * Get the total price stored in the order's pricing JSONB.
   */
  async getOrderAmount(
    orderId: number,
  ): Promise<{ totalPrice: string } | undefined> {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_AMOUNT, [
      orderId,
    ]);
    return r.rows[0];
  }

  /**
   * Get the payment mode recorded on the order row.
   */
  async getOrderPaymentMode(
    orderId: number,
  ): Promise<{ paymentMode: string } | undefined> {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_PAYMENT_MODE, [
      orderId,
    ]);
    return r.rows[0];
  }

  /**
   * Store QR code details and payment mode on a transaction.
   */
  async updateQrDetails(
    transactionId: number,
    qrId: string,
    imageUrl: string,
    expiresAt: string,
    paymentMode: string,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.UPDATE_QR_DETAILS, [
      transactionId,
      qrId,
      imageUrl,
      expiresAt,
      paymentMode,
    ]);
  }

  /**
   * Look up a transaction by its Razorpay QR code id.
   */
  async getTransactionByQrCode(
    qrCodeId: string,
  ): Promise<{ transactionId: number; orderId: number; status: string; amount: string } | undefined> {
    const r = await drizzlePool.query(
      paymentQueries.GET_TRANSACTION_BY_QR_CODE,
      [qrCodeId],
    );
    return r.rows[0];
  }

  /**
   * Mark a transaction as failed with a reason.
   */
  async markFailed(
    transactionId: number,
    failureReason: string,
  ): Promise<{ transactionId: number; paymentFailedAt: string } | undefined> {
    const r = await drizzlePool.query(paymentQueries.MARK_PAYMENT_FAILED, [
      transactionId,
      failureReason,
    ]);
    return r.rows[0];
  }

  /**
   * Insert a driver earnings ledger record.
   */
  async createEarningsEntry(
    driverId: number,
    orderId: number,
    assignmentId: number,
    grossAmount: number,
    commissionPct: number,
    commissionAmt: number,
    netAmount: number,
  ): Promise<{ ledgerId: number } | undefined> {
    const r = await drizzlePool.query(paymentQueries.CREATE_EARNINGS_ENTRY, [
      driverId,
      orderId,
      assignmentId,
      grossAmount,
      commissionPct,
      commissionAmt,
      netAmount,
    ]);
    return r.rows[0];
  }

  /**
   * Get driver earnings rows for a given period.
   */
  async getDriverEarnings(driverId: number, period: string): Promise<any[]> {
    const r = await drizzlePool.query(paymentQueries.GET_DRIVER_EARNINGS, [
      driverId,
      period,
    ]);
    return r.rows;
  }

  /**
   * Get driver payout history (paginated).
   */
  async getDriverPayouts(
    driverId: number,
    limit: number,
    offset: number,
  ): Promise<any[]> {
    const r = await drizzlePool.query(paymentQueries.GET_DRIVER_PAYOUTS, [
      driverId,
      limit,
      offset,
    ]);
    return r.rows;
  }

  /**
   * Count total payouts for a driver (for pagination).
   */
  async countDriverPayouts(driverId: number): Promise<number> {
    const r = await drizzlePool.query(paymentQueries.COUNT_DRIVER_PAYOUTS, [
      driverId,
    ]);
    return parseInt(r.rows[0]?.count ?? "0", 10);
  }

  /**
   * Get all drivers with unsettled earnings grouped by driver id.
   */
  async getUnsettledEarningsByDriver(): Promise<any[]> {
    const r = await drizzlePool.query(
      paymentQueries.GET_UNSETTLED_EARNINGS_BY_DRIVER,
    );
    return r.rows;
  }

  /**
   * Get a driver's payout info (UPI id) from their profile.
   */
  async getDriverPayoutInfo(
    driverId: number,
  ): Promise<{ driverId: number; upiId: string | null } | undefined> {
    const r = await drizzlePool.query(paymentQueries.GET_DRIVER_PAYOUT_INFO, [
      driverId,
    ]);
    return r.rows[0];
  }

  /**
   * Insert a driver payout record.
   */
  async createPayoutRecord(
    driverId: number,
    totalDeliveries: number,
    grossTotal: number,
    commissionTotal: number,
    netTotal: number,
    payoutMethod: string,
    payoutUpiId: string,
    payoutDate: string,
  ): Promise<{ payoutId: number } | undefined> {
    const r = await drizzlePool.query(paymentQueries.CREATE_PAYOUT_RECORD, [
      driverId,
      totalDeliveries,
      grossTotal,
      commissionTotal,
      netTotal,
      payoutMethod,
      payoutUpiId,
      payoutDate,
    ]);
    return r.rows[0];
  }

  /**
   * Store the provider's external payout id and update status.
   */
  async updatePayoutExternalId(
    payoutId: number,
    externalPayoutId: string,
    status: string,
    failureReason: string | null,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.UPDATE_PAYOUT_EXTERNAL_ID, [
      payoutId,
      externalPayoutId,
      status,
      failureReason,
    ]);
  }

  /**
   * Mark a driver's pending earnings as settled against a payout record.
   * @deprecated Settlement now happens via webhook reconciliation (settleProcessingEarnings).
   */
  async settleDriverEarnings(
    driverId: number,
    payoutId: number,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.SETTLE_DRIVER_EARNINGS, [
      driverId,
      payoutId,
    ]);
  }

  // ── Crash-safe payout helpers (3.1) ────────────────────────────────────────

  /**
   * Atomically mark all pending earnings for a driver as 'processing',
   * linking them to the payout record BEFORE any provider call.
   * Returns the number of ledger rows claimed.
   * $1 = driver_id, $2 = payout_id
   */
  async markEarningsProcessing(driverId: number, payoutId: number): Promise<number> {
    const r = await drizzlePool.query(paymentQueries.MARK_EARNINGS_PROCESSING, [
      driverId,
      payoutId,
    ]);
    return r.rows.length;
  }

  /**
   * Settle all 'processing' earnings for a payout (called by webhook reconciliation).
   */
  async settleProcessingEarnings(payoutId: number): Promise<void> {
    await drizzlePool.query(paymentQueries.SETTLE_PROCESSING_EARNINGS, [payoutId]);
  }

  /**
   * Revert 'processing' earnings back to 'pending' on payout failure or crash.
   */
  async revertProcessingEarnings(payoutId: number): Promise<void> {
    await drizzlePool.query(paymentQueries.REVERT_PROCESSING_EARNINGS, [payoutId]);
  }

  /**
   * Look up the internal payout_id from the provider's external payout id.
   * Returns null if not found.
   */
  async getPayoutByExternalId(externalId: string): Promise<number | null> {
    const r = await drizzlePool.query(paymentQueries.GET_PAYOUT_BY_EXTERNAL_ID, [externalId]);
    return r.rows[0]?.payoutId ?? null;
  }

  /**
   * Mark a payout as completed (status: processing → completed).
   */
  async completePayout(payoutId: number): Promise<void> {
    await drizzlePool.query(paymentQueries.COMPLETE_PAYOUT, [payoutId]);
  }

  /**
   * Mark a payout as failed with a reason.
   */
  async failPayout(payoutId: number, reason: string): Promise<void> {
    await drizzlePool.query(paymentQueries.FAIL_PAYOUT, [payoutId, reason]);
  }

  /**
   * Acquire a PostgreSQL session-level advisory lock (key 91823) on a dedicated
   * pooled client so two concurrent payout scheduler runs cannot overlap.
   * The lock is held for the duration of the payout loop — NOT inside a
   * transaction — so provider network calls don't hold a DB transaction open.
   *
   * Returns null and logs a warning if another run holds the lock.
   */
  async runWithPayoutLock<T>(fn: () => Promise<T>): Promise<T | null> {
    const client = await drizzlePool.connect();
    try {
      const res = await client.query("SELECT pg_try_advisory_lock(91823) AS locked");
      if (!res.rows[0]?.locked) {
        logger.warn({ msg: "Payout run already in progress; skipping" });
        return null;
      }
      try {
        return await fn();
      } finally {
        await client.query("SELECT pg_advisory_unlock(91823)");
      }
    } finally {
      client.release();
    }
  }

  // ── Webhook idempotency ─────────────────────────────────────────────────────

  /**
   * Insert a webhook event row if its event_id has not been seen before.
   * Returns true when a new row was created; false when it was a duplicate.
   */
  async insertWebhookEventIfNew(
    provider: string,
    eventId: string,
    eventType: string,
    payloadJson: string,
  ): Promise<boolean> {
    const r = await drizzlePool.query(webhookEventQueries.INSERT_EVENT_IF_NEW, [
      provider,
      eventId,
      eventType,
      payloadJson,
    ]);
    return r.rows.length > 0;
  }

  /**
   * Mark a previously-inserted webhook event as processed.
   */
  async markWebhookProcessed(eventId: string): Promise<void> {
    await drizzlePool.query(webhookEventQueries.MARK_EVENT_PROCESSED, [
      eventId,
    ]);
  }

  /**
   * Complete a transaction only if it is still pending AND the stored amount
   * (rupees) matches the webhook amount (paise). Amount mismatch → returns false.
   */
  async completeTransactionIfPending(
    transactionId: number,
    providerPaymentId: string,
    vpa: string | null | undefined,
    amountPaise: number,
  ): Promise<boolean> {
    const r = await drizzlePool.query(paymentQueries.COMPLETE_TXN_IF_PENDING, [
      transactionId,
      providerPaymentId,
      vpa ?? null,
      amountPaise,
    ]);
    return r.rows.length > 0;
  }

  /**
   * Apply a parsed webhook event inside a single DB transaction.
   *
   * - captured / qr_credited: looks up the transaction, then applies the
   *   amount-guarded completion query.  If event.amount is missing the event
   *   is treated as un-actionable and a warning is logged.
   * - failed: looks up the transaction and marks it failed (no amount guard).
   * - All other statuses are intentional no-ops here (handled elsewhere/later).
   */
  async applyWebhookEvent(event: WebhookEvent): Promise<void> {
    await rawTransaction(async (client) => {
      switch (event.status) {
        case "captured": {
          if (!event.providerOrderId) return;
          if (event.amount === undefined) {
            logger.warn({
              msg: "Webhook 'captured' event missing amount — skipping completion",
              eventId: event.eventId,
              providerOrderId: event.providerOrderId,
            });
            return;
          }
          const txnRes = await client.query(
            paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
            [event.providerOrderId],
          );
          const txn = txnRes.rows[0];
          if (!txn) return;
          const completed = await client.query(
            paymentQueries.COMPLETE_TXN_IF_PENDING,
            [
              txn.transactionId,
              event.providerPaymentId ?? null,
              event.vpa ?? null,
              event.amount,
            ],
          );
          if (completed.rows.length === 0) {
            logger.warn({
              msg: "Webhook 'captured': transaction not updated (wrong status or amount mismatch)",
              transactionId: txn.transactionId,
              webhookAmountPaise: event.amount,
            });
          }
          break;
        }

        case "qr_credited": {
          if (!event.qrCodeId) return;
          if (event.amount === undefined) {
            logger.warn({
              msg: "Webhook 'qr_credited' event missing amount — skipping completion",
              eventId: event.eventId,
              qrCodeId: event.qrCodeId,
            });
            return;
          }
          const txnRes = await client.query(
            paymentQueries.GET_TRANSACTION_BY_QR_CODE,
            [event.qrCodeId],
          );
          const txn = txnRes.rows[0];
          if (!txn) return;
          const completed = await client.query(
            paymentQueries.COMPLETE_TXN_IF_PENDING,
            [
              txn.transactionId,
              event.providerPaymentId ?? null,
              event.vpa ?? null,
              event.amount,
            ],
          );
          if (completed.rows.length === 0) {
            logger.warn({
              msg: "Webhook 'qr_credited': transaction not updated (wrong status or amount mismatch)",
              transactionId: txn.transactionId,
              webhookAmountPaise: event.amount,
            });
          }
          break;
        }

        case "failed": {
          if (!event.providerOrderId) return;
          const txnRes = await client.query(
            paymentQueries.GET_TRANSACTION_BY_RAZORPAY_ORDER,
            [event.providerOrderId],
          );
          const txn = txnRes.rows[0];
          if (!txn) return;
          await client.query(paymentQueries.MARK_PAYMENT_FAILED, [
            txn.transactionId,
            "Payment failed via webhook",
          ]);
          break;
        }

        // Intentional no-op
        case "refunded":
          break;

        case "payout_processed": {
          if (!event.providerPayoutId) return;
          const payoutRes = await client.query(
            paymentQueries.GET_PAYOUT_BY_EXTERNAL_ID,
            [event.providerPayoutId],
          );
          const payoutId: number | undefined = payoutRes.rows[0]?.payoutId;
          if (!payoutId) return;
          await client.query(paymentQueries.COMPLETE_PAYOUT, [payoutId]);
          await client.query(paymentQueries.SETTLE_PROCESSING_EARNINGS, [payoutId]);
          logger.info({
            msg: "Payout reconciled: completed and earnings settled",
            providerPayoutId: event.providerPayoutId,
            payoutId,
          });
          break;
        }

        case "payout_failed": {
          if (!event.providerPayoutId) return;
          const payoutRes = await client.query(
            paymentQueries.GET_PAYOUT_BY_EXTERNAL_ID,
            [event.providerPayoutId],
          );
          const payoutId: number | undefined = payoutRes.rows[0]?.payoutId;
          if (!payoutId) return;
          await client.query(paymentQueries.FAIL_PAYOUT, [
            payoutId,
            "Payout failed via webhook",
          ]);
          await client.query(paymentQueries.REVERT_PROCESSING_EARNINGS, [payoutId]);
          logger.warn({
            msg: "Payout reconciled: failed and earnings reverted to pending",
            providerPayoutId: event.providerPayoutId,
            payoutId,
          });
          break;
        }

        case "unknown":
        default:
          break;
      }
    });
  }

  /**
   * Get the client (business) user id that owns an order, or null if missing.
   */
  async getOrderOwner(orderId: number): Promise<number | null> {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_OWNER, [
      orderId,
    ]);
    return r.rows[0]?.clientId ?? null;
  }

  /**
   * Get the courier id currently assigned to an order, or null if unassigned.
   */
  async getAssignedCourier(orderId: number): Promise<number | null> {
    const r = await drizzlePool.query(
      paymentQueries.GET_ORDER_ASSIGNED_COURIER,
      [orderId],
    );
    return r.rows[0]?.courierId ?? null;
  }

  /**
   * Look up a transaction by its internal transaction_id.
   */
  async getTransactionById(
    transactionId: number,
  ): Promise<{ transactionId: number; orderId: number; amount: string; status: string; externalTransactionId: string | null } | undefined> {
    const r = await drizzlePool.query(paymentQueries.GET_TRANSACTION_BY_ID, [
      transactionId,
    ]);
    return r.rows[0];
  }

  /**
   * Insert a new refund row. Returns the new refund_id.
   */
  async createRefund(
    transactionId: number,
    orderId: number,
    amount: number,
    reason: string,
    status: string,
  ): Promise<{ refundId: number }> {
    const r = await drizzlePool.query(paymentQueries.CREATE_REFUND, [
      transactionId,
      orderId,
      amount,
      reason,
      status,
    ]);
    return r.rows[0];
  }

  /**
   * Mark a refund as processed with the provider's external refund id.
   */
  async markRefundProcessed(
    refundId: number,
    externalRefundId: string,
  ): Promise<void> {
    await drizzlePool.query(paymentQueries.MARK_REFUND_PROCESSED, [
      refundId,
      externalRefundId,
    ]);
  }

  /**
   * Mark the transaction's status as 'refunded'.
   */
  async markTransactionRefunded(transactionId: number): Promise<void> {
    await drizzlePool.query(paymentQueries.MARK_TRANSACTION_REFUNDED, [
      transactionId,
    ]);
  }

  /**
   * Expire all pending QR transactions past their expiry time.
   * Returns the count of rows that were expired.
   */
  async expireStaleQRs(): Promise<number> {
    const r = await drizzlePool.query(paymentQueries.EXPIRE_STALE_QR_TXNS);
    return r.rows.length;
  }
}

export default new PaymentsRepository();
