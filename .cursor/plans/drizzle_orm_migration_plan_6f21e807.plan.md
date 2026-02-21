---
name: Drizzle ORM Migration Plan with Schema Optimization
overview: ""
todos:
  - id: install-dependencies
    content: Install drizzle-orm@0.45.1, drizzle-kit, and configure package.json
    status: completed
  - id: create-new-folder-structure
    content: Create backend/src/database-new/ folder structure with subdirectories (schema, queries, functions, utils)
    status: completed
    dependencies:
      - install-dependencies
  - id: create-drizzle-config
    content: Create database-new/drizzle.config.ts and database-new/drizzle.ts connection wrapper
    status: completed
    dependencies:
      - create-new-folder-structure
  - id: create-optimized-sql-schemas
    content: Create optimized SQL schema files in database-new/schemas/ with JSONB consolidation (pickup_location, delivery_location, items, labels in orders.requests)
    status: completed
    dependencies:
      - create-new-folder-structure
  - id: add-computed-postgis-columns
    content: Add GENERATED ALWAYS AS STORED PostGIS columns for JSONB location data (pickup_point, delivery_point) with spatial indexes
    status: completed
    dependencies:
      - create-optimized-sql-schemas
  - id: define-schema-structure
    content: Create database-new/schema/index.ts and organize schema files by domain (public, users, orders, logistics, payments, tracking, ratings)
    status: completed
    dependencies:
      - create-drizzle-config
      - create-optimized-sql-schemas
  - id: define-base-schemas
    content: Define all optimized table schemas in Drizzle format with JSONB types, computed PostGIS columns, and proper indexes
    status: completed
    dependencies:
      - define-schema-structure
  - id: define-relations
    content: "Define Drizzle relations for foreign keys (users→addresses, orders→assignments, etc.) - note: orders no longer references logistics.locations"
    status: completed
    dependencies:
      - define-base-schemas
  - id: create-transaction-helper
    content: Create database-new/transaction.ts with Drizzle transaction support and raw SQL transaction support for stored functions
    status: completed
    dependencies:
      - create-drizzle-config
  - id: create-raw-sql-wrapper
    content: Create executeRaw<T>() helper in database-new/utils/ for type-safe raw SQL queries with Drizzle
    status: completed
    dependencies:
      - create-drizzle-config
  - id: create-postgis-helpers
    content: Create helper functions in database-new/utils/postgis.ts for PostGIS operations (createPoint, distance, etc.) using Drizzle sql helper
    status: completed
    dependencies:
      - create-raw-sql-wrapper
  - id: migrate-stored-functions
    content: Copy and update stored functions to work with optimized schema (update orders.create_order_with_locations to use JSONB)
    status: completed
    dependencies:
      - create-optimized-sql-schemas
  - id: migrate-static-repository
    content: Migrate static.repository.ts to use Drizzle for all simple SELECT queries
    status: completed
    dependencies:
      - define-base-schemas
      - create-transaction-helper
  - id: migrate-users-repository
    content: ""
    status: completed
    dependencies:
      - define-base-schemas
      - create-transaction-helper
  - id: migrate-auth-repository
    content: ""
    status: completed
    dependencies:
      - define-base-schemas
      - create-transaction-helper
  - id: migrate-ratings-repository
    content: ""
    status: completed
    dependencies:
      - define-base-schemas
      - create-transaction-helper
  - id: migrate-orders-repository
    content: Update orders.repository.ts to work with JSONB locations/items/labels, use Drizzle for simple queries, raw SQL for complex
    status: completed
    dependencies:
      - define-base-schemas
      - create-raw-sql-wrapper
      - migrate-stored-functions
  - id: migrate-drivers-repository
    content: Update drivers.repository.ts to use Drizzle for simple queries, keep PostGIS queries as raw SQL
    status: completed
    dependencies:
      - define-base-schemas
      - create-postgis-helpers
  - id: update-complex-queries
    content: Update complex queries in database-new/queries/ to work with optimized schema, use executeRaw with types
    status: completed
    dependencies:
      - create-raw-sql-wrapper
      - migrate-orders-repository
  - id: update-type-definitions
    content: Replace manual types (DbUser, DbCourier) with Drizzle inferred types, create types for JSONB structures
    status: pending
    dependencies:
      - define-base-schemas
  - id: create-data-migration-script
    content: Create script to migrate data from old schema to optimized schema (locations→JSONB, items→JSONB, labels→JSONB)
    status: cancelled
    dependencies:
      - create-optimized-sql-schemas
  - id: update-tests
    content: Update repository tests to work with Drizzle and optimized schema, test both Drizzle and raw SQL queries
    status: cancelled
    dependencies:
      - migrate-static-repository
      - migrate-users-repository
      - migrate-auth-repository
      - migrate-orders-repository
  - id: performance-testing
    content: Compare query performance with optimized schema, ensure no regression, optimize indexes if needed
    status: cancelled
    dependencies:
      - update-complex-queries
  - id: update-documentation
    content: Create database-new/README.md with Drizzle patterns, JSONB usage, computed columns, and query examples
    status: cancelled
    dependencies:
      - update-complex-queries
  - id: final-swap
    content: "After testing: delete backend/src/database/, rename database-new/ to database/, update all imports"
    status: completed
    dependencies:
      - update-tests
      - performance-testing
      - update-documentation
