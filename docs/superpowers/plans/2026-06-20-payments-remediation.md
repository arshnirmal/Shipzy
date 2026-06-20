# Payments Module Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Shipzy payments module correct, secure, and money-safe, restore the mandated layering, and turn the provider abstraction into a genuinely pluggable capability registry.

**Architecture:** Backend (Fastify + PostgreSQL/Drizzle). Phase 0 fixes critical money/security defects. Phase 1 adds a repository layer so the service stops touching the DB driver. Phase 2 splits the provider mega-interface into capability interfaces behind a registry. Phase 3 closes payout reconciliation, refunds, QR expiry, config validation, and adds tests.

**Tech Stack:** TypeScript (ESM), Fastify 4, `pg`/Drizzle, `razorpay` SDK, `fastify-raw-body`, Jest + Supertest, Zod.

**Reference spec:** `docs/superpowers/specs/2026-06-20-payments-remediation-design.md`

**Conventions to follow (from repo):**
- Layering: `routes → controller → service → repository → queries → PostgreSQL`. Services NEVER call `drizzlePool`/`drizzleDb` directly.
- SQL lives only in `src/database/queries/*.queries.ts`, parameterized (`$1,$2,…`).
- Errors are typed (`AppError`, `NotFoundError`, `ValidationError` from `src/utils/error.util.js`); use `new AppError(msg, 403)` for forbidden.
- Money internally in **integer paise**; convert to rupees only at the API boundary.
- Run after each task: `pnpm run lint` and the relevant `pnpm test`.

---

## File Structure

**Create:**
- `backend/src/modules/payments/payments.repository.ts` — all DB access for the module.
- `backend/src/modules/payments/provider-registry.ts` — capability registry (replaces `provider-factory.ts`).
- `backend/src/modules/payments/capabilities.ts` — capability interface definitions.
- `backend/tests/modules/payments.test.ts` — module test suite.
- `backend/src/database/queries/webhook-events.queries.ts` — webhook-event dedupe SQL (or extend `payments.queries.ts`).

**Modify:**
- `payments.service.ts`, `payments.controller.ts`, `payments.routes.ts`, `payments.zod.ts`, `payments.schema.ts`, `providers/razorpay.provider.ts`, `payout.scheduler.ts`, `payment-provider.interface.ts`.
- `src/database/queries/payments.queries.ts`, `src/database/queries/orders.queries.ts`.
- `src/database/schema/payments.ts`, `src/database/schema/public.ts`.
- `src/modules/orders/orders.service.ts`, `src/modules/orders/orders.repository.ts`.
- `src/config/env.ts`, `src/app.ts`, `.env.example`, `package.json`.

---

# PHASE 0 — Critical money-safety & security

### Task 0.1: Register raw-body capture for webhook signature (C1)

**Files:**
- Modify: `backend/package.json` (add dependency)
- Modify: `backend/src/app.ts`
- Modify: `backend/src/modules/payments/payments.routes.ts:22-33`
- Modify: `backend/src/modules/payments/payments.controller.ts:159-179`
- Modify: `backend/src/modules/payments/providers/razorpay.provider.ts:198-217`

- [ ] **Step 1: Install fastify-raw-body**

Run: `cd backend && pnpm add fastify-raw-body`
Expected: dependency added to `package.json`.

- [ ] **Step 2: Register the plugin globally with `global: false`** in `src/app.ts`, after helmet/rateLimit registration (around line 80), so only routes that opt in get a raw body:

```ts
import rawBody from "fastify-raw-body";

await app.register(rawBody, {
  field: "rawBody",
  global: false,
  encoding: "utf8",
  runFirst: true,
});
```

- [ ] **Step 3: Opt the webhook route into raw body** in `payments.routes.ts` — replace the `config.rawBody` hack with the plugin's per-route option:

```ts
fastify.post(
  "/webhook/:provider",
  { config: { rawBody: true } },
  asRouteHandler(paymentsController.handleWebhook.bind(paymentsController)),
);
```

