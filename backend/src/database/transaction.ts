// services/backend/src/database/transaction.ts
// Transaction helper supporting both Drizzle and raw SQL transactions

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import pg from "pg";
import logger from "../config/logger.js";
import db from "./db.js";
import drizzleDb from "./drizzle.js";

/**
 * Execute a function within a Drizzle transaction
 * @param callback - Async function that receives a Drizzle transaction
 * @returns Result of the callback
 */
export const drizzleTransaction = async <T>(
  callback: (
    tx: PgTransaction<
      NodePgQueryResultHKT,
      typeof import("./schema/index.js"),
      ExtractTablesWithRelations<typeof import("./schema/index.js")>
    >,
  ) => Promise<T>,
): Promise<T> => {
  return drizzleDb.transaction(callback);
};

/**
 * Execute a function within a raw SQL transaction (for stored functions)
 * @param callback - Async function that receives a pg client
 * @returns Result of the callback
 */
export const rawTransaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");
    logger.debug("Raw SQL transaction started");

    const result = await callback(client);

    await client.query("COMMIT");
    logger.debug("Raw SQL transaction committed");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.warn({
      msg: "Raw SQL transaction rolled back",
      error: (error as Error).message,
    });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Legacy transaction function (for backward compatibility during migration)
 * @deprecated Use drizzleTransaction or rawTransaction instead
 */
export const transaction = rawTransaction;

export default {
  drizzleTransaction,
  rawTransaction,
  transaction, // Legacy
};
