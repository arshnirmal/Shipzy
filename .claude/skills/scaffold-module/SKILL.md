---
name: scaffold-module
description: >
  Scaffold a complete new backend module for Shipzy. Invoke when asked to create a new
  feature module, add a new API domain, or bootstrap a new module with the layered architecture.
  Creates all 5 required files plus query stubs, app registration, and test file.
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: <module-name>
---

# Scaffold New Backend Module: $ARGUMENTS

Read the existing auth module files first to use as the canonical template.

## Read Template

!`cat services/backend/src/modules/auth/auth.routes.js`
!`cat services/backend/src/modules/auth/auth.controller.js`
!`cat services/backend/src/modules/auth/auth.service.js`
!`cat services/backend/src/modules/auth/auth.repository.js`
!`cat services/backend/src/modules/auth/auth.schema.js`
!`cat services/backend/src/app.js`

## Files to Create

1. `services/backend/src/modules/$ARGUMENTS/$ARGUMENTS.routes.js`
   - Register Fastify routes, attach schemas, apply `authenticate` middleware on protected routes

2. `services/backend/src/modules/$ARGUMENTS/$ARGUMENTS.controller.js`
   - Extract request params/body/query, call service methods, return response via `response.util.js`
   - ZERO business logic here

3. `services/backend/src/modules/$ARGUMENTS/$ARGUMENTS.service.js`
   - One exported async function per operation
   - Add `// TODO: Implement` stub + JSDoc comment for each
   - Call repository methods only — no direct DB calls

4. `services/backend/src/modules/$ARGUMENTS/$ARGUMENTS.repository.js`
   - One exported async function per DB operation
   - Call query functions from `../../database/queries/$ARGUMENTS.queries.js`

5. `services/backend/src/modules/$ARGUMENTS/$ARGUMENTS.schema.js`
   - AJV schemas for each route's body, querystring, params, and response

6. `services/backend/src/database/queries/$ARGUMENTS.queries.js`
   - SQL query stubs — parameterized, no SELECT *

7. `services/backend/src/app.js` — Register the new module plugin

8. `services/backend/tests/$ARGUMENTS/$ARGUMENTS.test.js`
   - Jest test file with describe blocks for each planned endpoint

## Requirements

- ES Module syntax throughout (`import`/`export`)
- Use `import logger from '../../config/logger.js'` — NEVER `console.log`
- Import env via `src/config/env.js` — NEVER `process.env.*` directly
- Every stubbed function has `// TODO: Implement` + JSDoc

After creation, print the list of all files created and the route registration line added to `app.js`.