(Generalize the path to `/webhook/:provider`; Razorpay's URL becomes `/api/v1/payments/webhook/razorpay`.)

- [ ] **Step 4: Pass `request.rawBody` to the service** in `payments.controller.ts handleWebhook`:

```ts
async handleWebhook(
  request: FastifyRequest<{ Params: { provider: string } }>,
  reply: FastifyReply,
) {
  try {
    const rawBody = (request as unknown as { rawBody?: string }).rawBody ?? "";
    const outcome = await paymentsService.processWebhook(
      request.params.provider,
      rawBody,
      request.headers as Record<string, string>,
    );
    return reply.status(outcome.statusCode).send({ status: outcome.status });
  } catch (error) {
    logger.error({ msg: "Webhook processing error", error: (error as Error).message });
    // Transient/processing failure → 5xx so the provider retries (idempotency makes this safe)
    return reply.status(500).send({ status: "error" });
  }
}
```

- [ ] **Step 5: Verify HMAC over the raw string** in `razorpay.provider.ts handleWebhook` — change the signature to accept the raw body string and verify against it directly (do NOT re-stringify):

```ts
async verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent> {
  const signature = headers["x-razorpay-signature"];
  if (!signature) throw new AppError("Missing X-Razorpay-Signature header", 400);

  const expected = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) throw new AppError("Invalid webhook signature", 400);

  const payload = JSON.parse(rawBody);
  // ... existing event mapping, returning the WebhookEvent shape (see Task 2.x) ...
}
```

(The full `verifyAndParse` body and `WebhookEvent` type are finalized in Phase 2 Task 2.3; for Phase 0 keep the existing `handleWebhook` name but switch it to read `rawBody`.)

- [ ] **Step 6: Run lint & build**

Run: `cd backend && pnpm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml backend/src/app.ts \
  backend/src/modules/payments/payments.routes.ts \
  backend/src/modules/payments/payments.controller.ts \
  backend/src/modules/payments/providers/razorpay.provider.ts
git commit -m "fix(payments): verify webhook signature over raw request body"
```

---

### Task 0.2: Fetch order amount server-side for prepaid (C2)

**Files:**
- Modify: `backend/src/database/queries/payments.queries.ts` (already has `GET_ORDER_AMOUNT`)
- Modify: `backend/src/modules/payments/payments.service.ts:25-74`
- Modify: `backend/src/modules/payments/payments.controller.ts:26-56`

- [ ] **Step 1: Drop the client-supplied amount.** In `payments.controller.ts createPaymentOrder`, call the service with only the orderId (the second/third args are removed):

```ts
const { orderId } = request.body;
const result = await paymentsService.initiatePayment(orderId, request.user!.userId);
```

- [ ] **Step 2: Resolve the amount inside the service** from the order, not the caller. Change `initiatePayment(orderId, businessUserId)` to read the order total via the repository (added in Phase 1; for Phase 0 read via the existing `GET_ORDER_AMOUNT` query through a temporary repository call or `paymentRepository.getOrderAmount(orderId)`). The amount must come from `orders.requests.pricing.totalPrice`:

```ts
async initiatePayment(orderId: number, businessUserId: number): Promise<PaymentOrderResponse> {
  const order = await paymentRepository.getOrderForPayment(orderId);
  if (!order) throw new NotFoundError("Order not found");
  // C3 ownership check added in Task 0.3
  const amountRupees = Number(order.totalPrice);
  const amountPaise = Math.round(amountRupees * 100);
  if (amountPaise < 100) throw new AppError("Order amount too small for online payment", 400);
  // ...create provider order with amountPaise...
}
```

- [ ] **Step 3: Verify** with a quick manual call (test DB) that a prepaid order produces a non-zero Razorpay order amount (mock provider in tests, Task 3.6). For now, `pnpm run lint`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/payments/payments.service.ts backend/src/modules/payments/payments.controller.ts
git commit -m "fix(payments): resolve prepaid amount from order server-side"
```

---

### Task 0.3: Ownership / assignment authorization checks (C3)

**Files:**
- Modify: `backend/src/database/queries/payments.queries.ts` (add ownership queries)
- Modify: `backend/src/modules/payments/payments.service.ts`
- Modify: `backend/src/modules/payments/payments.controller.ts` (pass `request.user`)

- [ ] **Step 1: Add ownership queries** to `payments.queries.ts`:

```ts
GET_ORDER_OWNER: `
  SELECT o.business_user_id AS "businessUserId"
  FROM orders.requests o
  WHERE o.order_id = $1
`,
GET_ORDER_ASSIGNED_COURIER: `
  SELECT a.courier_id AS "courierId"
  FROM orders.assignments a
  WHERE a.order_id = $1 AND a.status NOT IN ('cancelled')
  ORDER BY a.created_at DESC
  LIMIT 1
`,
```

(Confirm the exact owner column name in `orders.requests` — adjust `business_user_id` to the real column.)

- [ ] **Step 2: Enforce in the service.** Add private guards and call them at the top of each order-scoped method:

```ts
private async assertBusinessOwnsOrder(orderId: number, userId: number) {
  const ownerId = await paymentRepository.getOrderOwner(orderId);
  if (ownerId === null) throw new NotFoundError("Order not found");
  if (ownerId !== userId) throw new AppError("Not authorized for this order", 403);
}

private async assertCourierAssigned(orderId: number, userId: number) {
  const courierId = await paymentRepository.getAssignedCourier(orderId);
  if (courierId !== userId) throw new AppError("Not authorized for this order", 403);
}
```

- `initiatePayment` / `verifyPayment` / `getPaymentStatus` (business path) → `assertBusinessOwnsOrder`.
- `generateCollectionQR` → `assertCourierAssigned`.
- `getPaymentStatus` is called by multiple roles → accept the caller's `{ userId, role }` and branch: courier must be assigned, business must own, admin always allowed.

- [ ] **Step 3: Thread `request.user` through the controller** for every order-scoped handler (`createPaymentOrder`, `verifyPayment`, `generateQR`, `getPaymentStatus`).

- [ ] **Step 4: Lint**

Run: `cd backend && pnpm run lint`

- [ ] **Step 5: Commit**

```bash
git add backend/src/database/queries/payments.queries.ts backend/src/modules/payments/payments.service.ts backend/src/modules/payments/payments.controller.ts
git commit -m "fix(payments): enforce order ownership/assignment on payment endpoints"
```

---

### Task 0.4: Webhook idempotency + amount reconciliation + status codes (C4/C5/C6)

**Files:**
- Modify: `backend/src/database/schema/public.ts` (add `expired` to payment status enum if needed)
- Modify: `backend/src/database/schema/payments.ts` (new `payment_webhook_events` table)
- Create: `backend/src/database/queries/webhook-events.queries.ts`
- Modify: `backend/src/modules/payments/payments.service.ts:281-363`

- [ ] **Step 1: Add the `payment_webhook_events` table** to `schema/payments.ts`:

```ts
export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    provider: varchar("provider", { length: 50 }).notNull(),
    eventId: varchar("event_id", { length: 255 }).primaryKey(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("received"),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  { schema: "payments" },
);
```

- [ ] **Step 2: Generate & apply the migration**

Run: `cd backend && pnpm run db:generate && pnpm run db:deploy`
Expected: new table created in the test/dev DB.

- [ ] **Step 3: Add dedupe queries** in `webhook-events.queries.ts`:

```ts
export default {
  INSERT_EVENT_IF_NEW: `
    INSERT INTO payments.payment_webhook_events (provider, event_id, event_type, payload, status)
    VALUES ($1, $2, $3, $4, 'received')
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id AS "eventId"
  `,
  MARK_EVENT_PROCESSED: `
    UPDATE payments.payment_webhook_events
    SET status = 'processed', processed_at = NOW()
    WHERE event_id = $1
  `,
};
```

- [ ] **Step 4: Make the state transition guarded and atomic.** Replace the check-then-update pairs with a single guarded UPDATE in `payments.queries.ts`:

```ts
COMPLETE_TXN_IF_PENDING: `
  UPDATE payments.transactions
  SET status = 'completed',
      external_transaction_id = $2,
      upi_vpa = COALESCE($3, upi_vpa),
      payment_completed_at = NOW()
  WHERE transaction_id = $1
    AND status = 'pending'
    AND amount = $4
  RETURNING transaction_id AS "transactionId"
`,
```

The `AND amount = $4` clause is the amount reconciliation (C6): the caller passes the webhook's amount converted to the same units stored on the row; a mismatch updates zero rows → not completed.

- [ ] **Step 5: Rewrite `processWebhook`** to: (a) verify+parse via provider, (b) dedupe by event id, (c) run the guarded update in a transaction, (d) return `{ statusCode, status }`:

```ts
async processWebhook(provider: string, rawBody: string, headers: Record<string, string>):
  Promise<{ statusCode: number; status: string }> {
  const event = await registry.webhook(provider).verifyAndParse(rawBody, headers); // throws AppError(400) on bad sig
  if (!event.handled) return { statusCode: 200, status: "ignored" };

  const isNew = await paymentRepository.insertWebhookEventIfNew(provider, event);
  if (!isNew) return { statusCode: 200, status: "duplicate" };

  await paymentRepository.applyWebhookEvent(event); // wraps guarded update in a tx; throws on transient DB error → controller returns 5xx
  await paymentRepository.markWebhookProcessed(event.eventId);
  return { statusCode: 200, status: "ok" };
}
```

(Note: `event.eventId` comes from the provider payload's top-level `id`/`event_id`. Add it to the `WebhookEvent` type in Phase 2; for Phase 0 derive it from the parsed payload.)

- [ ] **Step 6: Lint**

Run: `cd backend && pnpm run lint`

- [ ] **Step 7: Commit**

```bash
git add backend/src/database/schema/payments.ts backend/src/database/schema/public.ts \
  backend/src/database/queries/webhook-events.queries.ts backend/src/database/queries/payments.queries.ts \
  backend/src/modules/payments/payments.service.ts backend/drizzle*
git commit -m "fix(payments): idempotent webhook handling with amount reconciliation"
```

---

# PHASE 1 — Repository layer (A1)

### Task 1.1: Create `payments.repository.ts` and move all DB access out of the service

**Files:**
- Create: `backend/src/modules/payments/payments.repository.ts`
- Modify: `backend/src/modules/payments/payments.service.ts` (replace every `drizzlePool.query` with a repository call)

- [ ] **Step 1: Scaffold the repository** mirroring `orders.repository.ts` (class, `drizzlePool.query(queries.X, [...])`, typed returns, logging). One method per current query the service uses, e.g.:

```ts
import { drizzlePool } from "../../database/drizzle.js";
import paymentQueries from "../../database/queries/payments.queries.js";
import webhookQueries from "../../database/queries/webhook-events.queries.js";
import { rawTransaction } from "../../database/transaction.js";

class PaymentsRepository {
  async getOrderForPayment(orderId: number) {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_AMOUNT, [orderId]);
    return r.rows[0] ? { totalPrice: r.rows[0].totalPrice } : null;
  }
  async getOrderOwner(orderId: number): Promise<number | null> {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_OWNER, [orderId]);
    return r.rows[0]?.businessUserId ?? null;
  }
  async getAssignedCourier(orderId: number): Promise<number | null> {
    const r = await drizzlePool.query(paymentQueries.GET_ORDER_ASSIGNED_COURIER, [orderId]);
    return r.rows[0]?.courierId ?? null;
  }
  async insertWebhookEventIfNew(provider: string, event: WebhookEvent): Promise<boolean> {
    const r = await drizzlePool.query(webhookQueries.INSERT_EVENT_IF_NEW,
      [provider, event.eventId, event.eventType, JSON.stringify(event.raw)]);
    return r.rows.length > 0;
  }
  async applyWebhookEvent(event: WebhookEvent): Promise<void> {
    await rawTransaction(async (client) => {
      // guarded COMPLETE_TXN_IF_PENDING / MARK_PAYMENT_FAILED depending on event.status
    });
  }
  // ...one method per remaining service query (createTransaction, getByOrder, getByQr,
  //    getByProviderOrder, updateQrDetails, earnings, payouts, settle, etc.)...
}
export default new PaymentsRepository();
```

- [ ] **Step 2: Replace service DB calls.** In `payments.service.ts`, remove the `drizzlePool` and `paymentQueries` imports and route every data access through `paymentRepository`. The service should import only `paymentRepository`, `registry`, `config`, `logger`, errors, and zod types.

- [ ] **Step 3: Move the inline SQL out of orders.service.** In `orders.service.ts:618-640`, replace the inline `drizzlePool.query("SELECT (pricing->>'totalPrice')…")` with `ordersRepository.getOrderGrossAmount(orderId)`; add that method to `orders.repository.ts` and the SQL to `orders.queries.ts`.

- [ ] **Step 4: Grep to confirm no DB driver usage remains in services**

Run: `cd backend && grep -rn "drizzlePool\|drizzleDb" src/modules/payments/payments.service.ts src/modules/orders/orders.service.ts`
Expected: no matches.

- [ ] **Step 5: Lint**

Run: `cd backend && pnpm run lint`

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/payments/payments.repository.ts backend/src/modules/payments/payments.service.ts \
  backend/src/modules/orders/orders.service.ts backend/src/modules/orders/orders.repository.ts \
  backend/src/database/queries/orders.queries.ts
git commit -m "refactor(payments): introduce repository layer, remove direct DB access from services"
```