---

# Drizzle ORM Migration Plan with Schema Optimization

## Overview

This plan migrates the Shipzy backend from raw SQL queries to Drizzle ORM v0.45.1 with **schema optimizations** using JSONB consolidation and computed PostGIS columns. The implementation will be done in a new `database-new/` folder, then replace the old `database/` folder after completion. This approach preserves PostgreSQL stored functions and complex geospatial queries while gaining type safety, better developer experience, and improved schema design.

## Schema Optimizations

### JSONB Consolidation Strategy

**1. Order Locations → JSONB**

- **Remove**: `logistics.locations` table references from `orders.requests`
- **Add**: `pickup_location JSONB` and `delivery_location JSONB` columns in `orders.requests`
- **Add**: Computed PostGIS columns `pickup_point` and `delivery_point` (GENERATED ALWAYS AS STORED) for spatial queries
- **Keep**: `logistics.locations` table for courier current locations (needs spatial indexing for matching)

**2. Order Items → JSONB Array**

- **Remove**: `orders.items` table
- **Add**: `items JSONB DEFAULT '[]'` column in `orders.requests`
- Structure: Array of item objects with `itemName`, `quantity`, `weightKg`, `dimensions`, `description`, `value`

**3. Order Labels → JSONB Array**

- **Remove**: `orders.order_labels` junction table
- **Add**: `labels JSONB DEFAULT '[]'` column in `orders.requests`
- Structure: Simple array of label names: `["new", "fastest", "popular"]`

**4. Tracking Events Optimization**

- **Remove**: Redundant `latitude` and `longitude` columns (extract from `location` PostGIS column)
- **Keep**: `location GEOGRAPHY(POINT, 4326)` for spatial queries
- **Keep**: `metadata JSONB` for additional tracking data

### PostGIS Computed Columns

For JSONB location data in orders, use computed stored columns:

```sql
pickup_point GEOGRAPHY(POINT, 4326) 
  GENERATED ALWAYS AS (
    ST_SetSRID(
      ST_MakePoint(
        (pickup_location->>'longitude')::numeric,
        (pickup_location->>'latitude')::numeric
      ),
      4326
    )::geography
  ) STORED
```

**Benefits:**

- Automatic spatial indexing support
- No data duplication
- Query performance maintained
- JSONB flexibility for API structure

### Index Strategy

**JSONB Indexes:**

- GIN indexes on JSONB columns for querying: `CREATE INDEX idx_orders_pickup_city ON orders.requests USING GIN ((pickup_location->>'city'));`
- GIN indexes on JSONB arrays: `CREATE INDEX idx_orders_labels ON orders.requests USING GIN (labels);`

**PostGIS Indexes:**

- GIST indexes on computed PostGIS columns: `CREATE INDEX idx_orders_pickup_point ON orders.requests USING GIST (pickup_point);`

