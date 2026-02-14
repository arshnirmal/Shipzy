# Database Deployment Guide (Koyeb & Neon)

## Overview

We have standardized the database deployment to be safe and idempotent. You can run the deployment script against any environment (Dev or Prod) without fear of data loss.

## The `db:deploy` Script

The `npm run db:deploy` command:

1.  Connects to the database defined in your environment variables.
2.  Creates a tracking table `_deployment_log` if it doesn't exist.
3.  **Schemas**: Checks `src/database/schemas/*.sql`. If a file has already been run (recorded in the log), it is skipped. New files are executed and logged.
4.  **Functions**: Always runs `src/database/functions/*.sql` (assumes `CREATE OR REPLACE` syntax) to ensure the latest logic is applied.

## How to Deploy to Koyeb

### 1. Environment Variables

Ensure your Koyeb service has the following environment variables set (connecting to Neon):

- `DB_HOST`: (your neon host)
- `DB_PORT`: 5432
- `DB_NAME`: (your database name)
- `DB_USER`: (your username)
- `DB_PASSWORD`: (your password)
- `NODE_ENV`: production

### 2. Build Command

Update your Koyeb Build Command to include the database deployment step.

**Option A: Run during build (Recommended if DB is accessible during build)**

```bash
npm install && npm run build && npm run db:deploy
```

**Option B: Run as a separate worker or manual job**
If the build environment cannot access the database, you can run this command locally against production, or set it as the "Run Command" for a one-off instance.

### 3. Local Deployment to Production

You can also run the migration from your local machine against production:

```bash
# Create a .env.prod file with Neon credentials
npm run db:deploy --env-file .env.prod
```

## Creating Migrations

1.  **Do not edit old schema files** (e.g., `01-extensions...sql`) if they have already run in production.
2.  **Create a new file** in `src/database/schemas/` with a higher number, e.g., `11-add-user-columns.sql`.
3.  Commit and push. `db:deploy` will pick it up automatically.
