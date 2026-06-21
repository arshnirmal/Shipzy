# Payments Client Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make prepaid payment work end-to-end from the business app while guaranteeing unpaid prepaid orders never reach drivers, plus close the audit's smaller gaps across both apps and the backend.

**Architecture:** Phase A adds the backend "dormant-until-paid" gate, idempotent create-order, list payment-status, and the API doc. Phase B wires the business prepaid Razorpay Checkout flow + pay-later UI. Phase C handles two driver-side edges. The governing invariant: a prepaid order is invisible to the driver fleet until `orders.requests.payment_status = 'completed'`.

**Tech Stack:** Backend: TypeScript ESM, Fastify, pg/Drizzle, Jest. Business: Next.js (App Router), React Query, TypeScript, Razorpay Checkout.js. Driver: Flutter, Riverpod, Dio, freezed.

## Global Constraints

- Backend layering: `routes → controller → service → repository → queries → DB`; no `drizzlePool` in services; SQL only in `*.queries.ts`. (Pre-existing exceptions are preserved verbatim when moved, not newly introduced.)
- Money internally in integer paise; rupees only at API boundary.
- Verify with `npx tsc --noEmit` (backend) — the repo's `pnpm run lint` is broken by an unrelated ESLint config issue; use tsc.
- Dev Postgres container `shipzy-postgres-dev` listens on **port 5433**; `pnpm run db:deploy` applies migrations (the `db-generate-migration.ts` tool re-snapshots the journal — that quirk is pre-existing and expected).
- Backend payment provider is mocked in tests via `registry.register({ name: "razorpay", ... })`; never hit the network in tests.
- Prepaid `/payments/verify` request body field names remain `razorpayOrderId` / `razorpayPaymentId` / `razorpaySignature` (client-submitted); the create-order **response** uses `providerOrderId` / `publishableKey`.
- Flutter: `flutter analyze` must be 0 issues; screens never call Dio directly (driver app has no repository layer — providers call `ApiService`, the existing app-wide pattern).

---

## File Structure

**Backend — create:**
- `backend/src/modules/orders/order-dispatch.service.ts` — courier broadcast, importable by both orders and payments without a cycle.

**Backend — modify:**
- `src/database/schema/orders.ts` (add `payment_status` column), `src/database/queries/orders.queries.ts` (availability gate + list payment_status), `src/database/queries/payments.queries.ts` (set order payment_status), `src/modules/orders/orders.service.ts` (deferred broadcast), `src/modules/orders/orders.repository.ts` + `payments.repository.ts` (payment_status writes), `src/modules/payments/payments.service.ts` (idempotent create-order + broadcast-on-payment + payment_status sync), `src/modules/payments/payments.repository.ts`, `backend/tests/modules/payments.test.ts`, `backend/tests/modules/orders.test.ts`.
- `backend/docs/api/payments.md` (new doc).

**Business — create:** `apps/business/src/hooks/use-payment.ts`.
**Business — modify:** `src/types/orders.ts`, `src/hooks/use-create-order.ts`, `src/components/orders/new-order-wizard.tsx`, `src/components/orders/order-detail-view.tsx`, `src/components/orders/orders-table.tsx`, `src/components/orders/payment-status-badge.tsx`.

**Driver — modify:** `apps/driver/lib/providers/payment_provider.dart`, `lib/screens/delivery/widgets/payment_qr_bottom_sheet.dart`, `lib/screens/delivery/active_delivery_screen.dart`.

---

# PHASE A — Backend (dormant-until-paid gate + support)

### Task A1: Add `payment_status` column to `orders.requests`

**Files:**
- Modify: `backend/src/database/schema/orders.ts`
- Migration: generated under `backend/src/database/migrations/`

**Interfaces:**
- Produces: `orders.requests.payment_status` (enum `payment_status`, default `'pending'`), Drizzle field `paymentStatus`.

- [ ] **Step 1: Import the enum and add the column.** In `orders.ts`, `paymentStatusEnum` is exported from `./public.js` (where `paymentModeEnum` already comes from). Add it to that import, then add to the `orderRequests` table definition next to `paymentMode`:

```ts
paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
```

- [ ] **Step 2: Generate + deploy the migration.**

Run: `cd backend && pnpm run db:generate && DB_PORT=5433 pnpm run db:deploy`
Expected: a new migration adds `payment_status` to `orders.requests`; deploy succeeds. Verify: `psql ... -c "\d orders.requests"` shows the column (or query `information_schema.columns`).

- [ ] **Step 3: Commit.**

```bash
git add backend/src/database/schema/orders.ts backend/src/database/migrations/
git commit -m "feat(orders): add denormalized payment_status column"
```

---

### Task A2: Extract `order-dispatch.service.ts` (no-cycle broadcast)

**Files:**
- Create: `backend/src/modules/orders/order-dispatch.service.ts`
- Modify: `backend/src/modules/orders/orders.service.ts`

**Interfaces:**
- Produces: `orderDispatchService.broadcastNewOrder({ orderId, orderNumber, pickupLat, pickupLng, totalPrice }): Promise<void>` (default export singleton).

- [ ] **Step 1: Create the dispatch service** by moving the existing `broadcastNewOrderToNearbyCouriers` body verbatim (it uses `drizzlePool` + `driversQueries.CALL_FIND_NEARBY_COURIERS` + `fcmService` — preserve as-is; this is pre-existing behavior being relocated, not new layering debt):

```ts
// src/modules/orders/order-dispatch.service.ts
import logger from "../../config/logger.js";
import { drizzlePool } from "../../database/drizzle.js";
import driversQueries from "../../database/queries/drivers.queries.js";
import fcmService from "../../services/fcm.service.js";

class OrderDispatchService {
  /** Notify online, idle couriers within radius about an order now ready for pickup. */
  async broadcastNewOrder(params: {
    orderId: number;
    orderNumber: string;
    pickupLat: number;
    pickupLng: number;
    totalPrice: number;
  }): Promise<void> {
    try {
      const radiusKm = 10;
      const limit = 25;
      const result = await drizzlePool.query<{ courier_id: number }>(
        driversQueries.CALL_FIND_NEARBY_COURIERS,
        [params.pickupLat, params.pickupLng, radiusKm, limit],
      );
      const courierIds = result.rows.map((r) => r.courier_id);
      if (courierIds.length === 0) return;
      await fcmService.sendToUsers(courierIds, {
        title: "New delivery nearby",
        body: `₹${params.totalPrice} · Tap to view pickup`,
        data: {
          type: "order.available",
          orderId: String(params.orderId),
          orderNumber: params.orderNumber,
        },
      });
    } catch (error) {
      logger.warn({
        msg: "Error broadcasting new order to nearby couriers",
        error: (error as Error).message,
      });
    }
  }
}
export default new OrderDispatchService();
```

- [ ] **Step 2: Replace the private method in `orders.service.ts`** — delete `broadcastNewOrderToNearbyCouriers`, import the dispatch service (`import orderDispatchService from "./order-dispatch.service.js"`), and update the create-order call site (next task adjusts the COD/prepaid condition; for now call `orderDispatchService.broadcastNewOrder({...})` with the same params).

- [ ] **Step 3: Typecheck.** Run: `cd backend && npx tsc --noEmit` → clean.

- [ ] **Step 4: Commit.**

```bash
git add backend/src/modules/orders/order-dispatch.service.ts backend/src/modules/orders/orders.service.ts
git commit -m "refactor(orders): extract order-dispatch service to break import cycle"
```

---

### Task A3: Deferred broadcast for prepaid in `createOrder`

**Files:**
- Modify: `backend/src/modules/orders/orders.service.ts:271-285`
- Test: `backend/tests/modules/orders.test.ts`

**Interfaces:**
- Consumes: `orderDispatchService.broadcastNewOrder` (A2).

- [ ] **Step 1: Write the failing test** — creating a prepaid order does NOT broadcast; creating a COD order does. Mock `orderDispatchService.broadcastNewOrder` with a spy. (Follow the existing orders.test setup; use fixtures `createClient`, `createOrder` with `paymentMode`.)

