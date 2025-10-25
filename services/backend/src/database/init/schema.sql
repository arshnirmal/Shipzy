-- ===================================================================
-- SHIPZY DATABASE SCHEMA v1.0
-- Hyperlocal Delivery Platform
-- PostgreSQL 16 + PostGIS 3.4
-- ===================================================================

-- ===================================================================
-- SECTION 1: EXTENSIONS AND SETUP
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist; -- For exclusion constraints
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For UUID generation

-- Verify PostGIS installation
SELECT postgis_full_version();

-- Drop existing schemas (for clean re-run in development)
DROP SCHEMA IF EXISTS users CASCADE;
DROP SCHEMA IF EXISTS logistics CASCADE;
DROP SCHEMA IF EXISTS orders CASCADE;
DROP SCHEMA IF EXISTS payments CASCADE;
DROP SCHEMA IF EXISTS tracking CASCADE;
DROP SCHEMA IF EXISTS notifications CASCADE;

-- Drop public tables
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.vehicle_categories CASCADE;
DROP TABLE IF EXISTS public.order_statuses CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.payment_statuses CASCADE;
DROP TABLE IF EXISTS public.assignment_statuses CASCADE;
DROP TABLE IF EXISTS public.notification_channels CASCADE;
DROP TABLE IF EXISTS public.notification_statuses CASCADE;
DROP TABLE IF EXISTS public.labels CASCADE;

-- ===================================================================
-- SECTION 2: CREATE SCHEMAS
-- ===================================================================

CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS tracking;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ===================================================================
-- SECTION 3: UTILITY FUNCTIONS
-- ===================================================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- SECTION 4: REFERENCE/ENUM TABLES (public schema)
-- ===================================================================

-- User Roles
CREATE TABLE public.user_roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.user_roles;
INSERT INTO public.user_roles (name, description) VALUES
    ('client', 'Customer who books deliveries'),
    ('courier', 'Delivery driver/rider'),
    ('admin', 'Platform administrator'),
    ('business', 'Business customer');

-- Vehicle Categories
CREATE TABLE public.vehicle_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.vehicle_categories;
INSERT INTO public.vehicle_categories (name, description) VALUES
    ('2-wheeler', 'Two-wheeler motorcycle/scooter'),
    ('3-wheeler', 'Three-wheeler vehicle'),
    ('mini-truck', 'Small pickup truck');

-- Order Statuses
CREATE TABLE public.order_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    display_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.order_statuses;
INSERT INTO public.order_statuses (name, description, display_order) VALUES
    ('pending', 'Order created, awaiting driver assignment', 1),
    ('accepted', 'Driver accepted the order', 2),
    ('picked_up', 'Package picked up from sender', 3),
    ('in_transit', 'Package in transit to destination', 4),
    ('delivered', 'Successfully delivered', 5),
    ('cancelled', 'Order cancelled', 6),
    ('undeliverable', 'Could not deliver to recipient', 7),
    ('returned', 'Package returned to sender', 8);

