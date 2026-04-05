const { Pool } = require("pg");
const path = require("node:path");
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

const dropTestDatabase = async () => {
  const testDbName = getTestDbName();
  const adminPool = new Pool(getBasePoolConfig("postgres"));

  try {
    await adminPool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [testDbName],
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${quoteIdent(testDbName)}`);
  } finally {
    await adminPool.end();
  }
};

module.exports = async () => {
  applyTestEnv();
  await dropTestDatabase();
};
