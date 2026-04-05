-- ========================================================
-- SHIPZY - Spatial Column Definitions & GIST Indexes
-- Idempotent: safe to run on every deployment
-- ========================================================

-- Add PostGIS computed geography columns to orders.requests.
-- These are STORED generated columns derived from the pickup_location
-- and delivery_location JSONB fields, used by ST_DWithin() and ST_Distance().

ALTER TABLE orders.requests
  ADD COLUMN IF NOT EXISTS pickup_point geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_MakePoint(
        (pickup_location  ->> 'longitude')::float8,
        (pickup_location  ->> 'latitude')::float8
      ), 4326
    )::geography
  ) STORED;

ALTER TABLE orders.requests
  ADD COLUMN IF NOT EXISTS delivery_point geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_MakePoint(
        (delivery_location ->> 'longitude')::float8,
        (delivery_location ->> 'latitude')::float8
      ), 4326
    )::geography
  ) STORED;

-- GIST indexes — required for ST_DWithin / ST_Distance to use index scans
CREATE INDEX IF NOT EXISTS idx_orders_requests_pickup_gist
  ON orders.requests USING GIST (pickup_point);

CREATE INDEX IF NOT EXISTS idx_orders_requests_delivery_gist
  ON orders.requests USING GIST (delivery_point);

CREATE INDEX IF NOT EXISTS idx_courier_status_location_gist
  ON logistics.courier_status USING GIST (current_location);
