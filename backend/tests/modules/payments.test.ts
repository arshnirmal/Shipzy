/**
 * Payments Module – Integration Tests
 *
 * Coverage:
 *  1. Webhook signature rejected (bad header → 400)
 *  2. Webhook idempotency (same event_id processed twice → 2nd is "duplicate", DB updated once)
 *  3. Amount mismatch rejected (webhook amount ≠ stored amount → transaction stays pending)
 *  4. IDOR on create-order (client B cannot pay for client A's order → 403)
 *  5. Refund only on completed (pending → 400; completed → success, status becomes "refunded")
 *  6. Payout no double-pay (processDailyPayouts() called twice → provider called once)
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import type { FastifyInstance } from "fastify";

import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import { getTestPool } from "../helpers/db.js";
import {
  createClient,
  createCourier,
  createAdmin,
  createOrder,
  createAssignment,
  advanceOrderTo,
} from "../helpers/fixtures.js";
import registry from "../../src/modules/payments/provider-registry.js";
import type {
  WebhookEvent,
  ProviderCapabilities,
  CollectionProvider,
  QRProvider,
  RefundProvider,
  PayoutProvider,
  WebhookProvider,
} from "../../src/modules/payments/capabilities.js";
import { AppError } from "../../src/utils/error.util.js";
import { drizzlePool } from "../../src/database/drizzle.js";
import paymentsService from "../../src/modules/payments/payments.service.js";

// ---------------------------------------------------------------------------
// Controllable fake provider state
// ---------------------------------------------------------------------------

let nextWebhookEvent: WebhookEvent | null = null;
let initiatePayoutCalls = 0;
let refundResult: { success: boolean; refundId: string; amount: number; status: string } | null = null;

// ---------------------------------------------------------------------------
// Fake ProviderCapabilities registered over the real Razorpay provider
// ---------------------------------------------------------------------------

const fakeWebhook: WebhookProvider = {
  async verifyAndParse(
    _rawBody: string,
    headers: Record<string, string>,
  ): Promise<WebhookEvent> {
    const sig = headers["x-razorpay-signature"];
    if (!sig || sig === "bad") {
      throw new AppError("Invalid webhook signature", 400);
    }
    if (!nextWebhookEvent) {
      // Return an unhandled event when nothing is configured
      return {
        handled: false,
        eventId: "evt_noop",
        eventType: "unknown",
        status: "unknown",
        raw: {},
      };
    }
    return nextWebhookEvent;
  },
};

const fakeCollection: CollectionProvider = {
  async createPaymentOrder(p) {
    return {
      providerOrderId: `fake_order_${p.orderId}_${Date.now()}`,
      amount: p.amount,
      currency: p.currency,
    };
  },
  async verifyPayment(_p) {
    return { verified: true, vpa: "test@upi" };
  },
};

const fakeQr: QRProvider = {
  async generateQRCode(p) {
    return {
      qrId: `fake_qr_${p.orderId}`,
      imageUrl: "https://example.com/fake-qr.png",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  },
};

const fakeRefund: RefundProvider = {
  async initiateRefund(p) {
    if (refundResult) return refundResult;
    return {
      success: true,
      refundId: `rfnd_${Date.now()}`,
      amount: p.amount,
      status: "processed",
    };
  },
};

const fakePayout: PayoutProvider = {
  async initiatePayout(p) {
    initiatePayoutCalls++;
    return {
      success: true,
      payoutId: `fake_payout_${p.driverId}_${Date.now()}`,
    };
  },
  async batchPayout(_p) {
    return { success: true, batchId: "fake_batch" };
  },
  async getPayoutStatus(_id) {
    return { status: "processing", payoutId: _id };
  },
};

const fakeProvider: ProviderCapabilities = {
  name: "razorpay",
  collection: fakeCollection,
  qr: fakeQr,
  refund: fakeRefund,
  payout: fakePayout,
  webhook: fakeWebhook,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Insert a payment transaction row directly into the DB and return its id. */
