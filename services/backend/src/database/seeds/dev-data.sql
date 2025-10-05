-- Development Seed Data for Shipzy
-- Run this in a development environment only

-- Clear existing data (optional, for clean seed)
-- DELETE FROM payments;
-- DELETE FROM order_tracking;
-- DELETE FROM orders;
-- DELETE FROM drivers;
-- DELETE FROM users;

-- Sample Users
INSERT INTO users (email, name, phone, role, password_hash) VALUES
('user1@example.com', 'John Doe', '+1234567890', 'user', auth_hash_password('password123')),
('driver1@example.com', 'Jane Smith', '+1234567891', 'driver', auth_hash_password('password123')),
('admin@example.com', 'Admin User', '+1234567892', 'admin', auth_hash_password('adminpass'));

-- Sample Drivers (linked to driver user)
INSERT INTO drivers (id, vehicle_type, license_number, is_available, rating) VALUES
((SELECT id FROM users WHERE email = 'driver1@example.com'), 'sedan', 'DL123456', true, 4.5);

-- Sample Orders
INSERT INTO orders (user_id, pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address, status) VALUES
((SELECT id FROM users WHERE email = 'user1@example.com'), 37.7749, -122.4194, '123 Main St, San Francisco', 37.8044, -122.2711, '456 Oak Ave, Oakland', 'pending'),
((SELECT id FROM users WHERE email = 'user1@example.com'), 40.7128, -74.0060, '789 Broadway, New York', 40.7589, -73.9851, '101 Park Ave, Manhattan', 'assigned');

-- Assign driver to second order
UPDATE orders SET driver_id = (SELECT id FROM users WHERE email = 'driver1@example.com'), status = 'assigned'
WHERE pickup_address = '789 Broadway, New York';

-- Sample Tracking Points
INSERT INTO order_tracking (order_id, lat, lng, driver_id) VALUES
((SELECT id FROM orders WHERE pickup_address = '789 Broadway, New York'), 40.7200, -74.0000, (SELECT id FROM users WHERE email = 'driver1@example.com')),
((SELECT id FROM orders WHERE pickup_address = '789 Broadway, New York'), 40.7300, -73.9900, (SELECT id FROM users WHERE email = 'driver1@example.com'));

-- Sample Payments
INSERT INTO payments (order_id, amount, currency, status, transaction_id) VALUES
((SELECT id FROM orders WHERE pickup_address = '123 Main St, San Francisco'), 25.50, 'USD', 'completed', 'txn_12345'),
((SELECT id FROM orders WHERE pickup_address = '789 Broadway, New York'), 35.00, 'USD', 'pending', NULL);

-- Verify seed data
SELECT 'Users seeded:' || COUNT(*) FROM users;
SELECT 'Drivers seeded:' || COUNT(*) FROM drivers;
SELECT 'Orders seeded:' || COUNT(*) FROM orders;
SELECT 'Payments seeded:' || COUNT(*) FROM payments;
