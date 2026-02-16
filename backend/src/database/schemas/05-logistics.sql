-- 05-logistics.sql
-- Courier vehicles, courier status, driver sessions, locations
-- Vehicle Categories moved to public schema for centralized master data

-- Add foreign key constraint to delivery_type_capabilities after vehicle_categories is created
ALTER TABLE public.delivery_type_capabilities
ADD CONSTRAINT fk_delivery_type_capabilities_vehicle_category
FOREIGN KEY (vehicle_category_id) REFERENCES public.vehicle_categories (category_id) ON DELETE CASCADE;

-- ============================================================
-- DELIVERY TYPE CAPABILITIES
-- Link delivery types with vehicle categories and weight tiers
-- ============================================================
-- DELIVER NOW - Supports 2-Wheeler (0-20kg)
INSERT INTO
    public.delivery_type_capabilities (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
SELECT
    dt.delivery_type_id,
    vc.category_id,
    wt.tier_id
FROM
    public.delivery_types dt
    CROSS JOIN public.vehicle_categories vc
    CROSS JOIN public.weight_tiers wt
WHERE
    dt.name = 'deliver_now'
    AND vc.name = '2_wheeler'
    AND wt.max_weight_kg <= 20.00;

-- DELIVER NOW - Supports 3-Wheeler (0-100kg)
INSERT INTO
    public.delivery_type_capabilities (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
SELECT
    dt.delivery_type_id,
    vc.category_id,
    wt.tier_id
FROM
    public.delivery_types dt
    CROSS JOIN public.vehicle_categories vc
    CROSS JOIN public.weight_tiers wt
WHERE
    dt.name = 'deliver_now'
    AND vc.name = '3_wheeler'
    AND wt.max_weight_kg <= 100.00;

-- SCHEDULED - Supports 2-Wheeler and 3-Wheeler
INSERT INTO
    public.delivery_type_capabilities (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
SELECT
    dt.delivery_type_id,
    vc.category_id,
    wt.tier_id
FROM
    public.delivery_types dt
    CROSS JOIN public.vehicle_categories vc
    CROSS JOIN public.weight_tiers wt
WHERE
    dt.name = 'scheduled'
    AND vc.name IN ('2_wheeler', '3_wheeler')
    AND (
        (
            vc.name = '2_wheeler'
            AND wt.max_weight_kg <= 20.00
        )
        OR (
            vc.name = '3_wheeler'
            AND wt.max_weight_kg <= 100.00
        )
    );

-- END-OF-DAY - Supports all except Truck
INSERT INTO
    public.delivery_type_capabilities (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
SELECT
    dt.delivery_type_id,
    vc.category_id,
    wt.tier_id
FROM
    public.delivery_types dt
    CROSS JOIN public.vehicle_categories vc
    CROSS JOIN public.weight_tiers wt
WHERE
    dt.name = 'end_of_day'
    AND vc.name IN ('2_wheeler', '3_wheeler')
    AND (
        (
            vc.name = '2_wheeler'
            AND wt.max_weight_kg <= 20.00
        )
        OR (
            vc.name = '3_wheeler'
            AND wt.max_weight_kg <= 100.00
        )
    );

-- TRUCK DELIVERY - Only trucks, all heavy tiers
INSERT INTO
    public.delivery_type_capabilities (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
SELECT
    dt.delivery_type_id,
    vc.category_id,
    wt.tier_id
FROM
    public.delivery_types dt
    CROSS JOIN public.vehicle_categories vc
    CROSS JOIN public.weight_tiers wt
WHERE
    dt.name = 'truck_delivery'
    AND vc.name IN ('mini_truck', 'truck')
    AND wt.min_weight_kg >= 20.00;

CREATE TABLE logistics.courier_vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    courier_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES public.vehicle_categories (category_id),
    vehicle_number VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    year INT,
    insurance_expiry DATE,
    registration_document_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logistics_courier_vehicles_courier_id ON logistics.courier_vehicles (courier_id);

CREATE TRIGGER set_timestamp_logistics_courier_vehicles BEFORE
UPDATE
    ON logistics.courier_vehicles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TABLE logistics.courier_status (
    status_id SERIAL PRIMARY KEY,
    courier_id INT UNIQUE NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    current_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMPTZ,
    current_assignment_id INT,
    total_deliveries_today INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics.driver_sessions (
    session_id BIGSERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES logistics.courier_status(courier_id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NULL,
    total_online_minutes INTEGER NULL,
    last_location_lat DECIMAL(10, 8),
    last_location_lng DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver_started ON logistics.driver_sessions(driver_id, started_at);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_active ON logistics.driver_sessions(driver_id)
WHERE
    ended_at IS NULL;

CREATE INDEX idx_logistics_courier_status_available ON logistics.courier_status (is_available, is_online)
WHERE
    is_available = TRUE
    AND is_online = TRUE;

CREATE INDEX idx_logistics_courier_status_location ON logistics.courier_status USING GIST (current_location);

CREATE INDEX idx_logistics_courier_status_courier_id ON logistics.courier_status (courier_id);

CREATE TRIGGER set_timestamp_logistics_courier_status BEFORE
UPDATE
    ON logistics.courier_status FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON TABLE logistics.courier_status IS 'Real-time courier availability and location for order matching';

CREATE TABLE logistics.locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100),
    floor_number VARCHAR(10),
    flat_number VARCHAR(10),
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    landmark VARCHAR(255),
    how_to_reach TEXT, -- Instructions for the courier to reach the location
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logistics_locations_location ON logistics.locations USING GIST (location);