```ts
it("does not broadcast a prepaid order at creation", async () => {
  const spy = jest.spyOn(orderDispatchService, "broadcastNewOrder").mockResolvedValue();
  await createOrder(app, client.accessToken, { paymentMode: "prepaid" });
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});
it("broadcasts a collect_on_delivery order at creation", async () => {
  const spy = jest.spyOn(orderDispatchService, "broadcastNewOrder").mockResolvedValue();
  await createOrder(app, client.accessToken, { paymentMode: "collect_on_delivery" });
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
```

(If `createOrder` fixture doesn't accept `paymentMode`, extend it to pass through `fulfillment.paymentMode`.)

- [ ] **Step 2: Run — verify it fails.** Run: `DB_PORT=5433 pnpm run test:orders` → the prepaid test fails (currently broadcasts unconditionally).

- [ ] **Step 3: Implement** — gate the broadcast on payment mode in the non-scheduled branch:

```ts
} else {
  // COD broadcasts immediately; prepaid stays dormant until payment completes (see payments.service).
  if (orderData.fulfillment.paymentMode === "collect_on_delivery") {
    orderDispatchService
      .broadcastNewOrder({
        orderId: result.order.identifiers.orderId,
        orderNumber: result.order.identifiers.orderNumber ?? "",
        pickupLat: orderData.locations.pickup.latitude,
        pickupLng: orderData.locations.pickup.longitude,
        totalPrice: pricing.totalPrice,
      })
      .catch((err) => {
        logger.warn({ msg: "broadcastNewOrder failed", error: (err as Error).message });
      });
  }
}
```

(Confirm the field holding payment mode on `orderData.fulfillment`; match the create payload shape.)

- [ ] **Step 4: Run — verify pass.** `DB_PORT=5433 pnpm run test:orders` → both tests pass.

- [ ] **Step 5: Commit.**

```bash
git add backend/src/modules/orders/orders.service.ts backend/tests/modules/orders.test.ts
git commit -m "feat(orders): defer courier broadcast for prepaid orders until payment"
```

---

### Task A4: Availability gate + on-payment broadcast + payment_status sync

**Files:**
- Modify: `backend/src/database/queries/orders.queries.ts` (gate + list field), `backend/src/database/queries/payments.queries.ts` (set order payment_status), `backend/src/modules/payments/payments.repository.ts`, `backend/src/modules/payments/payments.service.ts`
- Test: `backend/tests/modules/payments.test.ts`

**Interfaces:**
- Consumes: `orderDispatchService.broadcastNewOrder` (A2), `orders.requests.payment_status` (A1).
- Produces: `paymentsRepository.setOrderPaymentStatus(orderId, status)`.

- [ ] **Step 1: Availability gate (SQL).** In `FIND_AVAILABLE_ORDERS_FOR_COURIER` (orders.queries.ts), after the `status = 'pending'`/freshness predicates add:

```sql
      AND (
        o.payment_mode = 'collect_on_delivery'
        OR o.payment_status = 'completed'
      )
```

- [ ] **Step 2: Set-order-payment-status query** (payments.queries.ts):

```ts
SET_ORDER_PAYMENT_STATUS: `
  UPDATE orders.requests SET payment_status = $2 WHERE order_id = $1
`,
```

- [ ] **Step 3: Repository method** (payments.repository.ts):

```ts
async setOrderPaymentStatus(orderId: number, status: string): Promise<void> {
  await drizzlePool.query(paymentQueries.SET_ORDER_PAYMENT_STATUS, [orderId, status]);
}
```

- [ ] **Step 4: Sync + broadcast on prepaid completion.** In `payments.service.ts`:
  - In `verifyPayment`, after marking the transaction completed: `await paymentsRepository.setOrderPaymentStatus(orderId, "completed");` then broadcast (fetch the order's pickup coords + number + total via a repository read; reuse `getOrderForBroadcast(orderId)` added below) → `orderDispatchService.broadcastNewOrder({...})` (fire-and-forget with `.catch`).
  - In the webhook `applyWebhookEvent`/`processWebhook` `captured` path: same two actions (set order payment_status completed + broadcast). For `qr_credited` (COD): set order payment_status completed (no broadcast — already visible). For `failed`: set `failed`. For refund: set `refunded`.

Add a small read for broadcast inputs (payments.queries.ts + repository):

```ts
GET_ORDER_FOR_BROADCAST: `
  SELECT order_id AS "orderId", order_number AS "orderNumber",
         (pickup_location->>'latitude')::float AS "pickupLat",
         (pickup_location->>'longitude')::float AS "pickupLng",
         (pricing->>'totalPrice')::numeric AS "totalPrice"
  FROM orders.requests WHERE order_id = $1
`,
```
(Verify the JSONB keys/column names against `orders.requests`; adjust to the real shape.)

- [ ] **Step 5: Tests** (payments.test.ts) — add to the existing suite:
  - **Availability gate**: seed a prepaid order `payment_status='pending'` → assert it is NOT returned by the available-orders endpoint/repo for a nearby courier; set it `completed` → assert it IS returned; a COD `pending` order IS returned.
  - **On-payment broadcast**: spy `orderDispatchService.broadcastNewOrder`; drive a prepaid `captured` webhook for a seeded order → assert order `payment_status='completed'` and broadcast called once. A `qr_credited` (COD) webhook → order `payment_status='completed'`, broadcast NOT called.

Provide real seeding via `drizzlePool` (as the existing suite does) and the mocked provider `verifyAndParse` returning the chosen event.

- [ ] **Step 6: Run.** `DB_PORT=5433 pnpm run test:payments` → all pass. `npx tsc --noEmit` clean.

- [ ] **Step 7: Commit.**

```bash
git add backend/src/database/queries/orders.queries.ts backend/src/database/queries/payments.queries.ts backend/src/modules/payments/payments.repository.ts backend/src/modules/payments/payments.service.ts backend/tests/modules/payments.test.ts
git commit -m "feat(payments): gate driver visibility on payment; broadcast prepaid on completion"
```

---

### Task A5: Idempotent `/payments/create-order`

**Files:**
- Modify: `backend/src/modules/payments/payments.service.ts` (`initiatePayment`), `backend/src/modules/payments/payments.repository.ts`
- Test: `backend/tests/modules/payments.test.ts`

- [ ] **Step 1: Failing test** — calling create-order twice for the same order returns the same `providerOrderId` and leaves exactly one `pending` transaction.

```ts
it("reuses the pending transaction on repeated create-order calls", async () => {
  // mock collection.createPaymentOrder to return incrementing provider order ids
  const r1 = await inject(app, { method: "POST", url: "/api/v1/payments/create-order",
    headers: authHeaders(client.accessToken), payload: { orderId } });
  const r2 = await inject(app, { method: "POST", url: "/api/v1/payments/create-order",
    headers: authHeaders(client.accessToken), payload: { orderId } });
  expect(r1.json().data.providerOrderId).toBe(r2.json().data.providerOrderId);
  const count = await countPendingTransactions(orderId); // helper via drizzlePool
  expect(count).toBe(1);
});
```

- [ ] **Step 2: Run — fails** (currently creates two). Run: `DB_PORT=5433 pnpm run test:payments`.

- [ ] **Step 3: Implement** — at the top of `initiatePayment`, after the ownership + amount checks, look up an existing reusable pending transaction:

```ts
const existing = await paymentsRepository.getPaymentByOrder(orderId);
if (existing && existing.paymentStatus === "pending" && existing.razorpayOrderId) {
  return {
    providerOrderId: existing.razorpayOrderId,
    amount,
    currency: "INR",
    publishableKey: config.razorpay.keyId,
    orderId,
  };
}
```

(Confirm `getPaymentByOrder` returns `razorpayOrderId`/`paymentStatus`; if not, extend its SELECT. "Reusable" = pending with a stored provider order id. A failed/expired txn is not reused — a new one is created.)

- [ ] **Step 4: Run — pass.** `DB_PORT=5433 pnpm run test:payments`.

- [ ] **Step 5: Commit.**

```bash
git add backend/src/modules/payments/payments.service.ts backend/src/modules/payments/payments.repository.ts backend/tests/modules/payments.test.ts
git commit -m "fix(payments): make create-order idempotent per order"
```

---

### Task A6: Orders list exposes `payment_status`

**Files:**
- Modify: `backend/src/database/queries/orders.queries.ts` (client list query), `backend/src/modules/orders/orders.service.ts` (`toBaseOrderFromRow`), `backend/src/modules/orders/orders.zod.ts` (or the OrderListRow/base type), `backend/tests/modules/orders.test.ts`

- [ ] **Step 1: Failing test** — the client order list includes `paymentStatus` for each order (e.g., a freshly created prepaid order shows `paymentStatus: "pending"`).

- [ ] **Step 2: Add `o.payment_status AS "paymentStatus"`** to the client-facing list SELECT (the query that powers GET orders for a business; the one returning `payment_mode` at orders.queries.ts:131), add `paymentStatus` to the `OrderListRow` type and to `toBaseOrderFromRow`'s output `fulfillment` (alongside `paymentMode`).

- [ ] **Step 3: Run — pass.** `DB_PORT=5433 pnpm run test:orders`. `npx tsc --noEmit` clean.

- [ ] **Step 4: Commit.**

```bash
git add backend/src/database/queries/orders.queries.ts backend/src/modules/orders/orders.service.ts backend/src/modules/orders/orders.zod.ts backend/tests/modules/orders.test.ts
git commit -m "feat(orders): include paymentStatus in order list"
```

---

### Task A7: `backend/docs/api/payments.md`

**Files:**
- Create: `backend/docs/api/payments.md`

- [ ] **Step 1: Write the doc** following the structure of a sibling (e.g. `orders.md`): for each endpoint give method, path, auth/role, request body, success response (with the standard envelope), and error cases. Cover `POST /payments/create-order` (response `providerOrderId`, `publishableKey`, `amount`, `currency`, `orderId`), `POST /payments/verify` (body `orderId`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`), `POST /payments/generate-qr`, `GET /payments/order/:orderId/status`, `POST /payments/webhook/:provider`, `POST /payments/:transactionId/refund`, `GET /payments/driver/earnings`, `GET /payments/driver/payouts`. Add a "Flows" section (prepaid pay-later; COD QR) and state the dormant-until-paid invariant. Add a "Webhook events" list (`payment.captured`, `payment.failed`, `qr_code.credited`, `refund.processed`, `payout.processed`, `payout.failed`).

- [ ] **Step 2: Commit.**

```bash
git add backend/docs/api/payments.md
git commit -m "docs(api): document the payments module contract"
```

---

# PHASE B — Business app (Next.js)

### Task B1: Payment status types + badge

**Files:**
- Modify: `apps/business/src/types/orders.ts`, `apps/business/src/components/orders/payment-status-badge.tsx`

- [ ] **Step 1: Extend the union** in `types/orders.ts`:

```ts
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled" | "expired";
```
Add `paymentStatus?: PaymentStatus` to the order list fulfillment type (to match A6).

- [ ] **Step 2: Add badge configs** for `cancelled` and `expired` in `payment-status-badge.tsx` `STATUS_CONFIG` (icons `XCircle`/`Clock`, label "Cancelled"/"Expired", muted/red styling consistent with siblings).

- [ ] **Step 3: Verify build.** Run: `cd apps/business && pnpm run lint && npx tsc --noEmit` (or the app's typecheck) → clean.

- [ ] **Step 4: Commit.**

```bash
git add apps/business/src/types/orders.ts apps/business/src/components/orders/payment-status-badge.tsx
git commit -m "feat(business): payment status types and badges for cancelled/expired"
```

---

### Task B2: `use-payment.ts` — Razorpay Checkout hook

**Files:**
- Create: `apps/business/src/hooks/use-payment.ts`

**Interfaces:**
- Produces: `usePayment()` → `{ payForOrder(orderId: number): Promise<{ status: "paid" | "cancelled" | "failed" }> }`.

- [ ] **Step 1: Implement the hook.** It (a) ensures Checkout.js is loaded, (b) calls `/payments/create-order`, (c) opens the modal with `providerOrderId` + `publishableKey`, (d) on success POSTs `/payments/verify`, (e) resolves a discriminated result. Use the app's `apiRequest` from `@/lib/api`.

```ts
"use client";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

declare global { interface Window { Razorpay?: new (opts: unknown) => { open: () => void } } }

type CreateOrderResp = { success: true; data: {
  providerOrderId: string; publishableKey: string; amount: number; currency: string; orderId: number;
}};

function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(s);
  });
}

