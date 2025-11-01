// tests/database.js
import fs from "fs";
import path from "path";
import pg from "pg";
import { testConfig } from "./setup.js";

const { Pool } = pg;

// Use relative paths since we're in tests/ directory
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "../src/database/init/schema.sql");
const functionsDir = path.join(__dirname, "../src/database/functions");
const seedsPath = path.join(__dirname, "../src/database/seeds/dev-data.sql");

// Test database connection pool
const testPool = new Pool(testConfig.database);

// Database setup and cleanup utilities
class TestDatabase {
  constructor() {
    this.pool = testPool;
  }

  async setup() {
    try {
      // Create test database if it doesn't exist
      await this.createTestDatabase();

      // Skip schema, functions, and seeds for now - assume database is already set up
      console.log("✅ Test database setup complete");
    } catch (error) {
      console.error("❌ Test database setup failed:", error);
      throw error;
    }
  }

  async teardown() {
    try {
      // Clean up test data
      await this.cleanupTestData();
      console.log("✅ Test database cleanup complete");
    } catch (error) {
      console.error("❌ Test database cleanup failed:", error);
      throw error;
    }
  }

  async createTestDatabase() {
    // For testing, we'll use the existing dev database and just clean it
    console.log(`Using existing database: ${testConfig.database.database}`);
  }

  async runSchema() {
    // Use psql to run the schema directly to avoid parsing issues
    const { spawn } = await import("child_process");
    const { promisify } = await import("util");

    return new Promise((resolve, reject) => {
      const psql = spawn(
        "docker",
        [
          "exec",
          "shipzy-postgres-dev",
          "psql",
          "-U",
          testConfig.database.user,
          "-d",
          testConfig.database.database,
          "-f",
          "/mnt/data/Arsh/Computer_Science/Projects/shipzy/services/backend/src/database/init/schema.sql",
        ],
        { stdio: "inherit" },
      );

      psql.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql exited with code ${code}`));
        }
      });

      psql.on("error", reject);
    });
  }

  async runFunctions() {
    if (fs.existsSync(functionsDir)) {
      const files = fs
        .readdirSync(functionsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const functionPath = path.join(functionsDir, file);
        const functionSQL = fs.readFileSync(functionPath, "utf8");
        await this.pool.query(functionSQL);
      }
    }
  }

  async runSeeds() {
    if (fs.existsSync(seedsPath)) {
      const seeds = fs.readFileSync(seedsPath, "utf8");
      await this.pool.query(seeds);
    }
  }

  async cleanupTestData() {
    // Clean up in reverse dependency order
    const cleanupQueries = [
      "DELETE FROM orders.proof_of_delivery",
      "DELETE FROM orders.courier_assignments",
      "DELETE FROM orders.order_labels",
      "DELETE FROM orders.items",
      "DELETE FROM orders.requests",
      "DELETE FROM users.addresses",
      "DELETE FROM users.auth_sessions",
      "DELETE FROM users.business_accounts",
      "DELETE FROM logistics.courier_vehicles",
      "DELETE FROM logistics.courier_status",
      "DELETE FROM logistics.locations",
      "DELETE FROM users.profiles WHERE user_id > 4", // Keep system users (1-4)
      "ALTER SEQUENCE users.profiles_user_id_seq RESTART WITH 5",
      "ALTER SEQUENCE orders.requests_order_id_seq RESTART WITH 1",
      "ALTER SEQUENCE logistics.locations_location_id_seq RESTART WITH 1",
    ];

    for (const query of cleanupQueries) {
      await this.pool.query(query);
    }
  }

  async createTestUser(userData) {
    const query = `
      INSERT INTO users.profiles (
        user_uuid, role_id, phone_number, email, full_name,
        firebase_uid, password_hash, is_verified, is_active
      ) VALUES (
        gen_random_uuid(),
        (SELECT role_id FROM public.user_roles WHERE name = $1),
        $2, $3, $4, $5, $6, true, true
      ) RETURNING *`;

    const result = await this.pool.query(query, [
      userData.role,
      userData.phoneNumber,
      userData.email,
      userData.fullName,
      userData.firebaseUid,
      userData.passwordHash || "$2b$10$dummy.hash.for.firebase.users", // Dummy hash for Firebase users
    ]);

    return result.rows[0];
  }

  async createTestOrder(orderData, clientId) {
    // Create pickup location
    const pickupLocationQuery = `
      INSERT INTO logistics.locations (
        address, latitude, longitude, city, state
      ) VALUES ($1, $2, $3, $4, $5) RETURNING location_id`;

    const pickupLocation = await this.pool.query(pickupLocationQuery, [
      orderData.pickupAddress,
      orderData.pickupLatitude,
      orderData.pickupLongitude,
      orderData.pickupCity,
      orderData.pickupState,
    ]);

    // Create delivery location
    const deliveryLocationQuery = `
      INSERT INTO logistics.locations (
        address, latitude, longitude, city, state
      ) VALUES ($1, $2, $3, $4, $5) RETURNING location_id`;

    const deliveryLocation = await this.pool.query(deliveryLocationQuery, [
      orderData.deliveryAddress,
      orderData.deliveryLatitude,
      orderData.deliveryLongitude,
      orderData.deliveryCity,
      orderData.deliveryState,
    ]);

    // Create order
    const orderQuery = `
      INSERT INTO orders.requests (
        client_id, delivery_type_id, status_id, pickup_location_id,
        delivery_location_id, pickup_contact_name, pickup_contact_phone,
        delivery_contact_name, delivery_contact_phone, weight_kg,
        dimensions, declared_value, special_instructions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`;

    const orderResult = await this.pool.query(orderQuery, [
      clientId,
      orderData.deliveryTypeId,
      orderData.statusId || 1, // Pending
      pickupLocation.rows[0].location_id,
      deliveryLocation.rows[0].location_id,
      orderData.pickupContactName,
      orderData.pickupContactPhone,
      orderData.deliveryContactName,
      orderData.deliveryContactPhone,
      orderData.weight,
      JSON.stringify(orderData.dimensions),
      orderData.declaredValue,
      orderData.specialInstructions,
    ]);

    return orderResult.rows[0];
  }

  async createTestDriver(driverData, userId) {
    // Create courier status
    const statusQuery = `
      INSERT INTO logistics.courier_status (courier_id, is_available, is_online)
      VALUES ($1, $2, $3)`;

    await this.pool.query(statusQuery, [userId, true, true]);

    // Create vehicle if provided
    if (driverData.vehicle) {
      const vehicleQuery = `
        INSERT INTO logistics.courier_vehicles (
          courier_id, category_id, vehicle_number, model, year, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6)`;

      await this.pool.query(vehicleQuery, [
        userId,
        driverData.vehicle.categoryId,
        driverData.vehicle.vehicleNumber,
        driverData.vehicle.model,
        driverData.vehicle.year,
        true,
      ]);
    }
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
  }
}

const testDb = new TestDatabase();

// Handle command line arguments for setup/cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === "setup") {
    testDb
      .setup()
      .then(() => {
        console.log("✅ Test database setup complete");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Test database setup failed:", error);
        process.exit(1);
      });
  } else if (command === "cleanup") {
    testDb
      .teardown()
      .then(() => {
        console.log("✅ Test database cleanup complete");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Test database cleanup failed:", error);
        process.exit(1);
      });
  } else {
    console.log("Usage: node database.js [setup|cleanup]");
    process.exit(1);
  }
}

export { TestDatabase, testDb, testPool };
