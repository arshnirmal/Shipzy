-- 06-orders.sql
-- Orders schema and related objects
-- Order Statuses and Assignment Statuses moved to public schema for centralized master data

CREATE TABLE orders.requests (
    order_id SERIAL PRIMARY KEY,
    order_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    order_number VARCHAR(50),
    client_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id),
    status_id INT NOT NULL REFERENCES public.order_statuses (status_id),
    vehicle_category_id INT NOT NULL REFERENCES public.vehicle_categories(category_id),
    weight_tier_id INT REFERENCES public.weight_tiers (tier_id),
    pickup_location_id INT NOT NULL REFERENCES logistics.locations (location_id),
    pickup_contact_name VARCHAR(100) NOT NULL,
    pickup_contact_phone VARCHAR(20) NOT NULL,
    scheduled_pickup_time TIMESTAMPTZ,
    actual_pickup_time TIMESTAMPTZ,
    delivery_location_id INT NOT NULL REFERENCES logistics.locations (location_id),
    delivery_contact_name VARCHAR(100) NOT NULL,
    delivery_contact_phone VARCHAR(20) NOT NULL,
    scheduled_delivery_time TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,
    package_type_id INT REFERENCES public.package_types (package_type_id),
    package_description TEXT,
    special_instructions TEXT,
    declared_value NUMERIC(10, 2) DEFAULT 0.00,
    estimated_distance_km NUMERIC(6, 2),
    actual_distance_km NUMERIC(6, 2),
    base_price NUMERIC(10, 2) NOT NULL,
    distance_price NUMERIC(10, 2) DEFAULT 0.00,
    weight_surcharge NUMERIC(10, 2) DEFAULT 0.00,
    platform_fee NUMERIC(10, 2) DEFAULT 10.00,
    special_handling_fee NUMERIC(10, 2) DEFAULT 0.00,
    subtotal_before_tax NUMERIC(10, 2) DEFAULT 0.00,
    gst_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,
    payment_method_id INT NOT NULL REFERENCES payments.payment_methods (method_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_requests_client_id ON orders.requests (client_id);

CREATE INDEX idx_orders_requests_status_id ON orders.requests (status_id);

CREATE INDEX idx_orders_requests_delivery_type_id ON orders.requests (delivery_type_id);

CREATE INDEX idx_orders_requests_created_at ON orders.requests (created_at DESC);

CREATE INDEX idx_orders_requests_deleted_at ON orders.requests (deleted_at)
WHERE
    deleted_at IS NULL;

CREATE INDEX idx_orders_vehicle_category_id ON orders.requests(vehicle_category_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX idx_orders_requests_weight_tier_id ON orders.requests(weight_tier_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX idx_orders_requests_client_active ON orders.requests (client_id, status_id, created_at DESC);

CREATE UNIQUE INDEX idx_orders_order_number ON orders.requests(order_number);

CREATE TRIGGER set_order_number_orders_requests BEFORE
INSERT
    ON orders.requests FOR EACH ROW EXECUTE FUNCTION orders.set_order_number();

CREATE TRIGGER set_timestamp_orders_requests BEFORE
UPDATE
    ON orders.requests FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- items, labels, assignments, proof of delivery, driver_ratings
CREATE TABLE orders.items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    weight_kg NUMERIC(10, 2),
    dimensions JSONB,
    description TEXT,
    value NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_items_order_id ON orders.items (order_id);

CREATE TABLE orders.order_labels (
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    label_id INT NOT NULL REFERENCES public.labels (label_id) ON DELETE CASCADE,
    PRIMARY KEY (order_id, label_id)
);

CREATE TABLE orders.courier_assignments (
    assignment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    courier_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    assignment_status_id INT NOT NULL REFERENCES public.assignment_statuses (status_id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    completed_at TIMESTAMPTZ,
    courier_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_courier_assignments_order_id ON orders.courier_assignments (order_id);

CREATE INDEX idx_orders_courier_assignments_courier_id ON orders.courier_assignments (courier_id);

CREATE INDEX idx_orders_courier_assignments_status ON orders.courier_assignments (assignment_status_id);

CREATE INDEX idx_assignments_courier_active ON orders.courier_assignments (
    courier_id,
    assignment_status_id,
    updated_at DESC
);

CREATE TRIGGER set_timestamp_orders_courier_assignments BEFORE
UPDATE
    ON orders.courier_assignments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE
    logistics.courier_status
ADD
    CONSTRAINT fk_courier_status_assignment FOREIGN KEY (current_assignment_id) REFERENCES orders.courier_assignments (assignment_id) ON DELETE
SET
    NULL;

CREATE TABLE orders.proof_of_delivery (
    proof_id SERIAL PRIMARY KEY,
    order_id INT UNIQUE NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    assignment_id INT NOT NULL REFERENCES orders.courier_assignments (assignment_id),
    recipient_name VARCHAR(100),
    recipient_signature_url VARCHAR(255),
    photo_url VARCHAR(255),
    delivery_notes TEXT,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_proof_of_delivery_order_id ON orders.proof_of_delivery (order_id);

CREATE TABLE IF NOT EXISTS logistics.driver_ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders.requests(order_id),
    driver_id INTEGER NOT NULL REFERENCES logistics.courier_status(courier_id),
    customer_id INTEGER NOT NULL REFERENCES users.profiles(user_id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_created ON logistics.driver_ratings(driver_id, created_at);