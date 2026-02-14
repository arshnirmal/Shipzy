-- ========================================
-- SHIPZY - PAYMENT FUNCTIONS
-- Payment processing and transaction management
-- ========================================

-- ========================================
-- Function: payments_create_transaction
-- Description: Create payment transaction record
-- Returns: Transaction ID
-- ========================================
CREATE OR REPLACE FUNCTION payments_create_transaction(
    p_order_id INT,
    p_payment_method_id INT,
    p_amount NUMERIC,
    p_currency VARCHAR DEFAULT 'INR'
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    new_transaction_id INT;
BEGIN
    INSERT INTO payments.transactions (
        order_id,
        payment_method_id,
        payment_status_id,
        amount,
        currency
    ) VALUES (
        p_order_id,
        p_payment_method_id,
        (SELECT status_id FROM payments.payment_statuses WHERE name = 'pending'),
        p_amount,
        p_currency
    )
    RETURNING transaction_id INTO new_transaction_id;

    RETURN new_transaction_id;
END;
$$;

-- ========================================
-- Function: payments_update_transaction_status
-- Description: Update payment transaction status
-- Returns: BOOLEAN indicating success
-- ========================================
CREATE OR REPLACE FUNCTION payments_update_transaction_status(
    p_transaction_id INT,
    p_status_name VARCHAR,
    p_external_transaction_id VARCHAR DEFAULT NULL,
    p_payment_gateway VARCHAR DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    status_id INT;
BEGIN
    -- Get the status_id for the given status name
    SELECT ps.status_id INTO status_id
    FROM payments.payment_statuses ps
    WHERE ps.name = p_status_name;

    IF status_id IS NULL THEN
        RAISE EXCEPTION 'Invalid payment status: %', p_status_name;
    END IF;

    -- Update the transaction
    UPDATE payments.transactions
    SET
        payment_status_id = status_id,
        external_transaction_id = COALESCE(p_external_transaction_id, external_transaction_id),
        payment_gateway = COALESCE(p_payment_gateway, payment_gateway),
        payment_completed_at = CASE WHEN p_status_name = 'completed' THEN NOW() ELSE payment_completed_at END,
        payment_failed_at = CASE WHEN p_status_name = 'failed' THEN NOW() ELSE payment_failed_at END,
        failure_reason = COALESCE(p_failure_reason, failure_reason),
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    RETURN FOUND;
END;
$$;

-- ========================================
-- Function: payments_get_by_order
-- Description: Get payment transactions by order
-- Returns: TABLE with transaction details
-- ========================================
CREATE OR REPLACE FUNCTION payments_get_by_order(
    p_order_id INT
)
RETURNS TABLE (
    transaction_id INT,
    amount NUMERIC,
    currency VARCHAR,
    status_name VARCHAR,
    external_transaction_id VARCHAR,
    payment_gateway VARCHAR,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.transaction_id,
        pt.amount,
        pt.currency,
        ps.name as status_name,
        pt.external_transaction_id,
        pt.payment_gateway,
        pt.created_at,
        pt.payment_completed_at
    FROM payments.transactions pt
    JOIN payments.payment_statuses ps ON pt.payment_status_id = ps.status_id
    WHERE pt.order_id = p_order_id
    ORDER BY pt.created_at DESC;
END;
$$;

-- ========================================
-- Function: payments_get_courier_earnings
-- Description: Calculate total earnings for courier
-- Returns: Total earnings amount
-- ========================================
CREATE OR REPLACE FUNCTION payments_get_courier_earnings(
    p_courier_id INT,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total_earnings NUMERIC := 0;
BEGIN
    -- Calculate earnings from completed deliveries
    SELECT COALESCE(SUM(pt.amount), 0) INTO total_earnings
    FROM payments.transactions pt
    JOIN orders.requests o ON pt.order_id = o.order_id
    JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
    WHERE ca.courier_id = p_courier_id
      AND ca.assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'delivered')
      AND pt.payment_status_id = (SELECT status_id FROM payments.payment_statuses WHERE name = 'completed')
      AND ca.completed_at >= p_start_date;

    RETURN total_earnings;
END;
$$;

-- ========================================
-- Function: payments_get_courier_summary
-- Description: Get payment summary for courier
-- Returns: TABLE with delivery and earnings summary
-- ========================================
CREATE OR REPLACE FUNCTION payments_get_courier_summary(
    p_courier_id INT,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
    total_deliveries BIGINT,
    total_earnings NUMERIC,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(ca.assignment_id) as total_deliveries,
        COALESCE(SUM(pt.amount), 0) as total_earnings,
        p_start_date as period_start,
        NOW() as period_end
    FROM orders.courier_assignments ca
    LEFT JOIN orders.requests o ON ca.order_id = o.order_id
    LEFT JOIN payments.transactions pt ON o.order_id = pt.order_id
        AND pt.payment_status_id = (SELECT status_id FROM payments.payment_statuses WHERE name = 'completed')
    WHERE ca.courier_id = p_courier_id
      AND ca.assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'delivered')
      AND ca.completed_at >= p_start_date;
END;
$$;
