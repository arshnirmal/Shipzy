# Driver Order Management — End-to-End Design Spec

**Date:** 2026-04-14
**Scope:** Shipzy backend — driver-facing order lifecycle, RTO flow, live tracking, proof of delivery, earnings fixes
**Approach:** Extend existing `orders` and `drivers` modules. No new module directories. No new tables. Direct schema updates — no migration scripts.

---

## 1. Context & Goals

The current driver backend covers profile management, availability toggling, location updates, order acceptance, status progression (picked_up → in_transit → delivered), and session tracking. The following gaps prevent end-to-end execution:

- No handling for `undeliverable` or `returned` order states
- No explicit "arrived at delivery" check-in for the wait timer
- No RTO (Return to Origin) flow
- `tracking.events` table exists but is never written to
- `proof_of_delivery` table exists but has no endpoint
- Live location lacks speed/bearing for client-side interpolation
- Earnings summary reports customer fare (`total_price`) instead of driver net payout
- `totalDeliveriesToday` counter is never incremented
- `qualityBonus` always applied unconditionally

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Assignment model | Pull — driver self-selects from nearby list | Already implemented; correct for low-volume MVP |
| RTO model | Return leg on same assignment | One trip, one assignment; simpler state; Porter/Borzo model |
| RTO pricing | Free — no additional charge | Payments infra not yet built; avoids complexity |
| Delivery attempts | 1 attempt + configurable wait period | Hyperlocal same-hour delivery; multi-day retry doesn't apply |
| Wait enforcement | Server-side via `arrivedAt` anchor + `retryAfter` | Prevents bypass; single config value |
| Photo proof | Optional for MVP; driver note required | Decouples storage choice from delivery flow |
| Photo storage | Cloudinary free tier | No credit card required; 25 GB storage; 25 GB/month bandwidth; Flutter SDK available |
| Live tracking | Hybrid — milestones always + 30s location update | Balances smooth UX with write load on Neon free tier |
| Smooth map | Client-side dead reckoning with speed + bearing | Standard approach; zero extra DB writes between 30s polls |
| Earnings persistence | Written atomically inside `deliver_order` stored function | Avoids extra service-layer round-trip; always consistent |

---

## 3. Full Order State Machine

### Order status additions

`returning` added to `order_status` enum (between `undeliverable` and `returned`).

```
pending / scheduled
  → accepted          driver self-selects from nearby list
  → picked_up         driver confirms package collected
  → in_transit        driver departs pickup address
  → delivered         happy path terminal state

in_transit
  → undeliverable     wait expired, driver submits note
  → returning         driver starts return leg
  → returned          RTO terminal state — driver confirms handback

any non-terminal → cancelled
```

### Assignment status additions

`returning` added to `assignment_status` enum (between `in_transit` and `returned`).

```
accepted → picked_up → in_transit → delivered     (happy path)
accepted → picked_up → in_transit → returning → returned  (RTO path)
```

### Courier release points

| Terminal state | Handler |
|---|---|
| `delivered` | Existing `deliver_order` stored function |
| `returned` | New `return_order` stored function |
| `cancelled` | Existing `cancel_order_with_refund` stored function |

All three atomically set `current_assignment_id = NULL` and `is_available = is_online` on `logistics.courier_status`.

---

## 4. Schema Changes

All changes are direct updates to existing schema files. No new tables.

### 4.1 Enum additions (`src/database/schema/public.ts`)

```sql
-- order_status enum
'returning'   added after 'undeliverable'

-- assignment_status enum
'returning'   added after 'in_transit'
```

### 4.2 `delivery_attempt` JSONB on `orders.requests`

```typescript
// Added to orderRequests table in src/database/schema/orders.ts
deliveryAttempt: jsonb("delivery_attempt").$type<DeliveryAttemptJSONB>()
```

Written progressively — each RTO action patches its own fields without overwriting earlier ones.

```typescript
// DeliveryAttemptJSONBZ in src/database/schema/types.ts
z.object({
  arrivedAt:       z.iso.datetime(),              // check-in timestamp (wait anchor)
  undeliverableAt: z.iso.datetime().optional(),   // when driver submitted note
  returnStartedAt: z.iso.datetime().optional(),   // when driver pressed "Start return"
  returnedAt:      z.iso.datetime().optional(),   // when driver confirmed handback
  driverNote:      z.string().min(1),             // required on POST /undeliverable
  photoUrl:        z.string().url().optional(),   // Cloudinary URL — optional for MVP
  gps:             CoordinatesZ.optional(),       // driver GPS at check-in time
})
```

