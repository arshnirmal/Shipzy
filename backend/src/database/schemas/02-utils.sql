-- 02-utils.sql
-- Utility trigger functions
CREATE
OR REPLACE FUNCTION public.trigger_set_timestamp() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Function to set order number
CREATE
OR REPLACE FUNCTION orders.set_order_number() RETURNS TRIGGER AS $ $ BEGIN -- Generate order number: ORD-YYYYMMDD-000001
NEW.order_number := 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(NEW.order_id :: TEXT, 6, '0');

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;