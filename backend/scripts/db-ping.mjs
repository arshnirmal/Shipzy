/**
 * Lightweight TCP/DB check for startup scripts (no psql required).
 * Uses the same env vars as the backend: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 */
import pg from "pg";

const { Client } = pg;

const ssl =
  process.env.DB_SSL === "true" ||
  process.env.DB_SSL === "require" ||
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;

const client = new Client({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
  ssl,
});

try {
  await client.connect();
  await client.query("SELECT 1");
  await client.end();
  process.exit(0);
} catch {
  try {
    await client.end();
  } catch {
    // ignore
  }
  process.exit(1);
}
