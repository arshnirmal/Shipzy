# Payments Client Integration (Business + Driver) — Design

Date: 2026-06-22
Status: Draft for review
Scope: `apps/business` (Next.js), `apps/driver` (Flutter), and supporting backend changes in `backend/src/modules/{orders,payments}` + `backend/docs/api`.
Predecessor: `docs/superpowers/specs/2026-06-20-payments-remediation-design.md` (backend remediation, completed).

## Context

The backend payments module was remediated (idempotent webhooks, ownership, capability registry, crash-safe payouts, tests). A follow-up audit of the two client apps found:

- **Business app**: payment UI scaffolding exists (mode selector, status/mode badges, payment-info in order detail) but it makes **no `/payments` API calls** — the prepaid Razorpay Checkout flow (`/payments/create-order` → modal → `/payments/verify`) was never wired. Prepaid orders can be created but never paid.
- **Driver app**: functionally complete for collection — calls `/payments/generate-qr`, polls `/payments/order/:id/status` every 5s, shows the QR bottom sheet, and reads earnings/payouts. Minor edges around the COD proof-of-delivery gate and QR expiry.
- **Cross-cutting**: no `backend/docs/api/payments.md`; orders **list** returns `payment_mode` but not `payment_status`; `/payments/create-order` is not idempotent per order.