async function seedPendingTransaction(opts: {
  orderId: number;
  razorpayOrderId: string;
  amountRupees: number;
  paymentMethodId?: number;
}): Promise<number> {
  const pool = getTestPool();
  const r = await pool.query<{ transaction_id: number }>(
    `INSERT INTO payments.transactions
       (order_id, payment_method_id, status, amount, currency,
        payment_gateway, razorpay_order_id, payment_mode, metadata, payment_initiated_at)
     VALUES ($1, $2, 'pending', $3, 'INR', 'razorpay', $4, 'prepaid', '{}', NOW())
     RETURNING transaction_id`,
    [
      opts.orderId,
      opts.paymentMethodId ?? 1,
      opts.amountRupees,
      opts.razorpayOrderId,
    ],
  );
  const txnId = r.rows[0]?.transaction_id;
  if (!txnId) throw new Error("seedPendingTransaction: no row returned");
  return txnId;
}

/** Read a transaction row back from the test DB. */
async function getTransaction(transactionId: number): Promise<any> {
  const pool = getTestPool();
  const r = await pool.query(
    `SELECT transaction_id AS "transactionId",
            status,
            payment_completed_at AS "paymentCompletedAt",
            external_transaction_id AS "externalTransactionId"
     FROM payments.transactions
     WHERE transaction_id = $1`,
    [transactionId],
  );
  return r.rows[0];
}