## Architecture Decision: What Stays in PostgreSQL vs Drizzle

### Stays in Pure PostgreSQL (Raw SQL)

1. **Stored Functions** (15+ functions):

   - `orders.calculate_fare()` - Complex pricing logic
   - `orders.create_order_with_locations()` - Multi-table transaction
   - `orders.cancel_order_with_refund()` - Business logic with refunds
   - `orders.assign_order_to_courier()` - Assignment logic
   - `payments.*` functions - Payment processing
   - `logistics.find_nearby_couriers()` - PostGIS spatial query
   - `tracking.*` functions - GeoJSON generation
   - `auth.*` functions - OTP/verification logic

2. **Complex Queries with PostGIS**:

   - `FIND_AVAILABLE_ORDERS_FOR_COURIER` - Uses `ST_DWithin`, `ST_Distance`
   - `UPDATE_COURIER_LOCATION` - Uses `ST_SetSRID`, `ST_MakePoint`
   - `GET_USER_ADDRESSES` - Extracts coordinates with `ST_Y`, `ST_X`
   - All queries using PostGIS geography/geometry types

3. **Complex JOINs** (5+ tables):

   - `FIND_ORDER_BY_ID` - 10+ table joins with nested data
   - `FIND_COURIER_ACTIVE_ASSIGNMENTS` - Complex aggregations
   - `FIND_ORDERS_BY_CLIENT` - Multiple status filters

### Migrates to Drizzle ORM

1. **Simple CRUD Operations**:

   - User profile updates (`UPDATE_USER_PROFILE`)
   - Address CRUD (`SAVE_ADDRESS`, `DELETE_ADDRESS`)
   - Courier profile updates
   - Session management (simple inserts/updates)
   - Rating creation (`INSERT_RATING`)

2. **Simple Lookups**:

   - `FIND_USER_BY_UUID`, `FIND_USER_BY_EMAIL`, `FIND_USER_BY_PHONE`
   - `FIND_COURIER_BY_USER_ID` (can be simplified)
   - Static data queries (delivery types, vehicle categories, etc.)

3. **Simple Status Updates**:

   - `UPDATE_ORDER_STATUS`
   - `UPDATE_COURIER_AVAILABILITY` (without location)
   - `MARK_ORDER_PICKED_UP`, `MARK_ORDER_DELIVERED`

## Implementation Steps

### Phase 1: Setup & New Folder Structure

**Step 1.1: Install Dependencies**

- Install `drizzle-orm@0.45.1`
- Install `drizzle-kit@latest` (for schema introspection and type generation)
- Keep `pg` package and use `drizzle-orm/node-postgres` adapter

**Step 1.2: Create New Folder Structure**

- Create `backend/src/database-new/` directory
- Create subdirectories: `schema/`, `queries/`, `functions/`, `schemas/`, `utils/`
- This allows parallel development without breaking existing code

**Step 1.3: Create Drizzle Configuration**

- Create `backend/src/database-new/drizzle.config.ts` for Drizzle Kit
- Configure connection string from environment variables
- Set schema directory to `./schema`

**Step 1.4: Create Database Connection Wrapper**

- Create `backend/src/database-new/drizzle.ts` that wraps Drizzle instance using `drizzle-orm/node-postgres`
- Create `backend/src/database-new/db.ts` for raw SQL queries (using existing pg Pool pattern)
- Export: `drizzleDb` (Drizzle instance) and `rawDb` (pg Pool for stored functions)

### Phase 2: Optimized SQL Schema Creation

**Step 2.1: Create Optimized SQL Schema Files**

- Create `backend/src/database-new/schemas/` directory
- Copy and modify existing schema files with optimizations:
  - `06-orders.sql`: Add JSONB columns (`pickup_location`, `delivery_location`, `items`, `labels`), remove foreign keys to `logistics.locations`, add computed PostGIS columns
  - `08-tracking.sql`: Remove redundant `latitude`/`longitude` columns
  - Keep other schema files mostly unchanged

**Step 2.2: Add Computed PostGIS Columns**

