---
name: db-migration
description: >
  Create a new PostgreSQL database migration for Shipzy. Invoke when asked to add a table,
  add columns, create indexes, modify constraints, or make any other schema change.
  Never modifies schema.sql directly — always creates a new numbered migration file.
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: <short-description>  e.g. add-driver-ratings-table  OR  add-index-orders-status
---

# Create Database Migration: $ARGUMENTS

## Step 1 — Read Current Schema

!`cat services/backend/src/database/init/schema.sql`
!`ls -1 services/backend/src/database/init/`

## Step 2 — Determine Migration Number

Find the highest existing migration number in `src/database/init/` and increment by 1.
Format: `NNN_<description>.sql` where NNN is zero-padded (e.g., `003_add-driver-ratings.sql`).

## Step 3 — Create Migration File

Create `services/backend/src/database/init/<NNN>_$ARGUMENTS.sql` with this structure:

```sql
-- Migration: $ARGUMENTS
-- Date: <today's date YYYY-MM-DD>
-- Description: <one sentence describing what this changes and why>

BEGIN;

-- Your DDL statements here

COMMIT;
```

## SQL Requirements

- Table/column names: `snake_case`
- Every new table gets: `id SERIAL PRIMARY KEY`, `created_at TIMESTAMP DEFAULT NOW()`, `updated_at TIMESTAMP DEFAULT NOW()`
- Foreign keys: add `REFERENCES <table>(id) ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- Indexes: add on all foreign key columns and any column used in WHERE clauses
- `NOT NULL` on all required fields
- Use proper PostgreSQL types: `BIGINT`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `NUMERIC(10,2)`, `TIMESTAMP`
- For geospatial: `GEOMETRY(Point, 4326)` with `CREATE INDEX ... USING GIST`

## After Creation

1. Show the complete migration SQL
2. List any `src/database/queries/` files that need new query functions for the new schema
3. Remind to run:
   ```bash
   psql -U shipzy_user -d shipzy_dev -f services/backend/src/database/init/<migration-file>.sql
   ```
