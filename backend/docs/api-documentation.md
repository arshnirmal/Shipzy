# Shipzy Backend API

This file is now an index for the module-specific API docs under `backend/docs/api/`.

The implementation source of truth is `backend/src/`, especially:

- `backend/src/app.ts` for top-level registration and system routes
- `backend/src/modules/*/*.routes.ts` for route paths, middleware hooks, and auth requirements
- `backend/src/modules/*/*.schema.ts` for request validation contracts

Keep the docs aligned with source. If a route changes in `src`, update the matching module doc in the same change.

## Documentation Map

- [System routes](api/system.md)
- [Auth API](api/auth.md)
- [Business API](api/business.md)
- [Addresses API](api/addresses.md)
- [Users API](api/users.md)
- [Drivers API](api/drivers.md)
- [Orders API](api/orders.md)
- [Ratings API](api/ratings.md)
- [Static API](api/static.md)

## Shared Conventions

- Base API prefix: `/api/v1`
- Protected endpoints use `Authorization: Bearer <accessToken>`
- Role checks are enforced in route hooks, not in the docs layer
- Response envelopes come from `backend/src/utils/response.util.ts`
- Error handling is centralized in `backend/src/middleware/error.middleware.ts`

## When To Use The Split Docs

- Use the module docs for endpoint lists, auth scope, and route grouping
- Use the source files for exact request and response schemas
- Use `backend/src/app.ts` to confirm any top-level route or registration change