- In `06-orders.sql`, add computed columns for spatial queries:
  ```sql
  pickup_point GEOGRAPHY(POINT, 4326) 
    GENERATED ALWAYS AS (
      ST_SetSRID(
        ST_MakePoint(
          (pickup_location->>'longitude')::numeric,
          (pickup_location->>'latitude')::numeric
        ),
        4326
      )::geography
    ) STORED,
  delivery_point GEOGRAPHY(POINT, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(
        ST_MakePoint(
          (delivery_location->>'longitude')::numeric,
          (delivery_location->>'latitude')::numeric
        ),
        4326
      )::geography
    ) STORED
  ```


**Step 2.3: Add Optimized Indexes**

- Add GIN indexes on JSONB columns for common queries
- Add GIST indexes on computed PostGIS columns
- Update existing indexes to match new schema structure

**Step 2.4: Update Stored Functions**

- Copy stored functions to `backend/src/database-new/functions/`
- Update `orders.create_order_with_locations()` to work with JSONB locations
- Update other functions that reference removed tables/columns

### Phase 3: Drizzle Schema Definitions

**Step 3.1: Create Base Schema File**

- Create `backend/src/database-new/schema/index.ts`
- Export all schema modules
- Define schema namespace organization

**Step 3.2: Define Schema Modules**

Organize schemas by domain (matching optimized SQL schema):

- `backend/src/database-new/schema/public.ts` - Master data (delivery_types, vehicle_categories, order_statuses, etc.)
- `backend/src/database-new/schema/users.ts` - Users, addresses, auth_sessions, business_accounts
- `backend/src/database-new/schema/orders.ts` - Orders with JSONB columns, assignments, proof_of_delivery
- `backend/src/database-new/schema/logistics.ts` - Locations (for couriers), courier_status, courier_vehicles, driver_sessions
- `backend/src/database-new/schema/payments.ts` - Payment methods, transactions, refunds
- `backend/src/database-new/schema/tracking.ts` - Tracking events (optimized)
- `backend/src/database-new/schema/ratings.ts` - Ratings
- `backend/src/database-new/schema/notifications.ts` - Notification queue, FCM tokens

**Step 3.3: Define JSONB Types**

- Create TypeScript types/interfaces for JSONB structures:
  - `OrderLocationJSONB` - Structure for pickup/delivery locations
  - `OrderItemJSONB` - Structure for items array
  - `OrderLabelsJSONB` - Array of label strings
- Use Drizzle's `jsonb()` column type with proper typing

**Step 3.4: Handle PostGIS Types**

- For direct PostGIS columns (courier locations, tracking events), use custom column type:
  ```typescript
  import { customType } from 'drizzle-orm/pg-core';
  
  const geography = customType<{ data: { lat: number; lng: number } }>({
    dataType: () => 'geography(POINT, 4326)',
  });
  ```

- For computed PostGIS columns, define as generated columns in Drizzle
- Use `sql` helper for PostGIS operations in queries

**Step 3.5: Define Relations**

- Use Drizzle's `relations()` for foreign keys
- Define `users.profiles` → `users.addresses` (one-to-many)
- Define `orders.requests` → `orders.courier_assignments` (one-to-many)
- **Note**: `orders.requests` no longer references `logistics.locations` (locations are JSONB)
- Define `logistics.courier_status` → `logistics.locations` (for courier current location)

### Phase 4: Utility Functions & Helpers

**Step 4.1: Create Raw SQL Wrapper**

- Create `backend/src/database-new/utils/executeRaw.ts`
- Helper function: `executeRaw<T>(sql: string, params: any[]): Promise<T[]>`
- Use Drizzle's `sql` template tag for type-safe raw queries
- Example:
  ```typescript
  const orders = await drizzleDb.execute<OrderDetails>(
    sql`${ordersQueries.FIND_ORDER_BY_ID}`, 
    [orderId]
  );
  ```


**Step 4.2: Create PostGIS Helpers**

- Create `backend/src/database-new/utils/postgis.ts`
- Helper functions:
  - `createPoint(lat: number, lng: number)` - Returns SQL fragment for PostGIS point
  - `distance(point1, point2)` - Calculate distance between points
  - `withinRadius(center, point, radiusKm)` - Check if point is within radius