### 4.3 `location_meta` JSONB on `logistics.courier_status`

```typescript
// Added to courierStatus table in src/database/schema/logistics.ts
locationMeta: jsonb("location_meta").$type<LocationMetaJSONB>()
```

```typescript
// LocationMetaJSONBZ in src/database/schema/types.ts
z.object({
  speed:    z.number().nonnegative().nullable(),    // km/h
  bearing:  z.number().min(0).max(360).nullable(),  // degrees
  accuracy: z.number().nonnegative().nullable(),    // metres
})
```

Updated on every `PATCH /drivers/me/location` call alongside the existing PostGIS geography column.

### 4.4 `net_earnings` on `orders.courier_assignments`

```typescript
// Added to courierAssignments table in src/database/schema/orders.ts
netEarnings: numeric("net_earnings", { precision: 10, scale: 2, mode: "number" })
```

- Populated atomically inside `deliver_order` stored function: `ROUND(v_order_total * v_commission_rate, 2)`
- `return_order` stored function writes `0` (failed delivery earns nothing for MVP)
- Null for assignments created before this change

### 4.5 `pricing_config` seed entries

```sql
INSERT INTO public.pricing_config (config_key, config_value, description)
VALUES
  ('undeliverable_wait_minutes', 5,  'Minutes driver must wait at delivery before marking undeliverable'),
  ('average_courier_speed_kmph', 25, 'Used for estimated delivery minutes calculation');
```

Configurable by admin at runtime — no deploy required to change wait duration.

---

## 5. New API Endpoints

All new endpoints added to the existing `orders` module. Auth via existing `fastify.authenticate` hook.

### 5.1 Driver-facing order actions

| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders/:id/arrive` | courier | Check in at delivery address, start wait timer |
| `POST` | `/api/v1/orders/:id/undeliverable` | courier | Mark undeliverable after wait expires |
| `POST` | `/api/v1/orders/:id/return` | courier | Start return leg to origin |
| `POST` | `/api/v1/orders/:id/returned` | courier | Confirm handback at origin, release courier |
| `POST` | `/api/v1/orders/:id/proof-of-delivery` | courier | Submit PoD after delivery (optional) |
| `GET` | `/api/v1/orders/:id/tracking` | client + courier | Live location + milestone timeline |

### 5.2 Enhanced existing endpoint

`PATCH /api/v1/drivers/me/location` — adds `speed`, `bearing`, `accuracy` to request body. Writes to `location_meta` JSONB alongside existing PostGIS column. Response contract unchanged.

---

## 6. Request / Response Contracts

### POST `/orders/:id/arrive`

```
Guards:   order status = 'in_transit', courierId = request.user.id
Idempotent: if delivery_attempt.arrivedAt already exists, return 200 with current waitUntil (no re-write, no duplicate tracking event)
Request:  { gps: { latitude: number, longitude: number } }
Response: {
  data: {
    arrivedAt:   ISO8601,
    waitUntil:   ISO8601,   // arrivedAt + undeliverable_wait_minutes
    waitMinutes: number
  }
}
Side effects:
  - Writes delivery_attempt.arrivedAt + delivery_attempt.gps to JSONB
  - Inserts tracking.events: checkpoint "Driver arrived at delivery address"
```

### POST `/orders/:id/undeliverable`

```
Guards:   order status = 'in_transit', delivery_attempt.arrivedAt exists
Request:  { driverNote: string, photoUrl?: string }
Response (wait not elapsed):
  400 { success: false, error: "Wait period not elapsed", retryAfter: ISO8601 }
Response (success):
  {
    data: {
      order: { orderId, status: "undeliverable", undeliverableAt: ISO8601 }
    }
  }
Side effects:
  - Patches delivery_attempt: undeliverableAt + driverNote + photoUrl
  - order status: in_transit → undeliverable
  - assignment status: unchanged (stays in_transit — changes to 'returning' only on POST /return)
  - Inserts tracking.events: status_change "Driver could not deliver"
  - Inserts orders.status_history record
```

### POST `/orders/:id/return`

```
Guards:   order status = 'undeliverable', courierId = request.user.id
Request:  {} (no body)
Response: {
  data: {
    order: { orderId, status: "returning", returnStartedAt: ISO8601 }
  }
}
Side effects:
  - Patches delivery_attempt.returnStartedAt
  - order status: undeliverable → returning
  - assignment status: in_transit → returning
  - Inserts tracking.events: status_change "Returning to sender"
  - Inserts orders.status_history record
