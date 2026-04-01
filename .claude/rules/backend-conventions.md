---
paths:
  - "services/backend/**"
---

# Backend Conventions

## Module Structure (Non-Negotiable)

Every feature module lives in `src/modules/<name>/` with exactly 5 files:

```
<name>.routes.js       ← URL binding, schema attachment, middleware hooks ONLY
<name>.controller.js   ← Request/response handling ONLY — no business logic
<name>.service.js      ← ALL business logic lives here
<name>.repository.js   ← Database access ONLY — calls queries/*.js
<name>.schema.js       ← AJV validation schemas for all endpoints in this module
```

Data flow is strictly one-directional:
`routes → controller → service → repository → queries/*.js → PostgreSQL`

Violations:
- Controllers NEVER contain business logic or direct DB calls
- Services NEVER call `db.js` or any query function directly
- Repositories NEVER contain conditional logic or business rules
- SQL NEVER lives outside `src/database/queries/<entity>.queries.js`

## ES Modules

- Always `import`/`export` — NEVER `require()` or `module.exports`
- Include file extensions in relative imports: `import { fn } from './auth.service.js'`
- Module type is `"module"` in `package.json` — don't change it

## Logging

- Always use the Pino logger: `import logger from '../../config/logger.js'`
- Levels: `logger.info()` for normal ops, `logger.warn()` for degraded states, `logger.error()` for failures, `logger.debug()` for dev-only detail
- NEVER use `console.log()`, `console.error()`, or `console.warn()` anywhere in src/
- Log context objects as the first argument: `logger.info({ userId, orderId }, 'Order accepted')`

## Validation

- Every route with a request body or query params MUST have a schema in `<module>.schema.js`
- Attach schemas via Fastify's `schema` option in `routes.js` — NEVER validate manually in controllers
- Use AJV keywords: `type`, `required`, `properties`, `additionalProperties: false`

## Response Format

ALL responses use helpers from `src/utils/response.util.js`. NEVER construct response objects inline.

```
// Success: { "success": true, "message": "...", "data": {...}, "timestamp": "ISO8601" }
// Error:   { "success": false, "message": "...", "error": "detail", "statusCode": 4xx/5xx }
```

## Error Handling

- Use custom error classes from `src/utils/error.util.js` (e.g., `NotFoundError`, `UnauthorizedError`)
- NEVER throw raw `new Error('message')` from service or repository layers
- All unhandled errors bubble to `src/middleware/error.middleware.js` — don't catch-and-swallow

## Environment

- Access ALL env variables via `src/config/env.js` only — NEVER `process.env.*` directly in any module
- When adding a new env var: update `env.js`, `.env.example`, and document the default value
