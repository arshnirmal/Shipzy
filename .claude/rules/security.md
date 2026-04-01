# Security Rules

> Applies to all files in the Shipzy monorepo — always loaded, no path scope.

## Secrets & Credentials

- NEVER read, display, log, or suggest committing `.env`, `.env.local`, `.env.production`, or any variant
- NEVER read, display, log, or suggest committing `shipzy-37e1c-firebase-adminsdk-fbsvc-e2f198175a.json` or any Firebase service account key file
- NEVER hardcode credentials, API keys, JWT secrets, or Mapbox tokens in source code
- NEVER log sensitive data: access tokens, refresh tokens, passwords, or user PII at any log level
- NEVER expose a secret in a code comment, string literal, or test fixture

## API Security

- NEVER return raw database errors in API responses — all errors flow through `src/middleware/error.middleware.js`
- NEVER expose internal stack traces to clients — `statusCode`, `message`, and optional `error` field only
- NEVER bypass `auth.middleware.js` on a protected route — every protected module applies the hook
- NEVER build SQL with string interpolation or concatenation of user input — parameterized queries only (`$1, $2, ...`)
- NEVER disable rate limiting on any public-facing route

## Environment Files

- `services/backend/.env` and `apps/*/.env` are gitignored — NEVER add them to `.gitignore` exceptions or stage them
- When adding a new environment variable, ALWAYS update BOTH:
  1. The relevant `.env.example` file
  2. `src/config/env.js` (backend) or the app's config constants file (Flutter)
- Firebase service account JSON must always be in `.gitignore`
