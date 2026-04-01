-- ========================================
-- SHIPZY - TRACKING FUNCTIONS
-- Real-time location tracking and event logging
-- ========================================

-- ========================================
-- Function: update_courier_location
-- Description: Update courier location and create tracking event
-- Returns: BOOLEAN indicating success
-- ========================================
CREATE OR REPLACE FUNCTION tracking.update_courier_location(
    p_courier_id INT,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_accuracy_meters NUMERIC DEFAULT NULL,
    p_speed_kmph NUMERIC DEFAULT NULL,
    p_bearing_degrees NUMERIC DEFAULT NULL,
    p_assignment_id INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_location GEOGRAPHY(POINT, 4326);
    v_order_id INT;
BEGIN
    -- Create geography point
    v_location := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

    -- Update courier status
    UPDATE logistics.courier_status
    SET
        current_location = v_location,
        last_location_update = NOW()
    WHERE courier_id = p_courier_id;

    -- Get order_id if assignment provided
    IF p_assignment_id IS NOT NULL THEN
        SELECT order_id INTO v_order_id
        FROM orders.courier_assignments
        WHERE assignment_id = p_assignment_id;
    END IF;

    -- Insert tracking event
    INSERT INTO tracking.events (
        assignment_id,
        order_id,
        courier_id,
        event_type,
        location,
        accuracy_meters,
        speed_kmph,
        bearing_degrees,
        event_description
    ) VALUES (
        p_assignment_id,
        v_order_id,
        p_courier_id,
        'location_update',
        v_location,
        p_accuracy_meters,
        p_speed_kmph,
        p_bearing_degrees,
        'Location update from mobile app'
    );

    RETURN TRUE;

EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION tracking.update_courier_location IS 'Update courier location and create tracking event';

-- ========================================
-- Function: log_tracking_event
-- Description: Log a tracking event (status change, note, etc.)
-- Returns: BIGINT (event_id)
-- ========================================
CREATE OR REPLACE FUNCTION tracking.log_tracking_event(
    p_assignment_id INT,
    p_event_type VARCHAR(50),
    p_event_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id BIGINT;
    v_order_id INT;
    v_courier_id INT;
BEGIN
    -- Get order and courier details from assignment
    SELECT
        ca.order_id,
        ca.courier_id
    INTO
        v_order_id,
        v_courier_id
    FROM orders.courier_assignments ca
    WHERE ca.assignment_id = p_assignment_id;

    -- Insert tracking event
    INSERT INTO tracking.events (
        assignment_id,
        order_id,
        courier_id,
        event_type,
        event_description,
        metadata
    ) VALUES (
        p_assignment_id,
        v_order_id,
        v_courier_id,
        p_event_type,
        p_event_description,
        p_metadata
    )
    RETURNING event_id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION tracking.log_tracking_event IS 'Log a tracking event for an assignment';

-- ========================================
-- Function: get_order_tracking_history
-- Description: Get complete tracking history for an order
-- Returns: TABLE with tracking events
-- ========================================
CREATE OR REPLACE FUNCTION tracking.get_order_tracking_history(
    p_order_id INT,
    p_limit INT DEFAULT 100
)
RETURNS TABLE (
    event_id BIGINT,
    event_type VARCHAR(50),
    event_description TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    accuracy_meters NUMERIC,
    speed_kmph NUMERIC,
    bearing_degrees NUMERIC,
    "timestamp" TIMESTAMPTZ,
    metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        te.event_id,
        te.event_type,
        te.event_description,
        ST_Y(te.location::geometry)::NUMERIC AS latitude,
        ST_X(te.location::geometry)::NUMERIC AS longitude,
        te.accuracy_meters,
        te.speed_kmph,
        te.bearing_degrees,
        te.timestamp,
        te.metadata
    FROM tracking.events te
    WHERE te.order_id = p_order_id
    ORDER BY te.timestamp DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION tracking.get_order_tracking_history IS 'Get complete tracking history for an order';

-- ========================================
-- Function: get_courier_recent_activity
-- Description: Get recent tracking activity for a courier
-- Returns: TABLE with recent events
-- ========================================
CREATE OR REPLACE FUNCTION tracking.get_courier_recent_activity(
    p_courier_id INT,
    p_hours_back INT DEFAULT 24
)
RETURNS TABLE (
    event_id BIGINT,
    "order_id" INT,
    event_type VARCHAR(50),
    event_description TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    "timestamp" TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        te.event_id,
        te.order_id,
        te.event_type,
        te.event_description,
        ST_Y(te.location::geometry)::NUMERIC AS latitude,
        ST_X(te.location::geometry)::NUMERIC AS longitude,
        te.timestamp
    FROM tracking.events te
    WHERE te.courier_id = p_courier_id
        AND te.timestamp >= NOW() - INTERVAL '1 hour' * p_hours_back
    ORDER BY te.timestamp DESC;
END;
$$;

COMMENT ON FUNCTION tracking.get_courier_recent_activity IS 'Get recent tracking activity for a courier';
