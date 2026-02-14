import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Config
const SCHEMA_DIR = path.resolve(__dirname, "../src/database/schemas");
const FUNCTIONS_DIR = path.resolve(__dirname, "../src/database/functions");

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || process.env.POSTGRES_DB || "shipzy_db",
  user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
  password:
    process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function deploy() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting Database Deployment...");
    console.log(`📡 Connected to: ${process.env.DB_HOST || "localhost"}`);

    // 1. Create Deployment Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _deployment_log (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        hash VARCHAR(64),
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Deploy Schemas (Run once)
    console.log("\n📂 Checking Schemas...");
    if (fs.existsSync(SCHEMA_DIR)) {
      const files = fs.readdirSync(SCHEMA_DIR).sort();

      for (const file of files) {
        if (!file.endsWith(".sql")) continue;

        const { rows } = await client.query(
          "SELECT id FROM _deployment_log WHERE filename = $1",
          [file],
        );

        if (rows.length === 0) {
          console.log(`   Running: ${file}`);
          const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), "utf-8");

          await client.query("BEGIN");
          try {
            await client.query(sql);
            await client.query(
              "INSERT INTO _deployment_log (filename) VALUES ($1)",
              [file],
            );
            await client.query("COMMIT");
            console.log(`   ✅ Success: ${file}`);
          } catch (err) {
            await client.query("ROLLBACK");
            console.error(`   ❌ Failed: ${file}`);
            throw err;
          }
        } else {
          console.log(`   ⏭️  Skipping: ${file} (already executed)`);
        }
      }
    }

    // 3. Deploy Functions (Always run / Replace)
    console.log("\n⚙️  Updating Functions...");
    if (fs.existsSync(FUNCTIONS_DIR)) {
      const files = fs.readdirSync(FUNCTIONS_DIR).sort();

      for (const file of files) {
        if (!file.endsWith(".sql")) continue;
        console.log(`   Refreshing: ${file}`);
        const sql = fs.readFileSync(path.join(FUNCTIONS_DIR, file), "utf-8");

        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`   ❌ Failed: ${file}`);
          throw err;
        }
      }
    }

    console.log("\n✅ Deployment Complete!");
  } catch (err) {
    console.error("\n❌ Deployment Failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

deploy();
