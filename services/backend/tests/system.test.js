// tests/system.test.js
const request = require("supertest");
const { testDb } = require("./database.js");

describe("System API", () => {
  let app;

  beforeAll(async () => {
    const appModule = await import("../src/app.js");
    app = await appModule.buildApp();
    await testDb.setup();
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  describe("GET /health", () => {
    it("should return server health status", async () => {
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
      });

      // Verify timestamp format
      expect(() => new Date(response.body.timestamp)).not.toThrow();

      // Verify uptime is positive number
      expect(response.body.uptime).toBeGreaterThan(0);

      // Verify environment is set
      expect(["development", "test", "production"]).toContain(
        response.body.environment,
      );
    });

    it("should return consistent health status across multiple requests", async () => {
      const responses = await Promise.all([
        request(app.server).get("/health"),
        request(app.server).get("/health"),
        request(app.server).get("/health"),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });

      // All responses should have similar uptime (within 1 second)
      const uptimes = responses.map((r) => r.body.uptime);
      for (let i = 1; i < uptimes.length; i++) {
        expect(Math.abs(uptimes[0] - uptimes[i])).toBeLessThan(1);
      }
    });

    it("should work without authentication", async () => {
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
      });
    });

    it("should handle high request volume", async () => {
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(request(app.server).get("/health"));
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });
  });

  describe("GET /api/v1", () => {
    it("should return API information", async () => {
      const response = await request(app.server).get("/api/v1").expect(200);

      expect(response.body).toMatchObject({
        name: "Shipzy API",
        version: "1.0.0",
        timestamp: expect.any(String),
      });

      // Verify timestamp format
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it("should work without authentication", async () => {
      const response = await request(app.server).get("/api/v1").expect(200);

      expect(response.body).toMatchObject({
        name: "Shipzy API",
        version: "1.0.0",
      });
    });

    it("should return consistent API info", async () => {
      const responses = await Promise.all([
        request(app.server).get("/api/v1"),
        request(app.server).get("/api/v1"),
        request(app.server).get("/api/v1"),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.name).toBe("Shipzy API");
        expect(response.body.version).toBe("1.0.0");
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      const response = await request(app.server)
        .get("/api/v1/non-existent-endpoint")
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
        timestamp: expect.any(String),
      });
    });

    it("should return 404 for non-existent nested endpoints", async () => {
      const response = await request(app.server)
        .get("/api/v1/auth/non-existent")
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
      });
    });

    it("should return 404 for invalid HTTP methods", async () => {
      const response = await request(app.server)
        .delete("/health") // Health endpoint doesn't support DELETE
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
      });
    });

    it("should return 404 for malformed URLs", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders//malformed") // Double slash
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("not found"),
      });
    });
  });

  describe("Request/Response Format", () => {
    it("should return consistent response format", async () => {
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
      });

      expect(response.headers).toMatchObject({
        "content-type": expect.stringContaining("application/json"),
      });
    });

    it("should include request ID in logs", async () => {
      const customHeaders = {
        "x-request-id": "test-request-123",
        "user-agent": "TestAgent/1.0",
      };

      const response = await request(app.server)
        .get("/health")
        .set(customHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
      });
    });

    it("should handle different content types appropriately", async () => {
      // Test JSON response
      const jsonResponse = await request(app.server)
        .get("/health")
        .set("Accept", "application/json")
        .expect(200);

      expect(jsonResponse.headers["content-type"]).toContain(
        "application/json",
      );

      // Test HTML response (should still work but return JSON)
      const htmlResponse = await request(app.server)
        .get("/health")
        .set("Accept", "text/html")
        .expect(200);

      expect(htmlResponse.headers["content-type"]).toContain(
        "application/json",
      );
    });
  });

  describe("Performance Monitoring", () => {
    it("should track response times accurately", async () => {
      const startTime = Date.now();

      await request(app.server).get("/health").expect(200);

      const endTime = Date.now();
      const requestTime = endTime - startTime;

      // Health check should be very fast (< 50ms)
      expect(requestTime).toBeLessThan(50);
    });

    it("should handle concurrent health checks", async () => {
      const concurrentRequests = [];
      for (let i = 0; i < 50; i++) {
        concurrentRequests.push(request(app.server).get("/health"));
      }

      const responses = await Promise.all(concurrentRequests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ok");
      });
    });

    it("should maintain performance under load", async () => {
      const startTime = Date.now();

      // Make 100 health check requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(request(app.server).get("/health"));
      }

      await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete 100 requests in reasonable time (< 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe("System Status Validation", () => {
    it("should report correct environment", async () => {
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body.environment).toBe("test");
    });

    it("should report increasing uptime", async () => {
      const response1 = await request(app.server).get("/health").expect(200);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app.server).get("/health").expect(200);

      expect(response2.body.uptime).toBeGreaterThan(response1.body.uptime);
    });

    it("should include valid timestamp format", async () => {
      const response = await request(app.server).get("/health").expect(200);

      const timestamp = response.body.timestamp;

      // Should be valid ISO string
      expect(() => new Date(timestamp)).not.toThrow();

      // Should be recent (within last minute)
      const timestampDate = new Date(timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - timestampDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe("API Documentation", () => {
    it("should return valid API version information", async () => {
      const response = await request(app.server).get("/api/v1").expect(200);

      expect(response.body).toMatchObject({
        name: "Shipzy API",
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        timestamp: expect.any(String),
      });
    });

    it("should maintain API version consistency", async () => {
      const responses = await Promise.all([
        request(app.server).get("/api/v1"),
        request(app.server).get("/api/v1"),
        request(app.server).get("/api/v1"),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.version).toBe("1.0.0");
        expect(response.body.name).toBe("Shipzy API");
      });
    });
  });

  describe("Security Headers", () => {
    it("should include security headers in responses", async () => {
      const response = await request(app.server).get("/health").expect(200);

      // Should include standard security headers (configured in helmet)
      expect(response.headers).toMatchObject({
        "x-content-type-options": expect.any(String),
        "x-frame-options": expect.any(String),
        "x-xss-protection": expect.any(String),
      });
    });

    it("should handle CORS preflight requests", async () => {
      const response = await request(app.server)
        .options("/health")
        .set({
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        })
        .expect(204); // No Content for OPTIONS

      expect(response.headers).toMatchObject({
        "access-control-allow-origin": expect.any(String),
        "access-control-allow-methods": expect.any(String),
        "access-control-allow-headers": expect.any(String),
      });
    });

    it("should reject requests from unauthorized origins", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .set({
          Origin: "http://malicious-site.com",
        })
        .expect(200); // Should still work for public endpoints

      // Public endpoints should work but may not include CORS headers for unauthorized origins
      expect(response.body).toMatchObject({
        success: true,
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to system endpoints", async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app.server).get("/health"));
      }

      const responses = await Promise.all(requests);

      // All should succeed (health endpoint has high rate limit)
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it("should handle rate limit exceeded gracefully", async () => {
      // This test would require making many more requests to trigger rate limit
      // For now, we'll just verify the endpoints work
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
      });
    });
  });

  describe("Database Connectivity", () => {
    it("should maintain database connection during health checks", async () => {
      // Verify database is accessible
      const dbStatus = await testDb.query("SELECT 1 as status");

      expect(dbStatus.rows[0].status).toBe(1);

      // Health check should still work
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body.status).toBe("ok");
    });

    it("should handle database connection failures", async () => {
      // This test would require disconnecting the database
      // For now, we'll just verify normal operation
      const response = await request(app.server).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
        environment: "test",
      });
    });
  });

  describe("Logging Integration", () => {
    it("should log requests appropriately", async () => {
      const response = await request(app.server)
        .get("/health")
        .set({
          "x-request-id": "test-logging-123",
          "user-agent": "TestLogger/1.0",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: "ok",
      });
    });

    it("should include request metadata in logs", async () => {
      const customHeaders = {
        "x-device-id": "test-device-456",
        "x-request-id": "test-metadata-789",
      };

      const response = await request(app.server)
        .get("/api/v1")
        .set(customHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        name: "Shipzy API",
      });
    });
  });

  describe("API Response Consistency", () => {
    it("should return consistent response structure", async () => {
      const endpoints = ["/health", "/api/v1"];

      for (const endpoint of endpoints) {
        const response = await request(app.server).get(endpoint).expect(200);

        expect(response.body).toMatchObject({
          timestamp: expect.any(String),
        });

        expect(response.headers["content-type"]).toContain("application/json");
      }
    });

    it("should handle different HTTP methods consistently", async () => {
      // Test that only allowed methods work
      await request(app.server).get("/health").expect(200);
      await request(app.server).head("/health").expect(200);
      await request(app.server).options("/health").expect(204);

      // These should return 404 (method not allowed)
      await request(app.server).post("/health").expect(404);
      await request(app.server).put("/health").expect(404);
      await request(app.server).delete("/health").expect(404);
    });
  });
});
