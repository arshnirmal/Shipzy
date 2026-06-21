import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import {
  advanceOrderTo,
  createAssignment,
  createClient,
  createCourier,
  createOrder,
} from "../helpers/fixtures.js";
import orderDispatchService from "../../src/modules/orders/order-dispatch.service.js";

describe("Orders Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/orders/calculate-fare", () => {
    it("returns fare estimate for valid input", async () => {
      const client = await createClient(app);
      const staticDataResponse = await inject(app, {
        method: "GET",
        url: "/api/v1/static/create-order-data",
      });
      const staticData = staticDataResponse.json().data.createOrder;
      const deliveryType = staticData.deliveryTypes[0];
      const vehicle = deliveryType.supportedVehicles[0];
      const weightTier = vehicle.weightTiers[0];
      const packageType = staticData.packageTypes[0];

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/orders/calculate-fare",
        headers: authHeaders(client.accessToken),
        payload: {
          fulfillment: {
            deliveryTypeId: deliveryType.deliveryTypeId,
            vehicleCategoryId: vehicle.categoryId,
            weightTierId: weightTier.tierId,
            packageTypeId: packageType.packageTypeId,
          },
          locations: {
            pickup: { latitude: 12.9716, longitude: 77.5946 },
            delivery: { latitude: 12.9352, longitude: 77.6245 },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.pricing.totalPrice).toEqual(expect.any(Number));
    });

    it("requires authentication and validates fields", async () => {
      const noAuth = await inject(app, {
        method: "POST",
        url: "/api/v1/orders/calculate-fare",
        payload: {},
      });
      expect(noAuth.statusCode).toBe(401);

      const client = await createClient(app);
      const invalidPayload = await inject(app, {
        method: "POST",
        url: "/api/v1/orders/calculate-fare",
        headers: authHeaders(client.accessToken),
        payload: {},
      });
      expect([400, 422]).toContain(invalidPayload.statusCode);
    });
  });

  describe("POST /api/v1/orders", () => {
    it("creates pending order for client", async () => {
      const client = await createClient(app);
      const result = await createOrder(app, client.accessToken);

      expect(result.order.identifiers.orderId).toEqual(expect.any(Number));
      expect(result.order.status).toBe("pending");
    });

    it("forbids courier role and validates payload", async () => {
      const courier = await createCourier(app);

      const forbidden = await inject(app, {
        method: "POST",
        url: "/api/v1/orders",
        headers: authHeaders(courier.accessToken),
        payload: {},
      });
      expect(forbidden.statusCode).toBe(403);

      const client = await createClient(app);
      const invalid = await inject(app, {
        method: "POST",
        url: "/api/v1/orders",
        headers: authHeaders(client.accessToken),
        payload: {},
      });
      expect([400, 422]).toContain(invalid.statusCode);
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    it("allows owner client and assigned courier", async () => {
      const client = await createClient(app);
      const courier = await createCourier(app);
      const { order } = await createOrder(app, client.accessToken);
      await createAssignment(
        app,
        order.identifiers.orderId,
        courier.accessToken,
      );

      const clientView = await inject(app, {
        method: "GET",
        url: `/api/v1/orders/${order.identifiers.orderId}`,
        headers: authHeaders(client.accessToken),
      });
      expect(clientView.statusCode).toBe(200);

      const courierView = await inject(app, {
        method: "GET",
        url: `/api/v1/orders/${order.identifiers.orderId}`,
        headers: authHeaders(courier.accessToken),
      });
      expect(courierView.statusCode).toBe(200);
    });

    it("blocks other clients and returns 404 for unknown order", async () => {
      const owner = await createClient(app);
      const other = await createClient(app);
      const { order } = await createOrder(app, owner.accessToken);

      const forbidden = await inject(app, {
        method: "GET",
        url: `/api/v1/orders/${order.identifiers.orderId}`,
        headers: authHeaders(other.accessToken),
      });
      expect(forbidden.statusCode).toBe(403);

      const notFound = await inject(app, {
        method: "GET",
        url: "/api/v1/orders/999999",
        headers: authHeaders(owner.accessToken),
      });
      expect(notFound.statusCode).toBe(404);
    });
  });

  describe("GET /api/v1/orders", () => {
    it("returns paginated list with meta.pagination and filters", async () => {
      const client = await createClient(app);

      await createOrder(app, client.accessToken);
      await createOrder(app, client.accessToken);
      await createOrder(app, client.accessToken);

      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/orders?page=1&limit=2&status=active",
        headers: authHeaders(client.accessToken),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.pagination.page).toBe(1);
      expect(body.meta.pagination.limit).toBe(2);
      expect(body.meta.pagination.total).toBeGreaterThanOrEqual(3);
      expect(body.meta.pagination.totalPages).toBeGreaterThanOrEqual(2);

      const dateFrom = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const dateTo = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const dateFiltered = await inject(app, {
        method: "GET",
        url: `/api/v1/orders?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
        headers: authHeaders(client.accessToken),
      });
      expect(dateFiltered.statusCode).toBe(200);
    });

    it("returns 401 without authentication", async () => {
      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/orders",
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      if (Object.prototype.hasOwnProperty.call(body, "success")) {
        expect(body.success).toBe(false);
      }
      expect(
        typeof body.message === "string" || typeof body.error === "string",
      ).toBe(true);
    });
  });

  describe("GET /api/v1/orders/available", () => {
    it("returns empty when no nearby orders and returns orders within radius", async () => {
      const courier = await createCourier(app);
      const client = await createClient(app);

      const empty = await inject(app, {
        method: "GET",
        url: "/api/v1/orders/available?latitude=12.9716&longitude=77.5946&radius=10",
        headers: authHeaders(courier.accessToken),
      });
      expect(empty.statusCode).toBe(200);
      expect(Array.isArray(empty.json().data)).toBe(true);

      await createOrder(app, client.accessToken);

      const withOrders = await inject(app, {
        method: "GET",
        url: "/api/v1/orders/available?latitude=12.9716&longitude=77.5946&radius=20",
        headers: authHeaders(courier.accessToken),
      });

      expect(withOrders.statusCode).toBe(200);
      expect(withOrders.json().data.length).toBeGreaterThan(0);
    });

    it("forbids client role", async () => {
      const client = await createClient(app);
      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/orders/available?latitude=12.97&longitude=77.59",
        headers: authHeaders(client.accessToken),
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("POST /api/v1/orders/:id/accept", () => {
    it("accepts pending order and rejects already accepted order", async () => {
      const client = await createClient(app);
      const courier = await createCourier(app);
      const { order } = await createOrder(app, client.accessToken);

      const accepted = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${order.identifiers.orderId}/accept`,
        headers: authHeaders(courier.accessToken),
      });
      expect(accepted.statusCode).toBe(200);

      const secondAccept = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${order.identifiers.orderId}/accept`,
        headers: authHeaders(courier.accessToken),
      });
      expect([400, 409]).toContain(secondAccept.statusCode);
    });

    it("allows exactly one success in concurrent accept race", async () => {
      const client = await createClient(app);
      const courierA = await createCourier(app);
      const courierB = await createCourier(app);
      const { order } = await createOrder(app, client.accessToken);

      const [resultA, resultB] = await Promise.all([
        inject(app, {
          method: "POST",
          url: `/api/v1/orders/${order.identifiers.orderId}/accept`,
          headers: authHeaders(courierA.accessToken),
        }),
        inject(app, {
          method: "POST",
          url: `/api/v1/orders/${order.identifiers.orderId}/accept`,
          headers: authHeaders(courierB.accessToken),
        }),
      ]);

      const statuses = [resultA.statusCode, resultB.statusCode];
      const successCount = statuses.filter((status) => status === 200).length;
      const failureStatuses = statuses.filter((status) => status !== 200);

      expect(successCount).toBe(1);
      expect(failureStatuses.length).toBe(1);
      expect([400, 409]).toContain(failureStatuses[0]);
    });
  });

  describe("POST /api/v1/orders/:id/cancel", () => {
    it("cancels own pending and accepted orders", async () => {
      const client = await createClient(app);
      const courier = await createCourier(app);

      const pendingOrder = await createOrder(app, client.accessToken);
      const pendingCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${pendingOrder.order.identifiers.orderId}/cancel`,
        headers: authHeaders(client.accessToken),
        payload: { cancellation: { reason: "Changed my plan" } },
      });
      expect(pendingCancel.statusCode).toBe(200);

      const acceptedOrder = await createOrder(app, client.accessToken);
      await createAssignment(
        app,
        acceptedOrder.order.identifiers.orderId,
        courier.accessToken,
      );
      const acceptedCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${acceptedOrder.order.identifiers.orderId}/cancel`,
        headers: authHeaders(client.accessToken),
        payload: { cancellation: { reason: "No longer needed" } },
      });
      expect(acceptedCancel.statusCode).toBe(200);
    });

    it("rejects cancelling delivered/cancelled orders and foreign orders", async () => {
      const owner = await createClient(app);
      const other = await createClient(app);
      const courier = await createCourier(app);

      const delivered = await createOrder(app, owner.accessToken);
      await createAssignment(
        app,
        delivered.order.identifiers.orderId,
        courier.accessToken,
      );
      await advanceOrderTo(
        app,
        delivered.order.identifiers.orderId,
        courier.accessToken,
        "delivered",
      );

      const deliveredCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${delivered.order.identifiers.orderId}/cancel`,
        headers: authHeaders(owner.accessToken),
        payload: { cancellation: { reason: "Too late" } },
      });
      expect(deliveredCancel.statusCode).toBe(400);

      const toCancel = await createOrder(app, owner.accessToken);
      const firstCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${toCancel.order.identifiers.orderId}/cancel`,
        headers: authHeaders(owner.accessToken),
        payload: { cancellation: { reason: "Need to cancel" } },
      });
      expect(firstCancel.statusCode).toBe(200);

      const secondCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${toCancel.order.identifiers.orderId}/cancel`,
        headers: authHeaders(owner.accessToken),
        payload: { cancellation: { reason: "Again" } },
      });
      expect(secondCancel.statusCode).toBe(400);

      const foreignOrder = await createOrder(app, owner.accessToken);
      const foreignCancel = await inject(app, {
        method: "POST",
        url: `/api/v1/orders/${foreignOrder.order.identifiers.orderId}/cancel`,
        headers: authHeaders(other.accessToken),
        payload: { cancellation: { reason: "Not mine" } },
      });
      expect(foreignCancel.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/orders/:id/status", () => {
    it("supports valid courier transitions and rejects invalid transitions", async () => {
      const client = await createClient(app);
      const courier = await createCourier(app);
      const { order } = await createOrder(app, client.accessToken);

      await createAssignment(
        app,
        order.identifiers.orderId,
        courier.accessToken,
      );

      const pickedUp = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "picked_up" } },
      });
      expect(pickedUp.statusCode).toBe(200);

      const inTransit = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "in_transit" } },
      });
      expect(inTransit.statusCode).toBe(200);

      const delivered = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "delivered" } },
      });
      expect(delivered.statusCode).toBe(200);

      const backward = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "picked_up" } },
      });
      expect(backward.statusCode).toBe(400);

      const newOrder = await createOrder(app, client.accessToken);
      await createAssignment(
        app,
        newOrder.order.identifiers.orderId,
        courier.accessToken,
      );
      const skipped = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${newOrder.order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "delivered" } },
      });
      expect(skipped.statusCode).toBe(400);

      const invalidStatus = await inject(app, {
        method: "PATCH",
        url: `/api/v1/orders/${newOrder.order.identifiers.orderId}/status`,
        headers: authHeaders(courier.accessToken),
        payload: { transition: { status: "cancelled" } },
      });
      expect([400, 422]).toContain(invalidStatus.statusCode);
    });
  });

  it("returns standardized error shape for 4xx responses", async () => {
    const response = await inject(app, {
      method: "GET",
      url: "/api/v1/orders",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    if (Object.prototype.hasOwnProperty.call(body, "success")) {
      expect(body.success).toBe(false);
    }
    expect(
      typeof body.message === "string" || typeof body.error === "string",
    ).toBe(true);
  });

  describe("broadcast gating on payment mode", () => {
    it("does not broadcast a prepaid order at creation", async () => {
      const client = await createClient(app);
      const spy = jest
        .spyOn(orderDispatchService, "broadcastNewOrder")
        .mockResolvedValue(undefined);
      await createOrder(app, client.accessToken, { paymentMode: "prepaid" });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("broadcasts a collect_on_delivery order at creation", async () => {
      const client = await createClient(app);
      const spy = jest
        .spyOn(orderDispatchService, "broadcastNewOrder")
        .mockResolvedValue(undefined);
      await createOrder(app, client.accessToken, {
        paymentMode: "collect_on_delivery",
      });
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});
