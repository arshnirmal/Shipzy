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
const SETUP_SQL = path.resolve(__dirname, "../src/database/setup.sql");
const MIGRATIONS_DIR = path.resolve(__dirname, "../src/database/migrations");
const FUNCTIONS_DIR = path.resolve(__dirname, "../src/database/functions");
const MASTER_DATA_SQL = path.resolve(
  __dirname,
  "../src/database/seeds/master-data.sql",
);

// Database connection
const sslConfig =
  process.env.DB_SSL === "true" ||
  process.env.DB_SSL === "require" ||
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || process.env.POSTGRES_DB || "shipzy_db",
      user: process.env.DB_USER || process.env.POSTGRES_USER || "postgres",
      password:
        process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
      ssl: sslConfig,
    });

async function deploy() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting Database Deployment...");
    console.log(
      `📡 Connected to: ${process.env.DB_HOST || (process.env.DATABASE_URL ? "DATABASE_URL" : "localhost")}`,
    );

    // 1. Create Deployment Log Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _deployment_log (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        hash VARCHAR(64),
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Run Setup SQL (Extensions & Schemas) - Run once
    console.log("\n🔧 Running Setup (Extensions & Schemas)...");
    if (fs.existsSync(SETUP_SQL)) {
      const { rows } = await client.query(
        "SELECT id FROM _deployment_log WHERE filename = $1",
        ["setup.sql"],
      );

      if (rows.length === 0) {
        console.log("   Running: setup.sql");
        const sql = fs.readFileSync(SETUP_SQL, "utf-8");

        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query(
            "INSERT INTO _deployment_log (filename) VALUES ($1)",
            ["setup.sql"],
          );
          await client.query("COMMIT");
          console.log("   ✅ Setup complete");
        } catch (err) {
          await client.query("ROLLBACK");
          console.error("   ❌ Setup failed");
          throw err;
        }
      } else {
        console.log("   ⏭️  Setup already executed");
      }
    }

    // 3. Deploy Drizzle Migrations (Generated from TypeScript schema)
    console.log("\n📦 Deploying Migrations...");
    if (fs.existsSync(MIGRATIONS_DIR)) {
      const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      if (files.length === 0) {
        console.log("   ⚠️  No migrations found. Run: npm run db:generate");
      } else {
        for (const file of files) {
          const { rows } = await client.query(
            "SELECT id FROM _deployment_log WHERE filename = $1",
            [file],
          );

          if (rows.length === 0) {
            console.log(`   Running: ${file}`);
            const sql = fs.readFileSync(
              path.join(MIGRATIONS_DIR, file),
              "utf-8",
            );

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
    } else {
      console.log(
        "   ⚠️  Migrations directory not found. Run: npm run db:generate",
      );
    }

    // 4. Deploy Functions (Always run / Replace)
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

    // 5. Reference / master data (idempotent — safe on every deploy)
    console.log("\n🌱 Applying master reference data...");
    if (fs.existsSync(MASTER_DATA_SQL)) {
      const sql = fs.readFileSync(MASTER_DATA_SQL, "utf-8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log("   ✅ master-data.sql applied");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("   ❌ master-data.sql failed");
        throw err;
      }
    } else {
      console.log("   ⚠️  master-data.sql not found — skipping");
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
