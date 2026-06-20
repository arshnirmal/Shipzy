# Payments Module Remediation & Pluggability — Design

Date: 2026-06-20
Status: Approved (design); pending implementation plan
Scope: `backend/src/modules/payments`, `orders.service`/`orders.queries` integration points, Razorpay provider, business + driver touchpoints unaffected except where API field names change.

## Context

An MVP payment module is already implemented across the backend, business portal, and driver app. It supports two modes — **Prepaid** (business pays via Razorpay Checkout at order creation) and **Collect-on-Delivery** (driver shows a single-use fixed-amount UPI QR, confirmed via webhook) — plus a driver earnings ledger and a daily RazorpayX batch payout.

A review found the structure sound (Strategy-pattern provider interface, paise conversion at the boundary, webhook + polling fallback, separate collection vs. payout providers) but surfaced critical money-safety/security defects, drift from the repo's mandated layering, and naming leaks that undermine the stated goal of making "any payment module easily integrable."

This document specifies the remediation. Backward compatibility is **not** required.

## Goals

1. Make money flows correct and safe (webhooks, idempotency, amount integrity, authorization).
2. Restore the mandated layering (`controller → service → repository → queries`).
3. Make the provider abstraction genuinely pluggable via capability interfaces + a registry.
4. Close missing pieces (refund wiring, payout reconciliation, QR expiry, config validation, tests).

## Non-Goals

- Adding a second payment provider now (the refactor only makes it cheap later).
- Card/net-banking, wallets, partial refunds, instant payouts (future phases).
- Changing the two payment modes or the daily-batch payout model.

## Findings Being Addressed

### Critical
- **C1 — Webhook signature broken.** HMAC is computed over `JSON.stringify(parsedBody)`; Razorpay signs raw request bytes. No raw-body plugin is registered despite `config.rawBody: true`.
- **C2 — Prepaid amount = 0.** Controller passes `amount: 0`; service never fetches the order total. Razorpay rejects sub-₹1 orders.
- **C3 — Broken object-level authorization (IDOR).** No ownership/assignment checks on `create-order`, `verify`, `generate-qr`, `order/:orderId/status`.
- **C4 — Webhook returns 200 on all errors.** Transient failures are never retried by Razorpay → lost confirmations; bad signatures are swallowed.
- **C5 — Racy idempotency.** Check-then-update across two queries with no transaction/lock; no event-id dedupe store.
- **C6 — No amount reconciliation.** Paid amount is never compared to the order amount before marking paid.

### High
- **A1 — Layering violation.** Service calls `drizzlePool.query` directly; no `payments.repository.ts`; raw SQL literal in `orders.service.ts`.
- **A2 — Payout double-pay risk.** Earnings settled after the payout call; no per-driver transaction, no "processing" lock, no scheduler lock, no async reconciliation.
- **A3 — Float money math.**
- **A4 — No tests for new endpoints.**

### Missing
- **M1 — Refund half-wired** (provider + type exist, no route/service path).
- **M2 — Expired QRs leak** (stay `pending` forever).
- **M3 — `.env.example` not updated; secrets default to `""` with no startup validation.**

## Target Architecture

### Layering (fixes A1)

Introduce `payments.repository.ts`. All DB access moves out of `payments.service.ts` into the repository; the inline order-amount SQL in `orders.service.ts` moves into `orders.queries.ts` and is called via the orders repository. Resulting flow:

```
routes → controller → service (orchestration + provider calls) → repository → queries → PostgreSQL
```

### Capability-split provider interfaces (fixes pluggability goal)

Replace the single `PaymentProvider` with focused capability interfaces:

```ts
interface CollectionProvider { createPaymentOrder; verifyPayment }
interface QRProvider         { generateQRCode }
interface RefundProvider     { initiateRefund }
interface PayoutProvider     { initiatePayout; batchPayout; getPayoutStatus }
interface WebhookProvider    { verifyAndParse(rawBody, headers): WebhookEvent }
```

A `ProviderRegistry` maps `providerName → { collection?, qr?, payout?, refund?, webhook? }`. `RazorpayProvider` registers under all five today. The service requests a capability by name; a provider missing that capability yields a typed `AppError` rather than a runtime crash. This removes the obligation for every gateway to implement payouts (RazorpayX is special; Stripe Connect differs entirely).

The existing `provider-factory.ts` is superseded by the registry. `getPaymentProvider`/`getPayoutProvider` are replaced by `registry.collection(name)` / `registry.payout(name)` style lookups.

### Provider-agnostic naming

- DB transactions store `provider` derived from `provider.name`, never the literal `"razorpay"`.
- API responses use `providerOrderId` and `publishableKey` instead of `razorpayOrderId` / `razorpayKeyId`. Business-portal hook and driver client update to the new field names (no back-compat required).
- Webhook route generalizes to `/webhook/:provider` → `registry.webhook(provider)`.

