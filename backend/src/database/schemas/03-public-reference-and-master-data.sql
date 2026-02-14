-- 03-public-reference-and-master-data.sql
-- Centralized master data and reference tables
-- Contains all lookup/reference tables used across the system:
-- - user_roles (moved from users schema)
-- - vehicle_categories (moved from logistics schema)
-- - order_statuses (moved from orders schema)
-- - assignment_statuses (moved from orders schema)
-- - notification_channels (moved from notifications schema)
-- - notification_statuses (moved from notifications schema)
-- - payment_methods/payment_statuses (already centralized)

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Remaining public tables: weight_tiers, delivery_types, package_types, delivery_type_capabilities, labels, delivery_type_labels, pricing_config

-- Weight tiers, delivery types, package types, capabilities, labels
CREATE TABLE public.weight_tiers (
    tier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_weight_kg NUMERIC(10, 2) NOT NULL,
    max_weight_kg NUMERIC(10, 2) NOT NULL,
    additional_charge NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_weight_range CHECK (min_weight_kg < max_weight_kg),
    CONSTRAINT unique_weight_range UNIQUE (min_weight_kg, max_weight_kg)
);

CREATE TABLE public.delivery_types (
    delivery_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    base_rate NUMERIC(10, 2) NOT NULL,
    per_km_rate NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.package_types (
    package_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    special_handling_fee NUMERIC(10, 2) DEFAULT 0.00,
    requires_special_handling BOOLEAN DEFAULT FALSE,
    handling_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_type_capabilities (
    capability_id SERIAL PRIMARY KEY,
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id) ON DELETE CASCADE,
    vehicle_category_id INT NOT NULL, -- FK added later: REFERENCES logistics.vehicle_categories (category_id) ON DELETE CASCADE
    weight_tier_id INT NOT NULL REFERENCES public.weight_tiers (tier_id) ON DELETE CASCADE,
    base_rate_override NUMERIC(10, 2),
    per_km_rate_override NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_capability UNIQUE (
        delivery_type_id,
        vehicle_category_id,
        weight_tier_id
    )
);

CREATE INDEX idx_capabilities_delivery_vehicle ON public.delivery_type_capabilities (delivery_type_id, vehicle_category_id);

CREATE TABLE public.labels (
    label_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_text VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    background_color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_type_labels (
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id) ON DELETE CASCADE,
    label_id INT NOT NULL REFERENCES public.labels (label_id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (delivery_type_id, label_id)
);

-- Pricing config
CREATE TABLE public.pricing_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value NUMERIC(10, 4) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_pricing_config BEFORE
UPDATE
    ON public.pricing_config FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- vehicle categories

-- order statuses

-- payment methods
-- User Roles (moved from users schema for centralized master data)
CREATE TABLE public.user_roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert user roles master data
INSERT INTO
    public.user_roles (name, description)
VALUES
    ('client', 'Customer who books deliveries'),
    ('courier', 'Delivery driver/rider'),
    ('admin', 'Platform administrator'),
    ('business', 'Business customer');

-- Vehicle Categories (moved from logistics schema for centralized master data)
CREATE TABLE public.vehicle_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    max_weight_kg NUMERIC(10, 2) NOT NULL,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert vehicle categories master data
INSERT INTO
    public.vehicle_categories (name, display_name, max_weight_kg)
VALUES
    ('2_wheeler', '2-Wheeler (Bike)', 20.00),
    ('3_wheeler', '3-Wheeler (Auto)', 100.00),
    ('mini_truck', 'Mini Truck', 500.00),
    ('truck', 'Truck', 2000.00);

-- Order Statuses (moved from orders schema for centralized master data)
CREATE TABLE public.order_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    display_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert order statuses master data
INSERT INTO public.order_statuses (name, description, display_order) VALUES 
    ('pending', 'Order created, awaiting driver assignment', 1), 
    ('accepted', 'Driver accepted the order', 2), 
    ('picked_up', 'Package picked up from sender', 3), 
    ('in_transit', 'Package in transit to destination', 4), 
    ('delivered', 'Successfully delivered', 5), 
    ('cancelled', 'Order cancelled', 6), 
    ('undeliverable', 'Could not deliver to recipient', 7), 
    ('returned', 'Package returned to sender', 8);

-- Assignment Statuses (moved from orders schema for centralized master data)
CREATE TABLE public.assignment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert assignment statuses master data
INSERT INTO public.assignment_statuses (name, description) VALUES 
    ('assigned', 'Order assigned to courier'), 
    ('accepted', 'Courier accepted assignment'), 
    ('rejected', 'Courier rejected assignment'), 
    ('picked_up', 'Package picked up'), 
    ('in_transit', 'Package in transit'), 
    ('delivered', 'Package delivered'), 
    ('cancelled', 'Assignment cancelled');

-- Notification Channels (moved from notifications schema for centralized master data)
CREATE TABLE public.notification_channels (
    channel_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Statuses (moved from notifications schema for centralized master data)
CREATE TABLE public.notification_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert notification channels and statuses master data
INSERT INTO public.notification_channels (name, description) VALUES 
    ('push', 'Push notification via FCM'), 
    ('sms', 'SMS notification'), 
    ('email', 'Email notification'), 
    ('in_app', 'In-app notification banner');

INSERT INTO public.notification_statuses (name) VALUES 
    ('pending'), 
    ('sent'), 
    ('delivered'), 
    ('read'), 
    ('failed');

-- ============================================================
-- 2. WEIGHT TIERS
-- ============================================================
INSERT INTO
    public.weight_tiers (
        name,
        min_weight_kg,
        max_weight_kg,
        additional_charge
    )
VALUES
    -- For 2-wheelers
    ('0-1 kg', 0.00, 1.00, 0.00),
    -- No surcharge
    ('1-5 kg', 1.00, 5.00, 10.00),
    -- ₹10 extra
    ('5-10 kg', 5.00, 10.00, 25.00),
    -- ₹25 extra
    ('10-15 kg', 10.00, 15.00, 50.00),
    -- ₹50 extra
    ('15-20 kg', 15.00, 20.00, 75.00),
    -- ₹75 extra
    -- For 3-wheelers (additional tiers)
    ('20-40 kg', 20.00, 40.00, 100.00),
    ('40-60 kg', 40.00, 60.00, 150.00),
    ('60-80 kg', 60.00, 80.00, 200.00),
    ('80-100 kg', 80.00, 100.00, 250.00),
    -- For trucks (even higher)
    ('100-200 kg', 100.00, 200.00, 400.00),
    ('200-500 kg', 200.00, 500.00, 800.00);

-- ============================================================
-- 3. DELIVERY TYPES
-- ============================================================
INSERT INTO
    public.delivery_types (
        name,
        display_name,
        description,
        base_rate,
        per_km_rate,
        sort_order
    )
VALUES
    (
        'deliver_now',
        'Deliver Now',
        'Instant pickup & delivery',
        50.00,
        8.00,
        1
    ),
    (
        'scheduled',
        'Scheduled Pickup',
        'Schedule for later',
        40.00,
        7.00,
        2
    ),
    (
        'end_of_day',
        'End-of-Day Delivery',
        'Deliver by end of day',
        35.00,
        6.00,
        3
    ),
    (
        'truck_delivery',
        'Truck Delivery',
        'Heavy cargo delivery',
        200.00,
        15.00,
        4
    );

INSERT INTO
    public.package_types (name, description, special_handling_fee, requires_special_handling, handling_description)
VALUES
    ('Document', 'Document package', 0.00, FALSE, NULL),
    ('Food', 'Food package', 15.00, TRUE, 'Perishable items - maintain temperature'),
    ('Clothes', 'Clothes package', 0.00, FALSE, NULL),
    ('Electronics', 'Electronics package', 25.00, TRUE, 'Fragile electronics - handle with extra care'),
    ('Medicine', 'Medicine package', 20.00, TRUE, 'Medical supplies - urgent delivery required'),
    ('Gift', 'Gift package', 20.00, TRUE, 'Special occasion items - careful packaging'),
    ('Grocery', 'Grocery package', 0.00, FALSE, NULL),
    ('Pet Supplies', 'Pet Supplies package', 0.00, FALSE, NULL),
    ('Other', 'Other package', 0.00, FALSE, NULL);


-- ============================================================
-- 4. LABELS (Promotional Tags)
-- ============================================================
INSERT INTO
    public.labels (name, display_text, color, background_color)
VALUES
    ('new', 'NEW', '#12B76A', '#12B76A'),
    ('discount_40', '40% OFF', '#EF4444', '#EF4444'),
    ('popular', 'Popular', '#3B82F6', '#3B82F6'),
    ('fastest', 'Fastest', '#F79009', '#F79009'),
    ('eco', 'Eco', '#16A34A', '#22C55E');

-- ============================================================
-- 5. ATTACH LABELS TO DELIVERY TYPES
-- ============================================================
-- "Deliver Now" is FASTEST
INSERT INTO
    public.delivery_type_labels (delivery_type_id, label_id, display_order)
SELECT
    dt.delivery_type_id,
    l.label_id,
    1
FROM
    public.delivery_types dt,
    public.labels l
WHERE
    dt.name = 'deliver_now'
    AND l.name = 'fastest';

-- "End of Day" has 40% OFF
INSERT INTO
    public.delivery_type_labels (delivery_type_id, label_id, display_order)
SELECT
    dt.delivery_type_id,
    l.label_id,
    1
FROM
    public.delivery_types dt,
    public.labels l
WHERE
    dt.name = 'end_of_day'
    AND l.name = 'discount_40';

-- "Scheduled" is ECO and NEW
INSERT INTO
    public.delivery_type_labels (delivery_type_id, label_id, display_order)
SELECT
    dt.delivery_type_id,
    l.label_id,
    1
FROM
    public.delivery_types dt,
    public.labels l
WHERE
    dt.name = 'scheduled'
    AND l.name = 'eco';

INSERT INTO
    public.delivery_type_labels (delivery_type_id, label_id, display_order)
SELECT
    dt.delivery_type_id,
    l.label_id,
    2
FROM
    public.delivery_types dt,
    public.labels l
WHERE
    dt.name = 'scheduled'
    AND l.name = 'new';

-- Payment Methods (created early to resolve circular dependency with orders)
CREATE TABLE payments.payment_methods (
    method_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Statuses (created early to resolve circular dependency with orders)
CREATE TABLE payments.payment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert payment methods and statuses master data
INSERT INTO payments.payment_methods (name, description) VALUES 
    ('cash_on_delivery', 'Cash on Delivery'), 
    ('prepaid_via_upi', 'Prepaid via UPI'), 
    ('prepaid_via_card', 'Prepaid via Credit/Debit Card');

INSERT INTO payments.payment_statuses (name, description) VALUES 
    ('pending', 'Payment not yet received'), 
    ('completed', 'Payment successful'), 
    ('failed', 'Payment failed'), 
    ('refunded', 'Payment refunded'), 
    ('cancelled', 'Payment cancelled');

-- Insert default pricing configuration
INSERT INTO public.pricing_config (config_key, config_value, description) VALUES
    ('platform_fee', 10.00, 'Fixed platform fee added to all orders'),
    ('gst_rate', 0.18, 'GST rate applied to taxable amount (18%)'),
    ('driver_commission_rate', 0.70, 'Driver commission rate (70% of base fare)'),
    ('driver_distance_rate', 0.65, 'Driver earnings rate for distance charges'),
    ('driver_weight_rate', 0.60, 'Driver earnings rate for weight surcharges'),
    ('peak_hour_bonus_rate', 0.15, 'Peak hour bonus as percentage of base payout'),
    ('urgency_bonus_amount', 15.00, 'Fixed bonus for urgent deliveries'),
    ('on_time_bonus_rate', 0.05, 'On-time delivery bonus rate'),
    ('quality_bonus_amount', 5.00, 'Quality bonus for good ratings');
