-- ========================================
-- SHIPZY - ORDER FUNCTIONS
-- Order creation, pricing, and management
-- ========================================

-- ========================================
-- Function: calculate_fare
-- Description: Calculate delivery fare based on distance, weight, and delivery type
-- Returns: JSON with fare breakdown
-- ========================================
CREATE OR REPLACE FUNCTION orders.calculate_fare(
    p_delivery_type_id INT,
    p_distance_km NUMERIC,
    p_weight_kg NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_base_rate NUMERIC;
    v_per_km_rate NUMERIC;
    v_weight_additional_charge NUMERIC := 0;
    v_base_price NUMERIC;
    v_distance_price NUMERIC;
    v_weight_surcharge NUMERIC;
    v_total_price NUMERIC;
    result JSON;
BEGIN
    -- Get delivery type rates
    SELECT base_rate, per_km_rate
    INTO v_base_rate, v_per_km_rate
    FROM public.delivery_types
    WHERE delivery_type_id = p_delivery_type_id
        AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid delivery type',
            'error_code', 'INVALID_DELIVERY_TYPE'
        );
    END IF;
    
    -- Get weight tier surcharge if weight provided
    IF p_weight_kg > 0 THEN
        SELECT additional_charge INTO v_weight_additional_charge
        FROM public.weight_tiers
        WHERE p_weight_kg >= min_weight_kg
            AND p_weight_kg < max_weight_kg
        LIMIT 1;
        
        v_weight_additional_charge := COALESCE(v_weight_additional_charge, 0);
    END IF;
    
    -- Calculate fare components
    v_base_price := v_base_rate;
    v_distance_price := ROUND(p_distance_km * v_per_km_rate, 2);
    v_weight_surcharge := v_weight_additional_charge;
    v_total_price := v_base_price + v_distance_price + v_weight_surcharge;
    
    -- Build result
    result := json_build_object(
        'success', true,
        'fare_breakdown', json_build_object(
            'base_price', v_base_price,
            'distance_km', p_distance_km,
            'distance_price', v_distance_price,
            'weight_kg', p_weight_kg,
            'weight_surcharge', v_weight_surcharge,
            'total_price', v_total_price
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'CALCULATION_ERROR'
    );
END;
$$;

COMMENT ON FUNCTION orders.calculate_fare IS 'Calculate delivery fare based on distance, weight, and delivery type';

-- ========================================
-- Function: create_order_with_locations
-- Description: Create order with pickup and delivery locations (atomic transaction)
-- Returns: JSON with created order details
-- ========================================
CREATE OR REPLACE FUNCTION orders.create_order_with_locations(
    p_order_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_client_id INT;
    v_delivery_type_id INT;
    v_payment_method_id INT;
    v_pickup_location_id INT;
    v_delivery_location_id INT;
    v_order_id INT;
    v_order_uuid UUID;
    v_fare_calculation JSONB;
    v_base_price NUMERIC;
    v_distance_price NUMERIC;
    v_weight_surcharge NUMERIC;
    v_total_price NUMERIC;
    v_status_id INT;
    result JSON;
BEGIN
    -- Extract and validate required fields
    v_client_id := (p_order_data->>'client_id')::INT;
    v_delivery_type_id := (p_order_data->>'delivery_type_id')::INT;
    v_payment_method_id := (p_order_data->>'payment_method_id')::INT;
    
    -- Validate client exists
    IF NOT EXISTS (SELECT 1 FROM users.profiles WHERE user_id = v_client_id AND is_active = true) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid client_id');
    END IF;
    
    -- Get pending status
    SELECT status_id INTO v_status_id FROM public.order_statuses WHERE name = 'pending';
    
    -- Calculate fare
    SELECT orders.calculate_fare(
        v_delivery_type_id,
        (p_order_data->>'estimated_distance_km')::NUMERIC,
        (p_order_data->>'package_weight_kg')::NUMERIC
    ) INTO v_fare_calculation;
    
    -- Extract fare components
    v_base_price := (v_fare_calculation->'fare_breakdown'->>'base_price')::NUMERIC;
    v_distance_price := (v_fare_calculation->'fare_breakdown'->>'distance_price')::NUMERIC;
    v_weight_surcharge := (v_fare_calculation->'fare_breakdown'->>'weight_surcharge')::NUMERIC;
    v_total_price := (v_fare_calculation->'fare_breakdown'->>'total_price')::NUMERIC;
    
    -- Create pickup location
    INSERT INTO logistics.locations (
        address, latitude, longitude, location,
        city, state, postal_code, landmark,
        contact_name, contact_phone
    )
    VALUES (
        p_order_data->'pickup'->>'address',
        (p_order_data->'pickup'->>'latitude')::NUMERIC,
        (p_order_data->'pickup'->>'longitude')::NUMERIC,
        ST_SetSRID(
            ST_MakePoint(
                (p_order_data->'pickup'->>'longitude')::NUMERIC,
                (p_order_data->'pickup'->>'latitude')::NUMERIC
            ),
            4326
        )::geography,
        p_order_data->'pickup'->>'city',
        p_order_data->'pickup'->>'state',
        p_order_data->'pickup'->>'postal_code',
        p_order_data->'pickup'->>'landmark',
        p_order_data->'pickup'->>'contact_name',
        p_order_data->'pickup'->>'contact_phone'
    )
    RETURNING location_id INTO v_pickup_location_id;
    
    -- Create delivery location
    INSERT INTO logistics.locations (
        address, latitude, longitude, location,
        city, state, postal_code, landmark,
        contact_name, contact_phone
    )
    VALUES (
        p_order_data->'delivery'->>'address',
        (p_order_data->'delivery'->>'latitude')::NUMERIC,
        (p_order_data->'delivery'->>'longitude')::NUMERIC,
        ST_SetSRID(
            ST_MakePoint(
                (p_order_data->'delivery'->>'longitude')::NUMERIC,
                (p_order_data->'delivery'->>'latitude')::NUMERIC
            ),
            4326
        )::geography,
        p_order_data->'delivery'->>'city',
        p_order_data->'delivery'->>'state',
        p_order_data->'delivery'->>'postal_code',
        p_order_data->'delivery'->>'landmark',
        p_order_data->'delivery'->>'contact_name',
        p_order_data->'delivery'->>'contact_phone'
    )
    RETURNING location_id INTO v_delivery_location_id;
    
    -- Create order
    INSERT INTO orders.requests (
        client_id,
        delivery_type_id,
        status_id,
        pickup_location_id,
        delivery_location_id,
        pickup_contact_name,
        pickup_contact_phone,
        delivery_contact_name,
        delivery_contact_phone,
        package_description,
        package_weight_kg,
        package_dimensions,
        special_instructions,
        estimated_distance_km,
        base_price,
        distance_price,
        weight_surcharge,
        total_price,
        payment_method_id,
        scheduled_pickup_time
    )
    VALUES (
        v_client_id,
        v_delivery_type_id,
        v_status_id,
        v_pickup_location_id,
        v_delivery_location_id,
        p_order_data->'pickup'->>'contact_name',
        p_order_data->'pickup'->>'contact_phone',
        p_order_data->'delivery'->>'contact_name',
        p_order_data->'delivery'->>'contact_phone',
        p_order_data->>'package_description',
        (p_order_data->>'package_weight_kg')::NUMERIC,
        p_order_data->'package_dimensions',
        p_order_data->>'special_instructions',
        (p_order_data->>'estimated_distance_km')::NUMERIC,
        v_base_price,
        v_distance_price,
        v_weight_surcharge,
        v_total_price,
        v_payment_method_id,
        (p_order_data->>'scheduled_pickup_time')::TIMESTAMPTZ
    )
    RETURNING order_id, order_uuid INTO v_order_id, v_order_uuid;
    
    -- Build success response
    result := json_build_object(
        'success', true,
        'order', json_build_object(
            'order_id', v_order_id,
            'order_uuid', v_order_uuid,
            'status', 'pending',
            'total_price', v_total_price,
            'created_at', NOW()
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'ORDER_CREATION_FAILED'
    );
END;
$$;

COMMENT ON FUNCTION orders.create_order_with_locations IS 'Create order with pickup and delivery locations in atomic transaction';

-- ========================================
-- Function: cancel_order_with_refund
-- Description: Cancel order, initiate refund, and queue notifications
-- Returns: JSON with operation result
-- ========================================
CREATE OR REPLACE FUNCTION orders.cancel_order_with_refund(
    p_order_id INT,
    p_cancellation_reason TEXT,
    p_cancelled_by_user_id INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_status_name VARCHAR(50);
    v_payment_transaction_id INT;
    v_client_id INT;
    v_order_total NUMERIC;
    result JSON;
BEGIN
    -- Get current order details
    SELECT 
        os.name,
        o.client_id,
        o.total_price
    INTO 
        v_order_status_name,
        v_client_id,
        v_order_total
    FROM orders.requests o
    JOIN public.order_statuses os ON o.status_id = os.status_id
    WHERE o.order_id = p_order_id
        AND o.deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- Validate order can be cancelled
    IF v_order_status_name IN ('delivered', 'cancelled') THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Order cannot be cancelled in %s status', v_order_status_name)
        );
    END IF;
    
    -- Update order status
    UPDATE orders.requests
    SET 
        status_id = (SELECT status_id FROM public.order_statuses WHERE name = 'cancelled'),
        cancelled_at = NOW(),
        cancellation_reason = p_cancellation_reason,
        updated_at = NOW()
    WHERE order_id = p_order_id;
    
    -- Update courier assignment if exists
    UPDATE orders.courier_assignments
    SET 
        assignment_status_id = (SELECT status_id FROM public.assignment_statuses WHERE name = 'cancelled'),
        updated_at = NOW()
    WHERE order_id = p_order_id
        AND assignment_status_id NOT IN (
            SELECT status_id FROM public.assignment_statuses WHERE name IN ('cancelled', 'rejected')
        );
    
    -- Check for completed payment
    SELECT transaction_id INTO v_payment_transaction_id
    FROM payments.transactions
    WHERE order_id = p_order_id
        AND payment_status_id = (SELECT status_id FROM public.payment_statuses WHERE name = 'completed')
    LIMIT 1;
    
    -- Initiate refund if payment was completed
    IF v_payment_transaction_id IS NOT NULL THEN
        INSERT INTO payments.refunds (
            transaction_id,
            order_id,
            refund_amount,
            refund_reason,
            refund_status
        )
        VALUES (
            v_payment_transaction_id,
            p_order_id,
            v_order_total,
            p_cancellation_reason,
            'pending'
        );
    END IF;
    
    -- Queue notification to user
    INSERT INTO notifications.queue (
        user_id,
        channel_id,
        status_id,
        title,
        body,
        data,
        priority
    )
    VALUES (
        v_client_id,
        (SELECT channel_id FROM public.notification_channels WHERE name = 'push'),
        (SELECT status_id FROM public.notification_statuses WHERE name = 'pending'),
        'Order Cancelled',
        format('Your order #%s has been cancelled. %s', 
            p_order_id,
            CASE WHEN v_payment_transaction_id IS NOT NULL 
                THEN 'Refund will be processed within 3-5 business days.'
                ELSE ''
            END
        ),
        json_build_object(
            'order_id', p_order_id,
            'type', 'order_cancelled'
        ),
        'high'
    );
    
    -- Build success response
    result := json_build_object(
        'success', true,
        'order_id', p_order_id,
        'refund_initiated', v_payment_transaction_id IS NOT NULL,
        'refund_amount', CASE WHEN v_payment_transaction_id IS NOT NULL THEN v_order_total ELSE 0 END,
        'cancelled_at', NOW()
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'CANCELLATION_FAILED'
    );
END;
$$;

COMMENT ON FUNCTION orders.cancel_order_with_refund IS 'Cancel order, initiate refund, and queue notifications atomically';