---

# PHASE 2 — Pluggable capability registry

### Task 2.1: Define capability interfaces

**Files:**
- Create: `backend/src/modules/payments/capabilities.ts`
- Modify: `backend/src/modules/payments/payment-provider.interface.ts` (keep param/result types; remove the monolithic `PaymentProvider`)

- [ ] **Step 1: Write `capabilities.ts`** reusing the existing param/result types:

```ts
import type {
  CreatePaymentOrderParams, PaymentOrderResult,
  VerifyPaymentParams, PaymentVerificationResult,
  GenerateQRParams, QRCodeResult,
  RefundParams, RefundResult,
  PayoutParams, PayoutResult, BatchPayoutParams, BatchPayoutResult, PayoutStatusResult,
} from "./payment-provider.interface.js";

export interface WebhookEvent {
  handled: boolean;
  eventId: string;
  eventType: string;
  status: "captured" | "failed" | "refunded" | "qr_credited" | "payout_processed" | "payout_failed";
  providerOrderId?: string;
  providerPaymentId?: string;
  qrCodeId?: string;
  providerPayoutId?: string;
  amount?: number; // paise
  vpa?: string;
  raw: unknown;
}

export interface CollectionProvider {
  createPaymentOrder(p: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(p: VerifyPaymentParams): Promise<PaymentVerificationResult>;
}
export interface QRProvider { generateQRCode(p: GenerateQRParams): Promise<QRCodeResult>; }
export interface RefundProvider { initiateRefund(p: RefundParams): Promise<RefundResult>; }
export interface PayoutProvider {
  initiatePayout(p: PayoutParams): Promise<PayoutResult>;
  batchPayout(p: BatchPayoutParams): Promise<BatchPayoutResult>;
  getPayoutStatus(id: string): Promise<PayoutStatusResult>;
}
export interface WebhookProvider {
  verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent>;
}

export interface ProviderCapabilities {
  readonly name: string;
  collection?: CollectionProvider;
  qr?: QRProvider;
  refund?: RefundProvider;
  payout?: PayoutProvider;
  webhook?: WebhookProvider;
}
```