- Use Drizzle's `sql` helper for all PostGIS operations

**Step 4.3: Create Transaction Helper**

- Create `backend/src/database-new/transaction.ts`
- Support both Drizzle transactions and raw SQL transactions
- Drizzle transactions: `db.transaction(async (tx) => { ... })`
- Raw SQL transactions: For stored function calls that need explicit transaction control

**Step 4.4: Create Data Migration Script**

- Create `backend/scripts/migrate-to-optimized-schema.ts`
- Migrate data from old schema to optimized schema:
  - Convert `logistics.locations` rows to JSONB in `orders.requests`
  - Convert `orders.items` rows to JSONB array
  - Convert `orders.order_labels` to JSONB array
  - Remove redundant `latitude`/`longitude` from `tracking.events`
- Run this script once before switching to new database folder

### Phase 5: Repository Migration (Gradual)

**Step 5.1: Create Hybrid Repository Pattern**

- Keep existing repository structure in modules
- Update imports to use `database-new/` instead of `database/`
- Add Drizzle methods alongside raw SQL methods
- Example: `findByUuid()` uses Drizzle, `calculateFare()` uses raw SQL

**Step 5.2: Migrate Simple Queries First**

**Users Repository** (`backend/src/modules/users/users.repository.ts`):

- Migrate `findByUuid()` to Drizzle
- Migrate `updateProfile()` to Drizzle
- Keep address queries with PostGIS as raw SQL initially

**Auth Repository** (`backend/src/modules/auth/auth.repository.ts`):

- Migrate `findByEmail()`, `findByPhone()` to Drizzle
- Keep `storeJwtToken()`, `validateJwtToken()` as raw SQL (complex logic)

**Static Repository** (`backend/src/modules/static/static.repository.ts`):

- Migrate all simple SELECT queries to Drizzle
- These are perfect candidates (no joins, no PostGIS)

**Ratings Repository** (`backend/src/modules/ratings/ratings.repository.ts`):

- Migrate `createRating()` to Drizzle
- Keep validation queries as raw SQL (complex WHERE clauses)

**Step 5.3: Migrate Orders Repository (Complex)**

- Update `backend/src/modules/orders/orders.repository.ts`
- Handle JSONB locations: Read from `pickup_location`/`delivery_location` JSONB columns
- Handle JSONB items: Read/write `items` JSONB array
- Handle JSONB labels: Read/write `labels` JSONB array
- Use computed PostGIS columns (`pickup_point`, `delivery_point`) for spatial queries
- Update stored function calls to work with JSONB structure
- Use Drizzle for simple queries, raw SQL for complex queries with JSONB

**Step 5.4: Migrate Drivers Repository**

- Update `backend/src/modules/drivers/drivers.repository.ts`
- Use Drizzle for simple profile updates
- Keep PostGIS queries (courier location matching) as raw SQL
- Use PostGIS helpers from `utils/postgis.ts`

### Phase 6: Complex Query Handling

**Step 6.1: Update Complex Queries**

- Update queries in `backend/src/database-new/queries/` to work with optimized schema
- Update `FIND_ORDER_BY_ID` to read from JSONB columns instead of JOINs
- Update `FIND_AVAILABLE_ORDERS_FOR_COURIER` to use computed PostGIS columns
- Use `executeRaw<T>()` helper for type-safe raw queries
- Example:
  ```typescript
  const orders = await executeRaw<OrderDetails>(
    ordersQueries.FIND_ORDER_BY_ID, 
    [orderId]
  );
  ```


**Step 6.2: Keep Stored Function Calls**

- All `CALL_*` queries stay as raw SQL
- Use Drizzle's `sql` helper for type safety:
  ```typescript
  const result = await drizzleDb.execute<FareCalculationResult>(
    sql`SELECT orders.calculate_fare($1, $2, $3, $4, $5) AS result`,
    [deliveryTypeId, vehicleCategoryId, distanceKm, weightTierId, packageTypeId]
  );
  ```

- Update stored functions to accept/return JSONB structures

**Step 6.3: JSONB Query Patterns**

