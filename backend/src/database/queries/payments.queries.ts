// services/backend/src/database/queries/payments.queries.ts

/**
 * Payment transaction queries
 */

export default {

  /**
   * Create payment transaction
   */
  CREATE_PAYMENT_TRANSACTION: `
    INSERT INTO payments.transactions (
      order_id,
      payment_method_id,
      status,
      amount,
      currency,
      external_transaction_id,
      payment_gateway,
      upi_vpa,
      metadata,
      payment_initiated_at
    )
    VALUES (
      $1, $2,
      'pending',
      $3, $4, $5, $6, $7, $8, NOW()
    )
      RETURNING transaction_id AS "transactionId", payment_initiated_at AS "paymentInitiatedAt"
  `,

  /**
   * Update Razorpay order ID and payment mode on a transaction
   */
  UPDATE_RAZORPAY_ORDER_ID: `
    UPDATE payments.transactions
    SET
      razorpay_order_id = $2,
      payment_mode = $3,
      updated_at = NOW()
    WHERE transaction_id = $1
  `,

  /**
   * Update QR code details on a transaction
   */
  UPDATE_QR_DETAILS: `
    UPDATE payments.transactions
    SET
      qr_code_id = $2,
      qr_image_url = $3,
      qr_expires_at = $4,
      payment_mode = $5,
      updated_at = NOW()
    WHERE transaction_id = $1
  `,

  /**
   * Update payment details after verification (external ID + UPI VPA)
   */
  UPDATE_PAYMENT_DETAILS: `
    UPDATE payments.transactions
    SET
      external_transaction_id = $2,
      upi_vpa = $3,
      updated_at = NOW()
    WHERE transaction_id = $1
  `,

  /**
   * Update payment status to completed
   */
  MARK_PAYMENT_COMPLETED: `
      UPDATE payments.transactions
      SET
          status = 'completed',
          payment_completed_at = NOW(),
          updated_at = NOW()
      WHERE transaction_id = $1
      RETURNING transaction_id AS "transactionId", payment_completed_at AS "paymentCompletedAt"
  `,

  /**
   * Idempotent, amount-guarded completion via webhook.
   * Only updates if the transaction is still pending AND the stored amount
   * (in rupees) matches the webhook amount (in paise) after rounding.
   * Returns the transaction_id on success; empty result on status/amount mismatch.
   * $1 = transaction_id, $2 = external_transaction_id, $3 = upi_vpa, $4 = amount_paise
   */
  COMPLETE_TXN_IF_PENDING: `
    UPDATE payments.transactions
    SET status = 'completed',
        external_transaction_id = $2,
        upi_vpa = COALESCE($3, upi_vpa),
        payment_completed_at = NOW(),
        updated_at = NOW()
    WHERE transaction_id = $1
      AND status = 'pending'
      AND ROUND(amount * 100) = $4
    RETURNING transaction_id AS "transactionId"
  `,

  /**
   * Mark payment as failed
   */
  MARK_PAYMENT_FAILED: `
      UPDATE payments.transactions
      SET 
          status = 'failed',
          payment_failed_at = NOW(),
          failure_reason = $2,
          updated_at = NOW()
      WHERE transaction_id = $1
      RETURNING transaction_id AS "transactionId", payment_failed_at AS "paymentFailedAt"
  `,

  /**
   * Get payment transaction by order ID (most recent)
   */
  GET_PAYMENT_BY_ORDER: `
      SELECT
          t.transaction_id AS "transactionId",
          t.order_id AS "orderId",
          t.amount AS "amount",
          t.currency AS "currency",
          t.razorpay_order_id AS "razorpayOrderId",
          t.external_transaction_id AS "externalTransactionId",
          t.payment_gateway AS "paymentGateway",
          t.payment_mode AS "paymentMode",
          t.upi_vpa AS "upiVpa",
          t.qr_code_id AS "qrCodeId",
          t.qr_image_url AS "qrImageUrl",
          t.qr_expires_at AS "qrExpiresAt",
          t.status AS "paymentStatus",
          pm.name AS "paymentMethod",
          t.payment_initiated_at AS "paymentInitiatedAt",
          t.payment_completed_at AS "paymentCompletedAt",
          t.payment_failed_at AS "paymentFailedAt",
          t.failure_reason AS "failureReason"
      FROM payments.transactions t
      JOIN payments.payment_methods pm ON t.payment_method_id = pm.method_id
      WHERE t.order_id = $1
      ORDER BY t.created_at DESC
      LIMIT 1
  `,

  /**
   * Get transaction by Razorpay order ID (for verification & webhooks)
   */
  GET_TRANSACTION_BY_RAZORPAY_ORDER: `
      SELECT
          transaction_id AS "transactionId",
          order_id AS "orderId",
          status,
          amount
      FROM payments.transactions
      WHERE razorpay_order_id = $1
      LIMIT 1
  `,

  /**
   * Get transaction by QR code ID (for QR webhooks)
   */
  GET_TRANSACTION_BY_QR_CODE: `
      SELECT
          transaction_id AS "transactionId",
          order_id AS "orderId",
          status,
          amount
      FROM payments.transactions
      WHERE qr_code_id = $1
      LIMIT 1
  `,

  /**
   * Get order amount (total_price from pricing JSONB)
   */
  GET_ORDER_AMOUNT: `
      SELECT
          (pricing->>'totalPrice')::NUMERIC AS "totalPrice"
      FROM orders.requests
      WHERE order_id = $1
  `,

  /**
   * Get order payment mode
   */
  GET_ORDER_PAYMENT_MODE: `
      SELECT
          payment_mode AS "paymentMode"
      FROM orders.requests
      WHERE order_id = $1
  `,

  /**
   * Get refund by order ID
   */
  GET_REFUND_BY_ORDER: `
      SELECT
          r.refund_id AS "refundId",
          r.transaction_id AS "transactionId",
          r.order_id AS "orderId",
          r.refund_amount AS "refundAmount",
          r.refund_reason AS "refundReason",
          r.refund_status AS "refundStatus",
          r.external_refund_id AS "externalRefundId",
          r.initiated_at AS "initiatedAt",
          r.processed_at AS "processedAt"
      FROM payments.refunds r
      WHERE r.order_id = $1
      ORDER BY r.initiated_at DESC
      LIMIT 1
  `,

  /**
   * Update refund status to completed
   */
  MARK_REFUND_PROCESSED: `
      UPDATE payments.refunds
      SET 
          refund_status = 'completed',
          processed_at = NOW(),
          external_refund_id = $2
      WHERE refund_id = $1
      RETURNING refund_id AS "refundId", processed_at AS "processedAt"
  `,

  // ─── Driver Earnings Ledger ───────────────────────────────────────────────

  /**
   * Create driver earnings entry
   */
  CREATE_EARNINGS_ENTRY: `
      INSERT INTO payments.driver_earnings_ledger (
          driver_id, order_id, assignment_id,
          gross_amount, commission_pct, commission_amt, net_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ledger_id AS "ledgerId"
  `,

  /**
   * Get driver earnings for a period
   * $1 = driver_id, $2 = period ('today', 'week', 'month', 'all')
   */
  GET_DRIVER_EARNINGS: `
      SELECT
          ledger_id AS "ledgerId",
          order_id AS "orderId",
          gross_amount AS "grossAmount",
          commission_pct AS "commissionPct",
          commission_amt AS "commissionAmt",
          net_amount AS "netAmount",
          status,
          earned_at AS "earnedAt"
      FROM payments.driver_earnings_ledger
      WHERE driver_id = $1
        AND earned_at >= CASE
          WHEN $2 = 'today' THEN CURRENT_DATE
          WHEN $2 = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
          WHEN $2 = 'month' THEN CURRENT_DATE - INTERVAL '30 days'
          ELSE '1970-01-01'::TIMESTAMPTZ
        END
      ORDER BY earned_at DESC
  `,

  /**
   * Get all unsettled earnings grouped by driver (for daily payout batch)
   */
  GET_UNSETTLED_EARNINGS_BY_DRIVER: `
      SELECT
          driver_id AS "driverId",
          COUNT(*) AS "totalDeliveries",
          SUM(gross_amount) AS "grossTotal",
          SUM(commission_amt) AS "commissionTotal",
          SUM(net_amount) AS "netTotal"
      FROM payments.driver_earnings_ledger
      WHERE status = 'pending'
      GROUP BY driver_id
      HAVING SUM(net_amount) > 0
  `,

  /**
   * Mark earnings as settled for a driver
   */
  SETTLE_DRIVER_EARNINGS: `
      UPDATE payments.driver_earnings_ledger
      SET
          status = 'settled',
          payout_id = $2,
          settled_at = NOW()
      WHERE driver_id = $1
        AND status = 'pending'
  `,

  // ─── Driver Payouts ───────────────────────────────────────────────────────

  /**
   * Create a payout record
   */
  CREATE_PAYOUT_RECORD: `
      INSERT INTO payments.driver_payouts (
          driver_id, total_deliveries,
          gross_amount, total_commission, net_amount,
          payout_method, payout_upi_id, payout_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING payout_id AS "payoutId"
  `,

  /**
   * Update payout with external ID and status
   */
  UPDATE_PAYOUT_EXTERNAL_ID: `
      UPDATE payments.driver_payouts
      SET
          external_payout_id = $2,
          status = $3,
          failure_reason = $4
      WHERE payout_id = $1
  `,

  /**
   * Get driver payout history (paginated)
   */
  GET_DRIVER_PAYOUTS: `
      SELECT
          payout_id AS "payoutId",
          total_deliveries AS "totalDeliveries",
          gross_amount AS "grossAmount",
          total_commission AS "totalCommission",
          net_amount AS "netAmount",
          payout_method AS "payoutMethod",
          status,
          payout_date AS "payoutDate",
          completed_at AS "completedAt"
      FROM payments.driver_payouts
      WHERE driver_id = $1
      ORDER BY payout_date DESC
      LIMIT $2 OFFSET $3
  `,

  /**
   * Count driver payouts (for pagination)
   */
  COUNT_DRIVER_PAYOUTS: `
      SELECT COUNT(*) AS count
      FROM payments.driver_payouts
      WHERE driver_id = $1
  `,

  /**
   * Get driver's payout info (UPI ID from profile metadata)
   */
  GET_DRIVER_PAYOUT_INFO: `
      SELECT
          up.user_id AS "driverId",
          up.onboarding->>'payoutUpiId' AS "upiId"
      FROM users.profiles up
      WHERE up.user_id = $1
  `,

  /**
   * Get the client (business) user who owns an order.
   * Returns client_id or nothing if the order doesn't exist.
   */
  GET_ORDER_OWNER: `
    SELECT client_id AS "clientId" FROM orders.requests WHERE order_id = $1
  `,

  /**
   * Get the courier currently assigned to an order.
   * Active assignment = status NOT IN ('rejected', 'cancelled').
   * Returns the most-recent active courier_id, or nothing if unassigned.
   */
  GET_ORDER_ASSIGNED_COURIER: `
    SELECT courier_id AS "courierId" FROM orders.courier_assignments
    WHERE order_id = $1 AND status NOT IN ('rejected','cancelled')
    ORDER BY created_at DESC LIMIT 1
  `,

  // ─── Crash-safe payout queries (3.1) ─────────────────────────────────────

  /**
   * Atomically claim all pending earnings for a driver by marking them
   * 'processing' and linking them to the payout record before any provider
   * call. Returns the ledger rows that were claimed.
   * $1 = driver_id, $2 = payout_id
   */
  MARK_EARNINGS_PROCESSING: `
    UPDATE payments.driver_earnings_ledger
    SET status = 'processing', payout_id = $2
    WHERE driver_id = $1 AND status = 'pending'
    RETURNING ledger_id AS "ledgerId"
  `,

  /**
   * Settle all earnings linked to a payout once the provider confirms success.
   * $1 = payout_id
   */
  SETTLE_PROCESSING_EARNINGS: `
    UPDATE payments.driver_earnings_ledger
    SET status = 'settled', settled_at = NOW()
    WHERE payout_id = $1 AND status = 'processing'
  `,

  /**
   * Revert earnings back to 'pending' on payout failure or crash, so they
   * are included in the next run.
   * $1 = payout_id
   */
  REVERT_PROCESSING_EARNINGS: `
    UPDATE payments.driver_earnings_ledger
    SET status = 'pending', payout_id = NULL
    WHERE payout_id = $1 AND status = 'processing'
  `,

  // ─── Payout reconciliation queries (3.2) ─────────────────────────────────

  /**
   * Look up the internal payout_id from the provider's external payout id.
   * $1 = external_payout_id
   */
  GET_PAYOUT_BY_EXTERNAL_ID: `
    SELECT payout_id AS "payoutId" FROM payments.driver_payouts WHERE external_payout_id = $1
  `,

  /**
   * Mark a payout completed (webhook: payout_processed).
   * $1 = payout_id
   */
  COMPLETE_PAYOUT: `
    UPDATE payments.driver_payouts
    SET status = 'completed', completed_at = NOW()
    WHERE payout_id = $1 AND status = 'processing'
  `,

  /**
   * Mark a payout failed with a reason (webhook: payout_failed or error).
   * $1 = payout_id, $2 = failure_reason
   */
  FAIL_PAYOUT: `
    UPDATE payments.driver_payouts
    SET status = 'failed', failure_reason = $2
    WHERE payout_id = $1
  `,

  /**
   * Get a transaction by its internal transaction_id.
   * $1 = transaction_id
   */
  GET_TRANSACTION_BY_ID: `
    SELECT
      transaction_id AS "transactionId",
      order_id AS "orderId",
      amount AS "amount",
      status AS "status",
      external_transaction_id AS "externalTransactionId"
    FROM payments.transactions
    WHERE transaction_id = $1
  `,

  /**
   * Insert a new refund row in 'pending' status.
   * $1 = transaction_id, $2 = order_id, $3 = refund_amount, $4 = refund_reason, $5 = refund_status
   */
  CREATE_REFUND: `
    INSERT INTO payments.refunds (transaction_id, order_id, refund_amount, refund_reason, refund_status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING refund_id AS "refundId"
  `,

  /**
   * Mark the transaction as refunded after a successful refund.
   * $1 = transaction_id
   */
  MARK_TRANSACTION_REFUNDED: `
    UPDATE payments.transactions
    SET status = 'refunded'
    WHERE transaction_id = $1
  `,

  /**
   * Expire all pending QR transactions whose qr_expires_at is in the past.
   * Returns the transaction_ids that were updated.
   */
  EXPIRE_STALE_QR_TXNS: `
    UPDATE payments.transactions
    SET status = 'expired'
    WHERE status = 'pending'
      AND qr_code_id IS NOT NULL
      AND qr_expires_at IS NOT NULL
      AND qr_expires_at < NOW()
    RETURNING transaction_id AS "transactionId"
  `,
};
