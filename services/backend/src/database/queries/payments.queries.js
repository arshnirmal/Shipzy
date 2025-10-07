// services/backend/src/database/queries/payments.queries.js

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
          payment_status_id,
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
          (SELECT status_id FROM public.payment_statuses WHERE name = 'pending'),
          $3, $4, $5, $6, $7, $8, NOW()
      )
      RETURNING transaction_id, payment_initiated_at
  `,
  
  /**
   * Update payment status to completed
   */
  MARK_PAYMENT_COMPLETED: `
      UPDATE payments.transactions
      SET 
          payment_status_id = (SELECT status_id FROM public.payment_statuses WHERE name = 'completed'),
          payment_completed_at = NOW()
      WHERE transaction_id = $1
      RETURNING transaction_id, payment_completed_at
  `,
  
  /**
   * Mark payment as failed
   */
  MARK_PAYMENT_FAILED: `
      UPDATE payments.transactions
      SET 
          payment_status_id = (SELECT status_id FROM public.payment_statuses WHERE name = 'failed'),
          payment_failed_at = NOW(),
          failure_reason = $2
      WHERE transaction_id = $1
      RETURNING transaction_id, payment_failed_at
  `,
  
  /**
   * Get payment transaction by order ID
   */
  GET_PAYMENT_BY_ORDER: `
      SELECT 
          t.transaction_id,
          t.order_id,
          t.amount,
          t.currency,
          t.external_transaction_id,
          t.payment_gateway,
          t.upi_vpa,
          ps.name AS payment_status,
          pm.name AS payment_method,
          t.payment_initiated_at,
          t.payment_completed_at,
          t.payment_failed_at,
          t.failure_reason
      FROM payments.transactions t
      JOIN public.payment_statuses ps ON t.payment_status_id = ps.status_id
      JOIN public.payment_methods pm ON t.payment_method_id = pm.method_id
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
          r.refund_id,
          r.transaction_id,
          r.order_id,
          r.refund_amount,
          r.refund_reason,
          r.refund_status,
          r.external_refund_id,
          r.initiated_at,
          r.processed_at
      FROM payments.refunds r
      WHERE r.order_id = $1
      ORDER BY r.initiated_at DESC
      LIMIT 1
  `,
  
  /**
   * Update refund status to processed
   */
  MARK_REFUND_PROCESSED: `
      UPDATE payments.refunds
      SET 
          refund_status = 'processed',
          processed_at = NOW(),
          external_refund_id = $2
      WHERE refund_id = $1
      RETURNING refund_id, processed_at
  `,
};
