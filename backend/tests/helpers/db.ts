import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Pool, type PoolConfig } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "../..");

dotenv.config({ path: path.resolve(BACKEND_ROOT, ".env.test") });
dotenv.config({ path: path.resolve(BACKEND_ROOT, ".env") });

const STATIC_TABLES = new Set([
  "public.delivery_type_capabilities",
  "public.delivery_types",
  "public.package_types",
  "public.pricing_config",
  "public.vehicle_categories",
  "public.weight_tiers",
  "payments.payment_methods",
  "public._deployment_log",
  "drizzle.__drizzle_migrations",
]);

let testPool: Pool | null = null;

const quoteIdent = (identifier: string): string => {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
};

const withDatabaseName = (
  connectionString: string,
  databaseName: string,
): string => {
  const parsed = new URL(connectionString);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

export const getTestDbName = (): string =>
  process.env.DB_NAME_TEST || "shipzy_test";

export const applyTestEnv = (): void => {
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

const getSslConfig = (): PoolConfig["ssl"] => {
  if (
    process.env.DB_SSL === "true" ||
    process.env.DB_SSL === "require" ||
    process.env.NODE_ENV === "production"
  ) {
    return { rejectUnauthorized: false };
  }
  return undefined;
};

const getBasePoolConfig = (database: string): PoolConfig => {
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

export const getTestPool = (): Pool => {
  if (!testPool) {
    testPool = new Pool(getBasePoolConfig(getTestDbName()));
  }
  return testPool;
};

export const closeTestPool = async (): Promise<void> => {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
};

const withAdminPool = async (
  fn: (pool: Pool) => Promise<void>,
): Promise<void> => {
  const adminPool = new Pool(getBasePoolConfig("postgres"));
  try {
    await fn(adminPool);
  } finally {
    await adminPool.end();
  }
};

export const recreateTestDatabase = async (): Promise<void> => {
  const testDbName = getTestDbName();
  const quotedDb = quoteIdent(testDbName);

  await withAdminPool(async (adminPool) => {
    await adminPool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [testDbName],
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${quotedDb}`);
    await adminPool.query(`CREATE DATABASE ${quotedDb}`);
  });
};

export const dropTestDatabase = async (): Promise<void> => {
  const testDbName = getTestDbName();
  const quotedDb = quoteIdent(testDbName);

  await withAdminPool(async (adminPool) => {
    await adminPool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [testDbName],
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${quotedDb}`);
  });
};

export const runDbDeploy = (): void => {
  const env = { ...process.env };
  execSync("pnpm run db:deploy", {
    cwd: BACKEND_ROOT,
    env,
    stdio: "inherit",
  });
};

export const truncateUserTables = async (): Promise<void> => {
  const pool = getTestPool();
  const result = await pool.query<{
    schema_name: string;
    table_name: string;
  }>(`
    SELECT table_schema AS schema_name, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `);

  const dynamicTables = result.rows
    .map((row) => `${row.schema_name}.${row.table_name}`)
    .filter((fullName) => !STATIC_TABLES.has(fullName));

  if (dynamicTables.length === 0) {
    return;
  }

  const truncateSql = dynamicTables
    .map((fullName) => {
      const [schema, table] = fullName.split(".");
      return `${quoteIdent(schema)}.${quoteIdent(table)}`;
    })
    .join(", ");

  await pool.query(`TRUNCATE TABLE ${truncateSql} RESTART IDENTITY CASCADE`);
};
