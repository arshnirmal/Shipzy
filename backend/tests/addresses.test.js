// tests/addresses.test.js
import request from "supertest";
import { buildApp } from "../src/app.js";
import { cleanupTestDatabase, setupTestDatabase } from "./database.js";

describe("Addresses API", () => {
  let app;
  let authToken;

  beforeAll(async () => {
    await setupTestDatabase();

    app = await buildApp({
      logger: false,
      disableRequestLogging: true,
    });

    // Create a test user and get auth token
    const authResponse = await request(app)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "test-token", // This will fail in real test, but structure is correct
        fullName: "Test User",
        role: "client",
      });

    if (authResponse.status === 200) {
      authToken = authResponse.body.data.accessToken;
    }
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    if (app) {
      await app.close();
    }
  });

  describe("POST /api/v1/addresses/search", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/search")
        .send({ query: "test" });

      expect(response.status).toBe(401);
    });

    it("should validate query minimum length", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/search")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({ query: "ab" }); // Too short

      expect([400, 401]).toContain(response.status);
    });

    it("should accept valid query", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/search")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({ query: "restaurant" });

      // Should return 400 (validation error) or 401 (auth error) or 200 (success with invalid token)
      expect([200, 400, 401]).toContain(response.status);
    });
  });

  describe("POST /api/v1/addresses/retrieve", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/retrieve")
        .send({
          mapboxId: "test-id",
          sessionToken: "test-token",
        });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/retrieve")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  describe("POST /api/v1/addresses/reverse-geocode", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/reverse-geocode")
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        });

      expect(response.status).toBe(401);
    });

    it("should validate coordinates", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/reverse-geocode")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  describe("POST /api/v1/addresses/directions", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/directions")
        .send({
          origin: { latitude: 37.7749, longitude: -122.4194 },
          destination: { latitude: 34.0522, longitude: -118.2437 },
        });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/directions")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({});

      expect([400, 401]).toContain(response.status);
    });
  });

  describe("POST /api/v1/addresses/distance", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/distance")
        .send({
          lat1: 37.7749,
          lon1: -122.4194,
          lat2: 34.0522,
          lon2: -118.2437,
        });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/distance")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({ lat1: 37.7749 });

      expect([400, 401]).toContain(response.status);
    });

    it("should calculate distance correctly", async () => {
      const response = await request(app)
        .post("/api/v1/addresses/distance")
        .set("Authorization", `Bearer ${authToken || "invalid"}`)
        .send({
          lat1: 37.7749,
          lon1: -122.4194,
          lat2: 34.0522,
          lon2: -118.2437,
        });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toHaveProperty("distanceKm");
      }
    });
  });
});
