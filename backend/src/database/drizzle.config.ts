// services/backend/src/database/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from multiple possible locations
const envPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  "/app/.env", // Docker container path
  ".env", // Current directory
];

for (const envPath of envPaths) {
  if (dotenv.config({ path: envPath }).error === undefined) {
    // Successfully loaded .env file
    break;
  }
}

const sslConfig =
  process.env.DB_SSL === "true" ||
  process.env.DB_SSL === "require" ||
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;

const dbCredentials = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "shipzy_user",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "shipzy_dev",
      ssl: sslConfig,
    };

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials,
  verbose: true,
  strict: true,
});
