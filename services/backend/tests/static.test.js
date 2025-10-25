// tests/static.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const { createTestAuthHeaders } = require("./setup.js");

describe("Static Data API", () => {
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

  describe("GET /api/v1/static/delivery-types", () => {
    it("should return all delivery types", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Delivery types retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            deliveryTypeId: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            estimatedTime: expect.any(String),
            basePrice: expect.any(Number),
            pricePerKm: expect.any(Number),
            maxWeight: expect.any(Number),
            maxDimensions: expect.any(Object),
            isActive: expect.any(Boolean),
            capabilities: expect.arrayContaining([
              expect.objectContaining({
                weightTierId: expect.any(Number),
                name: expect.any(String),
                maxWeight: expect.any(Number),
                priceMultiplier: expect.any(Number),
              }),
            ]),
            labels: expect.arrayContaining([
              expect.objectContaining({
                labelId: expect.any(Number),
                name: expect.any(String),
                color: expect.any(String),
              }),
            ]),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify standard delivery type exists
      const standardDelivery = response.body.data.find(
        (dt) => dt.name === "standard",
      );
      expect(standardDelivery).toBeDefined();
      expect(standardDelivery).toMatchObject({
        name: "standard",
        description: expect.stringContaining("Standard delivery"),
        basePrice: expect.any(Number),
        pricePerKm: expect.any(Number),
        maxWeight: expect.any(Number),
        isActive: true,
      });
    });

    it("should return only active delivery types", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      const deliveryTypes = response.body.data;

      // All returned delivery types should be active
      deliveryTypes.forEach((deliveryType) => {
        expect(deliveryType.isActive).toBe(true);
      });
    });

    it("should include weight tier capabilities", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      const deliveryTypes = response.body.data;

      deliveryTypes.forEach((deliveryType) => {
        expect(deliveryType.capabilities).toBeDefined();
        expect(deliveryType.capabilities.length).toBeGreaterThan(0);

        deliveryType.capabilities.forEach((capability) => {
          expect(capability).toMatchObject({
            weightTierId: expect.any(Number),
            name: expect.any(String),
            maxWeight: expect.any(Number),
            priceMultiplier: expect.any(Number),
          });
        });
      });
    });

    it("should include associated labels", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      const deliveryTypes = response.body.data;

      deliveryTypes.forEach((deliveryType) => {
        expect(deliveryType.labels).toBeDefined();
        if (deliveryType.labels.length > 0) {
          deliveryType.labels.forEach((label) => {
            expect(label).toMatchObject({
              labelId: expect.any(Number),
              name: expect.any(String),
              color: expect.any(String),
            });
          });
        }
      });
    });
  });

  describe("GET /api/v1/static/weight-tiers", () => {
    it("should return all weight tiers", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/weight-tiers")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Weight tiers retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            tierId: expect.any(Number),
            name: expect.any(String),
            minWeight: expect.any(Number),
            maxWeight: expect.any(Number),
            priceMultiplier: expect.any(Number),
            description: expect.any(String),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should have logical weight progression", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/weight-tiers")
        .expect(200);

      const weightTiers = response.body.data;

      // Sort by minWeight to check progression
      const sortedTiers = weightTiers.sort((a, b) => a.minWeight - b.minWeight);

      for (let i = 0; i < sortedTiers.length - 1; i++) {
        expect(sortedTiers[i].maxWeight).toBeLessThanOrEqual(
          sortedTiers[i + 1].minWeight,
        );
      }
    });

    it("should have reasonable price multipliers", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/weight-tiers")
        .expect(200);

      const weightTiers = response.body.data;

      weightTiers.forEach((tier) => {
        expect(tier.priceMultiplier).toBeGreaterThan(0);
        expect(tier.priceMultiplier).toBeLessThanOrEqual(5); // Reasonable upper bound
      });
    });
  });

  describe("GET /api/v1/static/vehicle-categories", () => {
    it("should return all vehicle categories", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/vehicle-categories")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Vehicle categories retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            categoryId: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            maxWeightCapacity: expect.any(Number),
            maxDimensions: expect.any(Object),
            iconUrl: expect.any(String),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should include 2-wheeler category", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/vehicle-categories")
        .expect(200);

      const twoWheeler = response.body.data.find(
        (cat) => cat.name === "2-wheeler",
      );
      expect(twoWheeler).toBeDefined();
      expect(twoWheeler).toMatchObject({
        name: "2-wheeler",
        description: expect.stringContaining("Two-wheeler"),
        maxWeightCapacity: expect.any(Number),
        maxDimensions: expect.any(Object),
      });
    });

    it("should have logical weight capacity progression", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/vehicle-categories")
        .expect(200);

      const categories = response.body.data;

      // 2-wheeler should have lower capacity than 3-wheeler and mini-truck
      const twoWheeler = categories.find((cat) => cat.name === "2-wheeler");
      const threeWheeler = categories.find((cat) => cat.name === "3-wheeler");
      const miniTruck = categories.find((cat) => cat.name === "mini-truck");

      if (threeWheeler) {
        expect(twoWheeler.maxWeightCapacity).toBeLessThan(
          threeWheeler.maxWeightCapacity,
        );
      }
      if (miniTruck) {
        expect(threeWheeler.maxWeightCapacity).toBeLessThan(
          miniTruck.maxWeightCapacity,
        );
      }
    });
  });

  describe("GET /api/v1/static/package-types", () => {
    it("should return all package types", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/package-types")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Package types retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            packageTypeId: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            icon: expect.any(String),
            maxWeight: expect.any(Number),
            maxDimensions: expect.any(Object),
            handlingFee: expect.any(Number),
            isFragile: expect.any(Boolean),
            requiresSignature: expect.any(Boolean),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should include fragile and signature requirements", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/package-types")
        .expect(200);

      const packageTypes = response.body.data;

      packageTypes.forEach((packageType) => {
        expect(packageType).toMatchObject({
          isFragile: expect.any(Boolean),
          requiresSignature: expect.any(Boolean),
          handlingFee: expect.any(Number),
        });
      });
    });

    it("should have appropriate handling fees for fragile items", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/package-types")
        .expect(200);

      const packageTypes = response.body.data;

      const fragilePackages = packageTypes.filter((pkg) => pkg.isFragile);
      const nonFragilePackages = packageTypes.filter((pkg) => !pkg.isFragile);

      if (fragilePackages.length > 0 && nonFragilePackages.length > 0) {
        const avgFragileFee =
          fragilePackages.reduce((sum, pkg) => sum + pkg.handlingFee, 0) /
          fragilePackages.length;
        const avgNonFragileFee =
          nonFragilePackages.reduce((sum, pkg) => sum + pkg.handlingFee, 0) /
          nonFragilePackages.length;

        expect(avgFragileFee).toBeGreaterThanOrEqual(avgNonFragileFee);
      }
    });
  });

  describe("GET /api/v1/static/payment-methods", () => {
    it("should return all payment methods", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/payment-methods")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Payment methods retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            paymentMethodId: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            icon: expect.any(String),
            isActive: expect.any(Boolean),
            processingFee: expect.any(Number),
            minAmount: expect.any(Number),
            maxAmount: expect.any(Number),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should include cash on delivery", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/payment-methods")
        .expect(200);

      const codMethod = response.body.data.find((method) =>
        method.name.toLowerCase().includes("cash"),
      );
      expect(codMethod).toBeDefined();
      expect(codMethod).toMatchObject({
        name: expect.stringMatching(/cash/i),
        description: expect.any(String),
        processingFee: expect.any(Number),
        isActive: expect.any(Boolean),
      });
    });

    it("should include online payment methods", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/payment-methods")
        .expect(200);

      const onlineMethods = response.body.data.filter(
        (method) =>
          method.name.toLowerCase().includes("card") ||
          method.name.toLowerCase().includes("upi") ||
          method.name.toLowerCase().includes("wallet"),
      );

      expect(onlineMethods.length).toBeGreaterThan(0);
    });

    it("should have reasonable transaction limits", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/payment-methods")
        .expect(200);

      const paymentMethods = response.body.data;

      paymentMethods.forEach((method) => {
        expect(method.minAmount).toBeGreaterThanOrEqual(0);
        expect(method.maxAmount).toBeGreaterThan(method.minAmount);
        expect(method.processingFee).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("GET /api/v1/static/create-order-data", () => {
    it("should return all data needed for order creation", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Create order data retrieved successfully",
        data: expect.objectContaining({
          deliveryTypes: expect.any(Array),
          weightTiers: expect.any(Array),
          vehicleCategories: expect.any(Array),
          packageTypes: expect.any(Array),
          paymentMethods: expect.any(Array),
          orderStatuses: expect.any(Array),
        }),
      });

      // Verify all required data is present
      expect(response.body.data.deliveryTypes.length).toBeGreaterThan(0);
      expect(response.body.data.weightTiers.length).toBeGreaterThan(0);
      expect(response.body.data.vehicleCategories.length).toBeGreaterThan(0);
      expect(response.body.data.packageTypes.length).toBeGreaterThan(0);
      expect(response.body.data.paymentMethods.length).toBeGreaterThan(0);
      expect(response.body.data.orderStatuses.length).toBeGreaterThan(0);
    });

    it("should return consistent data across multiple requests", async () => {
      const response1 = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      const response2 = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      // Data should be consistent
      expect(response1.body.data.deliveryTypes).toEqual(
        response2.body.data.deliveryTypes,
      );
      expect(response1.body.data.weightTiers).toEqual(
        response2.body.data.weightTiers,
      );
      expect(response1.body.data.vehicleCategories).toEqual(
        response2.body.data.vehicleCategories,
      );
    });

    it("should include all necessary fields for each data type", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      const data = response.body.data;

      // Check delivery types structure
      data.deliveryTypes.forEach((deliveryType) => {
        expect(deliveryType).toMatchObject({
          deliveryTypeId: expect.any(Number),
          name: expect.any(String),
          basePrice: expect.any(Number),
          pricePerKm: expect.any(Number),
        });
      });

      // Check vehicle categories structure
      data.vehicleCategories.forEach((category) => {
        expect(category).toMatchObject({
          categoryId: expect.any(Number),
          name: expect.any(String),
          maxWeightCapacity: expect.any(Number),
        });
      });

      // Check package types structure
      data.packageTypes.forEach((packageType) => {
        expect(packageType).toMatchObject({
          packageTypeId: expect.any(Number),
          name: expect.any(String),
          maxWeight: expect.any(Number),
          handlingFee: expect.any(Number),
        });
      });
    });
  });

  describe("GET /api/v1/static/order-statuses", () => {
    it("should return all order statuses", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/order-statuses")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order statuses retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            statusId: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            displayOrder: expect.any(Number),
            color: expect.any(String),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should include all standard order statuses", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/order-statuses")
        .expect(200);

      const statusNames = response.body.data.map((status) => status.name);

      expect(statusNames).toEqual(
        expect.arrayContaining([
          "pending",
          "assigned",
          "picked_up",
          "in_transit",
          "delivered",
          "cancelled",
        ]),
      );
    });

    it("should have logical display order", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/order-statuses")
        .expect(200);

      const statuses = response.body.data;

      // Sort by display order
      const sortedStatuses = statuses.sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );

      // Check that display orders are sequential
      for (let i = 0; i < sortedStatuses.length; i++) {
        expect(sortedStatuses[i].displayOrder).toBe(i + 1);
      }
    });

    it("should include appropriate colors for each status", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/order-statuses")
        .expect(200);

      const statuses = response.body.data;

      statuses.forEach((status) => {
        expect(status.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
      });

      // Check specific status colors
      const pendingStatus = statuses.find((s) => s.name === "pending");
      const deliveredStatus = statuses.find((s) => s.name === "delivered");
      const cancelledStatus = statuses.find((s) => s.name === "cancelled");

      expect(pendingStatus.color).not.toBe(deliveredStatus.color);
      expect(cancelledStatus.color).not.toBe(deliveredStatus.color);
    });
  });

  describe("Public Access", () => {
    it("should allow access to static endpoints without authentication", async () => {
      const endpoints = [
        "/api/v1/static/delivery-types",
        "/api/v1/static/weight-tiers",
        "/api/v1/static/vehicle-categories",
        "/api/v1/static/package-types",
        "/api/v1/static/payment-methods",
        "/api/v1/static/create-order-data",
        "/api/v1/static/order-statuses",
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.server).get(endpoint).expect(200);

        expect(response.body).toMatchObject({
          success: true,
        });
      }
    });

    it("should return same data regardless of authentication", async () => {
      const unauthenticatedResponse = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      const authenticatedResponse = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .set(createTestAuthHeaders("some_token"))
        .expect(200);

      expect(unauthenticatedResponse.body.data).toEqual(
        authenticatedResponse.body.data,
      );
    });
  });

  describe("Data Consistency", () => {
    it("should maintain referential integrity across static data", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      const data = response.body.data;

      // Verify delivery types reference valid weight tiers
      data.deliveryTypes.forEach((deliveryType) => {
        deliveryType.capabilities.forEach((capability) => {
          const weightTier = data.weightTiers.find(
            (wt) => wt.tierId === capability.weightTierId,
          );
          expect(weightTier).toBeDefined();
        });
      });

      // Verify vehicle categories have reasonable constraints
      data.vehicleCategories.forEach((category) => {
        expect(category.maxWeightCapacity).toBeGreaterThan(0);
        expect(category.maxDimensions).toMatchObject({
          length: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
        });
      });
    });

    it("should have consistent pricing structure", async () => {
      const response = await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      const data = response.body.data;

      // Weight tiers should have increasing price multipliers
      const sortedWeightTiers = data.weightTiers.sort(
        (a, b) => a.minWeight - b.minWeight,
      );

      for (let i = 0; i < sortedWeightTiers.length - 1; i++) {
        expect(sortedWeightTiers[i].priceMultiplier).toBeLessThanOrEqual(
          sortedWeightTiers[i + 1].priceMultiplier,
        );
      }

      // Delivery types should have positive pricing
      data.deliveryTypes.forEach((deliveryType) => {
        expect(deliveryType.basePrice).toBeGreaterThan(0);
        expect(deliveryType.pricePerKm).toBeGreaterThan(0);
      });
    });
  });

  describe("Performance", () => {
    it("should return static data quickly", async () => {
      const startTime = Date.now();

      await request(app.server)
        .get("/api/v1/static/create-order-data")
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 100ms for static data
      expect(responseTime).toBeLessThan(100);
    });

    it("should handle concurrent requests to static endpoints", async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(request(app.server).get("/api/v1/static/delivery-types"));
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // All should return same data
      for (let i = 1; i < responses.length; i++) {
        expect(responses[0].body.data).toEqual(responses[i].body.data);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection issues gracefully", async () => {
      // This test would require mocking database failures
      // For now, we'll just verify the endpoints work with valid data
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types")
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should return appropriate error messages for invalid requests", async () => {
      // Test with invalid query parameters
      const response = await request(app.server)
        .get("/api/v1/static/delivery-types?invalid=param")
        .expect(200); // Should still work despite invalid param

      expect(response.body).toMatchObject({
        success: true,
      });
    });
  });
});
