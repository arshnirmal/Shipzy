// services/backend/src/database/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import config from "../config/env.js";

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    ssl: config.database.ssl,
  },
  verbose: true,
  strict: true,
});
