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
const migrationsMetaDir = path.join(migrationsDir, "meta");
const journalPath = path.join(migrationsMetaDir, "_journal.json");

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type Journal = {
  version: string;
  dialect: string;
  entries: JournalEntry[];
};

const EMPTY_JOURNAL: Journal = {
  version: "7",
  dialect: "postgresql",
  entries: [],
};

function ensureMigrationScaffold() {
  fs.mkdirSync(migrationsMetaDir, { recursive: true });

  if (!fs.existsSync(journalPath)) {
    fs.writeFileSync(journalPath, JSON.stringify(EMPTY_JOURNAL, null, 2));
    console.log("🧱 Created drizzle journal scaffold (meta/_journal.json)");
    return;
  }

  let parsed: Journal | null = null;
  try {
    parsed = JSON.parse(fs.readFileSync(journalPath, "utf8")) as Journal;
  } catch {
    fs.writeFileSync(journalPath, JSON.stringify(EMPTY_JOURNAL, null, 2));
    console.log("🧹 Repaired malformed drizzle journal (meta/_journal.json)");
    return;
  }

  if (!Array.isArray(parsed.entries)) {
    fs.writeFileSync(journalPath, JSON.stringify(EMPTY_JOURNAL, null, 2));
    console.log("🧹 Repaired invalid drizzle journal entries");
    return;
  }

  const migrationSqlFiles = new Set(
    fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"))
      : [],
  );

  const validEntries = parsed.entries.filter((entry) => {
    const snapshotPath = path.join(
      migrationsMetaDir,
      `${entry.tag}_snapshot.json`,
    );
    const migrationPath = path.join(migrationsDir, `${entry.tag}.sql`);
    return (
      fs.existsSync(snapshotPath) &&
      (fs.existsSync(migrationPath) ||
        migrationSqlFiles.has(`${entry.tag}.sql`))
    );
  });

  if (validEntries.length !== parsed.entries.length) {
    const normalizedEntries = validEntries.map((entry, idx) => ({
      ...entry,
      idx,
    }));
    const normalized: Journal = {
      ...parsed,
      entries: normalizedEntries,
    };
    fs.writeFileSync(journalPath, JSON.stringify(normalized, null, 2));
    console.log(
      "🧹 Pruned stale drizzle journal entries with missing snapshot/sql files",
    );
  }
}

/** drizzle-kit quotes custom PostGIS types; unquoted geography(...) is required. */
function fixPostgisGeographyQuoting(dir: string) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
  for (const file of files) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) {
      continue;
    }

    const content = fs.readFileSync(fp, "utf8");
    const next = content.replaceAll(
      '"geography(POINT, 4326)"',
      "geography(POINT, 4326)",
    );
    if (next !== content) {
      fs.writeFileSync(fp, next);
      console.log(`🔧 Fixed PostGIS geography quoting in migrations/${file}`);
    }
  }
}

console.log("🔄 Generating SQL migration from TypeScript schema...");
console.log(`📁 Working directory: ${databaseDir}`);

try {
  ensureMigrationScaffold();

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