## Money-Safety & Idempotency

- **Raw-body verification (C1):** register `fastify-raw-body` (or a content-type parser that retains the raw buffer) and verify the HMAC over `request.rawBody`. The webhook route opts into raw-body capture.
- **`payment_webhook_events` table (C4/C5):** columns `(provider, event_id PK, event_type, status, payload jsonb, received_at, processed_at)`. Handler inserts `event_id` with `ON CONFLICT DO NOTHING`; a conflict means duplicate → ack 200 without reprocessing. All resulting state transitions run inside a single DB transaction using a guarded `UPDATE … WHERE status = 'pending' RETURNING …`.
- **Webhook status codes:** `200` only when processed or safely ignored; `400` on invalid signature; `5xx` on transient/processing errors so Razorpay retries. Idempotency makes retries safe.
- **Amount reconciliation (C6):** `verifyPayment` and the captured/credited webhook branches assert captured amount (paise) equals the stored transaction amount before marking paid; mismatch → flag + do not complete.
- **Server-side amount (C2):** `initiatePayment` reads the order total from the repository; the controller no longer accepts or passes an amount.
- **Integer paise (A3):** all internal money math in integer paise; rupee conversion only at the API boundary; commission computed in paise.

## Authorization, Payouts, Completeness

- **Ownership checks (C3):** service verifies the order belongs to the requesting business (prepaid create / verify / status) or is assigned to the requesting courier (generate-qr / status). Failure → typed `ForbiddenError` mapped to 403.
- **Payout safety (A2):**
  - Wrap each driver's payout in a DB transaction.
  - Mark that driver's earnings `processing` (with the new `payout_id`) **before** calling RazorpayX; only the `payout.processed` confirmation moves them to `settled`; `payout.failed` reverts to `pending` for retry.
  - Reconcile RazorpayX async status via a `payout.processed` / `payout.failed` webhook, with `getPayoutStatus` as a fallback sweep.
  - Take a Postgres advisory lock around the scheduler run so concurrent instances cannot double-pay.
- **Refund wiring (M1):** add `POST /payments/:transactionId/refund` (admin) → service → `RefundProvider`; record refund + emit/consume `refund.processed`.
- **Expired-QR reconciliation (M2):** a periodic sweep marks `pending` QR transactions past `qr_expires_at` as `expired`; driver app can regenerate.
- **Config/secrets (M3):** add all `RAZORPAY_*` and payment vars to `.env.example`; extend `env.ts` startup validation to require the Razorpay keys when `NODE_ENV !== "test"`.
- **Tests (A4):** webhook signature pass/fail, webhook idempotency (duplicate event id), amount-mismatch rejection, IDOR/ownership rejection, prepaid verify happy path, QR generate + credited happy path, payout double-run safety.

## Data Model Changes

- **New:** `payment_webhook_events (provider text, event_id text pk, event_type text, status text, payload jsonb, received_at timestamptz, processed_at timestamptz)`.
- **`transactions`:** ensure a `provider` column is populated from `provider.name`; add transaction `status` value `expired`. (`qr_code_id`, `qr_image_url`, `qr_expires_at` already added.)
- **`driver_earnings_ledger`:** add `processing` to the earnings status enum (alongside `pending`/`settled`/`failed`).
- **`driver_payouts`:** reconciled by payout webhook (`processing → completed/failed`).

## Error Handling

- All provider failures surface as typed `AppError`/`ForbiddenError`/`NotFoundError`; no raw Razorpay or SQL errors reach clients (per repo rules).
- Webhook handler distinguishes signature failures (400) from transient processing failures (5xx).
- Payout failures are logged, recorded on `driver_payouts.failure_reason`, and leave earnings recoverable.

## Phasing

- **Phase 0 — Critical money-safety/security:** C1 raw-body, C2 server-side amount, C3 ownership checks, C4/C5 webhook idempotency + status codes + `payment_webhook_events`, C6 amount reconciliation.
- **Phase 1 — Architecture:** `payments.repository.ts`; relocate all SQL into query files.
- **Phase 2 — Pluggability:** capability interfaces + `ProviderRegistry`; provider-agnostic naming in DB/API; `/webhook/:provider`. Update business + driver clients to new field names.
- **Phase 3 — Completeness:** payout reconciliation/locking + payout webhook, refund route, QR-expiry sweep, config validation, `.env.example`, test suite.

## Verification

- `cd backend && pnpm test` (no regressions) and a new `tests/modules/payments.test.ts` covering the cases listed under A4.
- `pnpm run lint` clean.
- Manual matrix: prepaid happy path / cancel-retry, COD QR happy path / expiry, duplicate webhook (single update), amount-mismatch webhook (rejected), IDOR attempt (403), payout scheduler double-run (no double pay), refund.
