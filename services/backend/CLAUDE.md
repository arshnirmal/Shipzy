> See root CLAUDE.md for monorepo overview, git workflow, and shared conventions.

# Shipzy Backend Guide

This guide applies to the Shipzy backend API implementation and backend domain logic. Use it when changing API routes, validation, service behavior, SQL, migrations, or test coverage. The backend is ESM-based, Fastify-powered, PostgreSQL-backed, and organized around strict layer boundaries.

## Scope And Source Paths

This file is located in services/backend for Claude Code context layering. In the current repository layout, backend runtime code and scripts live under backend.

Primary working directory:

```text
backend/
```

## Directory Structure

```text
backend/
|- src/
|  |- app.ts
|  |- server.ts
|  |- config/
|  |  |- env.ts
|  |  |- firebase.ts
|  |  \- logger.ts
|  |- utils/
|  |  |- jwt.util.ts
|  |  |- response.util.ts
|  |  \- error.util.ts
|  |- middleware/
|  |  |- auth.middleware.ts
|  |  |- error.middleware.ts
|  |  \- validate.middleware.ts
|  |- database/
|  |  |- db.ts
|  |  |- transaction.ts
|  |  |- init/
|  |  \- queries/
|  |     |- auth.queries.ts
|  |     |- orders.queries.ts
|  |     |- drivers.queries.ts
|  |     \- ...
|  |- modules/
|  |  |- auth/
|  |  |- users/
|  |  |- drivers/
|  |  |- orders/
|  |  |- addresses/
|  |  |- pricing/
|  |  |- ratings/
|  |  \- static/
|  |- schemas/
|  |- types/
|  \- utils/
|- tests/
|- scripts/
|- docker-compose.dev.yml
|- .env.example
\- package.json
```

## Architecture Pattern (Mandatory)

All request handling must follow this flow:

```text
HTTP Request
  -> routes
  -> controller
  -> service
  -> repository
  -> database queries
  -> PostgreSQL
```

Layer responsibilities:

- routes: URL registration, schema attachment, middleware hooks.
- controller: request parsing and response dispatch only.
- service: all business rules and orchestration.
- repository: data access calls only.
- queries: raw SQL only, parameterized placeholders.

## Naming Conventions

- Module folders: lowercase (auth, orders, drivers).
- Source files: camelCase for utility-like files, module files by role suffix.
- Route/controller/service/repository naming must stay consistent per module.
- Constants: UPPER_SNAKE_CASE.
- Functions and variables: camelCase.
- Classes and types: PascalCase.

## Code Style And Tooling

- Use ESM imports/exports only.
- Use async/await consistently.
- Use logger from config; never use console logging in production paths.
- Access environment values through centralized config loading, not ad hoc process reads.
- Keep request validation schema-backed for body/query/params.
- Keep SQL parameterized with placeholders; never interpolate user input.
- Keep API responses aligned with response utility and root response contract.

## Key Commands (Run From backend)

```bash
pnpm install
pnpm run dev
pnpm start

pnpm test
pnpm run test:watch
pnpm run test:auth
pnpm run test:users
pnpm run test:drivers
pnpm run test:orders
pnpm run test:static
pnpm run test:coverage

pnpm run test:db:setup
pnpm run test:db:cleanup

pnpm run lint
pnpm run lint:fix
pnpm run format

pnpm run db:generate
pnpm run db:deploy
pnpm run db:seed
pnpm run dev:start
pnpm run dev:stop
pnpm run dev:logs
```

## Critical Rules

- NEVER place SQL outside database query files.
- NEVER write business logic in controllers.
- NEVER call database clients directly from services.
- NEVER use SELECT \* in production queries.
- NEVER skip auth middleware on protected routes.
- NEVER throw raw untyped errors from service/repository.
- NEVER return raw database/internal errors to clients.
- NEVER read secrets from committed files.
- NEVER modify base schema behavior without migration planning.

## Backend Testing Rules

- Keep tests in tests with module-oriented grouping.
- Add or update tests for every endpoint behavior change.
- Mock Firebase interactions where external dependencies are not under test.
- Use isolated test DB setup and cleanup scripts for deterministic runs.
- Treat lint and tests as merge blockers for backend changes.
