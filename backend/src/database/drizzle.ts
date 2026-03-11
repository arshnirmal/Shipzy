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

// Connection event handlers with cleanup support
const connectHandler = () => {
  logger.debug("New Drizzle database connection established");
};

const errorHandler = (err: any) => {
  logger.error({
    msg: "Unexpected database error on idle client (Drizzle)",
    error: err.message,
  });
};

pool.on("connect", connectHandler);
pool.on("error", errorHandler);

// Cleanup function for graceful shutdown
export const cleanupDrizzlePool = async () => {
  try {
    // Remove event listeners to prevent memory leaks
    pool.removeListener("connect", connectHandler);
    pool.removeListener("error", errorHandler);
    
    // Close all connections
    await pool.end();
    logger.info("Drizzle database pool closed successfully");
  } catch (err) {
    logger.error({
      msg: "Error closing Drizzle database pool",
      error: (err as Error).message,
    });
  }
};

// Test connection on startup with timeout and proper error handling
const testConnection = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });

    const connectionPromise = pool.query("SELECT NOW()");
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    logger.info({
      msg: "Drizzle database connection successful",
      time: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({
      msg: "Failed to connect to database (Drizzle)",
      error: (err as Error).message,
      critical: true,
    });
    // Don't exit immediately - allow retry mechanisms
    throw err;
  }
};

// Start connection test asynchronously
testConnection().catch((err) => {
  logger.error({
    msg: "Database initialization failed",
    error: (err as Error).message,
  });
});

// Create Drizzle instance with schema
const drizzleDb = drizzle(pool, { schema });

export default drizzleDb;
export { pool as drizzlePool };