```

### POST `/orders/:id/returned`

```
Guards:   order status = 'returning', courierId = request.user.id, assignment belongs to this courier
Request:  {} (no body)
Response: {
  data: {
    order: { orderId, status: "returned", returnedAt: ISO8601 }
  }
}
Side effects:
  - Calls return_order(orderId, courierId) stored function:
      • order: returning → returned
      • assignment: returning → returned, completed_at = NOW()
      • courier_assignments.net_earnings = 0
      • courier_status: current_assignment_id = NULL, is_available = is_online
      • orders.status_history record inserted
  - Patches delivery_attempt.returnedAt
  - Inserts tracking.events: delivery "Returned to sender"
```

### POST `/orders/:id/proof-of-delivery`

```
Guards:   order status = 'delivered'
Request:  {
  recipientName?:         string,
  photoUrl?:              string,   // Cloudinary URL
  recipientSignatureUrl?: string,
  deliveryNotes?:         string
}
Response: {
  data: {
    proof: { proofId, orderId, deliveredAt: ISO8601 }
  }
}
Side effects:
  - Inserts into existing proof_of_delivery table
```

### GET `/orders/:id/tracking`

```
Auth:     client (own orders only), courier (assigned orders only), admin (any)
Response: {
  data: {
    order: { orderId, status },
    driver: {                             // null if no active courier assignment
      location:     { latitude, longitude },
      locationMeta: { speed, bearing, accuracy },
      lastUpdatedAt: ISO8601
    },
    milestones: [
      { eventType, description, location?: { lat, lng }, timestamp: ISO8601 }
    ],
    attempt: DeliveryAttemptJSONB | null
  }
}
```

---

## 7. Live Tracking Architecture

### Write path (driver → backend)

```
Driver app sends PATCH /drivers/me/location every 30s
  { latitude, longitude, speed, bearing, accuracy }
  ↓
UPDATE logistics.courier_status
  SET current_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      location_meta = { speed, bearing, accuracy },
      last_location_update = NOW()
  WHERE courier_id = $1

No INSERT into tracking.events for regular 30s pings.
tracking.events written only at status transition milestones (8 rows max per order).
```

### Read path (customer app → backend)

```
Customer app polls GET /orders/:id/tracking every 30s
  ↓
Single SELECT joining:
  - logistics.courier_status for live position + location_meta
  - tracking.events for milestones (ORDER BY timestamp ASC)
  - orders.requests.delivery_attempt for RTO data

Response includes speed + bearing + lastUpdatedAt.
```

### Client-side dead reckoning (Flutter)

Between 30s polls, the Flutter customer app extrapolates the marker position each second:

```
new_lat = last_lat + (speed_ms * cos(bearing_rad) * elapsed_seconds) / EARTH_RADIUS_M * (180/π)
new_lng = last_lng + (speed_ms * sin(bearing_rad) * elapsed_seconds) / (EARTH_RADIUS_M * cos(lat_rad)) * (180/π)
```

Result: smooth map animation with 30s real-data intervals. Industry-standard approach used by Borzo, Ola, and Google Maps to reduce server load.

### Write load estimate

| Operation | Frequency | DB cost |
|---|---|---|
| 30s location update | 2/min per active courier | UPDATE single indexed row |
| Milestone event | ~8 per order | INSERT into tracking.events |
| 10 concurrent deliveries | 20 UPDATEs/min total | Negligible on Neon free tier |

---

## 8. Milestone Event Matrix

All use the existing `tracking.events` schema. No new columns.

| Transition | `event_type` | `event_description` |
|---|---|---|
| Order accepted | `status_change` | Driver accepted your order |
| picked_up | `pickup` | Package collected |
| in_transit | `status_change` | Driver is on the way |
| Arrived (check-in) | `checkpoint` | Driver arrived at delivery address |
| delivered | `delivery` | Delivered successfully |
| undeliverable | `status_change` | Driver could not deliver |
| returning | `status_change` | Returning to sender |
| returned | `delivery` | Returned to sender |

---

## 9. New Stored Function: `orders.return_order`

Added to `src/database/functions/orders.sql`. Mirrors `deliver_order` structure.

```
Inputs:  p_order_id INT, p_courier_id INT
Guards:
  - Order must exist and not be deleted
  - Order status must be 'returning'
