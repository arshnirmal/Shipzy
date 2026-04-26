# Business Order Management — Phase 2 Design Spec

**Date:** 2026-04-14
**Status:** Approved
**Phase 2 scope:** Scheduled orders, volume discount tiers, analytics dashboard
**Depends on:** Phase 1 spec (`2026-04-14-business-order-management-design.md`) — `business` module and tables must exist

---

## Overview

Phase 2 builds on the `business` module established in Phase 1. It adds three features:

1. **Scheduled orders** — business users set a future `pickupAt`; order is held in a `scheduled` state and auto-released into the courier pool 30 minutes before pickup time.
2. **Volume discount tiers** — business users automatically receive a percentage discount at order creation based on their rolling 30-day order count.
3. **Analytics dashboard** — a summary endpoint returning total orders, spend, and delivery success rate for a given date range.

---

## Feature 1: Scheduled Orders

### How it works

When a business user creates an order (via draft submit or bulk create) and `schedule.pickupAt` is set to more than 30 minutes in the future, `ordersService.createOrder()` sets `status = 'scheduled'` instead of `'pending'`. The order sits outside the courier pool until the auto-release job fires.

```
create order with schedule.pickupAt = T+3h
  → status: scheduled   (held, not visible to couriers)
      ↓
  setInterval fires every 5 min
  → finds orders where status = 'scheduled'
      AND (schedule->>'pickupAt')::timestamptz <= now() + interval '30 minutes'
  → transitions each to status: pending   (enters courier pool)
      ↓
pending → accepted → picked_up → in_transit → delivered
```

Orders without `schedule.pickupAt`, or where `pickupAt` is within 30 minutes of now, are created as `pending` immediately (existing behaviour unchanged).

### Database changes

Add `scheduled` to the `order_status` enum in `src/database/schema/public.ts`:

```ts
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "scheduled",   // ← new
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "undeliverable",
  "returned",
]);
```

No new tables. The `schedule` JSONB column (`pickupAt`, `deliveryAt`) already exists on `orders.requests`.

Add index to support the polling query efficiently:

```
index on orders.requests (status, (schedule->>'pickupAt'))
  where status = 'scheduled' AND deleted_at IS NULL
```

### Auto-release mechanism

**Primary: in-process Fastify polling** (`src/utils/scheduler.ts`)

```ts
export function startScheduler(fastify: FastifyInstance): void {
  setInterval(async () => {
    try {
      await ordersService.releaseScheduledOrders();
    } catch (err) {
      fastify.log.error({ err }, "scheduler: releaseScheduledOrders failed");
    }
  }, 5 * 60 * 1000); // every 5 minutes
}
```

Called once from `app.ts` after the server is ready. Errors are logged and swallowed — a failed tick does not crash the server. The next tick retries naturally.

`ordersService.releaseScheduledOrders()`:
- Queries for all `scheduled` orders where `(schedule->>'pickupAt')::timestamptz <= now() + interval '30 minutes'`
- For each: transitions `status → pending`, writes a `status_history` row (existing audit trail)
- Runs each transition in its own transaction — one failure does not block the rest

**Safety net: pg_cron (Neon)**

Neon supports the `pg_cron` extension even on the free tier. A supplemental cron job can run the same release query at the database level every 5 minutes, acting as a fallback if the Fastify process restarts mid-interval.

```sql
SELECT cron.schedule(
  'release-scheduled-orders',
  '*/5 * * * *',
  $$
    UPDATE orders.requests
    SET status = 'pending', updated_at = now()
    WHERE status = 'scheduled'
      AND (schedule->>'pickupAt')::timestamptz <= now() + interval '30 minutes'
      AND deleted_at IS NULL;
  $$
);
```

This is additive — if both the Fastify loop and pg_cron fire, the UPDATE is idempotent (orders already released are no longer `scheduled`).

**Future upgrade path (DigitalOcean Droplet):**

Extract `startScheduler` into a separate PM2-managed worker process on the same Droplet. No queue infrastructure needed.

### API changes

No new endpoints. The scheduling behaviour is implicit in order creation:
- `POST /business/drafts/:id/submit` — if draft has future `pickupAt`, order is created as `scheduled`
- `POST /business/orders/bulk` — same logic per order

The `ListOrdersQueryZ` status filter gains a `scheduled` option so business users can see their queued orders.

`GET /business/orders/export` already streams all statuses; no change needed.

### Zod / type changes

- `OrderLifecycleStatusZ` gains `"scheduled"` value
- `OrderScheduleJSONBZ` already has `pickupAt`/`deliveryAt` — no change
- `CreateOrderRequestZ` already accepts `schedule` — no change

---

## Feature 2: Volume Discount Tiers

### How it works

At order creation, if the placing user has `role = 'business'`, the service counts their completed orders in the last 30 days and looks up a matching discount tier. The discount is applied to the calculated fare before the order is stored. The discount details are persisted in the `pricing` JSONB.

