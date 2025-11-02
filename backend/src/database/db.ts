// services/backend/src/database/db.ts
import pg from "pg";
import config from "../config/env";
import logger from "../config/logger";

const { Pool } = pg;

const pool = new Pool(config.database);

// Connection event handlers
pool.on("connect", (client) => {
  logger.debug("New database connection established");
});

pool.on("error", (err, client) => {
  logger.error({
    msg: "Unexpected database error on idle client",
    error: err.message,
  });
});

pool.on("remove", () => {
  logger.debug("Database connection removed from pool");
});

/**
 * Execute a query with parameters
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
const query = async (
  text: string,
  params: any[] = [],
): Promise<pg.QueryResult> => {
  const start = Date.now();

  // ✅ Validate query text
  if (!text || typeof text !== "string") {
    logger.error({
      msg: "Database query called with invalid text",
      text,
      textType: typeof text,
      params,
      stack: new Error(
        `Database query text is invalid: received ${typeof text}. This usually means a query constant is undefined. ${text}`,
      ).stack,
    });
    throw new Error(
      `Database query text is invalid: received ${typeof text}. This usually means a query constant is undefined.`,
    );
  }

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // ✅ Safe logging
    if (config?.logging?.logQueries) {
      const queryPreview =
        text.length > 100 ? text.substring(0, 100) + "..." : text;

      logger.debug({
        msg: "Query executed",
        query: queryPreview,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    const queryPreview =
      text.length > 100 ? text.substring(0, 100) + "..." : text;

    logger.error({
      msg: "Database query error",
      query: queryPreview,
      params,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns Database client
 */
const getClient = async (): Promise<pg.PoolClient> => {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);

  // Track if client has been released
  let isReleased = false;
  client.release = () => {
    if (isReleased) {
      logger.warn("Attempted to release already released client");
      return;
    }
    isReleased = true;
    originalRelease();
  };

  return client;
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
  await pool.end();
  logger.info("Database connection pool closed");
};

// Test connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error({
      msg: "Failed to connect to database",
      error: err.message,
    });
    process.exit(1);
  } else {
    logger.info({
      msg: "Database connection successful",
      time: res?.rows[0].now,
    });
  }
});

export default {
  query,
  getClient,
  closePool,
};