- Create helper functions for common JSONB operations:
  - `extractLocation(order, type: 'pickup' | 'delivery')` - Extract location from JSONB
  - `extractItems(order)` - Extract items array from JSONB
  - `extractLabels(order)` - Extract labels array from JSONB
- Use JSONB operators in queries: `->`, `->>`, `@>`, `?`, etc.

### Phase 7: Type Safety Improvements

**Step 7.1: Generate Types from Schema**

- Drizzle automatically infers types from schema
- Replace manual `DbUser`, `DbCourier` types with Drizzle inferred types
- Create type aliases for JSONB structures:
  ```typescript
  export type OrderLocation = z.infer<typeof OrderLocationZ>;
  export type OrderItem = z.infer<typeof OrderItemZ>;
  ```

- Update `backend/src/types/` to use Drizzle types where applicable

**Step 7.2: Update Repository Return Types**

- Change repository methods to return Drizzle inferred types
- Example: `async findByUuid(uuid: string): Promise<typeof users.$inferSelect | null>`
- For JSONB columns, use typed accessors:
  ```typescript
  const order = await db.select().from(orders).where(eq(orders.orderId, id));
  const pickupLocation = order.pickupLocation as OrderLocation;
  ```


**Step 7.3: Type-Safe Query Results**

- Use Drizzle's `InferSelectModel` and `InferInsertModel` utilities
- Export types from schema files for use in services
- Create helper types for JSONB columns:
  ```typescript
  export type OrderWithLocations = InferSelectModel<typeof orders> & {
    pickupLocation: OrderLocation;
    deliveryLocation: OrderLocation;
    items: OrderItem[];
    labels: string[];
  };
  ```


### Phase 8: Testing & Validation

**Step 8.1: Update Tests**

- Update repository tests to work with Drizzle and optimized schema
- Test JSONB read/write operations
- Test computed PostGIS columns for spatial queries
- Test both Drizzle queries and raw SQL queries
- Ensure stored functions work with JSONB structures

**Step 8.2: Performance Testing**

- Compare query performance: old schema vs optimized schema
- Benchmark JSONB queries vs JOIN queries
- Test PostGIS query performance with computed columns
- Ensure no regression, optimize indexes if needed

**Step 8.3: Integration Testing**

- Test full request flow: create order with JSONB locations/items
- Verify stored functions work with JSONB
- Test transaction handling
- Test data migration script end-to-end

### Phase 9: Documentation & Final Swap

**Step 9.1: Update Documentation**

- Create `backend/src/database-new/README.md` with:
  - Drizzle patterns and usage examples
  - JSONB structure documentation
  - Computed PostGIS columns explanation
  - Query patterns (Drizzle vs raw SQL)
  - Index strategy
  - Migration guide from old schema

**Step 9.2: Code Cleanup**

- Remove unused query files
- Keep query files for complex queries (document why)
- Consolidate duplicate code
- Ensure all imports point to `database-new/`

**Step 9.3: Final Folder Swap**

- Run data migration script on production database
- Deploy optimized SQL schemas
- Test thoroughly in staging
- **Swap**: Delete `backend/src/database/`, rename `database-new/` to `database/`
- Update all imports across codebase (use find/replace or script)
- Deploy and monitor

## File Structure (During Development)

