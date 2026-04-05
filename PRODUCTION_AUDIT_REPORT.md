# Shipzy Backend Production Readiness Audit Report

**Date**: April 5, 2026  
**Last Updated**: April 4, 2026 (remediation pass 2)  
**Scope**: Complete backend codebase audit across security, architecture, database, reliability, API design, and test coverage  
**Status**: ⛔ **NOT PRODUCTION READY** — Critical blocker remains (test suite)

---

## Executive Summary

**Remaining Blocker**: One critical blocker remains before production deployment:

- ⛔ **CRITICAL**: Zero automated test files; 0% code coverage across all metrics

---

## ✅ FIXED Issues

### Issue #3 — Raw Error Messages Leaking to API Clients

**Fix**: All 7 controllers updated. `AppError` subclasses pass their message to clients — intentional. All unexpected errors re-throw to the global handler which returns `"Internal server error"` in production.

---

### Issue #2 — Refresh Token Lifecycle Not Persisted

**Fix**: Added `refresh_token_hash VARCHAR(255) UNIQUE` to `users.auth_sessions` (Drizzle schema). All login/register/Google auth flows SHA-256 hash the refresh token and store it. Token refresh validates hash against an active session before minting. Logout expiring the session also blocks the linked refresh token.

**Note**: Existing sessions have `refresh_token_hash = NULL` — all existing refresh tokens will fail after deploy. Users re-login once.

**Files**: `schema/users.ts`, `auth.repository.ts`, `auth.service.ts`.

---

### Issue #4 — Auth Rate Limiting Not Applied to Routes

**Fix**: Per-route `config: { rateLimit: { max: 10, timeWindow: "15 minutes" } }` on all 4 sensitive auth routes in `auth.routes.ts`.

---

### Issue #7 — Docker `.dockerignore` Missing Secret Exclusions

**Fix**: Added `src/config/*.json`, `src/config/firebase-*`, `coverage`, `dist`, `tests`.

---

### Issue #9 — N+1 Query in Driver Earnings Calculation

**Fix**: `getActiveAssignments()` calls `pricingRepo.getAllPricingConfig()` once and passes the `Map<string, number>` to each `calculateDriverEarnings()`. 7N DB calls → 1.

---

### Issue #8 — Migration Race Condition

**Fix**: `db-deploy.ts` wraps all migration work in `pg_advisory_lock(7482910)` / `pg_advisory_unlock()`.

---

### Issue #5 — Spatial Query Indexes Unverified

**Fix**:
- Created `src/database/functions/spatial.sql` — deployed on every `db:deploy` run (idempotent):
  - Adds `pickup_point` and `delivery_point` as `GENERATED ALWAYS AS ... STORED` PostGIS geography columns on `orders.requests`, derived from the JSONB `pickup_location`/`delivery_location` fields.
  - Creates GIST indexes on `pickup_point`, `delivery_point`, and `logistics.courier_status.current_location`.
- `logistics.ts` Drizzle schema has a comment pointing to `spatial.sql` for the `current_location` GIST index.

---

### Issue NEW-A — Health Check Exposes Internal System Info

**Fix**: `/health` now returns `{ status, timestamp }` only. Detailed diagnostics moved to `/_internal/health` which must be protected at infrastructure level (internal network / load balancer probe path only).

---

### Issue NEW-B — Auth Session Accumulation (No Cleanup)

**Fix**: Session accumulation addressed by UPSERT on login:
- Added `uniqueIndex("uq_auth_sessions_user_device").on(userId, deviceId).where(deviceId IS NOT NULL)` to `users.auth_sessions` in Drizzle schema.
- `storeJwtToken()` now UPSERTs when `deviceId` is present: replaces the existing session for that user+device. Sessions without `deviceId` (web logins) still INSERT as before.

---

### Issue NEW-C — `authRateLimitConfig` Export Unused

