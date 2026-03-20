#!/usr/bin/env tsx
/**
 * Generate SQL migration from Drizzle TypeScript schema
 * This script generates SQL migrations from the TypeScript schema definitions
 * Run: npm run db:generate
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const databaseDir = path.join(backendDir, "src/database");
const migrationsDir = path.join(databaseDir, "migrations");

/** drizzle-kit quotes custom PostGIS types; unquoted geography(...) is required. */
function fixPostgisGeographyQuoting(dir: string) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
  for (const file of files) {
    const fp = path.join(dir, file);
    const content = fs.readFileSync(fp, "utf8");
    const next = content.replaceAll('"geography(POINT, 4326)"', "geography(POINT, 4326)");
    if (next !== content) {
      fs.writeFileSync(fp, next);
      console.log(`🔧 Fixed PostGIS geography quoting in migrations/${file}`);
    }
  }
}

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

  fixPostgisGeographyQuoting(migrationsDir);

  console.log("\n✅ Migration generated successfully!");
  console.log("📝 Review the generated SQL in: src/database/migrations/");
  console.log("🚀 Deploy with: npm run db:deploy");
} catch (error) {
  console.error("\n❌ Failed to generate migration:", error);
  process.exit(1);
}
