// Drizzle Kit config (CommonJS) so npx drizzle-kit can load it without ESM/require conflicts
const path = require("node:path");

// Load environment variables from multiple possible locations
const dotenv = require("dotenv");
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

module.exports = {
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials,
  verbose: true,
  strict: true,
};
