-- 10-views-and-seeds.sql
-- Views for common queries and sample seed data
-- View: Active Orders with Details
CREATE
OR REPLACE VIEW orders.active_orders_view AS
SELECT
    o.order_id,
    o.order_uuid,
    o.client_id,
    u.full_name AS client_name,
    u.phone_number AS client_phone,
    o.status_id,
    os.name AS status_name,
    dt.name AS delivery_type,
    o.total_price,
    o.created_at,
    pl.address AS pickup_address,
    dl.address AS delivery_address,
    ca.courier_id,
    cu.full_name AS courier_name,
    cu.phone_number AS courier_phone
FROM
    orders.requests o
    JOIN users.profiles u ON o.client_id = u.user_id
    JOIN public.order_statuses os ON o.status_id = os.status_id
    JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
    JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
    JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
    LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
    AND ca.assignment_status_id IN (
        SELECT
            status_id
        FROM
            public.assignment_statuses
        WHERE
            name IN ('assigned', 'accepted', 'picked_up', 'in_transit')
    )
    LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
WHERE
    o.deleted_at IS NULL
    AND o.status_id IN (
        SELECT
            status_id
        FROM
            public.order_statuses
        WHERE
            name IN ('pending', 'accepted', 'picked_up', 'in_transit')
    );

-- View: Available Couriers
CREATE
OR REPLACE VIEW logistics.available_couriers_view AS
SELECT
    cs.courier_id,
    u.full_name AS courier_name,
    u.phone_number,
    cs.is_available,
    cs.is_online,
    cs.current_location,
    cs.last_location_update,
    cs.total_deliveries_today,
    cv.vehicle_number,
    vc.name AS vehicle_category
FROM
    logistics.courier_status cs
    JOIN users.profiles u ON cs.courier_id = u.user_id
    LEFT JOIN logistics.courier_vehicles cv ON cs.courier_id = cv.courier_id
    AND cv.is_active = TRUE
    LEFT JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
WHERE
    cs.is_available = TRUE
    AND cs.is_online = TRUE
    AND u.is_active = TRUE
    AND u.deleted_at IS NULL;

-- SAMPLE SEED DATA (Optional for Development)
-- (kept same as original seed statements - include the existing seed insert block)
-- (Note) To run seeds separately, use this file as last step.