export function usePayment() {
  async function payForOrder(orderId: number): Promise<{ status: "paid" | "cancelled" | "failed" }> {
    try {
      await loadCheckout();
      const created = await apiRequest<CreateOrderResp>("/payments/create-order", {
        method: "POST", body: JSON.stringify({ orderId }),
      });
      const { providerOrderId, publishableKey, amount, currency } = created.data;
      return await new Promise((resolve) => {
        const rzp = new window.Razorpay!({
          key: publishableKey,
          order_id: providerOrderId,
          amount: Math.round(amount * 100),
          currency,
          name: "Shipzy",
          description: `Order #${orderId}`,
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await apiRequest("/payments/verify", { method: "POST", body: JSON.stringify({
                orderId,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              })});
              toast.success("Payment successful");
              resolve({ status: "paid" });
            } catch (e) { toast.error(getErrorMessage(e)); resolve({ status: "failed" }); }
          },
          modal: { ondismiss: () => resolve({ status: "cancelled" }) },
        });
        rzp.open();
      });
    } catch (e) { toast.error(getErrorMessage(e)); return { status: "failed" }; }
  }
  return { payForOrder };
}
```

(Confirm `apiRequest`'s signature/return shape against `@/lib/api`; adapt headers/body handling to match the other hooks.)

- [ ] **Step 2: Typecheck.** `cd apps/business && npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit.**

