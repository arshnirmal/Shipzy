# Shipzy Database

This directory contains the PostgreSQL database schema, functions, queries, and seed data for the Shipzy backend.

## Structure

- `init/schema.sql`: Main schema definition with tables, enums, indexes, views, and triggers.
- `functions/`: PL/pgSQL functions for business logic (auth, orders, etc.).
- `queries/`: JavaScript modules exporting parameterized SQL queries for use in the Node.js backend.
- `seeds/`: SQL scripts for populating development data.
- `db.js`: Connection pool setup using `pg`.
- `transaction.js`: Helper for running transactions.

## Tables Overview

- `users`: User accounts (id, email, name, phone, role, password_hash).
- `drivers`: Driver details (extends users: vehicle_type, license_number, is_available, rating, current location).
- `orders`: Ride orders (pickup/dropoff locations, status).
- `order_tracking`: Location updates during rides.
- `payments`: Payment records for orders.

See `schema.sql` for full details.

## Initialization

1. Set `DATABASE_URL` in `.env` (e.g., `postgresql://user:pass@localhost:5432/shipzy`).
2. Run the backend: `npm run dev` (connects automatically).
3. Initialize schema:
   ```bash
   psql $DATABASE_URL -f init/schema.sql
   ```
4. Seed development data:
   ```bash
   psql $DATABASE_URL -f seeds/dev-data.sql
   ```

## Migrations

Use a tool like `db-migrate` or manual SQL scripts. Track changes in a `migrations/` folder (not included).

## Usage in Backend

Import queries:
```js
const authQueries = require('./database/queries/auth.queries');
const { query } = require('./database/db');

// Execute query
const result = await query(authQueries.createUser, [email, name, phone, role, hash]);
```

For functions, call via SQL:
```js
await query('SELECT auth_hash_password($1)', [password]);
```

For transactions:
```js
const { withTransaction } = require('./database/transaction');
await withTransaction(async (client) => {
  // Use client.query()
});
```

## Functions

- Auth: Password hashing/verification, JWT payload.
- Logistics: Find nearest drivers, update availability.
- Orders: Create/update orders, assign drivers.
- Tracking: Insert points, get recent tracking.
- Payments: Create/update payments, calculate earnings.

Call them as `SELECT function_name(params);`.

## Seed Data

Run `seeds/dev-data.sql` for sample users, drivers, orders. Passwords: 'password123'.

## Testing

Use the seeded data to test API endpoints. Ensure functions work with sample data.

## Notes

- Uses UUIDs for IDs.
- Timestamps in UTC.
- Add PostGIS extension for advanced geo queries if needed.
- Secure passwords in production; use app-level hashing before storing.

For production, use connection pooling and monitor queries.
