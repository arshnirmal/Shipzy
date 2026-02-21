#!/usr/bin/env tsx
/**
 * Generate SQL migration from Drizzle TypeScript schema
 * This script generates SQL migrations from the TypeScript schema definitions
 * Run: npm run db:generate
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const databaseDir = path.join(backendDir, "src/database");

console.log("🔄 Generating SQL migration from TypeScript schema...");
console.log(`📁 Working directory: ${databaseDir}`);

try {
  // Run drizzle-kit generate from database directory
  execSync(
    `npx drizzle-kit generate`,
    {
      cwd: databaseDir,
      stdio: "inherit",
      env: { ...process.env },
    }
  );

  console.log("\n✅ Migration generated successfully!");
  console.log("📝 Review the generated SQL in: src/database/migrations/");
  console.log("🚀 Deploy with: npm run db:deploy");
} catch (error) {
  console.error("\n❌ Failed to generate migration:", error);
  process.exit(1);
}
