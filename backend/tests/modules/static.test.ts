import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject } from "../helpers/app.js";

describe("Static Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns non-empty datasets from all public static endpoints", async () => {
    const endpoints: Array<{ path: string; key: string }> = [
      { path: "/api/v1/static/vehicle-categories", key: "vehicleCategories" },
      { path: "/api/v1/static/weight-tiers", key: "weightTiers" },
      { path: "/api/v1/static/delivery-types", key: "deliveryTypes" },
      { path: "/api/v1/static/package-types", key: "packageTypes" },
      { path: "/api/v1/static/payment-methods", key: "paymentMethods" },
      { path: "/api/v1/static/order-statuses", key: "orderStatuses" },
    ];

    for (const endpoint of endpoints) {
      const response = await inject(app, {
        method: "GET",
        url: endpoint.path,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data[endpoint.key])).toBe(true);
      expect(body.data[endpoint.key].length).toBeGreaterThan(0);
    }

    const createOrderDataResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/static/create-order-data",
    });

    expect(createOrderDataResponse.statusCode).toBe(200);
    const createOrderBody = createOrderDataResponse.json();
    expect(createOrderBody.success).toBe(true);
    expect(
      createOrderBody.data.createOrder.deliveryTypes.length,
    ).toBeGreaterThan(0);
    expect(
      createOrderBody.data.createOrder.packageTypes.length,
    ).toBeGreaterThan(0);
    expect(
      createOrderBody.data.createOrder.paymentMethods.length,
    ).toBeGreaterThan(0);
  });

  it("returns minimal public health payload", async () => {
    const response = await inject(app, {
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.database).toBeUndefined();
    expect(body.memory).toBeUndefined();
    expect(body.uptime).toBeUndefined();
  });

  it("returns internal health diagnostics", async () => {
    const response = await inject(app, {
      method: "GET",
      url: "/_internal/health",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toEqual(expect.any(String));
    expect(body.uptime).toEqual(expect.any(Number));
    expect(body.database).toBeDefined();
    expect(body.memory).toBeDefined();
  });
});
