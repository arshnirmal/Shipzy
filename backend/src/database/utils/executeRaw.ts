// services/backend/src/database/utils/executeRaw.ts
// Type-safe raw SQL query wrapper using raw database connection

import { drizzlePool } from "../drizzle.js";
import logger from "../../config/logger.js";
import config from "../../config/env.js";

/**
 * Execute a raw SQL query with type safety
 * @param queryText - SQL query text with PostgreSQL $1, $2, etc. placeholders ONLY
 * @param params - Query parameters array
 * @returns Array of typed results
 */
export const executeRaw = async <T extends Record<string, unknown> = Record<string, unknown>>(
  queryText: string,
  params: any[] = [],
): Promise<T[]> => {
  const start = Date.now();

  try {
    // Validate query format - only allow PostgreSQL placeholders
    if (queryText.includes("?")) {
      throw new Error(
        "Invalid query format: Only PostgreSQL $1, $2 placeholders are supported. Use parameterized queries only."
      );
    }

    // Validate parameter count matches placeholders
    const placeholderCount = (queryText.match(/\$\d+/g) || []).length;
    if (placeholderCount !== params.length) {
      throw new Error(
        `Parameter count mismatch: Query has ${placeholderCount} placeholders but ${params.length} parameters provided`
      );
    }

    const result = await drizzlePool.query(queryText, params);
    const duration = Date.now() - start;

    // Safe logging
    if (config?.logging?.logQueries) {
      const queryPreview =
        queryText.length > 100 ? queryText.substring(0, 100) + "..." : queryText;

      logger.debug({
        msg: "Raw SQL query executed",
        query: queryPreview,
        duration: `${duration}ms`,
        rows: result.rowCount || 0,
      });
    }

    return (result.rows as T[]) || [];
  } catch (error) {
    const queryPreview =
      queryText.length > 100 ? queryText.substring(0, 100) + "..." : queryText;

    logger.error({
      msg: "Raw SQL query error",
      query: queryPreview,
      params,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Execute a raw SQL query and return a single row
 * @param queryText - SQL query text
 * @param params - Query parameters array
 * @returns Single typed result or null
 */
export const executeRawOne = async <T extends Record<string, unknown> = Record<string, unknown>>(
  queryText: string,
  params: any[] = [],
): Promise<T | null> => {
  const results = await executeRaw<T>(queryText, params);
  return results.length > 0 ? (results[0] as T) : null;
};

export default {
  executeRaw,
  executeRawOne,
};
