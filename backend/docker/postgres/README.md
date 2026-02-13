# 🗄️ PostgreSQL Initialization

## How It Works

This setup uses **direct volume mounts** to the source files - **no copying required!**

### Init Scripts Order

PostgreSQL runs scripts in `/docker-entrypoint-initdb.d/` in alphabetical order:

1. **01-extensions.sql** (from `docker/postgres/init-scripts/`)
   - Installs PostGIS, UUID, pg_stat_statements

2. **02-load-schema.sh** (from `docker/postgres/init-scripts/`)
   - Loads all schema files from `src/database/schemas/` in order
   - ✅ **Modular schema files!**

3. **03-load-functions.sh** (from `docker/postgres/init-scripts/`)
   - Loads all `.sql` files from mounted functions directory

4. **functions/\*.sql** (mounted from `services/backend/src/database/functions/`)
   - All your stored functions
   - ✅ **Single source of truth!**

## Volume Mounts

```yaml
volumes:
  # Actual source files (no duplication!)
  - ./services/backend/src/database/schemas:/docker-entrypoint-initdb.d/schemas:ro
  - ./services/backend/src/database/functions:/docker-entrypoint-initdb.d/functions:ro
```

## Benefits

✅ **Single source of truth** - Edit only in `services/backend/src/database/`
✅ **No copying** - Files are mounted directly
✅ **Auto-sync** - Changes are immediately available
✅ **No maintenance** - No need to keep files in sync

## Making Changes

Just edit the source files:

```bash
# Edit schema
nano services/backend/src/database/schemas/

# Edit functions
nano services/backend/src/database/functions/auth.sql

# Recreate database to apply changes
./scripts/reset-db.sh
```

## File Structure

```
services/backend/src/database/
├── init/
│   └── schema.sql          ← Edit here (mounted to 02-schema.sql)
└── functions/
    ├── auth.sql            ← Edit here (auto-loaded)
    ├── orders.sql          ← Edit here (auto-loaded)
    ├── logistics.sql       ← Edit here (auto-loaded)
    ├── tracking.sql        ← Edit here (auto-loaded)
    └── payments.sql        ← Edit here (auto-loaded)

docker/postgres/init-scripts/
├── 01-extensions.sql       ← Edit here (extensions only)
└── 03-load-functions.sh    ← Auto-loads function files
```

## First Time Setup

**No manual copying required!** Just:

```bash
./scripts/dev.sh
```

PostgreSQL will automatically load all files from the source directories.

## Notes

- Init scripts only run on **first database creation**
- To reapply changes: `./scripts/reset-db.sh` (deletes database)
- All mounts are **read-only** (`:ro`) for safety
- Function files are loaded in alphabetical order
