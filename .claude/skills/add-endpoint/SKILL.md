---
name: add-endpoint
description: >
  Add a new API endpoint to an existing Shipzy backend module. Invoke when asked to add a new
  route, API endpoint, or feature to an already-existing module (auth, users, drivers, orders,
  addresses, or static). Touches all 5 module files in the correct order.
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: <module> <METHOD> <path>  e.g. orders GET /orders/:id/tracking
---

# Add New Endpoint: $ARGUMENTS

## Step 1 — Read the Existing Module

!`ls services/backend/src/modules/`

Read all 5 files of the target module before writing anything.

## Step 2 — Make Changes in This Order

1. **`<module>.schema.js`** — Add the AJV schema for the new endpoint (body, querystring, params, response)
2. **`<module>.routes.js`** — Register the new route with the schema and appropriate auth middleware
3. **`<module>.controller.js`** — Add a controller method (extract input → call service → return via `response.util.js`)
4. **`<module>.service.js`** — Add the business logic method
5. **`<module>.repository.js`** — Add the DB access method (if DB is needed)
6. **`src/database/queries/<module>.queries.js`** — Add the SQL query (if DB is needed)
7. **`tests/<module>/<module>.test.js`** — Add test cases

## Step 3 — Verification Checklist

- [ ] Schema defined in `<module>.schema.js`
- [ ] Route registered with schema and auth middleware
- [ ] Controller extracts input and formats response only — zero business logic
- [ ] Business logic is in service only
- [ ] DB calls are in repository only
- [ ] SQL uses parameterized queries (`$1, $2`) — no string concatenation
- [ ] Response uses `response.util.js` helpers
- [ ] Tests added: happy path + unauthorized + validation failure
- [ ] `npm run lint` passes with no errors

Show a summary table of all files modified and what changed in each.
