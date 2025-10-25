// tests/database.js
const fs = require("fs");
const path = require("path");
const pg = require("pg");
const { testConfig } = require("./setup.js");

const { Pool } = pg;

// Use relative paths since we're in tests/ directory
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

      // Run schema
      await this.runSchema();

      // Run functions
      await this.runFunctions();

      // Run seed data
      await this.runSeeds();

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
    const adminPool = new Pool({
      ...testConfig.database,
      database: "postgres",
    });

    try {
      await adminPool.query(
        `DROP DATABASE IF EXISTS ${testConfig.database.database}`,
      );
      await adminPool.query(`CREATE DATABASE ${testConfig.database.database}`);
    } finally {
      await adminPool.end();
    }
  }

  async runSchema() {
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split schema into individual statements and execute
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        await this.pool.query(statement + ";");
      }
    }
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
        firebase_uid, is_verified, is_active
      ) VALUES (
        gen_random_uuid(),
        (SELECT role_id FROM public.user_roles WHERE name = $1),
        $2, $3, $4, $5, true, true
      ) RETURNING *`;

    const result = await this.pool.query(query, [
      userData.role,
      userData.phoneNumber,
      userData.email,
      userData.fullName,
      userData.firebaseUid,
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
if (require.main === module) {
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

module.exports = {
  testPool,
  TestDatabase,
  testDb,
};