```bash
git add apps/business/src/hooks/use-payment.ts
git commit -m "feat(business): Razorpay Checkout hook for prepaid payment"
```

---

### Task B3: Wire prepaid into order creation

**Files:**
- Modify: `apps/business/src/components/orders/new-order-wizard.tsx`, `apps/business/src/hooks/use-create-order.ts`

- [ ] **Step 1: Remove the dead field.** Drop `paymentMethodId` from `CreateOrderPayload.fulfillment` and `buildCreateOrderPayload` (backend ignores it). Typecheck-drive the removals.

- [ ] **Step 2: Chain checkout after creation for prepaid.** In the wizard's submit handler (`new-order-wizard.tsx`), after `useCreateOrder().mutateAsync(payload)` resolves with the new `orderId`, if `payload.fulfillment.paymentMode === "prepaid"` call `usePayment().payForOrder(orderId)`. Regardless of the result, navigate to the order (the order exists; if `cancelled`/`failed` it shows as pending-payment with a Pay-now action from B4). COD: no checkout.

- [ ] **Step 3: Verify build.** `cd apps/business && pnpm run lint && npx tsc --noEmit`.

- [ ] **Step 4: Commit.**

```bash
git add apps/business/src/components/orders/new-order-wizard.tsx apps/business/src/hooks/use-create-order.ts
git commit -m "feat(business): collect prepaid payment after order creation"
```

