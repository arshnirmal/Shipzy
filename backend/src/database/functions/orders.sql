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
    p_weight_tier_id INT,
    p_package_type_id INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    -- Pricing configuration variables (loaded in a single query)
    v_platform_fee         NUMERIC;
    v_gst_rate             NUMERIC;
    v_special_handling_fee NUMERIC := 0;

    -- Base calculation variables
    v_base_rate            NUMERIC;
    v_per_km_rate          NUMERIC;
    v_weight_surcharge     NUMERIC := 0;
    v_base_price           NUMERIC;
    v_distance_price       NUMERIC;
    v_subtotal_before_tax  NUMERIC;
    v_gst_amount           NUMERIC;
    v_total_price          NUMERIC;
    v_pricing_json         JSON;

    result JSON;

BEGIN
    -- ============================================================
    -- STEP 1: Load pricing configuration (single query)
    -- ============================================================
    SELECT
        MAX(config_value) FILTER (WHERE config_key = 'platform_fee') AS platform_fee,
        MAX(config_value) FILTER (WHERE config_key = 'gst_rate')     AS gst_rate
    INTO v_platform_fee, v_gst_rate
    FROM public.pricing_config
    WHERE config_key IN ('platform_fee', 'gst_rate')
      AND is_active = TRUE;

    -- ============================================================
    -- STEP 2: Special handling fee from package type (if provided)
    -- ============================================================
    IF p_package_type_id IS NOT NULL THEN
        SELECT special_handling_fee INTO v_special_handling_fee
        FROM public.package_types
        WHERE package_type_id = p_package_type_id;
    END IF;

    -- ============================================================
    -- STEP 3: Validate that this combination is supported
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1
        FROM public.delivery_type_capabilities dtc
        WHERE dtc.delivery_type_id    = p_delivery_type_id
          AND dtc.vehicle_category_id = p_vehicle_category_id
          AND dtc.weight_tier_id      = p_weight_tier_id
          AND dtc.is_active           = TRUE
    ) THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid combination: delivery type, vehicle category, and weight tier',
            'error_code', 'INVALID_COMBINATION'
        );
    END IF;

    -- ============================================================
    -- STEP 4: Get base and per-km rates (with override support)
    -- ============================================================
    SELECT
        COALESCE(dtc.base_rate_override, dt.base_rate),
        COALESCE(dtc.per_km_rate_override, dt.per_km_rate)
    INTO v_base_rate, v_per_km_rate
    FROM public.delivery_types dt
    LEFT JOIN public.delivery_type_capabilities dtc
        ON  dt.delivery_type_id      = dtc.delivery_type_id
        AND dtc.vehicle_category_id  = p_vehicle_category_id
        AND dtc.weight_tier_id       = p_weight_tier_id
        AND dtc.is_active            = TRUE
    WHERE dt.delivery_type_id = p_delivery_type_id
      AND dt.is_active        = TRUE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Invalid delivery type',
            'error_code', 'INVALID_DELIVERY_TYPE'
        );
    END IF;

    -- ============================================================
    -- STEP 5: Get weight tier surcharge
    -- ============================================================
    SELECT wt.additional_charge INTO v_weight_surcharge
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
    -- STEP 6: Calculate final price
    -- ============================================================
    v_base_price          := v_base_rate;
    v_distance_price      := ROUND(p_distance_km * v_per_km_rate, 2);
    v_subtotal_before_tax := v_base_price + v_distance_price + v_weight_surcharge
                           + v_platform_fee + v_special_handling_fee;
    v_gst_amount          := ROUND(v_subtotal_before_tax * v_gst_rate, 2);
    v_total_price         := v_subtotal_before_tax + v_gst_amount;

    -- ============================================================
    -- STEP 7: Return structured result
    -- ============================================================
    v_pricing_json := json_build_object(
            'basePrice',          v_base_price,
            'distanceKm',         p_distance_km,
            'distancePrice',      v_distance_price,
            'weightSurcharge',    v_weight_surcharge,
            'platformFee',        v_platform_fee,
            'specialHandlingFee', v_special_handling_fee,
            'subtotalBeforeTax',  v_subtotal_before_tax,
            'gstAmount',          v_gst_amount,
            'totalPrice',         v_total_price,
            'currency',           'INR'
        );

    result := json_build_object(
        'success', TRUE,
        'pricing', v_pricing_json
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
-- Description: Create order with pickup and delivery locations as JSONB (atomic transaction)
-- Returns: JSON with created order details
-- ========================================
CREATE OR REPLACE FUNCTION orders.create_order_with_locations(
    p_order_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_client_id            INT;
    v_delivery_type_id     INT;
    v_vehicle_category_id  INT;
    v_payment_method_id    INT;
    v_weight_tier_id       INT;
    v_package_type_id      INT;
    v_order_id             INT;
    v_order_uuid           UUID;
    v_order_number         VARCHAR(50);
    v_status               order_status := 'pending';

    -- Fare values extracted from fareBreakdown
    v_base_price           NUMERIC;
    v_distance_price       NUMERIC;
    v_weight_surcharge     NUMERIC;
    v_platform_fee         NUMERIC;
    v_platform_fee_default NUMERIC := 0;
    v_special_handling_fee NUMERIC;
    v_subtotal_before_tax  NUMERIC;
    v_gst_amount           NUMERIC;
    v_total_price          NUMERIC;

    -- JSONB column values
    v_pickup_location      JSONB;
    v_delivery_location    JSONB;
    v_items                JSONB;
    v_pricing              JSONB;
    v_schedule             JSONB;
    v_package              JSONB;
    v_snapshot             JSONB;

    -- Snapshot fields from master tables
    v_dt_name              VARCHAR;
    v_dt_display_name      VARCHAR;
    v_vc_name              VARCHAR;
    v_vc_display_name      VARCHAR;
    v_vc_max_weight_kg     NUMERIC;
    v_wt_name              VARCHAR;
    v_wt_min_weight_kg     NUMERIC;
    v_wt_max_weight_kg     NUMERIC;
    v_wt_additional_charge NUMERIC;
    v_pt_name              VARCHAR;
    v_pm_name              VARCHAR;
    v_now_iso              TEXT;

    result JSON;

BEGIN
    -- Extract IDs
    v_client_id           := (p_order_data ->> 'clientId')::INT;
    v_delivery_type_id    := (p_order_data -> 'fulfillment' ->> 'deliveryTypeId')::INT;
    v_vehicle_category_id := (p_order_data -> 'fulfillment' ->> 'vehicleCategoryId')::INT;
    v_payment_method_id   := (p_order_data -> 'fulfillment' ->> 'paymentMethodId')::INT;
    v_weight_tier_id      := (p_order_data -> 'fulfillment' ->> 'weightTierId')::INT;
    v_package_type_id     := (p_order_data -> 'fulfillment' ->> 'packageTypeId')::INT;

    -- Validate client
    IF NOT EXISTS (
        SELECT 1 FROM users.profiles WHERE user_id = v_client_id AND is_active = TRUE
    ) THEN
        RETURN json_build_object('success', FALSE, 'error', 'Invalid client_id');
    END IF;

    -- Validate vehicle category is supported for this delivery type
    IF NOT EXISTS (
        SELECT 1 FROM public.delivery_type_capabilities
        WHERE delivery_type_id    = v_delivery_type_id
          AND vehicle_category_id = v_vehicle_category_id
          AND is_active           = TRUE
    ) THEN
        RETURN json_build_object('success', FALSE, 'error', 'Vehicle category not supported for this delivery type');
    END IF;

    -- Load platform fee fallback
    SELECT config_value INTO v_platform_fee_default
    FROM public.pricing_config
    WHERE config_key = 'platform_fee' AND is_active = TRUE
    LIMIT 1;

    -- Extract fare values from provided pricing object
    v_base_price           := (p_order_data -> 'pricing' ->> 'basePrice')::NUMERIC;
    v_distance_price       := (p_order_data -> 'pricing' ->> 'distancePrice')::NUMERIC;
    v_weight_surcharge     := (p_order_data -> 'pricing' ->> 'weightSurcharge')::NUMERIC;
    v_platform_fee         := COALESCE((p_order_data -> 'pricing' ->> 'platformFee')::NUMERIC, v_platform_fee_default);
    v_special_handling_fee := COALESCE((p_order_data -> 'pricing' ->> 'specialHandlingFee')::NUMERIC, 0.00);
    v_subtotal_before_tax  := COALESCE(
        (p_order_data -> 'pricing' ->> 'subtotalBeforeTax')::NUMERIC,
        v_base_price + v_distance_price + v_weight_surcharge + v_platform_fee + v_special_handling_fee
    );
    v_gst_amount           := COALESCE(
        (p_order_data -> 'pricing' ->> 'gstAmount')::NUMERIC,
        ROUND(v_subtotal_before_tax * 0.18, 2)
    );
    v_total_price          := (p_order_data -> 'pricing' ->> 'totalPrice')::NUMERIC;

    -- Build location JSONB objects
    v_pickup_location := jsonb_build_object(
        'fullAddress', p_order_data -> 'locations' -> 'pickup' ->> 'fullAddress',
        'city',        p_order_data -> 'locations' -> 'pickup' ->> 'city',
        'state',       p_order_data -> 'locations' -> 'pickup' ->> 'state',
        'postalCode',  p_order_data -> 'locations' -> 'pickup' ->> 'postalCode',
        'latitude',   (p_order_data -> 'locations' -> 'pickup' ->> 'latitude')::NUMERIC,
        'longitude',  (p_order_data -> 'locations' -> 'pickup' ->> 'longitude')::NUMERIC,
        'building',    p_order_data -> 'locations' -> 'pickup' ->> 'building',
        'floor',       p_order_data -> 'locations' -> 'pickup' ->> 'floor',
        'flatNumber',  p_order_data -> 'locations' -> 'pickup' ->> 'flatNumber',
        'landmark',    p_order_data -> 'locations' -> 'pickup' ->> 'landmark',
        'howToReach',  p_order_data -> 'locations' -> 'pickup' ->> 'howToReach',
        'contactName', p_order_data -> 'locations' -> 'pickup' ->> 'contactName',
        'contactPhone',p_order_data -> 'locations' -> 'pickup' ->> 'contactPhone'
    );

    v_delivery_location := jsonb_build_object(
        'fullAddress', p_order_data -> 'locations' -> 'delivery' ->> 'fullAddress',
        'city',        p_order_data -> 'locations' -> 'delivery' ->> 'city',
        'state',       p_order_data -> 'locations' -> 'delivery' ->> 'state',
        'postalCode',  p_order_data -> 'locations' -> 'delivery' ->> 'postalCode',
        'latitude',   (p_order_data -> 'locations' -> 'delivery' ->> 'latitude')::NUMERIC,
        'longitude',  (p_order_data -> 'locations' -> 'delivery' ->> 'longitude')::NUMERIC,
        'building',    p_order_data -> 'locations' -> 'delivery' ->> 'building',
        'floor',       p_order_data -> 'locations' -> 'delivery' ->> 'floor',
        'flatNumber',  p_order_data -> 'locations' -> 'delivery' ->> 'flatNumber',
        'landmark',    p_order_data -> 'locations' -> 'delivery' ->> 'landmark',
        'howToReach',  p_order_data -> 'locations' -> 'delivery' ->> 'howToReach',
        'contactName', p_order_data -> 'locations' -> 'delivery' ->> 'contactName',
        'contactPhone',p_order_data -> 'locations' -> 'delivery' ->> 'contactPhone'
    );

    v_items := COALESCE(p_order_data -> 'items', '[]'::JSONB);

    -- Build pricing JSONB
    v_pricing := jsonb_build_object(
        'basePrice',          v_base_price,
        'distanceKm',        (p_order_data -> 'pricing' ->> 'distanceKm')::NUMERIC,
        'distancePrice',      v_distance_price,
        'weightSurcharge',    v_weight_surcharge,
        'platformFee',        v_platform_fee,
        'specialHandlingFee', v_special_handling_fee,
        'subtotalBeforeTax',  v_subtotal_before_tax,
        'gstAmount',          v_gst_amount,
        'totalPrice',         v_total_price,
        'currency',           'INR'
    );

    -- Build schedule JSONB
    v_schedule := jsonb_build_object(
        'pickupAt',   p_order_data -> 'schedule' ->> 'pickupAt',
        'deliveryAt', p_order_data -> 'schedule' ->> 'deliveryAt'
    );

    -- Build package JSONB
    v_package := jsonb_build_object(
        'description',         p_order_data -> 'package' ->> 'description',
        'specialInstructions', p_order_data -> 'package' ->> 'specialInstructions',
        'declaredValue',      (p_order_data -> 'package' ->> 'declaredValue')::NUMERIC,
        'notifyRecipientSms',  COALESCE((p_order_data -> 'package' ->> 'notifyRecipientSms')::BOOLEAN, FALSE)
    );

    v_now_iso := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    -- Build snapshot JSONB (denormalize master data at creation time)
    SELECT dt.name, dt.display_name
    INTO v_dt_name, v_dt_display_name
    FROM public.delivery_types dt
    WHERE dt.delivery_type_id = v_delivery_type_id;

    SELECT vc.name, vc.display_name, vc.max_weight_kg
    INTO v_vc_name, v_vc_display_name, v_vc_max_weight_kg
    FROM public.vehicle_categories vc
    WHERE vc.category_id = v_vehicle_category_id;

    IF v_weight_tier_id IS NOT NULL THEN
        SELECT wt.name, wt.min_weight_kg, wt.max_weight_kg, wt.additional_charge
        INTO v_wt_name, v_wt_min_weight_kg, v_wt_max_weight_kg, v_wt_additional_charge
        FROM public.weight_tiers wt
        WHERE wt.tier_id = v_weight_tier_id;
    END IF;

    IF v_package_type_id IS NOT NULL THEN
        SELECT pt.name INTO v_pt_name
        FROM public.package_types pt
        WHERE pt.package_type_id = v_package_type_id;
    END IF;

    SELECT pm.name INTO v_pm_name
    FROM payments.payment_methods pm
    WHERE pm.method_id = v_payment_method_id;

    v_snapshot := jsonb_build_object(
        'deliveryType', jsonb_build_object(
            'id',          v_delivery_type_id,
            'name',        v_dt_name,
            'displayName', v_dt_display_name
        ),
        'vehicleCategory', jsonb_build_object(
            'id',           v_vehicle_category_id,
            'name',         v_vc_name,
            'displayName',  v_vc_display_name,
            'maxWeightKg',  v_vc_max_weight_kg
        ),
        'weightTier', CASE WHEN v_weight_tier_id IS NOT NULL THEN jsonb_build_object(
            'id',               v_weight_tier_id,
            'name',             v_wt_name,
            'minWeightKg',      v_wt_min_weight_kg,
            'maxWeightKg',      v_wt_max_weight_kg,
            'additionalCharge', v_wt_additional_charge
        ) ELSE NULL END,
        'packageType', CASE WHEN v_package_type_id IS NOT NULL THEN jsonb_build_object(
            'id',   v_package_type_id,
            'name', v_pt_name
        ) ELSE NULL END,
        'paymentMethod', jsonb_build_object(
            'id',   v_payment_method_id,
            'name', v_pm_name
        )
    );

    -- Insert order with consolidated JSONB columns
    INSERT INTO orders.requests (
        client_id, delivery_type_id, vehicle_category_id, weight_tier_id,
        package_type_id, payment_method_id, status,
        pickup_location, delivery_location, items,
        pricing, schedule, package, snapshot,
        estimated_distance_km, total_price,
        coupon_code
    )
    VALUES (
        v_client_id, v_delivery_type_id, v_vehicle_category_id, v_weight_tier_id,
        v_package_type_id, v_payment_method_id, v_status,
        v_pickup_location, v_delivery_location, v_items,
        v_pricing, v_schedule, v_package, v_snapshot,
        (p_order_data -> 'pricing' ->> 'distanceKm')::NUMERIC,
        v_total_price,
        p_order_data ->> 'couponCode'
    )
    RETURNING order_id, order_uuid INTO v_order_id, v_order_uuid;

    -- Generate human-readable order number
    v_order_number := format('ORD-%s-%s',
        to_char(NOW(), 'YYYYMMDD'),
        LPAD(v_order_id::TEXT, 6, '0')
    );

    UPDATE orders.requests
    SET order_number = v_order_number
    WHERE order_id = v_order_id;

    -- Seed status history
    INSERT INTO orders.status_history (order_id, status, previous_status, changed_by)
    VALUES (v_order_id, 'pending', NULL, v_client_id);

    result := json_build_object(
        'success', TRUE,
        'order', json_build_object(
            'identifiers', json_build_object(
                'orderId', v_order_id,
                'orderUuid', v_order_uuid,
                'orderNumber', v_order_number
            ),
            'status',      'pending',
            'fulfillment', json_build_object(
                'deliveryTypeId', v_delivery_type_id,
                'vehicleCategoryId', v_vehicle_category_id,
                'weightTierId', v_weight_tier_id,
                'packageTypeId', v_package_type_id,
                'paymentMethodId', v_payment_method_id
            ),
            'locations', json_build_object(
                'pickup', v_pickup_location,
                'delivery', v_delivery_location
            ),
            'package', v_package,
            'schedule', v_schedule,
            'pricing', v_pricing,
            'couponCode', p_order_data ->> 'couponCode',
            'items', v_items,
            'metrics', json_build_object(
                'estimatedDistanceKm', (p_order_data -> 'pricing' ->> 'distanceKm')::NUMERIC,
                'actualDistanceKm', NULL,
                'actualDurationMins', NULL,
                'totalPrice', v_total_price
            ),
            'timeline', json_build_object(
                'createdAt', v_now_iso,
                'acceptedAt', NULL,
                'pickedUpAt', NULL,
                'inTransitAt', NULL,
                'deliveredAt', NULL,
                'cancelledAt', NULL
            ),
            'snapshot', v_snapshot,
            'actual', jsonb_build_object()
        )
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
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
    p_order_id             INT,
    p_cancellation_reason  TEXT,
    p_cancelled_by_user_id INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_status          order_status;
    v_payment_transaction_id INT;
    v_client_id             INT;
    v_order_total           NUMERIC;
    v_cancelled_at_iso      TEXT;

    result JSON;

BEGIN
    SELECT o.status, o.client_id, o.total_price
    INTO v_order_status, v_client_id, v_order_total
    FROM orders.requests o
    WHERE o.order_id = p_order_id
      AND o.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Order not found');
    END IF;

    IF v_order_status IN ('delivered', 'cancelled') THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', format('Order cannot be cancelled in %s status', v_order_status)
        );
    END IF;

    -- Update order status
    UPDATE orders.requests
    SET status             = 'cancelled',
        cancelled_at       = NOW(),
        cancellation_reason = p_cancellation_reason,
        updated_at         = NOW()
    WHERE order_id = p_order_id;

    v_cancelled_at_iso := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    -- Record status transition
    INSERT INTO orders.status_history (order_id, status, previous_status, changed_by, notes)
    VALUES (p_order_id, 'cancelled', v_order_status, p_cancelled_by_user_id, p_cancellation_reason);

    -- Cancel courier assignment if exists
    UPDATE orders.courier_assignments
    SET status     = 'cancelled',
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND status NOT IN ('cancelled', 'rejected');

    -- Check for completed payment
    SELECT transaction_id INTO v_payment_transaction_id
    FROM payments.transactions
    WHERE order_id = p_order_id
      AND status   = 'completed'
    LIMIT 1;

    -- Initiate refund if payment was completed
    IF v_payment_transaction_id IS NOT NULL THEN
        INSERT INTO payments.refunds (
            transaction_id, order_id, refund_amount, refund_reason, refund_status
        )
        VALUES (
            v_payment_transaction_id, p_order_id,
            v_order_total, p_cancellation_reason, 'pending'
        );
    END IF;

    -- Queue notification
    INSERT INTO notifications.queue (
        user_id, channel, status, title, body, data, priority
    )
    VALUES (
        v_client_id, 'push', 'pending',
        'Order Cancelled',
        format('Your order #%s has been cancelled. %s',
            p_order_id,
            CASE WHEN v_payment_transaction_id IS NOT NULL
                 THEN 'Refund will be processed within 3-5 business days.'
                 ELSE '' END
        ),
        json_build_object('order_id', p_order_id, 'type', 'order_cancelled'),
        'high'
    );

    result := json_build_object(
        'success',         TRUE,
        'order', json_build_object(
            'orderId', p_order_id,
            'status', 'cancelled',
            'cancelledAt', v_cancelled_at_iso,
            'cancellationReason', p_cancellation_reason
        ),
        'refund', json_build_object(
            'initiated', v_payment_transaction_id IS NOT NULL,
            'amount', CASE WHEN v_payment_transaction_id IS NOT NULL THEN v_order_total ELSE 0 END,
            'status', CASE WHEN v_payment_transaction_id IS NOT NULL THEN 'pending' ELSE 'not_required' END
        )
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'error_code', 'CANCELLATION_FAILED'
    );
END;
$$;

COMMENT ON FUNCTION orders.cancel_order_with_refund IS 'Cancel order, initiate refund, and queue notifications atomically';


-- ========================================
-- Function: assign_order_to_courier
-- Description: Atomically assign an order to a courier with row-level locks
-- Returns: JSON indicating success/failure and assignment_id
-- ========================================
CREATE OR REPLACE FUNCTION orders.assign_order_to_courier(
    p_order_id  INT,
    p_courier_id INT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_status   order_status;
    v_assignment_id  INT;
    v_assigned_at_iso TEXT;
    v_accepted_at_iso TEXT;

BEGIN
    -- Lock the order row to prevent concurrent assignments
    PERFORM 1 FROM orders.requests WHERE order_id = p_order_id FOR UPDATE;

    SELECT o.status INTO v_order_status
    FROM orders.requests o
    WHERE o.order_id = p_order_id;

    IF NOT FOUND OR v_order_status IS NULL THEN
        RETURN json_build_object('success', FALSE, 'error', 'Order not found');
    END IF;

    IF v_order_status != 'pending' THEN
        RETURN json_build_object('success', FALSE, 'error', 'Order is not in a pending state');
    END IF;

    -- Lock courier status row
    PERFORM 1 FROM logistics.courier_status WHERE courier_id = p_courier_id FOR UPDATE;

    -- Check courier availability
    IF NOT EXISTS (
        SELECT 1 FROM logistics.courier_status cs
        WHERE cs.courier_id            = p_courier_id
          AND cs.is_available          = TRUE
          AND cs.is_online             = TRUE
          AND cs.current_assignment_id IS NULL
    ) THEN
        RETURN json_build_object('success', FALSE, 'error', 'Courier not available');
    END IF;

    -- Create assignment
    INSERT INTO orders.courier_assignments (order_id, courier_id, status, timeline)
    VALUES (
        p_order_id,
        p_courier_id,
        'accepted',
        jsonb_build_object(
            'acceptedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'rejectedAt', NULL
        )
    )
    RETURNING assignment_id INTO v_assignment_id;

    -- Update courier status and order status atomically
    UPDATE logistics.courier_status
    SET current_assignment_id = v_assignment_id,
        is_available          = FALSE,
        updated_at            = NOW()
    WHERE courier_id = p_courier_id;

    UPDATE orders.requests
    SET status      = 'accepted',
        accepted_at = NOW(),
        updated_at  = NOW()
    WHERE order_id = p_order_id;

    v_assigned_at_iso := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    v_accepted_at_iso := v_assigned_at_iso;

    RETURN json_build_object(
        'success', TRUE,
        'assignment', json_build_object(
            'assignmentId', v_assignment_id,
            'orderId', p_order_id,
            'courierId', p_courier_id,
            'status', 'accepted',
            'assignedAt', v_assigned_at_iso,
            'acceptedAt', v_accepted_at_iso
        ),
        'order', json_build_object(
            'orderId', p_order_id,
            'status', 'accepted',
            'acceptedAt', v_accepted_at_iso
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION orders.assign_order_to_courier IS 'Atomically assign an order to a courier with row-level locking to avoid race conditions';
