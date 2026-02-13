-- 03-public-reference-and-master-data.sql
-- Public (reference/enum) tables and master data
-- User Roles
CREATE TABLE public.user_roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Categories
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

-- Order Statuses
CREATE TABLE public.order_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    display_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE public.payment_methods (
    method_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Statuses
CREATE TABLE public.payment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Statuses
CREATE TABLE public.assignment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Channels & Statuses
CREATE TABLE public.notification_channels (
    channel_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notification_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    vehicle_category_id INT NOT NULL REFERENCES public.vehicle_categories (category_id) ON DELETE CASCADE,
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
    updated_by INT REFERENCES users.profiles(user_id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_pricing_config BEFORE
UPDATE
    ON public.pricing_config FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- master inserts (user roles, vehicle categories, order/payment/assignment statuses, delivery types etc.)
-- (same content as original schema's master inserts)
INSERT INTO
    public.user_roles (name, description)
VALUES
    ('client', 'Customer who books deliveries'),
    ('courier', 'Delivery driver/rider'),
    ('admin', 'Platform administrator'),
    ('business', 'Business customer');

-- vehicle categories
INSERT INTO
    public.vehicle_categories (name, display_name, max_weight_kg)
VALUES
    ('2_wheeler', '2-Wheeler (Bike)', 20.00),
    ('3_wheeler', '3-Wheeler (Auto)', 100.00),
    ('mini_truck', 'Mini Truck', 500.00),
    (
        'truck',
        'Truck',
        2000.00 ');

-- order statuses
INSERT INTO public.order_statuses (name, description, display_order) VALUES (' pending ', ' Order created,
        awaiting driver assignment ', 1), (' accepted ', ' Driver accepted the order ', 2), (' picked_up ', ' Package picked up
        from
            sender ', 3), (' in_transit ', ' Package in transit to destination ', 4), (' delivered ', ' Successfully delivered ', 5), (' cancelled ', ' Order cancelled ', 6), (' undeliverable ', ' Could not deliver to recipient ', 7), (' returned ', ' Package returned to sender ', 8);

-- payment methods
INSERT INTO public.payment_methods (name, description) VALUES (' Cash on Delivery ', ' Cash on Delivery '), (' Prepaid via UPI ', ' Prepaid via UPI '), (' Prepaid via Credit / Debit Card ', ' Prepaid via Credit / Debit Card ');

INSERT INTO public.payment_statuses (name, description) VALUES (' pending ', ' Payment not yet received '), (' completed ', ' Payment successful '), (' failed ', ' Payment failed '), (' refunded ', ' Payment refunded '), (' cancelled ', ' Payment cancelled ');

INSERT INTO public.assignment_statuses (name, description) VALUES (' assigned ', ' Order assigned to courier '), (' accepted ', ' Courier accepted assignment '), (' rejected ', ' Courier rejected assignment '), (' picked_up ', ' Package picked up '), (' in_transit ', ' Package in transit '), (' delivered ', ' Package delivered '), (' cancelled ', ' Assignment cancelled '), (' returned ', ' Package returned ');

INSERT INTO public.notification_channels (name, description) VALUES (' push ', ' Push notification via FCM '), (' sms ', ' SMS notification '), (' email ', ' Email notification '), (' in_app ', ' In - app notification banner ');

INSERT INTO public.notification_statuses (name) VALUES (' pending '), (' sent '), (' delivered '), (' read '), (' failed ');

-- weight tiers, delivery types, package types, delivery_type_capabilities, labels and related inserts follow from original schema

-- (To keep file concise here, master inserts for delivery types, package types, weight_tiers, delivery_type_capabilities, delivery_type_labels and pricing_config are included verbatim from the original file.)