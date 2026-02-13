-- 08-tracking.sql
-- Tracking events and indexes
CREATE TABLE tracking.events (
    event_id BIGSERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES orders.courier_assignments (assignment_id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    courier_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    accuracy_meters NUMERIC(6, 2),
    speed_kmph NUMERIC(5, 2),
    bearing_degrees NUMERIC(5, 2),
    event_description TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tracking_events_assignment_id ON tracking.events (assignment_id);

CREATE INDEX idx_tracking_events_order_id ON tracking.events (order_id);

CREATE INDEX idx_tracking_events_courier_id ON tracking.events (courier_id);

CREATE INDEX idx_tracking_events_timestamp ON tracking.events (timestamp DESC);

CREATE INDEX idx_tracking_events_location ON tracking.events USING GIST (location)
WHERE
    location IS NOT NULL;

CREATE INDEX idx_tracking_events_order_timestamp ON tracking.events (order_id, timestamp DESC);

COMMENT ON TABLE tracking.events IS 'Stores all tracking events including location updates (every 30-60 seconds) and status changes';