Atomic operations:
  1. UPDATE orders.requests: status = 'returned', updated_at = NOW()
  2. UPDATE orders.courier_assignments:
       status = 'returned', completed_at = NOW(), net_earnings = 0
     WHERE order_id = p_order_id AND courier_id = p_courier_id
  3. UPDATE logistics.courier_status:
       current_assignment_id = NULL, is_available = is_online, updated_at = NOW()
     WHERE courier_id = p_courier_id
  4. INSERT orders.status_history: (order_id, 'returned', 'returning', courier_id)
Returns: JSON { success, order: { orderId, status, returnedAt } }
```

---

## 10. Earnings Bug Fixes

### Fix 1 — Earnings summary reports customer fare

**File:** `src/database/queries/drivers.queries.ts` — `GET_COURIER_EARNINGS_SUMMARY`

```sql
-- Before (wrong)
COALESCE(SUM(o.total_price), 0) AS "totalEarnings"

-- After (fixed, with fallback for historical rows)
COALESCE(SUM(COALESCE(ca.net_earnings, o.total_price * 0.7)), 0) AS "totalEarnings"
```

`net_earnings` is populated in `deliver_order` stored function:
```sql
SELECT config_value INTO v_commission_rate
FROM public.pricing_config
WHERE config_key = 'driver_commission_rate' AND is_active = TRUE;

UPDATE orders.courier_assignments
SET net_earnings = ROUND(v_order_total * v_commission_rate, 2),
    ...
WHERE order_id = p_order_id AND courier_id = p_courier_id;
```

### Fix 2 — `totalDeliveriesToday` never incremented

**File:** `src/database/functions/orders.sql` — `deliver_order` function

Added to the existing courier release UPDATE:
```sql
SET total_deliveries_today = total_deliveries_today + 1,
    current_assignment_id  = NULL,
    is_available           = is_online,
    updated_at             = NOW()
```

**Daily reset:** `sessionsRepository.createSession()` resets `total_deliveries_today = 0` if the driver's last session ended before today. No pg_cron job required.

### Fix 3 — `qualityBonus` always applied unconditionally

**File:** `src/modules/drivers/drivers.service.ts` — `calculateDriverEarnings()`

```typescript
// Before
const qualityBonus = qualityBonusAmount; // always ₹5

// After
const qualityBonus = 0; // requires ratings threshold — not yet implemented
```

### Fix 4 — `estimatedDeliveryMinutes` hardcodes 25 km/h

**File:** `src/modules/drivers/drivers.service.ts` — `getActiveAssignments()`

```typescript
// Before
Math.ceil(((estimatedDistanceKm ?? 10) / 25) * 60)

// After — reads from already-fetched pricingConfig
const avgSpeedKmph = pricingConfig.get("average_courier_speed_kmph") ?? 25;
Math.ceil(((estimatedDistanceKm ?? 10) / avgSpeedKmph) * 60)
```

---

## 11. Modified Files Summary

| File | Change |
|---|---|
| `src/database/schema/public.ts` | Add `returning` to `order_status` and `assignment_status` enums |
| `src/database/schema/orders.ts` | Add `deliveryAttempt` JSONB column to `orderRequests`; add `netEarnings` column to `courierAssignments` |
| `src/database/schema/logistics.ts` | Add `locationMeta` JSONB column to `courierStatus` |
| `src/database/schema/types.ts` | Add `DeliveryAttemptJSONBZ` and `LocationMetaJSONBZ` types |
| `src/database/functions/orders.sql` | Fix `deliver_order` (net_earnings + totalDeliveriesToday); add `return_order` function |
| `src/database/queries/orders.queries.ts` | Add queries for arrive, undeliverable, return, returned, PoD, tracking GET |
| `src/database/queries/drivers.queries.ts` | Update `UPDATE_COURIER_LOCATION` to write `location_meta` |
| `src/modules/orders/orders.routes.ts` | Register 6 new routes |
| `src/modules/orders/orders.controller.ts` | Add 6 new controller methods |
| `src/modules/orders/orders.service.ts` | Add arrive, undeliverable, return, returned, PoD, tracking service methods |
| `src/modules/orders/orders.repository.ts` | Add corresponding repository methods |
| `src/modules/orders/orders.zod.ts` | Add request/response Zod schemas for new endpoints |
| `src/modules/orders/orders.schema.ts` | Add Fastify JSON schemas for new routes |
| `src/modules/drivers/drivers.service.ts` | Fix qualityBonus, fix estimatedDeliveryMinutes |
| `src/modules/drivers/drivers.repository.ts` | Update location method to include locationMeta |
| `src/modules/drivers/sessions.repository.ts` | Reset totalDeliveriesToday on new-day session start |

No new modules. No new tables. No migration scripts.
