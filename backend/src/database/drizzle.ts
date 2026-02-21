// services/backend/src/database/drizzle.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import config from "../config/env.js";
import logger from "../config/logger.js";
import * as schema from "./schema/index.js";

// Create connection pool for Drizzle
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  ssl: config.database.ssl,
});

// Connection event handlers
pool.on("connect", () => {
  logger.debug("New Drizzle database connection established");
});

pool.on("error", (err) => {
  logger.error({
    msg: "Unexpected database error on idle client (Drizzle)",
    error: err.message,
  });
});

// Test connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error({
      msg: "Failed to connect to database (Drizzle)",
      error: err.message,
    });
    process.exit(1);
  } else {
    logger.info({
      msg: "Drizzle database connection successful",
      time: res?.rows[0].now,
    });
  }
});

// Create Drizzle instance with schema
const drizzleDb = drizzle(pool, { schema });

export default drizzleDb;
export { pool as drizzlePool };
