import { jest } from "@jest/globals";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import type { FastifyInstance } from "fastify";
import addressesRepository from "../../src/modules/addresses/addresses.repository.js";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import { createClient } from "../helpers/fixtures.js";

describe("Addresses Module", () => {
  let app: FastifyInstance;
  let clientToken: string;

  beforeAll(async () => {
    app = await buildTestApp();
    const account = await createClient(app);
    clientToken = account.accessToken;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/addresses/search", () => {
    it("returns suggestions for query", async () => {
      jest.spyOn(addressesRepository, "suggest").mockResolvedValueOnce([
        {
          mapbox_id: "mbx.1",
          name: "MG Road",
          full_address: "MG Road, Bengaluru",
          feature_type: "address",
          coordinates: { latitude: 12.9716, longitude: 77.5946 },
        },
      ]);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/search",
        headers: authHeaders(clientToken),
        payload: {
          query: "MG Road",
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.search.suggestions.length).toBe(1);
    });

    it("validates missing query and handles empty results", async () => {
      const missing = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/search",
        headers: authHeaders(clientToken),
        payload: {},
      });
      expect([400, 422]).toContain(missing.statusCode);

      jest.spyOn(addressesRepository, "suggest").mockResolvedValueOnce([]);

      const empty = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/search",
        headers: authHeaders(clientToken),
        payload: {
          query: "NoResult",
        },
      });

      expect(empty.statusCode).toBe(200);
      expect(empty.json().data.search.suggestions).toEqual([]);
    });
  });

  describe("POST /api/v1/addresses/retrieve", () => {
    it("returns place details and handles not found", async () => {
      jest.spyOn(addressesRepository, "retrieve").mockResolvedValueOnce({
        id: "feature.1",
        properties: {
          mapbox_id: "mbx.1",
          name: "MG Road",
          full_address: "MG Road, Bengaluru",
          context: {
            place: { name: "Bengaluru" },
            region: { name: "Karnataka" },
          },
        },
        geometry: {
          type: "Point",
          coordinates: [77.5946, 12.9716],
        },
        bbox: [77.5, 12.9, 77.6, 13.0],
      });

      const success = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/retrieve",
        headers: authHeaders(clientToken),
        payload: {
          mapboxId: "mbx.1",
          sessionToken: "session-1",
        },
      });
      expect(success.statusCode).toBe(200);
      expect(success.json().data.place.mapboxId).toBe("mbx.1");

      jest.spyOn(addressesRepository, "retrieve").mockResolvedValueOnce(null);
      const notFound = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/retrieve",
        headers: authHeaders(clientToken),
        payload: {
          mapboxId: "mbx.missing",
          sessionToken: "session-2",
        },
      });
      expect([400, 404]).toContain(notFound.statusCode);
    });
  });

  describe("POST /api/v1/addresses/reverse-geocode", () => {
    it("returns reverse geocode data and validates required fields", async () => {
      jest.spyOn(addressesRepository, "reverseGeocode").mockResolvedValueOnce([
        {
          id: "reverse.1",
          properties: {
            mapbox_id: "reverse.1",
            name: "Brigade Road",
            full_address: "Brigade Road, Bengaluru",
            context: {
              place: { name: "Bengaluru" },
              region: { name: "Karnataka" },
            },
            coordinates: {
              latitude: 12.95,
              longitude: 77.61,
            },
          },
          geometry: {
            type: "Point",
            coordinates: [77.61, 12.95],
          },
        },
      ]);

      const success = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/reverse-geocode",
        headers: authHeaders(clientToken),
        payload: {
          latitude: 12.95,
          longitude: 77.61,
        },
      });
      expect(success.statusCode).toBe(200);
      expect(success.json().data.reverseGeocode.total).toBeGreaterThanOrEqual(
        1,
      );

      const invalid = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/reverse-geocode",
        headers: authHeaders(clientToken),
        payload: {},
      });
      expect([400, 422]).toContain(invalid.statusCode);
    });
  });

  describe("POST /api/v1/addresses/directions", () => {
    it("returns route details and validates required params", async () => {
      jest.spyOn(addressesRepository, "directions").mockResolvedValueOnce({
        distance: 3500,
        duration: 900,
        geometry: {
          type: "LineString",
          coordinates: [
            [77.5946, 12.9716],
            [77.6245, 12.9352],
          ],
        },
      });

      const success = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/directions",
        headers: authHeaders(clientToken),
        payload: {
          origin: { latitude: 12.9716, longitude: 77.5946 },
          destination: { latitude: 12.9352, longitude: 77.6245 },
          profile: "driving",
        },
      });
      expect(success.statusCode).toBe(200);
      expect(success.json().data.route.distanceKm).toEqual(expect.any(Number));

      const invalid = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/directions",
        headers: authHeaders(clientToken),
        payload: {},
      });
      expect([400, 422]).toContain(invalid.statusCode);
    });
  });

  describe("POST /api/v1/addresses/distance", () => {
    it("returns straight-line distance and validates params", async () => {
      const success = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/distance",
        headers: authHeaders(clientToken),
        payload: {
          lat1: 12.9716,
          lon1: 77.5946,
          lat2: 12.9352,
          lon2: 77.6245,
        },
      });
      expect(success.statusCode).toBe(200);
      expect(success.json().data.distance.kilometers).toEqual(
        expect.any(Number),
      );

      const invalid = await inject(app, {
        method: "POST",
        url: "/api/v1/addresses/distance",
        headers: authHeaders(clientToken),
        payload: {
          lat1: 12.9716,
        },
      });
      expect([400, 422]).toContain(invalid.statusCode);
    });
  });
});
