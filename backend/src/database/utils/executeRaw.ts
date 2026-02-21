// services/backend/src/database/utils/executeRaw.ts
// Type-safe raw SQL query wrapper using raw database connection

import db from "../db.js";
import logger from "../../config/logger.js";
import config from "../../config/env.js";

/**
 * Execute a raw SQL query with type safety
 * @param queryText - SQL query text with $1, $2, etc. placeholders or ? for auto-conversion
 * @param params - Query parameters array
 * @returns Array of typed results
 */
export const executeRaw = async <T extends Record<string, unknown> = Record<string, unknown>>(
  queryText: string,
  params: any[] = [],
): Promise<T[]> => {
  const start = Date.now();

  try {
    // Convert ? placeholders to PostgreSQL $1, $2, etc. format if needed
    let finalQuery = queryText;
    if (queryText.includes("?") && !queryText.includes("$")) {
      let paramIndex = 1;
      finalQuery = queryText.replace(/\?/g, () => `$${paramIndex++}`);
    }

    const result = await db.query(finalQuery, params);
    const duration = Date.now() - start;

    // Safe logging
    if (config?.logging?.logQueries) {
      const queryPreview =
        finalQuery.length > 100 ? finalQuery.substring(0, 100) + "..." : finalQuery;

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
