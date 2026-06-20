// src/modules/payments/payments.repository.ts
// Data-access layer for the payments module.
// Each method wraps exactly one parameterized query — no business logic here.

import { drizzlePool } from "../../database/drizzle.js";
import paymentQueries from "../../database/queries/payments.queries.js";

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
}

export default new PaymentsRepository();