- [ ] **Step 2: Lint & commit**

```bash
git add backend/src/modules/payments/capabilities.ts backend/src/modules/payments/payment-provider.interface.ts
git commit -m "feat(payments): define capability interfaces"
```

---

### Task 2.2: Build the provider registry (replaces provider-factory)

**Files:**
- Create: `backend/src/modules/payments/provider-registry.ts`
- Delete: `backend/src/modules/payments/provider-factory.ts`

- [ ] **Step 1: Write the registry** with typed-capability lookups that throw when a provider lacks a capability:

```ts
import { AppError } from "../../utils/error.util.js";
import type { ProviderCapabilities, CollectionProvider, QRProvider, RefundProvider, PayoutProvider, WebhookProvider } from "./capabilities.js";
import { razorpayProvider } from "./providers/razorpay.provider.js";

class ProviderRegistry {
  private providers = new Map<string, ProviderCapabilities>();
  register(p: ProviderCapabilities) { this.providers.set(p.name, p); }
  private get(name: string): ProviderCapabilities {
    const p = this.providers.get(name);
    if (!p) throw new AppError(`Unknown payment provider: ${name}`, 400);
    return p;
  }
  collection(name = "razorpay"): CollectionProvider { return this.require(name, "collection"); }
  qr(name = "razorpay"): QRProvider { return this.require(name, "qr"); }
  refund(name = "razorpay"): RefundProvider { return this.require(name, "refund"); }
  payout(name = "razorpay"): PayoutProvider { return this.require(name, "payout"); }
  webhook(name: string): WebhookProvider { return this.require(name, "webhook"); }
  private require<K extends keyof ProviderCapabilities>(name: string, cap: K) {
    const c = this.get(name)[cap];
    if (!c) throw new AppError(`Provider ${name} does not support ${String(cap)}`, 400);
    return c as NonNullable<ProviderCapabilities[K]>;
  }
}
export const registry = new ProviderRegistry();
registry.register(razorpayProvider);
export default registry;
```

