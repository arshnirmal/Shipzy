// tests/setup.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load test environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

// Set test environment
process.env.NODE_ENV = "test";

// Test database configuration
const testConfig = {
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || "shipzy_dev",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "test_jwt_secret_key_for_testing",
    expiresIn: "1h",
    refreshExpiresIn: "7d",
  },
  server: {
    port: 3001,
    host: "localhost",
  },
};

// Test user data
const testUsers = {
  client: {
    phoneNumber: "+1234567890",
    fullName: "Test Client",
    email: "client@test.com",
    firebaseUid: "test_client_uid_123",
    role: "client",
  },
  courier: {
    phoneNumber: "+1234567891",
    fullName: "Test Courier",
    email: "courier@test.com",
    firebaseUid: "test_courier_uid_123",
    role: "courier",
  },
  admin: {
    phoneNumber: "+1234567892",
    fullName: "Test Admin",
    email: "admin@test.com",
    firebaseUid: "test_admin_uid_123",
    role: "admin",
  },
};

// Test addresses
const testAddresses = {
  pickup: {
    label: "Test Pickup Location",
    fullAddress: "123 Test Pickup Street, Test City, Test State 123456",
    city: "Test City",
    state: "Test State",
    postalCode: "123456",
    latitude: 28.6139,
    longitude: 77.209,
    building: "Test Building",
    floor: "Ground",
    flatNumber: "1A",
    landmark: "Near Test Mall",
  },
  delivery: {
    label: "Test Delivery Location",
    fullAddress: "456 Test Delivery Avenue, Test City, Test State 123457",
    city: "Test City",
    state: "Test State",
    postalCode: "123457",
    latitude: 28.7041,
    longitude: 77.1025,
    building: "Test Apartment",
    floor: "5th",
    flatNumber: "501",
    landmark: "Opposite Test Park",
  },
};

// Test order data
const testOrder = {
  deliveryTypeId: 1, // Standard delivery
  weight: 2.5,
  dimensions: { length: 30, width: 20, height: 15 },
  declaredValue: 1000,
  specialInstructions: "Handle with care",
  items: [
    {
      name: "Test Package",
      quantity: 1,
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      value: 1000,
    },
  ],
};

// Test vehicle data
const testVehicle = {
  categoryId: 1, // 2-wheeler
  vehicleNumber: "DL12AB1234",
  model: "Honda Activa",
  year: 2023,
  insuranceExpiry: "2025-12-31",
};

// Helper functions
const createTestAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const createTestDeviceHeaders = (deviceId = "test_device_123") => ({
  "X-Device-Id": deviceId,
  "User-Agent": "ShipzyTest/1.0.0",
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Firebase Admin SDK mock (to be used in test files where jest is available)
const createMockFirebaseAdmin = () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
  }),
  credential: {
    cert: jest.fn(),
  },
  apps: [],
  initializeApp: jest.fn(),
});

// Global test timeout
const TEST_TIMEOUT = 30000;

// Export all constants and functions
export {
  createMockFirebaseAdmin,
  createTestAuthHeaders,
  createTestDeviceHeaders,
  delay,
  TEST_TIMEOUT,
  testAddresses,
  testConfig,
  testOrder,
  testUsers,
  testVehicle,
};
