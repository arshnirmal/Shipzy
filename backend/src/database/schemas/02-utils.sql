-- 02-utils.sql
-- Utility trigger functions
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to set order number
CREATE OR REPLACE FUNCTION orders.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate order number: ORD-YYYYMMDD-000001
  NEW.order_number := 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(NEW.order_id :: TEXT, 6, '0');
  RETURN NEW;
END;
$$;