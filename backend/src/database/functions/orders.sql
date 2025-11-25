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
    p_vehicle_category_id INT,
    p_distance_km NUMERIC,
    p_weight_tier_id INT
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_base_rate NUMERIC;
    v_per_km_rate NUMERIC;
    v_weight_surcharge NUMERIC := 0;
    v_base_price NUMERIC;
    v_distance_price NUMERIC;
    v_total_price NUMERIC;
    result JSON;
BEGIN
    -- ============================================================
    -- STEP 1: Validate that this combination is supported
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 
        FROM public.delivery_type_capabilities dtc
        WHERE dtc.delivery_type_id = p_delivery_type_id
          AND dtc.vehicle_category_id = p_vehicle_category_id
          AND dtc.weight_tier_id = p_weight_tier_id
          AND dtc.is_active = TRUE
    ) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid combination: delivery type, vehicle category, and weight tier',
            'error_code', 'INVALID_COMBINATION'
        );
    END IF;
    
    -- ============================================================
    -- STEP 2: Get base and per-km rates (with override support)
    -- ============================================================
    SELECT 
        COALESCE(dtc.base_rate_override, dt.base_rate),
        COALESCE(dtc.per_km_rate_override, dt.per_km_rate)
    INTO v_base_rate, v_per_km_rate
    FROM public.delivery_types dt
    LEFT JOIN public.delivery_type_capabilities dtc 
        ON dt.delivery_type_id = dtc.delivery_type_id
        AND dtc.vehicle_category_id = p_vehicle_category_id
        AND dtc.weight_tier_id = p_weight_tier_id
        AND dtc.is_active = TRUE
    WHERE dt.delivery_type_id = p_delivery_type_id
      AND dt.is_active = TRUE
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid delivery type',
            'error_code', 'INVALID_DELIVERY_TYPE'
        );
    END IF;
    
    -- ============================================================
    -- STEP 3: Get weight tier surcharge and info
    -- ============================================================
    SELECT 
        wt.additional_charge
    INTO 
        v_weight_surcharge
    FROM public.weight_tiers wt
    WHERE wt.tier_id = p_weight_tier_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid weight tier',
            'error_code', 'INVALID_WEIGHT_TIER'
        );
    END IF;
    
    -- ============================================================
    -- STEP 4: Calculate final price
    -- ============================================================
    v_base_price := v_base_rate;
    v_distance_price := ROUND(p_distance_km * v_per_km_rate, 2);
    v_total_price := v_base_price + v_distance_price + v_weight_surcharge;
    
    -- ============================================================
    -- STEP 5: Return structured result
    -- ============================================================
    result := json_build_object(
        'success', TRUE,
        'fare_breakdown', json_build_object(
            'basePrice', v_base_price,
            'distanceKm', p_distance_km,
            'distancePrice', v_distance_price,
            'weightSurcharge', v_weight_surcharge,
            'totalPrice', v_total_price,
            'currency', 'INR'
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'error_code', 'CALCULATION_ERROR'
    );
END;
$$;

COMMENT ON FUNCTION orders.calculate_fare IS 'Calculate delivery fare based on distance and weight tier ID';

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
    v_vehicle_category_id INT;
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
    v_client_id := (p_order_data->>'clientId')::INT;
    v_delivery_type_id := (p_order_data->>'deliveryTypeId')::INT;
    v_vehicle_category_id := (p_order_data->>'vehicleCategoryId')::INT;
    v_payment_method_id := (p_order_data->>'paymentMethodId')::INT;
    
    -- Validate client exists
    IF NOT EXISTS (
        SELECT 1 FROM users.profiles 
        WHERE user_id = v_client_id AND is_active = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Invalid client_id');
    END IF;
    
    -- VALIDATE: Vehicle category is supported for this delivery type
    IF NOT EXISTS (
        SELECT 1 FROM public.delivery_type_capabilities
        WHERE delivery_type_id = v_delivery_type_id
          AND vehicle_category_id = v_vehicle_category_id
          AND is_active = TRUE
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Vehicle category not supported for this delivery type'
        );
    END IF;
    
    -- Get 'pending' status
    SELECT status_id INTO v_status_id 
    FROM public.order_statuses 
    WHERE name = 'pending';
    
    -- Extract fare values from provided fareBreakdown
    -- The service layer has already validated these values
    v_base_price := (p_order_data->'fareBreakdown'->>'basePrice')::NUMERIC;
    v_distance_price := (p_order_data->'fareBreakdown'->>'distancePrice')::NUMERIC;
    v_weight_surcharge := (p_order_data->'fareBreakdown'->>'weightSurcharge')::NUMERIC;
    v_total_price := (p_order_data->'fareBreakdown'->>'totalPrice')::NUMERIC;
    
    -- Create pickup location
    INSERT INTO logistics.locations (
        address, latitude, longitude, location,
        city, state, postal_code, landmark,
        building_name, floor_number, flat_number,
        contact_name, contact_phone
    ) VALUES (
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
        p_order_data->'pickup'->>'postalCode',
        p_order_data->'pickup'->>'howToReach',
        p_order_data->'pickup'->>'building',
        p_order_data->'pickup'->>'floor',
        p_order_data->'pickup'->>'flatNumber',
        p_order_data->'pickup'->>'contactName',
        p_order_data->'pickup'->>'contactPhone'
    ) RETURNING location_id INTO v_pickup_location_id;
    
    -- Create delivery location
    INSERT INTO logistics.locations (
        address, latitude, longitude, location,
        city, state, postal_code, landmark,
        building_name, floor_number, flat_number,
        contact_name, contact_phone
    ) VALUES (
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
        p_order_data->'delivery'->>'postalCode',
        p_order_data->'delivery'->>'howToReach',
        p_order_data->'delivery'->>'building',
        p_order_data->'delivery'->>'floor',
        p_order_data->'delivery'->>'flatNumber',
        p_order_data->'delivery'->>'contactName',
        p_order_data->'delivery'->>'contactPhone'
    ) RETURNING location_id INTO v_delivery_location_id;
    
    -- Create order
    INSERT INTO orders.requests (
        client_id,
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id,
        status_id,
        pickup_location_id,
        delivery_location_id,
        pickup_contact_name,
        pickup_contact_phone,
        delivery_contact_name,
        delivery_contact_phone,
        package_description,
        package_type_id,
        special_instructions,
        declared_value,
        estimated_distance_km,
        base_price,
        distance_price,
        weight_surcharge,
        total_price,
        payment_method_id,
        scheduled_pickup_time,
        scheduled_delivery_time
    ) VALUES (
        v_client_id,
        v_delivery_type_id,
        v_vehicle_category_id,
        (p_order_data->>'weightTierId')::INT,
        v_status_id,
        v_pickup_location_id,
        v_delivery_location_id,
        p_order_data->'pickup'->>'contactName',
        p_order_data->'pickup'->>'contactPhone',
        p_order_data->'delivery'->>'contactName',
        p_order_data->'delivery'->>'contactPhone',
        p_order_data->>'packageDescription',
        (p_order_data->>'packageTypeId')::INT,
        p_order_data->>'specialInstructions',
        (p_order_data->>'declaredValue')::NUMERIC,
        (p_order_data->'fareBreakdown'->>'distanceKm')::NUMERIC,
        v_base_price,
        v_distance_price,
        v_weight_surcharge,
        v_total_price,
        v_payment_method_id,
        (p_order_data->>'scheduledPickupTime')::TIMESTAMPTZ,
        (p_order_data->>'scheduledDeliveryTime')::TIMESTAMPTZ
    ) RETURNING order_id, order_uuid INTO v_order_id, v_order_uuid;
    
    -- Build success response
    result := json_build_object(
        'success', true,
        'order', json_build_object(
            'orderId', v_order_id,
            'orderUuid', v_order_uuid,
            'orderNumber', (SELECT order_number FROM orders.requests WHERE order_id = v_order_id),
            'status', 'pending',
            'totalPrice', v_total_price,
            'createdAt', NOW()
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