---

### Task B4: Pay-now / retry affordances + status display

**Files:**
- Modify: `apps/business/src/components/orders/order-detail-view.tsx`, `apps/business/src/components/orders/orders-table.tsx`

- [ ] **Step 1: Order detail — "Pay now" button.** In the payment section, when `paymentMode === "prepaid"` and `paymentStatus` is `pending`/`failed`/`expired`, render a "Pay now" button that calls `usePayment().payForOrder(orderId)` and, on `paid`, invalidates the order query (`queryClient.invalidateQueries({ queryKey: ["order", orderId] })`) so the status refreshes. Show the `PaymentStatusBadge`.

- [ ] **Step 2: Orders list — status column + inline pay.** Add a `paymentStatus` cell using `PaymentStatusBadge` (data now present via A6). For unpaid prepaid rows, add a small "Pay" action (row action menu) invoking the same hook.

- [ ] **Step 3: Verify build.** `cd apps/business && pnpm run lint && npx tsc --noEmit`.

- [ ] **Step 4: Commit.**

```bash
git add apps/business/src/components/orders/order-detail-view.tsx apps/business/src/components/orders/orders-table.tsx
git commit -m "feat(business): pay-now/retry actions and payment status in list+detail"
```

---

# PHASE C — Driver app (Flutter)

