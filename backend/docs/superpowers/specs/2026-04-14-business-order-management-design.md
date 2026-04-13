# Business Order Management — Design Spec

**Date:** 2026-04-14
**Status:** Approved
**Phase 1 scope:** Draft orders, order templates, bulk order creation, CSV export
**Phase 2 scope (out of this spec):** Scheduled orders, volume discount tiers, analytics dashboard

---

## Context

Shipzy is adding a `business` role for small-business users (pharmacies, florists, local shops) who manage deliveries via a web dashboard. The goal is to give them richer order management than individual clients get, without touching the existing client/courier order lifecycle.

Existing state:
- `business` role exists in the `user_role` enum and `users.business_accounts` table
- Business users can already list orders, view details, and cancel/bulk-cancel via `/api/v1/orders`
- Business users **cannot** create orders today (restricted to `client` role)
- `OrderScheduleJSONBZ` has `pickupAt`/`deliveryAt` fields — scheduling infrastructure exists but is not business-specific
- No draft, template, or bulk creation concept exists

---

## Approach

A new `src/modules/business/` module handles all business-specific pre-order concepts (drafts, templates) and business-scoped order operations (bulk create, export). The existing `ordersService.createOrder()` remains the single owner of order creation — `businessService` delegates to it when promoting a draft or bulk-creating orders. The `orderRequests` table stays unpolluted with draft/template concepts.

---

## Database Schema

### New table: `orders.drafts`

Added to `src/database/schema/orders.ts` (no separate migration script — Drizzle generate/deploy handles it).

| Column | Type | Notes |
|---|---|---|
| `draft_id` | serial PK | |
| `draft_uuid` | uuid unique | client-facing ID |
| `client_id` | integer FK → `users.profiles` NOT NULL | the business user |
| `name` | varchar(200) nullable | human-readable label |
| `fulfillment` | jsonb nullable | vehicle, weight tier, delivery type, payment method |
| `pickup_location` | jsonb nullable | `OrderLocationJSONB` |
| `delivery_location` | jsonb nullable | `OrderLocationJSONB` — intentionally nullable |
| `items` | jsonb NOT NULL default `[]` | |
| `package` | jsonb nullable | `OrderPackageJSONB` |
| `pricing` | jsonb nullable | cached fare estimate; null until all location+fulfillment fields are present |
| `coupon_code` | varchar(50) nullable | |
| `notes` | text nullable | internal business notes, never exposed to courier |
| `template_id` | integer FK → `orders.templates` nullable | which template this was created from |
| `submitted_order_id` | integer FK → `orders.requests` nullable | set on submission |
| `submitted_at` | timestamptz nullable | set on submission; makes draft immutable |
| `created_at` | timestamptz NOT NULL default now() | |
| `updated_at` | timestamptz NOT NULL default now() | |
| `deleted_at` | timestamptz nullable | soft delete |

**Draft state is derived, not stored:**
- `incomplete` — required fields (fulfillment, pickup_location, delivery_location) are null
- `ready` — all required fields pass `CreateOrderRequestZ` validation
- `submitted` — `submitted_at IS NOT NULL`

Indexes:
- `(client_id, created_at)` where `deleted_at IS NULL`
- `(client_id, submitted_at)` where `deleted_at IS NULL`

### New table: `orders.templates`

| Column | Type | Notes |
|---|---|---|
| `template_id` | serial PK | |
| `template_uuid` | uuid unique | |
| `client_id` | integer FK → `users.profiles` NOT NULL | |
| `name` | varchar(200) NOT NULL | e.g. "Pharmacy → Customer" |
| `description` | text nullable | |
| `fulfillment` | jsonb nullable | can be partial |
| `pickup_location` | jsonb nullable | fixed pickup address (optional) |
| `delivery_location` | jsonb nullable | intentionally blank for variable delivery |
| `items` | jsonb NOT NULL default `[]` | |
| `package` | jsonb nullable | `OrderPackageJSONB` |
| `use_count` | integer NOT NULL default 0 | incremented each time a draft is created from this template |
| `is_active` | boolean NOT NULL default true | |
| `created_at` | timestamptz NOT NULL default now() | |
| `updated_at` | timestamptz NOT NULL default now() | |
| `deleted_at` | timestamptz nullable | soft delete |

Index: `(client_id)` where `deleted_at IS NULL AND is_active = true`

---

## Module Structure

```
src/modules/business/
├── business.routes.ts      — URL registration, schema attachment, authorize("business") hook
├── business.controller.ts  — request parsing + response dispatch only, no logic
├── business.service.ts     — all decisions, delegates to ordersService for order creation
├── business.repository.ts  — reads/writes orders.drafts and orders.templates only
├── business.schema.ts      — Fastify JSON schemas via zodToJsonSchema
└── business.zod.ts         — Zod schemas + TypeScript types
```

Registered in `app.ts`:
```ts
fastify.register(businessRoutes, { prefix: "/api/v1/business" });
```

---

## API Routes

All routes share `fastify.authenticate` + `authorize("business")` at the router level.

### Drafts

| Method | Path | Description |
|---|---|---|
| `POST` | `/business/drafts` | Create draft — all fields optional |
| `GET` | `/business/drafts` | List drafts with filter: `state=incomplete\|ready\|submitted` |
| `GET` | `/business/drafts/:id` | Get single draft with derived state |
| `PATCH` | `/business/drafts/:id` | Update draft fields — replaces each top-level field sent; unsent fields unchanged |
| `DELETE` | `/business/drafts/:id` | Soft delete (sets `deleted_at`) |
| `POST` | `/business/drafts/:id/submit` | Validate + promote draft → real order |

