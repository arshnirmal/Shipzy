#!/usr/bin/env tsx
/**
 * Generate SQL migration from Drizzle TypeScript schema
 * This script generates SQL migrations from the TypeScript schema definitions
 * Run: npm run db:generate
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const databaseDir = path.join(backendDir, "src/database");

console.log("🔄 Generating SQL migration from TypeScript schema...");
console.log(`📁 Working directory: ${databaseDir}`);

try {
  // Use CJS config so drizzle-kit (which uses require) loads without ESM errors
  const configPath = path.join(databaseDir, "drizzle.config.cjs");
  execSync(`npx drizzle-kit generate --config=${configPath}`, {
    cwd: databaseDir,
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("\n✅ Migration generated successfully!");
  console.log("📝 Review the generated SQL in: src/database/migrations/");
  console.log("🚀 Deploy with: npm run db:deploy");
} catch (error) {
  console.error("\n❌ Failed to generate migration:", error);
  process.exit(1);
}