### Task C1: Handle `expired` QR status in the poller

**Files:**
- Modify: `apps/driver/lib/providers/payment_provider.dart`, `apps/driver/lib/screens/delivery/widgets/payment_qr_bottom_sheet.dart`

- [ ] **Step 1: Stop polling on terminal states.** In the polling notifier (`payment_provider.dart`), the timer currently stops on `completed`. Change the stop condition to also stop on `expired` and `failed`:

```dart
final status = result.paymentStatus;
if (status == 'completed' || status == 'expired' || status == 'failed') {
  _timer?.cancel();
}
```

- [ ] **Step 2: QR sheet — expired UI.** In `payment_qr_bottom_sheet.dart`, in the `pollingAsync.when(...)` data branch, when `paymentStatus == 'expired'` show "QR expired" with a "Regenerate QR" button that re-invokes `qrCodeProvider(orderId)` (or the existing generate path) and restarts polling. Keep all strings in the existing centralized location if one is used.

- [ ] **Step 3: Analyze.** Run: `cd apps/driver && flutter analyze` → 0 issues.

- [ ] **Step 4: Commit.**

```bash
git add apps/driver/lib/providers/payment_provider.dart apps/driver/lib/screens/delivery/widgets/payment_qr_bottom_sheet.dart
git commit -m "feat(driver): handle expired QR — stop polling and offer regenerate"
```

---

### Task C2: COD proof-of-delivery gate UX

**Files:**
- Modify: `apps/driver/lib/screens/delivery/active_delivery_screen.dart`

- [ ] **Step 1: Detect the gate error.** The backend rejects `submitProofOfDelivery` for COD with a 400 ("Payment must be collected before submitting proof of delivery..."). Where the screen calls the PoD submit and catches errors, special-case this: if `paymentMode == 'collect_on_delivery'` and payment isn't `completed`, do not even attempt PoD — instead surface a clear inline prompt "Collect payment first — show the QR to the customer" with a button that opens the QR bottom sheet. As a fallback, if the backend 400 is returned, map it to the same friendly prompt rather than a raw error toast.

- [ ] **Step 2: Analyze.** Run: `cd apps/driver && flutter analyze` → 0 issues.

- [ ] **Step 3: Commit.**

```bash
git add apps/driver/lib/screens/delivery/active_delivery_screen.dart
git commit -m "feat(driver): guide collect-first on COD proof-of-delivery"
```

---

## Self-Review Notes

- **Spec coverage:** A1(list)→A6; A2(idempotent)→A5; A3(doc)→A7; A4a→A4(step1); A4b→A3; A4c→A1+A4; A4d→A4(step4); A4e→A2; B1→B2; B2→B3+B4; B3→B4; B4(types)→B1; C1(PoD)→C2; C2(expired QR)→C1. All spec items mapped.
- **Type/name consistency:** `orderDispatchService.broadcastNewOrder` (A2) is consumed by A3 and A4. `paymentsRepository.setOrderPaymentStatus` (A4) and `getPaymentByOrder` returning `razorpayOrderId`/`paymentStatus` (A5) are consistent. `usePayment().payForOrder` (B2) is consumed by B3 and B4. `PaymentStatus` union (B1) used by B4.
- **Ordering:** Execute A1→A2→A3→A4→A5→A6→A7, then B1→B2→B3→B4, then C1→C2. Phase B depends on A4/A6 (status data) and the create-order response field names. Phase C is independent of A/B.
- **Verify before coding:** several exact column/JSONB key names (`pickup_location` keys, the client list query id, `orderData.fulfillment` payment-mode field, `apiRequest` signature) are flagged inline — confirm against the real files rather than assume.