**Fix**: Removed the export from `ratelimit.middleware.ts` and cleaned up `app.ts`.

---

### Issue #11 — Duplicate Rating Endpoints

**Decision**: Kept `/api/v1/ratings/orders/:orderId` (canonical — ratings is a first-class resource module with its own controller/service/schema). Removed `POST /api/v1/orders/:id/rate` from `orders.routes.ts` and the dead `rateOrder` method + `ratingsService` import from `orders.controller.ts`.

**Rationale**: The ratings module exists precisely to own this resource. Keeping it under orders would couple two unrelated domains and breaks REST resource ownership.

---

### Issue #12 — Inconsistent Pagination Pattern

**Fix**: Standardized on `meta.pagination` shape across all paginated responses:

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  },
  "timestamp": "2026-04-04T..."
}
```

This matches the existing `PaginatedResponseZ` schema already defined in `common.zod.ts`. Updated `response.util.ts:paginatedResponse()` and the one call site in `orders.controller.ts`.

**Why offset-based, not cursor**: Order history for delivery apps is stable (past orders don't shuffle), user-initiated (not a feed), and infrequently paginated. Offset pagination is appropriate and significantly simpler. Cursor-based pagination adds complexity with no real benefit here.

---

### Issue #13 — PUT vs PATCH Semantics Inconsistent

**Fix**: Changed all partial update routes to PATCH:
- `drivers.routes.ts`: `PUT /me` → `PATCH /me`, `PUT /me/availability` → `PATCH /me/availability`, `PUT /me/location` → `PATCH /me/location`
- `users.routes.ts`: `PUT /me` → `PATCH /me`
- `orders.routes.ts`: `PUT /:id/status` → `PATCH /:id/status`

---

### Auth/AuthZ Best Practices — Improvements Applied

**Issues found and fixed**:

1. **No token type distinction** — Access and refresh tokens used the same secret and `verifyToken()`. A refresh token could be presented to protected endpoints.
   - **Fix**: `generateAccessToken()` now embeds `type: "access"`; `generateRefreshToken()` embeds `type: "refresh"`. `authenticate` middleware rejects any token where `type !== "access"`. `refreshToken` service rejects tokens where `type !== "refresh"`.

2. **Auth middleware swallowed all errors as AuthenticationError** — DB connection errors during token validation were wrapped as `AuthenticationError("connection refused")`, leaking the DB error message to the client.
   - **Fix**: Middleware now preserves `AppError`/`AuthorizationError` subtypes; wraps only unexpected errors as a generic `AuthenticationError("Authentication failed")`.

**Remaining recommendations** (document only, not changed):

3. **Single-session logout** — Logout revokes only the session tied to the current access token. Other active sessions (other devices) remain valid. This is by design for MVP. For "logout all devices", call `revokeAllUserTokens(userId)` — the method already exists in `auth.repository.ts`.

4. **DB hit on every authenticated request** — Every request validates the token hash in PostgreSQL. Works fine for MVP. At scale (>10k req/min), cache the token validity in Redis with a short TTL (30–60s).

5. **Refresh token not rotated** — The same refresh token is reused until the session expires (7 days). Rotating on every refresh (issue new refresh token, invalidate old) is more secure but adds complexity. Acceptable for MVP.

6. **No token expiry grace period** — Access tokens expire hard (default 7 days per code). Consider shorter access token lifetimes (15–30 min) with frequent refresh for better security posture post-MVP.

---

## ⛔ CRITICAL Issues (Remaining)

### Issue #1 — Missing Test Suite

**Status**: OPEN — Intentionally deferred (to be addressed after this remediation pass)  
**Impact**: Cannot verify security fixes, cannot detect regressions.

**Priority test coverage needed**:
- Auth: email login, refresh token DB validation, stolen token rejected after logout, rate limit enforcement
- Orders: state transitions, invalid transitions rejected, concurrent courier accept (race condition)
- Error handling: verify unexpected errors return generic 500, AppErrors pass message through
- Spatial: verify `ST_DWithin` uses GIST index (can inspect query plan)

---

## 🔴 HIGH Priority Issues (Remaining)

### Issue #6 — Concurrent Order Acceptance — Needs Verification

**Status**: NEEDS VERIFICATION  
**Impact**: Two couriers could accept same order if row-level locking is bypassed.  
**Required**: Confirm `orders.service.ts::acceptOrder()` calls the `assign_order_to_courier()` SQL function which uses `FOR UPDATE`. Add concurrency integration test.

---

## 🟠 MEDIUM Priority Issues (Remaining)

### Issue #10 — Rate Limit Proxy Trust Misconfiguration

**Status**: OPEN — deployment-time configuration  
**Required at deploy**: Configure `x-forwarded-for` trust chain per infrastructure. Behind Cloudflare: use `cf-connecting-ip`.

---

## Remediation Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Missing test suite | ⛔ CRITICAL | OPEN (deferred) |
| 2 | Refresh token not persisted | ⛔ CRITICAL | ✅ FIXED |
| 3 | Raw error message leakage | ⛔ CRITICAL | ✅ FIXED |
| 4 | Auth rate limiting not applied | 🔴 HIGH | ✅ FIXED |
| 5 | Spatial indexes unverified | 🔴 HIGH | ✅ FIXED |
| 6 | Concurrent order acceptance | 🔴 HIGH | NEEDS VERIFY |
| 7 | Docker .dockerignore gaps | 🟠 MEDIUM | ✅ FIXED |
| 8 | Migration advisory lock | 🟠 MEDIUM | ✅ FIXED |
| 9 | N+1 driver earnings | 🟠 MEDIUM | ✅ FIXED |
| 10 | Rate limit proxy trust | 🟠 MEDIUM | OPEN (deploy-time) |
| 11 | Duplicate rating endpoints | 🟡 LOW | ✅ FIXED |
| 12 | Inconsistent pagination | 🟡 LOW | ✅ FIXED |
| 13 | PUT vs PATCH semantics | 🟡 LOW | ✅ FIXED |
| NEW-A | Health check info leak | 🔴 HIGH | ✅ FIXED |
| NEW-B | Session accumulation | 🟠 MEDIUM | ✅ FIXED |
| NEW-C | Unused authRateLimitConfig | 🟡 LOW | ✅ FIXED |
| AUTH | Token type not enforced | 🔴 HIGH | ✅ FIXED |
| AUTH | Middleware error leakage | 🟠 MEDIUM | ✅ FIXED |

**Score: 14/18 issues fixed. 1 critical blocker remaining (tests). 1 needs verification (concurrent orders). 2 are deploy-time configuration.**

---

## Sign-Off Checklist for Production Deploy

- [ ] Test suite written with 80%+ coverage, all critical tests passing
- [x] Refresh token revocation implemented
- [x] Error messages sanitized
- [x] Auth token types enforced (access vs refresh)
- [x] Auth rate limiting enforced (10 req / 15 min)
- [x] Spatial GIST indexes defined and deployed via `spatial.sql`
- [x] Docker `.dockerignore` updated
- [ ] Concurrent order acceptance verified + tested
- [x] Migration advisory locking implemented
- [x] Driver earnings N+1 fixed
- [ ] Rate limit proxy trust documented for production infra
- [x] Health check secured (minimal public endpoint)
- [x] Session accumulation addressed (UPSERT by device)
- [x] Duplicate rating endpoints resolved
- [x] Pagination standardized
- [x] HTTP method semantics corrected (PATCH for partial updates)
- [ ] All types pass: `pnpm run type-check`
- [ ] All tests pass: `pnpm test` (with 80%+ coverage)

---

**Last Updated**: April 4, 2026 (remediation pass 2 — 8 more issues fixed)  
**Status**: NOT APPROVED FOR PRODUCTION DEPLOYMENT
