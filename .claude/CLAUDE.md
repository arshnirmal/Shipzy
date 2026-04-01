# Shipzy Monorepo Guide For Claude Code

This repository powers Shipzy, a hyperlocal delivery platform connecting customers and couriers for instant deliveries. The codebase is a single-developer monorepo with two Flutter apps and one backend API. Use this file as the source of truth for monorepo-level architecture, workflows, and non-negotiable conventions.

Read this file first, then read the project-local guide:

- apps/user/CLAUDE.md
- apps/driver/CLAUDE.md
- services/backend/CLAUDE.md

## Monorepo Directory Tree

```text
shipzy/
|- LICENSE
|- README.md
|- apps/
|  |- user/
|  |  |- android/
|  |  |- ios/
|  |  |- lib/
|  |  |- assets/
|  |  |- analysis_options.yaml
|  |  |- .env.example
|  |  |- pubspec.yaml
|  |  |- README.md
|  |  \- CLAUDE.md
|  \- driver/
|     |- android/
|     |- ios/
|     |- lib/
|     |- assets/
|     |- analysis_options.yaml
|     |- .env.example
|     |- pubspec.yaml
|     |- README.md
|     \- CLAUDE.md
|- backend/
|  |- src/
|  |  |- app.ts
|  |  |- server.ts
|  |  |- config/
|  |  |- database/
|  |  |- middleware/
|  |  |- modules/
|  |  |- schemas/
|  |  |- types/
|  |  \- utils/
|  |- tests/
|  |- scripts/
|  |- docs/
|  |- .env.example
|  |- docker-compose.dev.yml
|  \- package.json
|- services/
|  \- backend/
|     \- CLAUDE.md
|- docs/
|  \- auth/
|- .github/
|  \- workflows/
\- CLAUDE.md
```

## How Sub-Projects Fit Together

- apps/user is the customer app: order creation, address management, checkout-style flow, and order tracking.
- apps/driver is the courier app: availability toggling, order acceptance, status progression, and location broadcasting.
- backend is the API system of record: auth, profiles, orders, static metadata, pricing, and role-based access control.
- Both apps integrate with backend over REST and share the same auth and order domain semantics.
- Shared contracts must stay aligned across backend responses and mobile models.

## Core Domain Flows

### Standard API Response Shape (Never Deviate)

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {},
  "timestamp": "ISO8601"
}
```

```json
{
  "success": false,
  "message": "Human-readable error",
  "error": "Specific detail",
  "statusCode": 400
}
```

### Authentication and Authorization Flow

1. Client signs in via Firebase/Google/Email and receives access and refresh tokens.
2. Protected endpoints require Authorization: Bearer <access_token>.
3. Auth middleware validates JWT, attaches request user context, and enforces role checks.
4. Roles are client, courier, and admin.
5. Firebase service account key is file-based and must stay gitignored at all times.

### Order Status Flow

pending -> accepted -> picked_up -> in_transit -> delivered

Terminal cancellation path:

pending | accepted | picked_up | in_transit -> cancelled

## Shared Architecture Rules

### Separation Of Concerns

- NEVER mix UI logic, transport logic, and domain logic in the same layer.
- NEVER bypass repository layers from UI or controller layers.
- ALWAYS keep data access isolated from business logic.

### Validation And Error Discipline

- Validate external input at system boundaries before business logic runs.
- Throw typed domain errors, not anonymous raw exceptions.
- Never leak stack traces, SQL internals, or secrets in API responses.

### Configuration And Secrets

- Never commit .env files.
- Keep .env.example up to date whenever adding or changing required variables.
- Never commit Firebase service account JSON keys.
- Never log access tokens, refresh tokens, OTPs, API keys, or private credentials.

## Naming Conventions (Repository-Wide)

- Use descriptive names tied to delivery domain language.
- Prefer explicit entity names over abbreviations.
- Keep folder naming consistent inside each project.
- Keep enum/constant values stable once they are exposed across app-backend boundaries.

Project-specific naming details are documented in:

- apps/user/CLAUDE.md
- apps/driver/CLAUDE.md
- services/backend/CLAUDE.md

## Tooling And Quality Gates

### Backend

- Runtime: Node.js 24.10+ (ESM).
- API framework: Fastify.
- Database: PostgreSQL + PostGIS.
- Tests: Jest + Supertest.
- Lint/format: ESLint + Prettier.

### Flutter Apps

- Flutter 3.0+ and Dart with null safety.
- State management pattern based on Provider/Bloc-style layering (implemented via Riverpod in current apps).
- Network client: Dio with interceptors.
- Maps/location stack: Mapbox + Geolocator.
- Static analysis per app must pass with zero unresolved issues.

## Git Workflow

- main is production-stable and protected.
- dev is the active development branch.
- All changes land in dev first, then merge to main.
- NEVER commit directly to main.

## Development Workflow For Claude Code

1. Read this root file, then read the nearest project CLAUDE.md.
2. Confirm layer boundaries before editing files.
3. Implement the smallest safe change.
4. Run project-local lint/tests relevant to the touched scope.
5. Ensure response shapes and status flow contracts remain unchanged.
6. Update docs or examples if contracts or commands change.

## Non-Negotiable Anti-Patterns

### General

- NEVER commit credentials, service account files, or local env files.
- NEVER skip tests for newly added endpoints or behavior changes.
- NEVER leave context-free TODO comments.
- NEVER introduce mock data into production code paths.

### Backend Cross-Cutting

- NEVER construct SQL with interpolated user input.
- NEVER bypass auth middleware for protected routes.
- NEVER return raw database errors to clients.

### Flutter Cross-Cutting

- NEVER call Dio directly from widget trees.
- NEVER hardcode API base URLs.
- NEVER suppress analysis rules without a justification comment.
- NEVER force-unwrap nullable values without safety context.

## Commands Reference

Run from backend directory:

```bash
cd backend
pnpm run dev
pnpm test
pnpm run lint
pnpm run format
```

Run from user app directory:

```bash
cd apps/user
flutter pub get
flutter analyze
flutter test
flutter run
```

Run from driver app directory:

```bash
cd apps/driver
flutter pub get
flutter analyze
flutter test
flutter run
```

## Sub-Project Files

- For backend details, read services/backend/CLAUDE.md.
- For customer app details, read apps/user/CLAUDE.md.
- For courier app details, read apps/driver/CLAUDE.md.
