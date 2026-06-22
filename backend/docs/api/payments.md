# Payments API

Base path: /api/v1/payments

Source of truth:

- [backend/src/modules/payments/payments.routes.ts](../../src/modules/payments/payments.routes.ts)
- [backend/src/modules/payments/payments.schema.ts](../../src/modules/payments/payments.schema.ts)
- [backend/src/modules/payments/payments.zod.ts](../../src/modules/payments/payments.zod.ts)

## Access Pattern

- All routes require authentication **except** `POST /webhook/:provider`, which is unauthenticated and verified via the provider's signature over the raw request body.
- Route-level authorization varies by action (see each endpoint).

## Frontend Setup

```bash
API_BASE_URL="http://localhost:3000/api/v1"
ACCESS_TOKEN="<jwt-access-token>"
```

Headers:

```text
Authorization: Bearer <access-token>
Content-Type: application/json
```

Success envelope:

```json
{
  "success": true,
  "message": "Human readable success message",
  "data": {},
  "timestamp": "2026-06-22T10:00:00.000Z"
}
```

Error envelope:

```json
{
  "success": false,
  "message": "Human readable error",
  "error": "Specific detail",
  "statusCode": 400
}
```

> **Provider-agnostic naming.** Responses use generic field names (`providerOrderId`, `publishableKey`) so the client is not coupled to a specific gateway. The **verify request body** still uses the `razorpay*` names because they are the fields the gateway's checkout widget returns to the client.

## Payment Modes

| Mode                  | Who pays            | When                          | Mechanism                                  |
| --------------------- | ------------------- | ----------------------------- | ------------------------------------------ |
| `prepaid`             | Business (upfront)  | Before the order goes live    | Gateway checkout (UPI), then server verify |
| `collect_on_delivery` | Recipient (on hand-off) | At delivery               | Driver shows a UPI QR; recipient pays      |

## Central Invariant — Dormant Until Paid

**A `prepaid` order is invisible to the driver fleet until its `payment_status` is `completed`.**

- `collect_on_delivery` orders are broadcast to nearby couriers immediately on creation and stay visible while `pending`.
- `prepaid` orders are created **dormant** — not broadcast — and only become visible to drivers once payment completes (verify success or `payment.captured` webhook). The denormalized `orders.requests.payment_status` column drives both the courier-availability gate and the `paymentStatus` field returned on orders.
- Consequence: drivers never receive an unpaid prepaid order, so no client-side handling of unpaid orders is required. The gate is entirely server-side.

---

## POST /payments/create-order

Business creates a gateway order for prepaid checkout. **Idempotent per order**: if a reusable `pending` transaction already exists for the order, the same `providerOrderId` is returned instead of creating a new one.

- Auth: `client`, `business`
- Success: `201 Created`

Request body:

```json
{
  "orderId": 123
}
```

Response `data`:

```json
{
  "providerOrderId": "order_Nxxxxxxxxxxxxx",
  "amount": 250.0,
  "currency": "INR",
  "publishableKey": "rzp_test_xxxxxxxx",
  "orderId": 123
}
```

Errors:

- `400` — order amount too small for online payment (minimum ₹1).
- `403` — caller does not own the order.
- `404` — order not found.

---

## POST /payments/verify

Business verifies a prepaid payment after the checkout widget succeeds. On success, the order's `payment_status` is set to `completed` and the order is broadcast to nearby couriers.

- Auth: `client`, `business`
- Success: `200 OK`

Request body:

```json
{
  "orderId": 123,
  "razorpayOrderId": "order_Nxxxxxxxxxxxxx",
  "razorpayPaymentId": "pay_Nxxxxxxxxxxxxx",
  "razorpaySignature": "<hmac-sha256-signature>"
}
```

Response `data`:

```json
{
  "verified": true,
  "transactionId": 456,
  "paymentStatus": "completed",
  "orderId": 123
}
```

Errors:

- `400` — signature verification failed / invalid payment.
- `403` — caller does not own the order.
- `404` — transaction or order not found.

---

## POST /payments/generate-qr

Driver generates a UPI QR for a `collect_on_delivery` order so the recipient can pay at delivery.

- Auth: `courier`
- Success: `201 Created`

Request body:

```json
{
  "orderId": 123
}
```

Response `data`:

```json
{
  "qrId": "qr_Nxxxxxxxxxxxxx",
  "imageUrl": "https://.../qr.png",
  "amount": 250.0,
  "expiresAt": "2026-06-22T10:30:00.000Z",
  "orderId": 123
}
```

Notes:

- QR codes expire. After `expiresAt`, the QR status becomes `expired`; regenerate by calling this endpoint again.

---

## GET /payments/order/:orderId/status

Poll the payment status for an order. Used by the driver app (collection polling) and the business app (after returning from checkout).

- Auth: `client`, `courier`, `business`, `admin`
- Success: `200 OK`

Response `data`:

```json
{
  "orderId": 123,
  "paymentMode": "collect_on_delivery",
  "paymentStatus": "pending",
  "amount": 250.0,
  "currency": "INR",
  "paymentMethod": "UPI",
  "transactionId": 456,
  "externalTransactionId": null,
  "paidAt": null,
  "qrCodeId": "qr_Nxxxxxxxxxxxxx",
  "qrImageUrl": "https://.../qr.png",
  "qrExpiresAt": "2026-06-22T10:30:00.000Z"
}
```

`paymentStatus` is one of: `pending`, `completed`, `failed`, `refunded`, `cancelled`, `expired`.

---

## POST /payments/webhook/:provider

Asynchronous gateway callback. **Unauthenticated** — verified via the provider's signature over the raw body. Idempotent: a previously-processed event id is acknowledged without re-applying side effects.

- Auth: none (signature-verified)
- `:provider` — e.g. `razorpay`
- Success: `200 OK` (always acknowledges so the gateway stops retrying)

Side effects by event (see [Webhook Events](#webhook-events)):

- `payment.captured` (prepaid) — completes the transaction, sets order `payment_status = completed`, broadcasts the order to nearby couriers (exactly once; de-duplicated against verify).
- `qr_code.credited` (COD) — completes the transaction, sets order `payment_status = completed` (no broadcast; COD orders are already visible).
- `payment.failed` — sets order `payment_status = failed`.
- `refund.processed`, `payout.processed`, `payout.failed` — update the corresponding refund/payout records.

---

## POST /payments/:transactionId/refund

Admin refunds a completed transaction. Sets the order's `payment_status` to `refunded`.

- Auth: `admin`
- Success: `200 OK`

Request body:

```json
{
  "reason": "Order cancelled by customer"
}
```

Response `data`:

```json
{
  "refundId": 12,
  "transactionId": 456,
  "amount": 250.0,
  "status": "completed"
}
```

---

## GET /payments/driver/earnings

Driver's earnings summary for a period.

- Auth: `courier`
- Query: `period` — `today` (default) | `week` | `month` | `all`
- Success: `200 OK`

Response `data`:

```json
{
  "period": "today",
  "totalDeliveries": 4,
  "grossEarnings": 1000.0,
  "totalCommission": 150.0,
  "netEarnings": 850.0,
  "pendingSettlement": 200.0,
  "entries": [
    {
      "ledgerId": 1,
      "orderId": 123,
      "grossAmount": 250.0,
      "commissionPct": 15.0,
      "commissionAmt": 37.5,
      "netAmount": 212.5,
      "status": "pending",
      "earnedAt": "2026-06-22T09:00:00.000Z"
    }
  ]
}
```

---

## GET /payments/driver/payouts

Driver's payout history (paginated).

- Auth: `courier`
- Query: `page` (default `1`), `limit` (default `20`, max `100`)
- Success: `200 OK`

Response `data`:

```json
{
  "payouts": [
    {
      "payoutId": 7,
      "totalDeliveries": 20,
      "grossAmount": 5000.0,
      "totalCommission": 750.0,
      "netAmount": 4250.0,
      "payoutMethod": "bank_transfer",
      "status": "completed",
      "payoutDate": "2026-06-21",
      "completedAt": "2026-06-21T18:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

## Flows

### Prepaid (pay-later)

1. Business creates the order with `paymentMode: "prepaid"`. The order is created **dormant** — not broadcast to drivers.
2. Business calls `POST /payments/create-order` → receives `providerOrderId` + `publishableKey`.
3. Business opens the gateway checkout widget; the recipient/business pays via UPI.
4. On widget success, the business calls `POST /payments/verify` with the `razorpay*` fields.
5. On verify success, the server sets `payment_status = completed` and **broadcasts** the order to nearby couriers. The order is now live.
6. If the business closes the widget or payment fails, the order stays pending-payment; the business retries via "Pay now" (which reuses the same `providerOrderId` thanks to idempotent create-order) or cancels.
7. The `payment.captured` webhook is the asynchronous backstop and performs the same completion + broadcast exactly once (de-duplicated against verify).

### Collect on delivery (COD)

1. Business creates the order with `paymentMode: "collect_on_delivery"`. The order is **broadcast immediately**.
2. A driver accepts and progresses the order to delivery.
3. At delivery the driver calls `POST /payments/generate-qr` and shows the QR.
4. The driver app polls `GET /payments/order/:orderId/status` until `completed` (or `expired` → regenerate).
5. The recipient pays; the `qr_code.credited` webhook sets `payment_status = completed`.
6. Proof-of-delivery for a COD order is gated on payment completion — the driver must collect payment before marking delivered.

## Webhook Events

| Provider event     | Internal status    | Effect                                                        |
| ------------------ | ------------------ | ------------------------------------------------------------- |
| `payment.captured` | `captured`         | Complete prepaid txn → order `completed` → broadcast to fleet |
| `payment.failed`   | `failed`           | Mark txn failed → order `payment_status = failed`             |
| `qr_code.credited` | `qr_credited`      | Complete COD txn → order `completed` (no broadcast)           |
| `refund.processed` | `refunded`         | Reconcile refund record                                       |
| `payout.processed` | `payout_processed` | Mark payout completed; settle processing earnings             |
| `payout.failed`    | `payout_failed`    | Mark payout failed                                            |