The decision is **"order created, pay later"** for prepaid (matches the backend's existing decoupling of order creation from payment). This introduces the central risk this spec must close: an order can exist with payment incomplete, and **must not** be worked by drivers until paid.

## Central Invariant

**A prepaid order is invisible to the driver fleet until `payment_status = 'completed'`.**

| Mode | At creation | Driver visibility | Collection |
|------|-------------|-------------------|------------|
| COD | broadcast immediately | visible while `pending` | driver shows QR at delivery; proof-of-delivery already gated on payment completion |
| Prepaid | created **dormant**, not broadcast | hidden until paid | none — driver only ever sees a paid prepaid order ("Prepaid ✓") |

Consequence: the **driver app needs no new logic for unpaid orders** — the gate is entirely server-side.

## Goals

1. Make prepaid payment actually work end-to-end from the business app.
2. Guarantee unpaid prepaid orders never reach drivers; make them visible/actionable to the business.
3. Make `/payments/create-order` safe to retry.
4. Document the payments contract and align client types/edges.

## Non-Goals

- Card/net-banking/wallet methods (UPI only, as before).
- Auto-cancel sweep for long-unpaid prepaid orders (noted as future).
- Partial refunds; refund UI in the business app (admin-only backend endpoint stays as-is).
- Adding a repository layer to the driver app (it has none app-wide; out of scope).

## Phase A — Backend support

### A1 — Orders list exposes `payment_status`
`FIND_AVAILABLE_ORDERS_FOR_COURIER` and the client-facing order list currently return `payment_mode` only. Add `payment_status` to the order list response so the business can see and act on unpaid orders. Served by the denormalized column from A4c (no join).

### A2 — Idempotent `/payments/create-order`
`initiatePayment` currently creates a new transaction + Razorpay order on every call. Change it to: if a `pending` transaction already exists for the order, reuse its Razorpay order (return the same `providerOrderId`) when still valid; otherwise create one. Prevents orphan pending transactions on retry. Keep ownership check (already added).

### A3 — `backend/docs/api/payments.md`
Document every endpoint (`create-order`, `verify`, `generate-qr`, `order/:id/status`, `webhook/:provider`, `:transactionId/refund`, `driver/earnings`, `driver/payouts`), both flows (prepaid, COD), the provider-agnostic field names (`providerOrderId`, `publishableKey`), webhook events, and the dormant-until-paid invariant. Apps integrate against this doc going forward.

### A4 — Dormant-until-paid gate (critical)
- **A4a Availability gate.** Add to `FIND_AVAILABLE_ORDERS_FOR_COURIER` WHERE:
  `AND (o.payment_mode = 'collect_on_delivery' OR o.payment_status = 'completed')`.
- **A4b Deferred broadcast.** In `createOrder`, broadcast to couriers immediately only for `collect_on_delivery` (and scheduled stays scheduled). Prepaid orders are created without broadcast.
- **A4c Denormalized `payment_status` on `orders.requests`.** New column (default `'pending'`), updated wherever transaction status changes: prepaid verify success, webhook `captured`, webhook `qr_credited` (COD), refund, QR-expiry. Serves both the availability gate and the list (A1) without hot-path joins. Migration required.
- **A4d Trigger broadcast on prepaid payment completion.** When a prepaid payment completes (verify success and webhook `captured`), set `orders.requests.payment_status = 'completed'` and broadcast the order to nearby couriers.
- **A4e Extract `order-dispatch.service.ts`.** Move `broadcastNewOrderToNearbyCouriers` (FCM + `find_nearby_couriers`) out of `orders.service.ts` into a standalone dispatch service that imports neither the orders nor payments service, so both `createOrder` (COD) and the payment-completion path (prepaid) can call it without a circular import.

Edge cases: failed/expired/never-paid prepaid orders stay dormant; the business retries via "Pay now" or cancels. Scheduled prepaid orders must be both due and paid before activation broadcasts (note for the scheduler; minimal change).

## Phase B — Business app (Next.js)

### B1 — `use-payment.ts` hook
Dynamically load Razorpay Checkout.js. `openCheckout({ providerOrderId, publishableKey, amount, prefill })` → on success POST `/payments/verify` with `{ orderId, providerPaymentId, signature, ... }` (align field names to the backend verify body) → returns verified status. Handle modal dismiss/failure without throwing.

### B2 — Wire prepaid into order creation + add pay-later affordances
- On create with `paymentMode === 'prepaid'`: create order → `/payments/create-order` → `openCheckout` → `/payments/verify`. On cancel/failure, leave the order as pending-payment (do not block creation).
- Add a **"Pay now / Retry payment"** action on the order detail and on unpaid prepaid rows in the orders list (now possible via A1).
- COD path unchanged (create order, done).

### B3 — Status display + field alignment
Show `paymentStatus` in the orders list (badge), refresh/poll payment status on the order detail after returning from checkout, and consume `providerOrderId`/`publishableKey` (not `razorpay*`).

### B4 — Types
Extend `PaymentStatus` with `cancelled` and `expired`; add badges. Remove the dead `paymentMethodId` from the create-order payload (backend ignores it).

## Phase C — Driver app (Flutter)

### C1 — COD proof-of-delivery gate UX
The backend rejects `submitProofOfDelivery` for COD until payment is `completed`. The delivery screen must detect this case and show a clear "Collect payment first — show the QR" prompt instead of a raw error toast.

### C2 — Handle `expired` QR status
The poller stops only on `completed`. Handle `expired` (from the backend QR-expiry sweep): stop polling, show "QR expired", and offer "Regenerate QR" (re-call `/payments/generate-qr`).

(No change needed for unpaid prepaid orders — the A4 gate ensures drivers never receive them.)

## Phase D — Types/docs cleanup
Folded into A3, B4, and C1/C2. Update `apps/*/.env.example` only if new config is required (Razorpay publishable key is returned by the API, so the business app needs no new env var; confirm during implementation).

## Data Model Changes
- `orders.requests.payment_status` — new enum/text column, default `'pending'`, maintained by the payment flows (A4c). Reuse the existing `payment_status` enum values (`pending|completed|failed|refunded|cancelled|expired`).

## Error Handling
- Checkout dismissal/failure → order remains pending-payment; user can retry; no data loss.
- `/payments/verify` failure → surfaced to the business with a retry path; order stays pending-payment.
- COD PoD-before-payment → backend 400 surfaced as a guided "collect first" prompt (C1), not a raw error.

## Verification
- Backend: tests for the availability gate (unpaid prepaid excluded; COD included; paid prepaid included), deferred + on-payment broadcast, idempotent create-order, and `payment_status` denormalization sync. Extend `tests/modules/payments.test.ts` / orders tests.
- Business: prepaid happy path (create → checkout → verify → order live), cancelled checkout (order pending-payment, pay-now works), list shows unpaid status.
- Driver: COD PoD gate prompt; expired-QR regenerate. `flutter analyze` clean.
- Manual: confirm an unpaid prepaid order does not appear in the driver available list and is not broadcast, then appears after payment.