- [ ] **Step 2: Update the service** to use `registry.collection()`, `registry.qr()`, `registry.payout()`, `registry.webhook(provider)` instead of `getPaymentProvider`/`getPayoutProvider`. Delete `provider-factory.ts`.

- [ ] **Step 3: Lint & commit**

```bash
git rm backend/src/modules/payments/provider-factory.ts
git add backend/src/modules/payments/provider-registry.ts backend/src/modules/payments/payments.service.ts
git commit -m "feat(payments): provider registry with capability lookups"
```

---

### Task 2.3: Make RazorpayProvider a capability bundle + agnostic naming

**Files:**
- Modify: `backend/src/modules/payments/providers/razorpay.provider.ts`
- Modify: `backend/src/modules/payments/payments.zod.ts` (rename response fields)
- Modify: `backend/src/modules/payments/payments.service.ts` (store `provider.name`, return agnostic fields)
- Modify: `apps/business/src/hooks/use-payment.ts` (or wherever `razorpayOrderId`/`razorpayKeyId` are consumed)

- [ ] **Step 1: Restructure the Razorpay class** to expose grouped capabilities and export a `ProviderCapabilities` object:

```ts
export const razorpayProvider: ProviderCapabilities = {
  name: "razorpay",
  collection: { createPaymentOrder, verifyPayment },
  qr: { generateQRCode },
  refund: { initiateRefund },
  payout: { initiatePayout, batchPayout, getPayoutStatus },
  webhook: { verifyAndParse },
};
```