```
ordersService.createOrder(payload, clientId)
  → calculate base fare (existing)
  → if user role = 'business':
      count orders (status IN ('delivered', 'in_transit', 'picked_up', 'accepted', 'pending'))
        for clientId in last 30 days
      lookup matching tier from business_discount_tiers
      if tier found:
        discountAmount = totalPrice * (tier.discountPct / 100)
        totalPrice = totalPrice - discountAmount
        store discountPct + discountAmount in pricing JSONB
  → insert order with adjusted totalPrice
```

### Database changes

New table `business_discount_tiers` (public schema, `src/database/schema/public.ts`):

| Column | Type | Notes |
|---|---|---|
| `tier_id` | serial PK | |
| `label` | varchar(100) NOT NULL | e.g. "Silver", "Gold", "Platinum" |
| `min_orders` | integer NOT NULL | rolling 30-day order count lower bound (inclusive) |
| `max_orders` | integer nullable | upper bound (inclusive); null = unlimited |
| `discount_pct` | numeric(5,2) NOT NULL | e.g. `5.00` = 5% off |
| `is_active` | boolean NOT NULL default true | |
| `created_at` | timestamptz NOT NULL default now() | |

Example seed data:

| label | min_orders | max_orders | discount_pct |
|---|---|---|---|
| Bronze | 10 | 49 | 3.00 |
| Silver | 50 | 149 | 5.00 |
| Gold | 150 | 499 | 8.00 |
| Platinum | 500 | null | 12.00 |

Check constraint: `discount_pct BETWEEN 0 AND 100`, `min_orders >= 0`, `max_orders > min_orders OR max_orders IS NULL`.

### Pricing JSONB changes

`OrderPricingJSONBZ` gains two optional fields:

```ts
discountPct: z.number().nonnegative().optional(),    // e.g. 5.00
discountAmount: z.number().nonnegative().optional(), // e.g. 62.50
```

These are nullable/optional — non-business orders and orders that don't meet any tier threshold have no discount fields, preserving backward compatibility.

### No new endpoints

Discount is applied transparently at order creation. Business users see `pricing.discountPct` and `pricing.discountAmount` in the order response. No separate discount-lookup endpoint is needed at MVP.

---

## Feature 3: Analytics Dashboard

### API

Added to the `business` module (Phase 1):

```
GET /api/v1/business/analytics?dateFrom=&dateTo=
```

`dateFrom` and `dateTo` are required ISO 8601 datetime strings. Maximum range: 366 days (returns `400` if exceeded).

### Response shape

```json
{
  "success": true,
  "message": "Analytics retrieved",
  "data": {
    "analytics": {
      "period": {
        "from": "2026-03-01T00:00:00Z",
        "to": "2026-03-31T23:59:59Z"
      },
      "orders": {
        "total": 45,
        "delivered": 38,
        "cancelled": 4,
        "active": 3,
        "successRate": 84.4
      },
      "spend": {
        "total": 12450.00,
        "average": 276.67,
        "currency": "INR"
      },
      "delivery": {
        "avgDurationMins": 42
      }
    }
  },
  "timestamp": "2026-04-14T10:00:00Z"
}
```

`successRate` = `(delivered / (delivered + cancelled + undeliverable + returned)) * 100`, or `0` if the denominator is zero. Cancelled, undeliverable, and returned all represent failed or incomplete deliveries.
`active` = orders in `scheduled | pending | accepted | picked_up | in_transit`.
`avgDurationMins` = average of `actual_duration_mins` for delivered orders in the period.

### Repository

Single aggregation query on `orders.requests` filtered by `client_id` and `created_at` range. Uses `COUNT(*)`, `SUM`, `AVG`, `FILTER (WHERE status = ...)` — no JOINs needed. Runs in one round trip.

### Module placement

New method on `business.service.ts` and `business.repository.ts`. New route and Zod schema added to the existing business module files (no new files).

---

## Layer Boundary Rules (unchanged from Phase 1)

- `ordersService.releaseScheduledOrders()` owns the scheduled→pending transition. Scheduler utility calls it; does not update DB directly.
- `ordersService.createOrder()` owns discount application. No discount logic leaks into `businessService`.
- `business.repository.ts` owns analytics aggregation queries.

---

## Error Handling

| Scenario | Response |
|---|---|
| Analytics date range > 366 days | `400 Bad Request` |
| Analytics missing `dateFrom` or `dateTo` | `400 Bad Request` |
| Scheduled order `pickupAt` in the past at submit time | `422 Unprocessable Entity` — "Scheduled pickup time must be in the future" |
| `pickupAt` within 30 min of now | Order created as `pending` immediately (not an error) |
| Scheduler tick DB error | Logged, swallowed — next tick retries |
| No discount tier matches | Order priced at full rate, no `discountPct`/`discountAmount` in pricing JSONB |

---

## Infrastructure Notes

- **Scheduled order polling:** `setInterval` inside the Fastify process — zero additional infrastructure. See memory note `project_scheduled_orders_infra.md`.
- **pg_cron safety net:** Enable via Neon dashboard (`CREATE EXTENSION pg_cron`) and register the release job. Idempotent with the Fastify loop.
- **Discount tiers:** Seeded via `pnpm run db:seed` — admin configures tiers, no runtime endpoint needed at MVP.
- **Schema changes:** Drizzle schema files updated directly — `pnpm run db:generate && pnpm run db:deploy`.
