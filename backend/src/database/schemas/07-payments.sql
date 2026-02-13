-- 07-payments.sql
-- Payments tables and triggers
CREATE TABLE payments.transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    payment_method_id INT NOT NULL REFERENCES public.payment_methods (method_id),
    payment_status_id INT NOT NULL REFERENCES public.payment_statuses (status_id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    external_transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50),
    upi_vpa VARCHAR(100),
    payment_initiated_at TIMESTAMPTZ,
    payment_completed_at TIMESTAMPTZ,
    payment_failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_transactions_order_id ON payments.transactions (order_id);

CREATE INDEX idx_payments_transactions_status_id ON payments.transactions (payment_status_id);

CREATE INDEX idx_payments_transactions_external_id ON payments.transactions (external_transaction_id);

CREATE TRIGGER set_timestamp_payments_transactions BEFORE
UPDATE
    ON payments.transactions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TABLE payments.refunds (
    refund_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES payments.transactions (transaction_id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    refund_amount NUMERIC(10, 2) NOT NULL,
    refund_reason TEXT NOT NULL,
    refund_status VARCHAR(50) NOT NULL,
    external_refund_id VARCHAR(255),
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_refunds_transaction_id ON payments.refunds (transaction_id);

CREATE INDEX idx_payments_refunds_order_id ON payments.refunds (order_id);