`verifyAndParse` returns the `WebhookEvent` shape (including `eventId` from payload top-level `id`, and `payout.processed`/`payout.failed` mapping).

- [ ] **Step 2: Rename response fields** in `payments.zod.ts`: `razorpayOrderId → providerOrderId`, `razorpayKeyId → publishableKey`. Update `payments.schema.ts` (types are inferred, so just the zod change).

- [ ] **Step 3: Service stores provider name** from the capability object (`registry.collection().name` is not available; pass the provider name explicitly, default `"razorpay"`) into the transaction `provider` column, and returns `providerOrderId`/`publishableKey`.

- [ ] **Step 4: Update the business client** to read `data.providerOrderId` and `data.publishableKey`. Grep first:

Run: `grep -rn "razorpayOrderId\|razorpayKeyId" apps/business/src`
Then update each hit.

- [ ] **Step 5: Lint (backend) + analyze (business)**

Run: `cd backend && pnpm run lint` and `cd apps/business && pnpm run lint`

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/payments/providers/razorpay.provider.ts backend/src/modules/payments/payments.zod.ts \
  backend/src/modules/payments/payments.service.ts apps/business/src
git commit -m "refactor(payments): provider-agnostic field names and capability-bundled Razorpay"
```

---

# PHASE 3 — Completeness

### Task 3.1: Payout safety — processing lock + per-driver transaction (A2)

**Files:**
- Modify: `backend/src/database/queries/payments.queries.ts`
- Modify: `backend/src/modules/payments/payments.repository.ts`
- Modify: `backend/src/modules/payments/payments.service.ts:495-591`

- [ ] **Step 1: Add a "mark processing before payout" query** so a crash never re-pays:

```ts
MARK_EARNINGS_PROCESSING: `
  UPDATE payments.driver_earnings_ledger
  SET status = 'processing', payout_id = $2
  WHERE driver_id = $1 AND status = 'pending'
  RETURNING ledger_id AS "ledgerId"
`,
SETTLE_PROCESSING_EARNINGS: `
  UPDATE payments.driver_earnings_ledger
  SET status = 'settled'
  WHERE payout_id = $1 AND status = 'processing'
`,
REVERT_PROCESSING_EARNINGS: `
  UPDATE payments.driver_earnings_ledger
  SET status = 'pending', payout_id = NULL
  WHERE payout_id = $1 AND status = 'processing'
`,
```

(Add `processing` to `earningsStatusEnum` in `public.ts`; generate+deploy migration.)

- [ ] **Step 2: Reorder `processDailyPayouts`** per driver, inside a transaction: create payout record → `MARK_EARNINGS_PROCESSING` → call provider → on success leave as `processing` (settled later by payout webhook); on immediate failure `REVERT_PROCESSING_EARNINGS` and mark payout `failed`.

- [ ] **Step 3: Add a Postgres advisory lock** around the whole run so two instances can't double-pay:

```ts
async processDailyPayouts() {
  await rawTransaction(async (client) => {
    const got = await client.query("SELECT pg_try_advisory_xact_lock(91823) AS locked");
    if (!got.rows[0].locked) { logger.warn({ msg: "Payout run already in progress" }); return; }
    // ...run payouts inside the same advisory-locked tx scope or release+process...
  });
}
```

- [ ] **Step 4: Lint & commit**

```bash
git add backend/src/database/queries/payments.queries.ts backend/src/modules/payments/payments.repository.ts \
  backend/src/modules/payments/payments.service.ts backend/src/database/schema/public.ts backend/drizzle*
