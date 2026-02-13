// services/backend/src/database/transaction.ts
import pg from "pg";
import logger from "../config/logger.js";
import db from "./db.js";

/**
 * Execute a function within a database transaction
 * @param callback - Async function that receives a client
 * @returns Result of the callback
 */
export const transaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");
    logger.debug("Transaction started");

    const result = await callback(client);

    await client.query("COMMIT");
    logger.debug("Transaction committed");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.warn({
      msg: "Transaction rolled back",
      error: (error as Error).message,
    });
    throw error;
  } finally {
    client.release();
  }
};

export default transaction;
