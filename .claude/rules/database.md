---
paths:
  - "services/backend/src/database/**"
  - "services/backend/src/modules/**/*.repository.js"
---

# Database Conventions

## Query File Rules

- ALL SQL lives in `src/database/queries/<entity>.queries.js` — one file per entity
- Each query file exports named functions: `export const getUserById = (id) => ({ text: '...', values: [id] })`
- NEVER inline SQL strings in service or repository files — they must call a query function
- Query functions return a `{ text, values }` object (for pg's parameterized query format)

## SQL Rules

- ALWAYS use parameterized placeholders: `$1, $2, $3...` — NEVER string interpolation
- NEVER `SELECT *` — always list explicit columns
- Column names: `snake_case` to match PostgreSQL convention
- Table joins: always use explicit `INNER JOIN`, `LEFT JOIN` — never implicit comma joins
- For geospatial queries: use PostGIS functions (`ST_DWithin`, `ST_Distance`, `ST_AsGeoJSON`, `ST_MakePoint`)
- Always add `LIMIT` to queries that could return large result sets

## Transactions

- Use the helper in `src/database/transaction.js` for any operation that touches multiple tables
- NEVER start/commit/rollback transactions manually in service or repository code
- If a transaction helper doesn't exist for your use case, create a new one in `transaction.js`

## Schema Changes (Important)

- NEVER modify `src/database/init/schema.sql` directly for production changes
- For any schema change: create a new migration file `src/database/init/<NNN>_<description>.sql`
  - Prefix with a 3-digit sequential number (`001_`, `002_`, etc.)
  - Wrap in `BEGIN;` ... `COMMIT;`
  - Include a header comment: `-- Migration: <description>` and `-- Date: YYYY-MM-DD`
- Test the migration on a local dev database before discussing it further

## Connection Pool

- Use the shared pool from `src/database/db.js`
- NEVER create new `pg.Pool` or `pg.Client` instances anywhere else in the codebase
- Connection pool settings (`DB_POOL_MAX`) are configured in `src/config/env.js`