```
backend/src/
├── database/                # OLD - Keep until migration complete
│   └── ... (existing files)
│
└── database-new/            # NEW - Optimized implementation
    ├── db.ts                # Raw SQL connection (pg Pool)
    ├── drizzle.ts           # Drizzle connection
    ├── drizzle.config.ts    # Drizzle Kit configuration
    ├── transaction.ts       # Transaction helper (Drizzle + raw SQL)
    ├── schema/              # Drizzle schema definitions
    │   ├── index.ts
    │   ├── public.ts
    │   ├── users.ts
    │   ├── orders.ts        # With JSONB columns
    │   ├── logistics.ts
    │   ├── payments.ts
    │   ├── tracking.ts      # Optimized (no redundant lat/lng)
    │   ├── ratings.ts
    │   └── notifications.ts
    ├── queries/             # Raw SQL queries (complex queries only)
    │   ├── orders.queries.ts
    │   ├── drivers.queries.ts
    │   └── ...
    ├── functions/           # Stored functions (updated for JSONB)
    │   ├── orders.sql      # Updated to work with JSONB
    │   └── ...
    ├── schemas/             # Optimized SQL schema files
    │   ├── 01-extensions-and-schemas.sql
    │   ├── 02-utils.sql
    │   ├── 03-public-reference-and-master-data.sql
    │   ├── 04-users.sql
    │   ├── 05-logistics.sql
    │   ├── 06-orders.sql    # With JSONB + computed columns
    │   ├── 07-payments.sql
    │   ├── 08-tracking.sql  # Optimized
    │   ├── 09-notifications.sql
    │   └── 10-views-and-seeds.sql
    └── utils/               # Utility functions
        ├── executeRaw.ts    # Type-safe raw SQL wrapper
        └── postgis.ts      # PostGIS helper functions
```

## File Structure (After Final Swap)

```
backend/src/database/        # Renamed from database-new/
├── db.ts
├── drizzle.ts
├── drizzle.config.ts
├── transaction.ts
├── schema/
├── queries/
├── functions/
├── schemas/
└── utils/
```

## Key Decisions

1. **New Folder Approach**: Implement in `database-new/` folder, swap after completion (no backward compatibility needed)
2. **Schema Optimization**: Consolidate order locations/items/labels into JSONB, use computed PostGIS columns for spatial queries
3. **Hybrid Approach**: Keep stored functions and complex PostGIS queries in PostgreSQL, migrate simple CRUD to Drizzle
4. **Gradual Migration**: Migrate one repository at a time, test thoroughly
5. **Type Safety**: Use Drizzle's inferred types, create typed interfaces for JSONB structures
6. **PostGIS Strategy**: Use computed stored columns for JSONB location data, direct PostGIS columns for frequently updated data (courier locations)
7. **No Migration System**: Manual schema deployment, Drizzle schemas match SQL schemas (no auto-migrations)

## Success Criteria

- All simple CRUD operations use Drizzle with type safety
- JSONB consolidation reduces table count and JOIN complexity
- Computed PostGIS columns maintain spatial query performance
- Stored functions work correctly with JSONB structures
- PostGIS queries work correctly with Drizzle's `sql` helper
- Type safety improved across codebase with typed JSONB structures
- No performance regression (benchmarked)
- Schema optimized: 3 fewer tables, better API alignment
- Clean folder swap: old `database/` deleted, `database-new/` renamed to `database/`

## Additional Recommendations

### Index Optimization

1. **JSONB Indexes**: Add GIN indexes on frequently queried JSONB fields:

   - `CREATE INDEX idx_orders_pickup_city ON orders.requests USING GIN ((pickup_location->>'city'));`
   - `CREATE INDEX idx_orders_labels ON orders.requests USING GIN (labels);`

2. **Composite Indexes**: For common query patterns:

   - `CREATE INDEX idx_orders_client_status_created ON orders.requests (client_id, status_id, created_at DESC);`

3. **Partial Indexes**: For active records:

   - `CREATE INDEX idx_orders_active ON orders.requests (status_id) WHERE deleted_at IS NULL;`

### JSONB Structure Validation

Consider adding CHECK constraints or triggers to validate JSONB structure:

```sql
ALTER TABLE orders.requests 
  ADD CONSTRAINT chk_pickup_location_structure 
  CHECK (pickup_location ? 'fullAddress' AND pickup_location ? 'latitude' AND pickup_location ? 'longitude');
```

### Best Practices

1. **JSONB Query Patterns**: Use JSONB operators efficiently:

   - `->` for object access: `pickup_location->'city'`
   - `->>` for text extraction: `pickup_location->>'city'`
   - `@>` for containment: `labels @> '["new"]'::jsonb`
   - `?` for key existence: `pickup_location ? 'landmark'`

2. **Computed Columns**: Use STORED (not VIRTUAL) for PostGIS to enable spatial indexing

3. **Type Safety**: Create Zod schemas for JSONB structures and validate on insert/update