git commit -m "fix(payments): crash-safe payouts with processing lock and advisory lock"
```

---

### Task 3.2: Payout reconciliation webhook (A2)

**Files:**
- Modify: `backend/src/modules/payments/providers/razorpay.provider.ts` (`verifyAndParse` payout events)
- Modify: `backend/src/modules/payments/payments.repository.ts` (apply payout events)
- Modify: `backend/src/modules/payments/payments.service.ts` (`applyWebhookEvent` payout branches)

- [ ] **Step 1: Map `payout.processed`/`payout.failed`** in `verifyAndParse` to `WebhookEvent` with `providerPayoutId` and `status`.
- [ ] **Step 2: Handle them** in `applyWebhookEvent`: processed → `driver_payouts.status='completed'` + `SETTLE_PROCESSING_EARNINGS`; failed → `status='failed'` + `REVERT_PROCESSING_EARNINGS` + record `failure_reason`. Add the matching queries.
- [ ] **Step 3: Lint & commit**

```bash
git commit -am "feat(payments): reconcile RazorpayX payout webhooks"
```

---

### Task 3.3: Refund endpoint (M1)

**Files:**
- Modify: `payments.routes.ts`, `payments.controller.ts`, `payments.service.ts`, `payments.schema.ts`, `payments.queries.ts`, `payments.repository.ts`

- [ ] **Step 1: Add the route** (admin only):

```ts
fastify.post("/:transactionId/refund",
  { schema: refundSchema, preHandler: [authorize("admin")] },
  asRouteHandler(paymentsController.refund.bind(paymentsController)));
```

- [ ] **Step 2: Controller `refund`** reads `transactionId` param + `reason` body, calls `paymentsService.refund(transactionId, reason)`.
- [ ] **Step 3: Service `refund`** loads the transaction (must be `completed`), calls `registry.refund().initiateRefund({ providerPaymentId, amount, reason })`, inserts a `refunds` row, returns `RefundResponse`.
- [ ] **Step 4: Add `refundSchema`** to `payments.schema.ts` using existing `RefundRequestZ`/`RefundResponseZ`/`PaymentParamsZ`.
- [ ] **Step 5: Lint & commit**

```bash
git commit -am "feat(payments): wire admin refund endpoint"
```

---

### Task 3.4: Expired-QR reconciliation (M2)

**Files:**
- Modify: `public.ts` (add `expired` to `paymentStatusEnum` if absent), `payments.queries.ts`, `payout.scheduler.ts` (or a small sweep interval)

- [ ] **Step 1: Add query** `EXPIRE_STALE_QR_TXNS`:

```ts
EXPIRE_STALE_QR_TXNS: `
  UPDATE payments.transactions
  SET status = 'expired'
  WHERE status = 'pending' AND qr_code_id IS NOT NULL
    AND qr_expires_at IS NOT NULL AND qr_expires_at < NOW()
  RETURNING transaction_id AS "transactionId"
`,
```

- [ ] **Step 2: Run it** on a 5-minute interval (reuse the scheduler) via `paymentsService.expireStaleQRs()` → repository. Lint & commit.

```bash
git commit -am "feat(payments): expire stale collect-on-delivery QRs"
```

---

### Task 3.5: Config validation + `.env.example` (M3)

**Files:**
- Modify: `backend/src/config/env.ts:130-160`, `backend/.env.example`

- [ ] **Step 1: Require Razorpay keys outside tests.** After the existing `requiredEnvVars` block:

```ts
if (process.env.NODE_ENV !== "test") {
  const missingPay = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]
    .filter((v) => !process.env[v]);
  if (missingPay.length) {
    throw new Error(`Missing required payment env vars: ${missingPay.join(", ")}`);
  }
}
```

- [ ] **Step 2: Add to `.env.example`** (no real values):

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_ACCOUNT_NUMBER=
DRIVER_COMMISSION_PCT=15
PAYOUT_SCHEDULE_HOUR=23
QR_EXPIRY_MINUTES=30
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/config/env.ts backend/.env.example
git commit -m "chore(payments): validate Razorpay config and document env vars"
```

