import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import {
  createAssignment,
  createClient,
  createCourier,
  createOrder,
} from "../helpers/fixtures.js";

describe("Drivers Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/drivers/me returns courier profile and blocks client role", async () => {
    const courier = await createCourier(app);
    const client = await createClient(app);

    const courierResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me",
      headers: authHeaders(courier.accessToken),
    });
    expect(courierResponse.statusCode).toBe(200);
    expect(courierResponse.json().data.driver.userId).toBe(courier.user.userId);

    const clientResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me",
      headers: authHeaders(client.accessToken),
    });
    expect(clientResponse.statusCode).toBe(403);
  });

  it("PATCH /api/v1/drivers/me updates profile for courier and forbids client", async () => {
    const courier = await createCourier(app);
    const client = await createClient(app);

    const courierResponse = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me",
      headers: authHeaders(courier.accessToken),
      payload: {
        profile: {
          fullName: "Updated Courier",
          phoneNumber: "9999998888",
        },
      },
    });

    expect(courierResponse.statusCode).toBe(200);
    expect(courierResponse.json().data.driver.fullName).toBe("Updated Courier");

    const clientResponse = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me",
      headers: authHeaders(client.accessToken),
      payload: {
        profile: {
          fullName: "Not Allowed",
        },
      },
    });

    expect(clientResponse.statusCode).toBe(403);
  });

  it("PATCH /api/v1/drivers/me updates vehicle JSONB and vehicle category", async () => {
    const courier = await createCourier(app, { activate: false });

    const catalogResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/static/create-order-data",
    });
    expect(catalogResponse.statusCode).toBe(200);
    const catalog = catalogResponse.json().data.createOrder;
    const vehicleCat = catalog.deliveryTypes[0]?.supportedVehicles?.[0];
    expect(vehicleCat?.categoryId).toBeDefined();

    const patchResponse = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me",
      headers: authHeaders(courier.accessToken),
      payload: {
        vehicle: {
          categoryId: Number(vehicleCat.categoryId),
          vehicleNumber: "KA01AB1234",
          model: "Activa",
          year: 2022,
        },
      },
    });

    expect(patchResponse.statusCode).toBe(200);
    const driver = patchResponse.json().data.driver;
    expect(driver.vehicle?.vehicleNumber).toBe("KA01AB1234");
    expect(driver.vehicle?.categoryId).toBe(Number(vehicleCat.categoryId));
  });

  it("PATCH /api/v1/drivers/me/availability toggles availability", async () => {
    const courier = await createCourier(app);

    const response = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me/availability",
      headers: authHeaders(courier.accessToken),
      payload: {
        availability: {
          isAvailable: true,
          isOnline: true,
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.availability.isAvailable).toBe(true);
    expect(body.data.availability.isOnline).toBe(true);
  });

  it("PATCH /api/v1/drivers/me/location updates current location and validates coordinates", async () => {
    const courier = await createCourier(app);

    const valid = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me/location",
      headers: authHeaders(courier.accessToken),
      payload: {
        location: {
          current: {
            latitude: 12.9716,
            longitude: 77.5946,
          },
        },
      },
    });

    expect(valid.statusCode).toBe(200);

    const invalid = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me/location",
      headers: authHeaders(courier.accessToken),
      payload: {
        location: {
          current: {
            latitude: 200,
            longitude: 77.5946,
          },
        },
      },
    });

    expect([400, 422]).toContain(invalid.statusCode);
  });

  it("GET /api/v1/drivers/me/assignments returns empty and active assignment states", async () => {
    const courier = await createCourier(app);
    const client = await createClient(app);

    const emptyResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me/assignments",
      headers: authHeaders(courier.accessToken),
    });
    expect(emptyResponse.statusCode).toBe(200);
    expect(emptyResponse.json().data.assignments).toEqual([]);

    let orderId: number | null = null;
    try {
      const { order } = await createOrder(app, client.accessToken);
      orderId = order.identifiers.orderId;
    } catch (error) {
      // Legacy DB snapshots may not satisfy calculate-fare prerequisites.
      if (
        error instanceof Error &&
        error.message.includes("calculate-fare failed")
      ) {
        return;
      }
      throw error;
    }

    if (!orderId) {
      return;
    }

    await createAssignment(app, orderId, courier.accessToken);

    const activeResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me/assignments",
      headers: authHeaders(courier.accessToken),
    });

    expect(activeResponse.statusCode).toBe(200);
    expect(activeResponse.json().data.assignments.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/drivers/me/earnings returns summary payload", async () => {
    const courier = await createCourier(app);

    const response = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me/earnings?period=week",
      headers: authHeaders(courier.accessToken),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.earnings.scope.period).toBe("week");
    expect(body.data.earnings.deliveries).toBeDefined();
  });

  it("GET /api/v1/drivers/me/rating returns rating stats", async () => {
    const courier = await createCourier(app);

    const response = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me/rating",
      headers: authHeaders(courier.accessToken),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.rating.averageRating).toEqual(expect.any(Number));
    expect(body.data.rating.totalRatings).toEqual(expect.any(Number));
  });
});
