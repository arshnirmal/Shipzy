-- ========================================
-- SHIPZY - LOGISTICS FUNCTIONS
-- Courier matching and location management
-- ========================================

-- ========================================
-- Function: find_nearby_couriers
-- Description: Find available couriers within radius using PostGIS
-- Returns: TABLE with courier details and distance
-- ========================================
CREATE OR REPLACE FUNCTION logistics.find_nearby_couriers(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_km NUMERIC DEFAULT 5,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    courier_id INT,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    distance_km NUMERIC,
    vehicle_category VARCHAR(50),
    vehicle_number VARCHAR(50),
    total_deliveries_today INT,
    current_location_lat NUMERIC,
    current_location_lng NUMERIC
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.courier_id,
        u.full_name,
        u.phone_number,
        ROUND(
            ST_Distance(
                cs.current_location,
                ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
            )::numeric / 1000, 2
        ) AS distance_km,
        vc.name AS vehicle_category,
        cs.vehicle->>'vehicleNumber' AS vehicle_number,
        cs.total_deliveries_today,
        ST_Y(cs.current_location::geometry) AS current_location_lat,
        ST_X(cs.current_location::geometry) AS current_location_lng
    FROM logistics.courier_status cs
    JOIN users.profiles u ON cs.courier_id = u.user_id
    LEFT JOIN public.vehicle_categories vc ON cs.vehicle_category_id = vc.category_id
    WHERE cs.is_available = true
        AND cs.is_online = true
        AND u.is_active = true
        AND u.is_verified = true
        AND u.deleted_at IS NULL
        AND cs.current_assignment_id IS NULL
        AND cs.current_location IS NOT NULL
        AND ST_DWithin(
            cs.current_location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_km * 1000
        )
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION logistics.find_nearby_couriers IS 'Find available couriers within radius using PostGIS spatial queries';
