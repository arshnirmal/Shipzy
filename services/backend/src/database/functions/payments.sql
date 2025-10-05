-- Payments Functions for Shipzy

-- Function to create payment record
CREATE OR REPLACE FUNCTION payments_create(
    p_order_id UUID,
    p_amount NUMERIC,
    p_currency VARCHAR DEFAULT 'USD',
    p_status VARCHAR DEFAULT 'pending'
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO payments (order_id, amount, currency, status)
    VALUES (p_order_id, p_amount, p_currency, p_status)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status
CREATE OR REPLACE FUNCTION payments_update_status(
    p_payment_id UUID,
    p_status VARCHAR,
    p_transaction_id VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE payments
    SET status = p_status,
        transaction_id = p_transaction_id,
        updated_at = CURRENT_TIMESTAMP  -- Assuming updated_at column exists
    WHERE id = p_payment_id
    RETURNING TRUE INTO BOOLEAN;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment by order
CREATE OR REPLACE FUNCTION payments_get_by_order(
    p_order_id UUID
) RETURNS TABLE (
    id UUID,
    amount NUMERIC,
    status VARCHAR,
    transaction_id VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, amount, status, transaction_id
    FROM payments
    WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total earnings for driver
CREATE OR REPLACE FUNCTION payments_get_driver_earnings(
    p_driver_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days'
) RETURNS NUMERIC AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(p.amount), 0) INTO total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE o.driver_id = p_driver_id
      AND p.created_at >= p_start_date
      AND p.status = 'completed';
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;