---

### Task 3.6: Test suite (A4)

**Files:**
- Create: `backend/tests/modules/payments.test.ts`
- Add script to `package.json`: `"test:payments": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.config.cjs tests/modules/payments.test.ts --verbose"`

The Razorpay provider must be mocked so no real API calls happen. Mock the registry's razorpay capability bundle.

- [ ] **Step 1: Write failing test — webhook signature rejected**

```ts
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject } from "../helpers/app.js";

describe("Payments Module", () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildTestApp(); });
  afterAll(async () => { await app.close(); });

  it("rejects a webhook with an invalid signature", async () => {
    const res = await inject(app, {
      method: "POST",
      url: "/api/v1/payments/webhook/razorpay",
      headers: { "x-razorpay-signature": "bad", "content-type": "application/json" },
      payload: JSON.stringify({ event: "payment.captured", id: "evt_test_1" }),
    });
    // Controller maps signature failure → 5xx (provider threw AppError 400 → not "ok")
    expect([400, 500]).toContain(res.statusCode);
  });
});
```

- [ ] **Step 2: Run — verify it fails** (route/wiring not ready):

Run: `cd backend && pnpm run test:payments`
Expected: FAIL initially, PASS once Phase 0 wiring is in.

- [ ] **Step 3: Add idempotency test** — with a mocked provider returning a valid `WebhookEvent` and a known `eventId`, POST the same event twice; assert the transaction is completed exactly once (second call returns `duplicate`). Insert a seeded pending transaction in a `beforeEach`.

- [ ] **Step 4: Add amount-mismatch test** — webhook event amount ≠ transaction amount → transaction stays `pending`.

- [ ] **Step 5: Add IDOR test** — business A creates an order; business B calls `/payments/create-order` for A's order → `403`.

- [ ] **Step 6: Add prepaid-verify happy path** — mocked `verifyPayment` returns `verified:true`; `/payments/verify` marks the txn `completed`.

- [ ] **Step 7: Add payout double-run test** — call `processDailyPayouts()` twice; assert the provider's `initiatePayout` mock is called once per driver (advisory lock / processing guard prevents the second).

- [ ] **Step 8: Run full suite**

Run: `cd backend && pnpm test`
Expected: all pass, no regressions.

- [ ] **Step 9: Commit**

```bash
git add backend/tests/modules/payments.test.ts backend/package.json
git commit -m "test(payments): webhook, idempotency, authz, verify, payout coverage"
```

---

## Self-Review Notes

- **Spec coverage:** C1→0.1, C2→0.2, C3→0.3, C4/C5/C6→0.4, A1→1.1, capability split/agnostic naming→2.1–2.3, A2→3.1/3.2, M1→3.3, M2→3.4, M3→3.5, A3 (integer paise) enforced in 0.2/0.4 amount handling, A4→3.6. All spec sections mapped.
- **Type consistency:** `WebhookEvent` defined once in `capabilities.ts` (Task 2.1) and referenced by repository/service/provider; `providerOrderId`/`publishableKey` introduced in 2.3 and consumed by the business client in the same task.
- **Ordering caveat:** Phase 0 references repository methods finalized in Phase 1 and `WebhookEvent`/`registry` finalized in Phase 2. If executing strictly Phase 0 first, use the existing `getPaymentProvider`/`drizzlePool` temporarily and refactor in Phases 1–2; otherwise execute 2.1–2.2 (interfaces + registry) before 0.4. Recommended execution order: 2.1, 2.2, 0.1, 0.2, 0.3, 0.4, 1.1, 2.3, then Phase 3.
- **Verify column names** (`business_user_id`, `pricing->>'totalPrice'`, assignment table/columns) against the actual schema before writing the queries — adjust to real names.
