import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import {
  advanceOrderTo,
  createAssignment,
  createClient,
  createCourier,
  createOrder,
  createRating,
} from "../helpers/fixtures.js";

describe("Ratings Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates rating for delivered order and updates courier stats", async () => {
    const client = await createClient(app);
    const courier = await createCourier(app);
    const { order } = await createOrder(app, client.accessToken);

    await createAssignment(app, order.identifiers.orderId, courier.accessToken);
    await advanceOrderTo(
      app,
      order.identifiers.orderId,
      courier.accessToken,
      "delivered",
    );

    const created = await createRating(
      app,
      order.identifiers.orderId,
      client.accessToken,
      5,
    );
    expect(created.rating.rating).toBe(5);

    const statsByCourier = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me/rating",
      headers: authHeaders(courier.accessToken),
    });

    expect(statsByCourier.statusCode).toBe(200);
    expect(
      statsByCourier.json().data.rating.totalRatings,
    ).toBeGreaterThanOrEqual(1);

    const publicStats = await inject(app, {
      method: "GET",
      url: `/api/v1/ratings/drivers/${courier.user.userId}`,
      headers: authHeaders(client.accessToken),
    });

    expect(publicStats.statusCode).toBe(200);
    expect(publicStats.json().data.rating.summary.total).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("rejects rating for non-delivered order", async () => {
    const client = await createClient(app);
    const courier = await createCourier(app);
    const { order } = await createOrder(app, client.accessToken);

    await createAssignment(app, order.identifiers.orderId, courier.accessToken);

    const response = await inject(app, {
      method: "POST",
      url: `/api/v1/ratings/orders/${order.identifiers.orderId}`,
      headers: authHeaders(client.accessToken),
      payload: {
        feedback: {
          score: 5,
          comment: "Great",
        },
      },
    });

    expect([400, 409]).toContain(response.statusCode);
  });

  it("prevents duplicate ratings and validates score", async () => {
    const client = await createClient(app);
    const courier = await createCourier(app);
    const { order } = await createOrder(app, client.accessToken);

    await createAssignment(app, order.identifiers.orderId, courier.accessToken);
    await advanceOrderTo(
      app,
      order.identifiers.orderId,
      courier.accessToken,
      "delivered",
    );

    const first = await inject(app, {
      method: "POST",
      url: `/api/v1/ratings/orders/${order.identifiers.orderId}`,
      headers: authHeaders(client.accessToken),
      payload: {
        feedback: {
          score: 4,
          comment: "Nice",
        },
      },
    });
    expect(first.statusCode).toBe(201);

    const duplicate = await inject(app, {
      method: "POST",
      url: `/api/v1/ratings/orders/${order.identifiers.orderId}`,
      headers: authHeaders(client.accessToken),
      payload: {
        feedback: {
          score: 4,
          comment: "Second try",
        },
      },
    });
    expect([400, 409]).toContain(duplicate.statusCode);

    const invalidScore = await inject(app, {
      method: "POST",
      url: `/api/v1/ratings/orders/${order.identifiers.orderId}`,
      headers: authHeaders(client.accessToken),
      payload: {
        feedback: {
          score: 6,
          comment: "Invalid score",
        },
      },
    });
    expect([400, 422]).toContain(invalidScore.statusCode);
  });

  it("enforces role restrictions on rating creation", async () => {
    const client = await createClient(app);
    const courier = await createCourier(app);
    const { order } = await createOrder(app, client.accessToken);

    const forbidden = await inject(app, {
      method: "POST",
      url: `/api/v1/ratings/orders/${order.identifiers.orderId}`,
      headers: authHeaders(courier.accessToken),
      payload: {
        feedback: {
          score: 5,
          comment: "Should fail",
        },
      },
    });

    expect(forbidden.statusCode).toBe(403);
  });

  it("requires authentication for ratings endpoints", async () => {
    const response = await inject(app, {
      method: "GET",
      url: "/api/v1/ratings/drivers/1",
    });

    expect(response.statusCode).toBe(401);
  });
});