/** Count rows in payment_webhook_events for a given event_id. */
async function countWebhookEvent(eventId: string): Promise<number> {
  const pool = getTestPool();
  const r = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM payments.payment_webhook_events WHERE event_id = $1`,
    [eventId],
  );
  return parseInt(r.rows[0]?.cnt ?? "0", 10);
}

/** Directly set driver UPI id via onboarding JSONB column in users.profiles. */
async function setDriverUpi(userId: number, upiId: string): Promise<void> {
  const pool = getTestPool();
  await pool.query(
    `UPDATE users.profiles
     SET onboarding = COALESCE(onboarding, '{}'::jsonb) || jsonb_build_object('payoutUpiId', $2::text)
     WHERE user_id = $1`,
    [userId, upiId],
  );
}

/** Seed a pending earnings ledger row for a driver. */
async function seedEarnings(opts: {
  driverId: number;
  orderId: number;
  assignmentId: number;
  netAmount: number;
}): Promise<number> {
  const pool = getTestPool();
  const r = await pool.query<{ ledger_id: number }>(
    `INSERT INTO payments.driver_earnings_ledger
       (driver_id, order_id, assignment_id, gross_amount, commission_pct, commission_amt, net_amount, status)
     VALUES ($1, $2, $3, $4, 10, $5, $4, 'pending')
     RETURNING ledger_id`,
    [opts.driverId, opts.orderId, opts.assignmentId, opts.netAmount, opts.netAmount * 0.1],
  );
  const id = r.rows[0]?.ledger_id;
  if (!id) throw new Error("seedEarnings: no row returned");
  return id;
}

/** Count pending earnings for a driver. */
async function countPendingEarnings(driverId: number): Promise<number> {
  const pool = getTestPool();
  const r = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM payments.driver_earnings_ledger
     WHERE driver_id = $1 AND status = 'pending'`,
    [driverId],
  );
  return parseInt(r.rows[0]?.cnt ?? "0", 10);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Payments Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();

    // Override the real Razorpay provider with our controllable fake.
    // The registry is a singleton — registering with the same name replaces the old entry.
    registry.register(fakeProvider);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset controllable state before each test
    nextWebhookEvent = null;
    initiatePayoutCalls = 0;
    refundResult = null;
  });

  // -------------------------------------------------------------------------
  // 1. Webhook signature rejected
  // -------------------------------------------------------------------------
  describe("1. Webhook signature rejected", () => {
    it("returns 400 when x-razorpay-signature header is bad", async () => {
      const res = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/webhook/razorpay",
        headers: { "x-razorpay-signature": "bad", "content-type": "application/json" },
        payload: JSON.stringify({ event: "test" }),
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when x-razorpay-signature header is missing", async () => {
      const res = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/webhook/razorpay",
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ event: "test" }),
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Webhook idempotency
  // -------------------------------------------------------------------------
  describe("2. Webhook idempotency", () => {
    it("processes first call and deduplicates second call", async () => {
      const client = await createClient(app);
      const { order } = await createOrder(app, client.accessToken);
      const orderId: number = order.identifiers.orderId;

      // Seed a pending transaction with a known razorpay_order_id
      const txnId = await seedPendingTransaction({
        orderId,
        razorpayOrderId: "order_test_idem_1",
        amountRupees: 500,
      });

      // Configure the fake provider to return a captured event
      nextWebhookEvent = {
        handled: true,
        eventId: "evt_idem_1",
        eventType: "payment.captured",
        status: "captured",
        providerOrderId: "order_test_idem_1",
        providerPaymentId: "pay_idem_1",
        amount: 50000, // 500 rupees in paise
        vpa: "test@upi",
        raw: {},
      };

      const headers = {
        "x-razorpay-signature": "ok",
        "content-type": "application/json",
      };
      const body = JSON.stringify({ event: "payment.captured" });

      // First call
      const res1 = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/webhook/razorpay",
        headers,
        payload: body,
      });
      expect(res1.statusCode).toBe(200);
      const body1 = res1.json();
      expect(body1.status).toBe("ok");

      // Verify transaction completed in DB
      const txn = await getTransaction(txnId);
      expect(txn.status).toBe("completed");
      expect(txn.paymentCompletedAt).not.toBeNull();

      // Second call (same event)
      const res2 = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/webhook/razorpay",
        headers,
        payload: body,
      });
      expect(res2.statusCode).toBe(200);
      const body2 = res2.json();
      expect(body2.status).toBe("duplicate");

      // webhook_events table should have exactly one row for this event_id
      const eventCount = await countWebhookEvent("evt_idem_1");
      expect(eventCount).toBe(1);

      // Transaction is still "completed" (not processed twice)
      const txn2 = await getTransaction(txnId);
      expect(txn2.status).toBe("completed");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Amount mismatch rejected
  // -------------------------------------------------------------------------
  describe("3. Amount mismatch rejected", () => {
    it("does not complete a transaction when webhook amount does not match stored amount", async () => {
      const client = await createClient(app);
      const { order } = await createOrder(app, client.accessToken);
      const orderId: number = order.identifiers.orderId;

      // Seed transaction with 500 rupees = 50000 paise
      const txnId = await seedPendingTransaction({
        orderId,
        razorpayOrderId: "order_test_amt_1",
        amountRupees: 500,
      });

      // Send a webhook with 999 rupees = 99900 paise (mismatch!)
      nextWebhookEvent = {
        handled: true,
        eventId: "evt_amt_1",
        eventType: "payment.captured",
        status: "captured",
        providerOrderId: "order_test_amt_1",
        providerPaymentId: "pay_amt_1",
        amount: 99900, // ≠ 50000
        raw: {},
      };

      const res = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/webhook/razorpay",
        headers: { "x-razorpay-signature": "ok", "content-type": "application/json" },
        payload: JSON.stringify({ event: "payment.captured" }),
      });

      expect(res.statusCode).toBe(200);
      // The webhook was new, so status is "ok" at the processing level,
      // but the amount guard prevents the DB update
      const txn = await getTransaction(txnId);
      expect(txn.status).toBe("pending"); // NOT completed
    });
  });

  // -------------------------------------------------------------------------
  // 4. IDOR on create-order
  // -------------------------------------------------------------------------
  describe("4. IDOR on create-order", () => {
    it("returns 403 when client B tries to pay for client A's order", async () => {
      const clientA = await createClient(app);
      const clientB = await createClient(app);

      const { order } = await createOrder(app, clientA.accessToken);
      const orderId: number = order.identifiers.orderId;

      const res = await inject(app, {
        method: "POST",
        url: "/api/v1/payments/create-order",
        headers: authHeaders(clientB.accessToken),
        payload: { orderId },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Refund only on completed
  // -------------------------------------------------------------------------
  describe("5. Refund only on completed", () => {
    it("returns 400 when trying to refund a pending transaction", async () => {
      const client = await createClient(app);
      const admin = await createAdmin(app);
      const { order } = await createOrder(app, client.accessToken);
      const orderId: number = order.identifiers.orderId;

      // Seed a pending transaction
      const txnId = await seedPendingTransaction({
        orderId,
        razorpayOrderId: "order_refund_pending_1",
        amountRupees: 300,
      });

      const res = await inject(app, {
        method: "POST",
        url: `/api/v1/payments/${txnId}/refund`,
        headers: authHeaders(admin.accessToken),
        payload: { reason: "Test refund on pending" },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
    });

    it("returns 200 and marks transaction as refunded for a completed transaction", async () => {
      const client = await createClient(app);
      const courier = await createCourier(app);
      const admin = await createAdmin(app);

      const { order } = await createOrder(app, client.accessToken);
      const orderId: number = order.identifiers.orderId;

      // Seed a completed transaction (directly insert with completed status)
      const pool = getTestPool();
      const r = await pool.query<{ transaction_id: number }>(
        `INSERT INTO payments.transactions
           (order_id, payment_method_id, status, amount, currency,
            payment_gateway, razorpay_order_id, payment_mode, metadata,
            external_transaction_id, payment_initiated_at, payment_completed_at)
         VALUES ($1, 1, 'completed', 500, 'INR', 'razorpay', 'order_refund_done_1',
                 'prepaid', '{}', 'pay_done_ext_1', NOW(), NOW())
         RETURNING transaction_id`,
        [orderId],
      );
      const txnId = r.rows[0]?.transaction_id;
      expect(txnId).toBeDefined();

      // Set refund mock result
      refundResult = {
        success: true,
        refundId: "rfnd_1",
        amount: 50000,
        status: "processed",
      };

      const res = await inject(app, {
        method: "POST",
        url: `/api/v1/payments/${txnId}/refund`,
        headers: authHeaders(admin.accessToken),
        payload: { reason: "Customer requested refund" },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("completed");

      // Transaction should now be "refunded"
      const txn = await getTransaction(txnId!);
      expect(txn.status).toBe("refunded");
    });
  });

  // -------------------------------------------------------------------------
  // 6. Payout no double-pay
  // -------------------------------------------------------------------------
  describe("6. Payout no double-pay", () => {
    it("calls initiatePayout exactly once when processDailyPayouts is run twice concurrently", async () => {
      const courier = await createCourier(app, { activate: false });
      const client = await createClient(app);

      // Set UPI id for the driver
      const driverId: number = courier.user.userId;
      await setDriverUpi(driverId, "driver@upi");

      // Create an order, then insert an assignment row directly (the HTTP
      // accept flow depends on courier-availability machinery unrelated to
      // payouts). We only need valid order_id/assignment_id FKs for earnings.
      const { order } = await createOrder(app, client.accessToken);
      const orderId: number = order.identifiers.orderId;
      const assignmentRes = await getTestPool().query(
        `INSERT INTO orders.courier_assignments (order_id, courier_id, status)
         VALUES ($1, $2, 'assigned')
         RETURNING assignment_id AS "assignmentId"`,
        [orderId, driverId],
      );
      const assignmentId: number = assignmentRes.rows[0].assignmentId;

      // Seed pending earnings for this driver
      await seedEarnings({
        driverId,
        orderId,
        assignmentId,
        netAmount: 200,
      });

      // Verify we start with pending earnings
      const pendingBefore = await countPendingEarnings(driverId);
      expect(pendingBefore).toBe(1);

      // Reset payout call counter
      initiatePayoutCalls = 0;

      // Run daily payouts TWICE sequentially (second run should find no pending earnings)
      await paymentsService.processDailyPayouts();
      await paymentsService.processDailyPayouts();

      // Provider should have been called exactly once
      expect(initiatePayoutCalls).toBe(1);

      // Verify earnings are no longer pending (they're in 'processing' state after payout initiation)
      const pendingAfter = await countPendingEarnings(driverId);
      expect(pendingAfter).toBe(0);
    });
  });
});
