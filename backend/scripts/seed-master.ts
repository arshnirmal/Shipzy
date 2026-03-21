import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER_DATA_SQL = path.resolve(
  __dirname,
  "../src/database/seeds/master-data.sql",
);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || process.env.POSTGRES_DB || "shipzy_db",
  user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
  password:
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  if (!fs.existsSync(MASTER_DATA_SQL)) {
    console.error("Missing:", MASTER_DATA_SQL);
    process.exit(1);
  }
  const sql = fs.readFileSync(MASTER_DATA_SQL, "utf-8");
  const client = await pool.connect();
  try {
    console.log("Applying master-data.sql...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Done.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
