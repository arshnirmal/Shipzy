const path = require("node:path");
const { Pool } = require("pg");
const dotenv = require("dotenv");

const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(backendRoot, ".env.test") });
dotenv.config({ path: path.resolve(backendRoot, ".env") });

const withDatabaseName = (connectionString, databaseName) => {
  const parsed = new URL(connectionString);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const getTestDbName = () => process.env.DB_NAME_TEST || "shipzy_test";

const applyTestEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET ||= "test-secret-minimum-32-chars-long";
  process.env.JWT_EXPIRES_IN ||= "15m";
  process.env.JWT_REFRESH_EXPIRES_IN ||= "30d";
  process.env.MAPBOX_ACCESS_TOKEN ||= "test-mapbox-token";

  const testDbName = getTestDbName();
  process.env.DB_NAME = testDbName;

  const explicitTestUrl =
    process.env.DB_TEST_URL || process.env.DATABASE_URL_TEST;
  if (explicitTestUrl) {
    process.env.DATABASE_URL = explicitTestUrl;
    return;
  }

  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = withDatabaseName(
      process.env.DATABASE_URL,
      testDbName,
    );
  }
};

const getSslConfig = () => {
  if (
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "require" ||
    process.env.NODE_ENV === "production"
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
};

const getBasePoolConfig = (database) => {
  const explicitTestUrl =
    process.env.DB_TEST_URL || process.env.DATABASE_URL_TEST;

  if (explicitTestUrl) {
    return {
      connectionString: withDatabaseName(explicitTestUrl, database),
      ssl: getSslConfig(),
    };
  }

  if (process.env.DATABASE_URL) {
    return {
      connectionString: withDatabaseName(process.env.DATABASE_URL, database),
      ssl: getSslConfig(),
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432", 10),
    database,
    user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
    password:
      process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
    ssl: getSslConfig(),
  };
};

const quoteIdent = (identifier) => {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

const recreateTestDatabaseFromTemplate = async (templateDbName) => {
  const testDbName = getTestDbName();
  const adminPool = new Pool(getBasePoolConfig("postgres"));

  try {
    await adminPool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [testDbName],
    );
    await adminPool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [templateDbName],
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${quoteIdent(testDbName)}`);
    await adminPool.query(
      `CREATE DATABASE ${quoteIdent(testDbName)} TEMPLATE ${quoteIdent(templateDbName)}`,
    );
  } finally {
    await adminPool.end();
  }

  const testPool = new Pool(getBasePoolConfig(testDbName));
  try {
    await testPool.query(`
      ALTER TABLE users.auth_sessions
      ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(64);
    `);

    await testPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_user_device_unique_idx
      ON users.auth_sessions(user_id, device_id);
    `);

    await testPool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'auth_sessions_user_device_unique'
        ) THEN
          ALTER TABLE users.auth_sessions
          ADD CONSTRAINT auth_sessions_user_device_unique UNIQUE (user_id, device_id);
        END IF;
      END
      $$;
    `);

    await testPool.query(`
      ALTER TABLE orders.requests
      ADD COLUMN IF NOT EXISTS pricing JSONB;
    `);

    await testPool.query(`
      ALTER TABLE orders.requests
      ADD COLUMN IF NOT EXISTS snapshot JSONB,
      ADD COLUMN IF NOT EXISTS package JSONB,
      ADD COLUMN IF NOT EXISTS schedule JSONB,
      ADD COLUMN IF NOT EXISTS actual JSONB,
      ADD COLUMN IF NOT EXISTS pickup_location JSONB,
      ADD COLUMN IF NOT EXISTS delivery_location JSONB,
      ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ;
    `);

    await testPool.query(`
      ALTER TABLE orders.courier_assignments
      ADD COLUMN IF NOT EXISTS timeline JSONB;
    `);

    await testPool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'orders'
            AND table_name = 'requests'
            AND column_name = 'schedule'
        ) THEN
          ALTER TABLE orders.requests
          ALTER COLUMN schedule SET DEFAULT '{}'::jsonb;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'orders'
            AND table_name = 'requests'
            AND column_name = 'actual'
        ) THEN
          ALTER TABLE orders.requests
          ALTER COLUMN actual SET DEFAULT '{}'::jsonb;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'orders'
            AND table_name = 'requests'
            AND column_name = 'base_price'
        ) THEN
          ALTER TABLE orders.requests
          ALTER COLUMN base_price SET DEFAULT 0;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'orders'
            AND table_name = 'requests'
            AND column_name = 'platform_fee'
        ) THEN
          ALTER TABLE orders.requests
          ALTER COLUMN platform_fee SET DEFAULT 0;
        END IF;
      END
      $$;
    `);
  } finally {
    await testPool.end();
  }
};

module.exports = async () => {
  const sourceDbName =
    process.env.DB_TEMPLATE_NAME || process.env.DB_NAME || "shipzy";
  applyTestEnv();
  await recreateTestDatabaseFromTemplate(sourceDbName);
};
