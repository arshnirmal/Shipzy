# Database Deployment Guide (Koyeb & Neon)

## Overview

We have standardized the database deployment to be safe and idempotent. You can run the deployment script against any environment (Dev or Prod) without fear of data loss.

## The `db:deploy` Script

The `pnpm run db:deploy` command:

1.  Connects to the database defined in your environment variables.
2.  Creates a tracking table `_deployment_log` if it doesn't exist.
3.  **Schemas**: Checks `src/database/schemas/*.sql`. If a file has already been run (recorded in the log), it is skipped. New files are executed and logged.
4.  **Functions**: Always runs `src/database/functions/*.sql` (assumes `CREATE OR REPLACE` syntax) to ensure the latest logic is applied.

## How to Deploy to Koyeb

### Recommended: Two-Service Release Flow (Dockerfile)

Use two Koyeb services in the same app:

- `backend-migrate` (Worker/Job): runs `pnpm run db:deploy` and exits.
- `backend-api` (Web Service): runs the API container normally.

This is the safest flow for this repository because the runtime Docker stage starts only `dist/server.js` and does not run migrations automatically.

### Service A: Migration Worker (`backend-migrate`)

1. Source:

- Same Git repository and branch as API.
- Root directory: `backend`.
- Dockerfile: `backend/Dockerfile.migrate`.

2. Environment variables:

- `DATABASE_URL` (Neon pooled URL with `sslmode=require`)
- `NODE_ENV=production`
- Optional fallback vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

3. Start command:

- Keep Docker default command from `backend/Dockerfile.migrate`.

4. Scaling:

- Single instance.
- Disable auto-redeploy if you only want to run it per release.

### Service B: API Web Service (`backend-api`)

1. Source:

- Same Git repository and branch.
- Root directory: `backend`.
- Dockerfile: `backend/Dockerfile`.

2. Environment variables:

- `DATABASE_URL` (same Neon project/branch used by migration worker)
- `NODE_ENV=production`
- API runtime vars (JWT, Firebase, Mapbox, CORS, etc.)

3. Start command:

- Keep Docker default: `node dist/server.js`.

### Release Order

For every production release:

1. Deploy `backend-migrate` and wait for successful completion.
2. Deploy `backend-api`.
3. Verify health endpoint and logs.

If `backend-migrate` fails, do not deploy `backend-api` for that release.

### 1. Environment Variables

Ensure your Koyeb service has the following environment variables set (connecting to Neon):

- `DATABASE_URL`: (Neon pooled connection string, includes `sslmode=require`)
- `DB_HOST`: (optional fallback)
- `DB_PORT`: (optional fallback)
- `DB_NAME`: (optional fallback)
- `DB_USER`: (optional fallback)
- `DB_PASSWORD`: (optional fallback)
- `NODE_ENV`: production

### 2. Build Command

Update your Koyeb Build Command to include the database deployment step.

**Option A: Run during build (Recommended if DB is accessible during build)**

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm run build && pnpm run db:deploy
```

**Option B: Run as a separate worker or manual job**
If the build environment cannot access the database, you can run this command locally against production, or set it as the "Run Command" for a one-off instance.

### 3. Local Deployment to Production

You can also run the migration from your local machine against production:

```bash
# Use backend/.env.prod with DATABASE_URL and NODE_ENV=production
pnpm run release:koyeb
```

Optional variants:

```bash
# Use a different env file
./scripts/release-koyeb.sh .env.staging

# Skip install if node_modules is already up to date
./scripts/release-koyeb.sh .env.prod --skip-install
```

## Creating Migrations

1.  **Do not edit old schema files** (e.g., `01-extensions...sql`) if they have already run in production.
2.  **Create a new file** in `src/database/schemas/` with a higher number, e.g., `11-add-user-columns.sql`.
3.  Commit and push. `db:deploy` will pick it up automatically.