### Templates

| Method | Path | Description |
|---|---|---|
| `POST` | `/business/templates` | Create template |
| `GET` | `/business/templates` | List templates (`is_active=true` by default) |
| `GET` | `/business/templates/:id` | Get single template |
| `PATCH` | `/business/templates/:id` | Update template |
| `DELETE` | `/business/templates/:id` | Soft delete (`is_active = false`, `deleted_at` set) |
| `POST` | `/business/templates/:id/draft` | Instantiate template → new draft, increments `use_count` |

### Orders

| Method | Path | Description |
|---|---|---|
| `POST` | `/business/orders/bulk` | Create up to 50 orders in one request |
| `GET` | `/business/orders/export` | Export order history as CSV |

---

## Service Logic

### Draft lifecycle

```
POST /business/drafts
  → insert row with provided fields (all nullable — partial save OK)
  → return draft with derived state

PATCH /business/drafts/:id
  → replaces each top-level field present in the request body; fields not sent are unchanged
  → for JSONB fields (fulfillment, pickup_location, etc.), the entire JSONB is replaced — client sends the full updated object
  → re-derives state after update
  → 409 Conflict if draft.submitted_at IS NOT NULL

POST /business/drafts/:id/submit
  → businessService.submitDraft(draftId, clientId)
  → validate draft fields pass CreateOrderRequestZ
  → if validation fails: 422 Unprocessable Entity with field errors
  → call ordersService.createOrder(payload, clientId) in a transaction
  → on success: SET submitted_order_id, submitted_at in same transaction
  → return new order (same shape as POST /api/v1/orders response)
```

### Template → Draft

```
POST /business/templates/:id/draft
  → copy template fields into new draft row
  → set draft.template_id = template.template_id
  → increment template.use_count
  → return new draft (client navigates to draft editor to fill any blanks)
```

Template creation is non-destructive — the template is never modified by this operation.

### Bulk order creation

```
POST /business/orders/bulk  { orders: [CreateOrderRequest, ...] }  max 50

For each order:
  → validate with CreateOrderRequestZ
  → call ordersService.createOrder() in its own independent transaction
  → collect per-item result

Response:
{
  "bulk": {
    "requested": 10,
    "created": 8,
    "failed": 2,
    "results": [
      { "index": 0, "success": true, "orderId": 123 },
      { "index": 3, "success": false, "error": "Invalid vehicle category" }
    ]
  }
}
```

One failure does not roll back others. Partial success is valid and reported.

**Note on single order creation for business users:** There is no separate `POST /business/orders` single-create endpoint. Single order creation for business users goes through the draft→submit flow (`POST /business/drafts` then `POST /business/drafts/:id/submit`), which enforces a review step before dispatch. Bulk create (`POST /business/orders/bulk`) is for submitting multiple pre-validated orders at once.

### CSV export

```
GET /business/orders/export?dateFrom=&dateTo=&status=&format=csv

→ reuses ordersRepository.listOrders() with clientId filter, pagination removed
→ safety cap: 10,000 rows max — 400 if exceeded ("narrow your date range")
→ streams via reply.raw to avoid buffering in memory (important on Neon free tier)
→ Content-Disposition: attachment; filename="orders-YYYY-MM-DD.csv"

CSV columns:
  Order Number | Status | Pickup Address | Delivery Address |
  Vehicle | Package Type | Total (₹) | Created At | Delivered At
```

---

## Layer Boundary Rules

- `business.controller` — parses request, calls one service method, sends response. Zero logic.
- `business.service` — all decisions live here. Calls `ordersService.createOrder()` for real order creation. Never touches `orderRequests` directly.
- `business.repository` — reads/writes `orders.drafts` and `orders.templates` only. Never touches `orderRequests`.
- `ordersService` remains the **single owner** of order creation. No duplication.

---

## Error Handling

| Scenario | Response |
|---|---|
| PATCH/DELETE on submitted draft | `409 Conflict` |
| Submit draft with missing required fields | `422 Unprocessable Entity` with Zod field errors |
| Bulk create with > 50 orders | `400 Bad Request` |
| Export exceeds 10,000 rows | `400 Bad Request` — narrow date range |
| Access draft/template belonging to another business user | `403 Forbidden` |
| Draft/template not found | `404 Not Found` |

---

## What This Spec Does Not Cover (Phase 2)

- **Scheduled orders** — new `scheduled` order status + in-process Fastify polling loop (5 min interval) to auto-release to `pending` at `pickupAt - 30min`
- **Volume discount tiers** — pricing multiplier stored in `pricingConfig` table, applied at order creation based on rolling 30-day order count
- **Analytics dashboard** — summary stats (total orders, total spend, delivery success rate) for a given date range

---

## Infrastructure Notes

- No background job infrastructure exists. Scheduled orders (Phase 2) will use `setInterval` inside the Fastify process — see memory note `project_scheduled_orders_infra.md`.
- Payments infrastructure is not yet built. Business users use the same per-order payment methods as regular clients for now. Wallet and invoicing are deferred.
- Schema changes go directly into Drizzle schema files. Run `pnpm run db:generate && pnpm run db:deploy` to apply.