-- Payment Methods
CREATE TABLE public.payment_methods (
    method_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.payment_methods;
INSERT INTO public.payment_methods (name, description) VALUES
    ('cod', 'Cash on Delivery'),
    ('prepaid_upi', 'Prepaid via UPI'),
    ('prepaid_card', 'Prepaid via Credit/Debit Card');

-- Payment Statuses
CREATE TABLE public.payment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.payment_statuses;
INSERT INTO public.payment_statuses (name, description) VALUES
    ('pending', 'Payment not yet received'),
    ('completed', 'Payment successful'),
    ('failed', 'Payment failed'),
    ('refunded', 'Payment refunded'),
    ('cancelled', 'Payment cancelled');

-- Assignment Statuses
CREATE TABLE public.assignment_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.assignment_statuses;
INSERT INTO public.assignment_statuses (name, description) VALUES
    ('assigned', 'Order assigned to courier'),
    ('accepted', 'Courier accepted assignment'),
    ('rejected', 'Courier rejected assignment'),
    ('picked_up', 'Package picked up'),
    ('in_transit', 'Package in transit'),
    ('delivered', 'Package delivered'),
    ('cancelled', 'Assignment cancelled'),
    ('returned', 'Package returned');

-- Notification Channels
CREATE TABLE public.notification_channels (
    channel_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.notification_channels;
INSERT INTO public.notification_channels (name, description) VALUES
    ('push', 'Push notification via FCM'),
    ('sms', 'SMS notification'),
    ('email', 'Email notification'),
    ('in_app', 'In-app notification banner');

-- Notification Statuses
CREATE TABLE public.notification_statuses (
    status_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.notification_statuses;
INSERT INTO public.notification_statuses (name) VALUES
    ('pending'),
    ('sent'),
    ('delivered'),
    ('read'),
    ('failed');

-- Labels (for categorization)
CREATE TABLE public.labels (
    label_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color_hex VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.labels;
INSERT INTO public.labels (name, color_hex) VALUES
    ('New', '#000000'),
    ('Save 40%', '#000000');

-- Weight Tiers (for pricing)
CREATE TABLE public.weight_tiers (
    tier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_weight_kg NUMERIC(10, 2) NOT NULL,
    max_weight_kg NUMERIC(10, 2) NOT NULL,
    additional_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT weight_tier_min_less_than_max CHECK (min_weight_kg < max_weight_kg)
);

DELETE FROM public.weight_tiers;
INSERT INTO public.weight_tiers (name, min_weight_kg, max_weight_kg, additional_charge) VALUES
    ('Up to 1 kg', 0, 1, 0),
    ('Up to 5 kg', 1, 5, 20),
    ('Up to 10 kg', 5, 10, 40),
    ('Up to 15 kg', 10, 15, 50),
    ('Up to 20 kg', 15, 20, 60),
    ('Up to 100 kg', 20, 100, 100);

-- Delivery Types
CREATE TABLE public.delivery_types (
    delivery_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_rate NUMERIC(10, 2) NOT NULL,
    per_km_rate NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.delivery_types;
INSERT INTO public.delivery_types (name, description, base_rate, per_km_rate) VALUES 
    ('Deliver Now', 'Immediate pickup and dropoff within 1 hour', 50.00, 8.20),
    ('Scheduled', 'Scheduled deliveries arriving at predetermined times', 40.00, 8.20),
    ('End-of-day', 'Delivery by close of business', 35.00, 7.50);

-- Package Types
CREATE TABLE public.package_types (
    package_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DELETE FROM public.package_types;
INSERT INTO public.package_types (name, description) VALUES
    ('Document', 'Document package'),
    ('Food', 'Food package'),
    ('Clothes', 'Clothes package'),
    ('Electronics', 'Electronics package'),
    ('Medicine', 'Medicine package'),
    ('Gift', 'Gift package'),
    ('Grocery', 'Grocery package'),
    ('Pet Supplies', 'Pet Supplies package'),
    ('Other', 'Other package');

-- ===================================================================
-- SECTION 5: USERS SCHEMA
-- ===================================================================

-- User Profiles (main user table)
CREATE TABLE users.profiles (
    user_id SERIAL PRIMARY KEY,
    user_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    role_id INT NOT NULL REFERENCES public.user_roles (role_id),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE, -- NULLABLE for OTP-only auth
    password_hash VARCHAR(255), -- NULLABLE for OTP-only auth
    full_name VARCHAR(100) NOT NULL,
    profile_picture_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_users_profiles_role_id ON users.profiles (role_id);
CREATE INDEX idx_users_profiles_phone ON users.profiles (phone_number);
CREATE INDEX idx_users_profiles_email ON users.profiles (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_profiles_deleted_at ON users.profiles (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER set_timestamp_users_profiles
BEFORE UPDATE ON users.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Authentication Sessions (OTP + JWT management)
CREATE TABLE users.auth_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_attempts INT DEFAULT 0,
    jwt_token_hash VARCHAR(255), -- Store hashed JWT for revocation
    device_id VARCHAR(255),
    device_info JSONB, -- Store device details
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_sessions_user_id ON users.auth_sessions (user_id);
CREATE INDEX idx_users_auth_sessions_phone ON users.auth_sessions (phone_number);
CREATE INDEX idx_users_auth_sessions_expires_at ON users.auth_sessions (expires_at);
CREATE INDEX idx_users_auth_sessions_jwt_hash ON users.auth_sessions (jwt_token_hash) WHERE jwt_token_hash IS NOT NULL;

COMMENT ON COLUMN users.auth_sessions.otp_code IS 'Plain OTP for development, should be hashed in production';
COMMENT ON COLUMN users.auth_sessions.jwt_token_hash IS 'SHA256 hash of JWT token for revocation checking';

-- Addresses
CREATE TABLE users.addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    address_type VARCHAR(50), -- 'home', 'work', 'other'
    label VARCHAR(100),
    building_name VARCHAR(100),
    floor_number VARCHAR(10),
    room_number VARCHAR(10),
    full_address TEXT NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_addresses_user_id ON users.addresses (user_id);
CREATE INDEX idx_users_addresses_location ON users.addresses USING GIST (location);

CREATE TRIGGER set_timestamp_users_addresses
BEFORE UPDATE ON users.addresses
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Business Accounts (for business customers)
CREATE TABLE users.business_accounts (
    business_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    gst_number VARCHAR(15) UNIQUE,
    pan_number VARCHAR(10),
    business_type VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_gst_format CHECK (gst_number IS NULL OR gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
);

CREATE INDEX idx_users_business_accounts_user_id ON users.business_accounts (user_id);

CREATE TRIGGER set_timestamp_users_business_accounts
BEFORE UPDATE ON users.business_accounts
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- ===================================================================
-- SECTION 6: LOGISTICS SCHEMA
-- ===================================================================

-- Delivery Type Capabilities (Junction Table - FIXED from array)
CREATE TABLE logistics.delivery_type_capabilities (
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id) ON DELETE CASCADE,
    weight_tier_id INT NOT NULL REFERENCES public.weight_tiers (tier_id) ON DELETE CASCADE,
    PRIMARY KEY (delivery_type_id, weight_tier_id)
);

DELETE FROM logistics.delivery_type_capabilities;
INSERT INTO logistics.delivery_type_capabilities (delivery_type_id, weight_tier_id) VALUES
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    (2, 6),
    (3, 6);

-- Delivery Type Labels (Junction Table)
CREATE TABLE logistics.delivery_type_labels (
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id) ON DELETE CASCADE,
    label_id INT NOT NULL REFERENCES public.labels (label_id) ON DELETE CASCADE,
    PRIMARY KEY (delivery_type_id, label_id)
);

DELETE FROM logistics.delivery_type_labels;
INSERT INTO logistics.delivery_type_labels (delivery_type_id, label_id) VALUES
    (2, 1),
    (3, 2);

-- Courier Vehicles
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

CREATE TRIGGER set_timestamp_logistics_courier_vehicles
BEFORE UPDATE ON logistics.courier_vehicles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Courier Status (CRITICAL NEW TABLE for availability tracking)
CREATE TABLE logistics.courier_status (
    status_id SERIAL PRIMARY KEY,
    courier_id INT UNIQUE NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    current_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMPTZ,
    current_assignment_id INT, -- Will reference orders.courier_assignments later
    total_deliveries_today INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logistics_courier_status_available ON logistics.courier_status (is_available, is_online) WHERE is_available = true AND is_online = true;
CREATE INDEX idx_logistics_courier_status_location ON logistics.courier_status USING GIST (current_location);
CREATE INDEX idx_logistics_courier_status_courier_id ON logistics.courier_status (courier_id);

CREATE TRIGGER set_timestamp_logistics_courier_status
BEFORE UPDATE ON logistics.courier_status
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON TABLE logistics.courier_status IS 'Real-time courier availability and location for order matching';

-- Locations (pickup/delivery points)
CREATE TABLE logistics.locations (
    location_id SERIAL PRIMARY KEY,
    building_name VARCHAR(100),
    floor_number VARCHAR(10),
    room_number VARCHAR(10),
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    landmark VARCHAR(255),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logistics_locations_location ON logistics.locations USING GIST (location);

-- ===================================================================
-- SECTION 7: ORDERS SCHEMA
-- ===================================================================

-- Order Requests (main orders table)
CREATE TABLE orders.requests (
    order_id SERIAL PRIMARY KEY,
    order_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    delivery_type_id INT NOT NULL REFERENCES public.delivery_types (delivery_type_id),
    status_id INT NOT NULL REFERENCES public.order_statuses (status_id),
    
    -- Pickup details
    pickup_location_id INT NOT NULL REFERENCES logistics.locations (location_id),
    pickup_contact_name VARCHAR(100) NOT NULL,
    pickup_contact_phone VARCHAR(20) NOT NULL,
    scheduled_pickup_time TIMESTAMPTZ,
    actual_pickup_time TIMESTAMPTZ,
    
    -- Delivery details
    delivery_location_id INT NOT NULL REFERENCES logistics.locations (location_id),
    delivery_contact_name VARCHAR(100) NOT NULL,
    delivery_contact_phone VARCHAR(20) NOT NULL,
    scheduled_delivery_time TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,
    
    -- Package details
    package_type_id INT NOT NULL REFERENCES public.package_types (package_type_id),
    package_description TEXT,
    package_weight_kg NUMERIC(10, 2),
    package_dimensions JSONB, -- {length, width, height, unit}
    special_instructions TEXT,
    declared_value NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Pricing
    estimated_distance_km NUMERIC(6, 2),
    actual_distance_km NUMERIC(6, 2),
    base_price NUMERIC(10, 2) NOT NULL,
    distance_price NUMERIC(10, 2) DEFAULT 0.00,
    weight_surcharge NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,
    
    -- Payment
    payment_method_id INT NOT NULL REFERENCES public.payment_methods (method_id),
    
    -- Lifecycle timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_orders_requests_client_id ON orders.requests (client_id);
CREATE INDEX idx_orders_requests_status_id ON orders.requests (status_id);
CREATE INDEX idx_orders_requests_delivery_type_id ON orders.requests (delivery_type_id);
CREATE INDEX idx_orders_requests_created_at ON orders.requests (created_at DESC);
CREATE INDEX idx_orders_requests_deleted_at ON orders.requests (deleted_at) WHERE deleted_at IS NULL;
-- Composite index for finding active orders for a user
CREATE INDEX idx_orders_requests_client_active ON orders.requests (client_id, status_id, created_at DESC);

CREATE TRIGGER set_timestamp_orders_requests
BEFORE UPDATE ON orders.requests
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Order Items (for multi-item shipments)
CREATE TABLE orders.items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    weight_kg NUMERIC(10, 2),
    dimensions JSONB,
    description TEXT,
    value NUMERIC(10, 2), -- Declared value for insurance
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_items_order_id ON orders.items (order_id);

-- Order Labels (Junction Table)
CREATE TABLE orders.order_labels (
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    label_id INT NOT NULL REFERENCES public.labels (label_id) ON DELETE CASCADE,
    PRIMARY KEY (order_id, label_id)
);

-- Courier Assignments
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
-- Composite index for finding active assignments for a courier
CREATE INDEX idx_assignments_courier_active ON orders.courier_assignments (courier_id, assignment_status_id, updated_at DESC);

CREATE TRIGGER set_timestamp_orders_courier_assignments
BEFORE UPDATE ON orders.courier_assignments
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Add foreign key constraint for courier_status.current_assignment_id
ALTER TABLE logistics.courier_status 
ADD CONSTRAINT fk_courier_status_assignment 
FOREIGN KEY (current_assignment_id) REFERENCES orders.courier_assignments (assignment_id) ON DELETE SET NULL;

-- Proof of Delivery
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

-- ===================================================================
-- SECTION 8: PAYMENTS SCHEMA
-- ===================================================================

-- Payment Transactions
CREATE TABLE payments.transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    payment_method_id INT NOT NULL REFERENCES public.payment_methods (method_id),
    payment_status_id INT NOT NULL REFERENCES public.payment_statuses (status_id),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    external_transaction_id VARCHAR(255), -- UPI transaction ID or gateway reference
    payment_gateway VARCHAR(50), -- 'upi', 'razorpay', 'stripe', etc.
    upi_vpa VARCHAR(100), -- Virtual Payment Address for UPI
    payment_initiated_at TIMESTAMPTZ,
    payment_completed_at TIMESTAMPTZ,
    payment_failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB, -- Store additional payment gateway data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_transactions_order_id ON payments.transactions (order_id);
CREATE INDEX idx_payments_transactions_status_id ON payments.transactions (payment_status_id);
CREATE INDEX idx_payments_transactions_external_id ON payments.transactions (external_transaction_id);

CREATE TRIGGER set_timestamp_payments_transactions
BEFORE UPDATE ON payments.transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

COMMENT ON COLUMN payments.transactions.external_transaction_id IS 'UPI transaction ID or payment gateway reference number';

-- Payment Refunds
CREATE TABLE payments.refunds (
    refund_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES payments.transactions (transaction_id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    refund_amount NUMERIC(10, 2) NOT NULL,
    refund_reason TEXT NOT NULL,
    refund_status VARCHAR(50) NOT NULL,
    external_refund_id VARCHAR(255),
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_refunds_transaction_id ON payments.refunds (transaction_id);
CREATE INDEX idx_payments_refunds_order_id ON payments.refunds (order_id);

-- ===================================================================
-- SECTION 9: TRACKING SCHEMA
-- ===================================================================

-- Tracking Events (location updates, status changes)
CREATE TABLE tracking.events (
    event_id BIGSERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES orders.courier_assignments (assignment_id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders.requests (order_id) ON DELETE CASCADE,
    courier_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'location_update', 'status_change', 'note_added'
    location GEOGRAPHY(POINT, 4326),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    accuracy_meters NUMERIC(6, 2),
    speed_kmph NUMERIC(5, 2),
    bearing_degrees NUMERIC(5, 2),
    event_description TEXT,
    metadata JSONB, -- Store additional tracking data
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tracking_events_assignment_id ON tracking.events (assignment_id);
CREATE INDEX idx_tracking_events_order_id ON tracking.events (order_id);
CREATE INDEX idx_tracking_events_courier_id ON tracking.events (courier_id);
CREATE INDEX idx_tracking_events_timestamp ON tracking.events (timestamp DESC);
CREATE INDEX idx_tracking_events_location ON tracking.events USING GIST (location) WHERE location IS NOT NULL;
-- Composite index for fetching order tracking history
CREATE INDEX idx_tracking_events_order_timestamp ON tracking.events (order_id, timestamp DESC);

COMMENT ON TABLE tracking.events IS 'Stores all tracking events including location updates (every 30-60 seconds) and status changes';

-- ===================================================================
-- SECTION 10: NOTIFICATIONS SCHEMA
-- ===================================================================

-- Notification Queue
CREATE TABLE notifications.queue (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    channel_id INT NOT NULL REFERENCES public.notification_channels (channel_id),
    status_id INT NOT NULL REFERENCES public.notification_statuses (status_id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB, -- Additional data payload
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_queue_user_id ON notifications.queue (user_id);
CREATE INDEX idx_notifications_queue_status_id ON notifications.queue (status_id);
CREATE INDEX idx_notifications_queue_scheduled_at ON notifications.queue (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_notifications_queue_created_at ON notifications.queue (created_at DESC);

-- FCM Device Tokens
CREATE TABLE notifications.fcm_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- 'android', 'ios', 'web'
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_token)
);

CREATE INDEX idx_notifications_fcm_tokens_user_id ON notifications.fcm_tokens (user_id);
CREATE INDEX idx_notifications_fcm_tokens_active ON notifications.fcm_tokens (is_active) WHERE is_active = true;

CREATE TRIGGER set_timestamp_notifications_fcm_tokens
BEFORE UPDATE ON notifications.fcm_tokens
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- ===================================================================
-- SECTION 11: VIEWS FOR COMMON QUERIES
-- ===================================================================

-- View: Active Orders with Details
CREATE OR REPLACE VIEW orders.active_orders_view AS
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
FROM orders.requests o
JOIN users.profiles u ON o.client_id = u.user_id
JOIN public.order_statuses os ON o.status_id = os.status_id
JOIN public.delivery_types dt ON o.delivery_type_id = dt.delivery_type_id
JOIN logistics.locations pl ON o.pickup_location_id = pl.location_id
JOIN logistics.locations dl ON o.delivery_location_id = dl.location_id
LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id 
    AND ca.assignment_status_id IN (SELECT status_id FROM public.assignment_statuses WHERE name IN ('assigned', 'accepted', 'picked_up', 'in_transit'))
LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
WHERE o.deleted_at IS NULL
    AND o.status_id IN (SELECT status_id FROM public.order_statuses WHERE name IN ('pending', 'accepted', 'picked_up', 'in_transit'));

-- View: Available Couriers
CREATE OR REPLACE VIEW logistics.available_couriers_view AS
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
FROM logistics.courier_status cs
JOIN users.profiles u ON cs.courier_id = u.user_id
LEFT JOIN logistics.courier_vehicles cv ON cs.courier_id = cv.courier_id AND cv.is_active = true
LEFT JOIN public.vehicle_categories vc ON cv.category_id = vc.category_id
WHERE cs.is_available = true 
    AND cs.is_online = true
    AND u.is_active = true
    AND u.deleted_at IS NULL;

-- ===================================================================
-- SECTION 12: SAMPLE SEED DATA (Optional for Development)
-- ===================================================================

-- Seed a test client user
DELETE FROM users.profiles WHERE phone_number IN ('+919876543210', '+919876543211', '+919876543212');
INSERT INTO users.profiles (role_id, phone_number, full_name, is_verified, is_active) VALUES
((SELECT role_id FROM public.user_roles WHERE name = 'client'), '+919876543210', 'Test Client User', true, true);

-- Seed test courier users
INSERT INTO users.profiles (role_id, phone_number, full_name, is_verified, is_active) VALUES
((SELECT role_id FROM public.user_roles WHERE name = 'courier'), '+919876543211', 'Test Courier 1', true, true),
((SELECT role_id FROM public.user_roles WHERE name = 'courier'), '+919876543212', 'Test Courier 2', true, true);

-- Initialize courier status for test couriers
DELETE FROM logistics.courier_status WHERE courier_id IN (
    SELECT user_id FROM users.profiles WHERE phone_number IN ('+919876543211', '+919876543212')
);
INSERT INTO logistics.courier_status (courier_id, is_available, is_online, current_location, last_location_update)
SELECT user_id, true, true, 
    ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, -- Mumbai coordinates
    NOW()
FROM users.profiles WHERE role_id = (SELECT role_id FROM public.user_roles WHERE name = 'courier');

-- ===================================================================
-- SECTION 13: DATABASE COMMENTS
-- ===================================================================

COMMENT ON DATABASE shipzy_dev IS 'Shipzy hyperlocal delivery platform database';
COMMENT ON SCHEMA users IS 'User accounts, authentication, profiles, and addresses';
COMMENT ON SCHEMA logistics IS 'Vehicles, delivery types, courier availability, and locations';
COMMENT ON SCHEMA orders IS 'Order requests, assignments, and proof of delivery';
COMMENT ON SCHEMA payments IS 'Payment transactions and refunds';
COMMENT ON SCHEMA tracking IS 'Real-time location tracking and event logging';
COMMENT ON SCHEMA notifications IS 'Push notifications, SMS, email queue';

-- ===================================================================
-- END OF SCHEMA MIGRATION
-- ===================================================================
