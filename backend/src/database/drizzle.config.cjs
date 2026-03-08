// Drizzle Kit config (CommonJS) so npx drizzle-kit can load it without ESM/require conflicts
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "shipzy_user",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "shipzy_dev",
    ssl:
      process.env.DB_SSL === "true" ||
      process.env.DB_SSL === "require" ||
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  },
  verbose: true,
  strict: true,
};
