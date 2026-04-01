// services/backend/src/database/queries/payments.queries.ts

/**
 * Payment transaction queries
 */

export default {
  // ============ PAYMENT TRANSACTIONS ============

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
   * Update payment status to completed
   */
  MARK_PAYMENT_COMPLETED: `
      UPDATE payments.transactions
      SET 
          status = 'completed',
          payment_completed_at = NOW()
      WHERE transaction_id = $1
      RETURNING transaction_id AS "transactionId", payment_completed_at AS "paymentCompletedAt"
  `,

  /**
   * Mark payment as failed
   */
  MARK_PAYMENT_FAILED: `
      UPDATE payments.transactions
      SET 
          status = 'failed',
          payment_failed_at = NOW(),
          failure_reason = $2
      WHERE transaction_id = $1
      RETURNING transaction_id AS "transactionId", payment_failed_at AS "paymentFailedAt"
  `,

  /**
   * Get payment transaction by order ID
   */
  GET_PAYMENT_BY_ORDER: `
      SELECT
          t.transaction_id AS "transactionId",
          t.order_id AS "orderId",
          t.amount AS "amount",
          t.currency AS "currency",
          t.external_transaction_id AS "externalTransactionId",
          t.payment_gateway AS "paymentGateway",
          t.upi_vpa AS "upiVpa",
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

  // ============ REFUNDS ============

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
};
