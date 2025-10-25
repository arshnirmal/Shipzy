// tests/integration.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const {
  createTestAuthHeaders,
  createTestDeviceHeaders,
  testUsers,
} = require("./setup.js");

/**
 * Integration tests that verify complete user workflows
 * These tests simulate real-world usage scenarios
 */
describe("Integration Tests - Complete Workflows", () => {
  let app;
  let clientUser;
  let courierUser;
  let clientToken;
  let courierToken;

  beforeAll(async () => {
    const appModule = await import("../src/app.js");
    app = await appModule.buildApp();
    await testDb.setup();

    // Create test users
    clientUser = await testDb.createTestUser(testUsers.client);
    courierUser = await testDb.createTestUser(testUsers.courier);

    // Set up courier status
    await testDb.createTestDriver(
      {
        vehicle: {
          categoryId: 1,
          vehicleNumber: "DL12AB1234",
          model: "Honda Activa",
          year: 2023,
        },
        isAvailable: true,
        isOnline: true,
      },
      courierUser.user_id,
    );

    // Get auth tokens
    const mockFirebaseResponse = {
      uid: testUsers.client.firebaseUid,
      phone_number: testUsers.client.phoneNumber,
      email: testUsers.client.email,
    };

    const firebaseAdmin = require("firebase-admin");
    firebaseAdmin.auth = () => ({
      verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
    });

    const clientLogin = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "integration_client_token",
        fullName: testUsers.client.fullName,
        role: testUsers.client.role,
      })
      .set(createTestDeviceHeaders("integration_client_device"));

    clientToken = clientLogin.body.data.tokens.accessToken;

    const courierLogin = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "integration_courier_token",
        fullName: testUsers.courier.fullName,
        role: testUsers.courier.role,
      })
      .set(createTestDeviceHeaders("integration_courier_device"));

    courierToken = courierLogin.body.data.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  describe("Complete Order Workflow", () => {
    let createdOrderId;
    let createdOrder;

    it("should complete full order lifecycle", async () => {
      // Step 1: Client creates order
      console.log("📦 Step 1: Creating order...");
      const orderData = {
        deliveryTypeId: 1,
        pickupAddress:
          "123 Integration Test Pickup, Test City, Test State 123456",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupContactName: "Integration Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress:
          "456 Integration Test Delivery, Test City, Test State 123457",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryContactName: "Integration Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        specialInstructions: "Integration test order - handle with care",
        items: [
          {
            name: "Integration Test Package",
            quantity: 1,
            weight: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            value: 1000,
          },
        ],
      };

      const createResponse = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(orderData)
        .expect(201);

      createdOrder = createResponse.body.data;
      createdOrderId = createdOrder.orderId;

      expect(createdOrder).toMatchObject({
        orderId: expect.any(Number),
        orderUuid: expect.any(String),
        status: expect.objectContaining({
          statusId: 1,
          name: "pending",
        }),
      });

      // Step 2: Client views their orders
      console.log("📋 Step 2: Client viewing orders...");
      const clientOrdersResponse = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(clientOrdersResponse.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: createdOrderId,
            status: expect.objectContaining({
              name: "pending",
            }),
          }),
        ]),
      );

      // Step 3: Courier sees available orders
      console.log("🚛 Step 3: Courier viewing available orders...");
      const availableOrdersResponse = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(availableOrdersResponse.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: createdOrderId,
            status: expect.objectContaining({
              name: "pending",
            }),
          }),
        ]),
      );

      // Step 4: Courier accepts order
      console.log("✅ Step 4: Courier accepting order...");
      const acceptResponse = await request(app.server)
        .post(`/api/v1/orders/${createdOrderId}/accept`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
          notes: "I will pick up within 30 minutes",
        })
        .expect(200);

      expect(acceptResponse.body.data).toMatchObject({
        orderId: createdOrderId,
        assignment: expect.objectContaining({
          courierId: courierUser.user_id,
          status: expect.objectContaining({
            statusId: 2,
            name: "assigned",
          }),
        }),
      });

      // Step 5: Courier updates order status to picked up
      console.log("📦 Step 5: Courier picking up package...");
      const pickupResponse = await request(app.server)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 3, // Picked up
          notes: "Package picked up successfully",
        })
        .expect(200);

      expect(pickupResponse.body.data.status.statusId).toBe(3);

      // Step 6: Courier updates status to in transit
      console.log("🚛 Step 6: Package in transit...");
      const transitResponse = await request(app.server)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 4, // In transit
          notes: "Package in transit to delivery location",
        })
        .expect(200);

      expect(transitResponse.body.data.status.statusId).toBe(4);

      // Step 7: Courier delivers package
      console.log("🏠 Step 7: Delivering package...");
      const deliveryResponse = await request(app.server)
        .put(`/api/v1/orders/${createdOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 5, // Delivered
          notes: "Package delivered successfully to recipient",
        })
        .expect(200);

      expect(deliveryResponse.body.data.status.statusId).toBe(5);

      // Step 8: Verify final state
      console.log("🔍 Step 8: Verifying final order state...");
      const finalOrderResponse = await request(app.server)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(finalOrderResponse.body.data).toMatchObject({
        orderId: createdOrderId,
        status: expect.objectContaining({
          statusId: 5,
          name: "delivered",
        }),
        assignment: expect.objectContaining({
          status: expect.objectContaining({
            statusId: 4, // Completed
            name: "completed",
          }),
        }),
      });

      console.log("🎉 Complete order workflow completed successfully!");
    }, 30000);

    it("should handle order cancellation workflow", async () => {
      // Create a cancellable order
      const cancellableOrderData = {
        deliveryTypeId: 1,
        pickupAddress: "123 Cancellable Pickup, Test City, Test State 123456",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupContactName: "Cancellable Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress:
          "456 Cancellable Delivery, Test City, Test State 123457",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryContactName: "Cancellable Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 1.0,
        dimensions: { length: 20, width: 15, height: 10 },
        declaredValue: 500,
        specialInstructions: "Cancellable test order",
        items: [
          {
            name: "Cancellable Package",
            quantity: 1,
            weight: 1.0,
            dimensions: { length: 20, width: 15, height: 10 },
            value: 500,
          },
        ],
      };

      const createResponse = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(cancellableOrderData)
        .expect(201);

      const cancellableOrderId = createResponse.body.data.orderId;

      // Cancel the order
      const cancelResponse = await request(app.server)
        .post(`/api/v1/orders/${cancellableOrderId}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Changed mind - integration test",
        })
        .expect(200);

      expect(cancelResponse.body.data.status.statusId).toBe(6); // Cancelled

      // Verify order is cancelled and not available for couriers
      const availableResponse = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      const availableOrderIds = availableResponse.body.data.map(
        (order) => order.orderId,
      );
      expect(availableOrderIds).not.toContain(cancellableOrderId);
    }, 15000);
  });

  describe("Driver Earnings Workflow", () => {
    it("should track courier earnings through order completion", async () => {
      // Create and complete an order
      const earningsOrderData = {
        deliveryTypeId: 1,
        pickupAddress: "123 Earnings Test Pickup, Test City, Test State 123456",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupContactName: "Earnings Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress:
          "456 Earnings Test Delivery, Test City, Test State 123457",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryContactName: "Earnings Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 2.0,
        dimensions: { length: 25, width: 18, height: 12 },
        declaredValue: 800,
        specialInstructions: "Earnings tracking test",
        items: [
          {
            name: "Earnings Test Package",
            quantity: 1,
            weight: 2.0,
            dimensions: { length: 25, width: 18, height: 12 },
            value: 800,
          },
        ],
      };

      // Create order
      const createResponse = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(earningsOrderData)
        .expect(201);

      const earningsOrderId = createResponse.body.data.orderId;

      // Courier accepts order
      await request(app.server)
        .post(`/api/v1/orders/${earningsOrderId}/accept`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          estimatedArrivalTime: "2024-12-25T14:00:00Z",
          notes: "Earnings test order acceptance",
        })
        .expect(200);

      // Complete order delivery
      await request(app.server)
        .put(`/api/v1/orders/${earningsOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 3, // Picked up
          notes: "Picked up for earnings test",
        })
        .expect(200);

      await request(app.server)
        .put(`/api/v1/orders/${earningsOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 4, // In transit
          notes: "In transit for earnings test",
        })
        .expect(200);

      await request(app.server)
        .put(`/api/v1/orders/${earningsOrderId}/status`)
        .set(createTestAuthHeaders(courierToken))
        .send({
          statusId: 5, // Delivered
          notes: "Delivered successfully - earnings test",
        })
        .expect(200);

      // Check courier earnings
      const earningsResponse = await request(app.server)
        .get("/api/v1/drivers/me/earnings")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(earningsResponse.body.data.totalOrders).toBeGreaterThan(0);
      expect(earningsResponse.body.data.totalEarnings).toBeGreaterThan(0);
      expect(earningsResponse.body.data.recentEarnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            orderId: earningsOrderId,
            earnings: expect.any(Number),
          }),
        ]),
      );
    }, 20000);
  });

  describe("Multi-User Interaction", () => {
    it("should handle multiple clients and couriers simultaneously", async () => {
      // Create additional users
      const client2 = await testDb.createTestUser({
        ...testUsers.client,
        phoneNumber: "+1234567896",
        firebaseUid: "test_client2_uid",
        fullName: "Test Client 2",
        email: "client2@test.com",
      });

      const courier2 = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567897",
        firebaseUid: "test_courier2_uid",
        fullName: "Test Courier 2",
        email: "courier2@test.com",
      });

      // Set up second courier
      await testDb.createTestDriver(
        {
          vehicle: {
            categoryId: 2,
            vehicleNumber: "DL12CD5678",
            model: "Bajaj Auto",
            year: 2023,
          },
          isAvailable: true,
          isOnline: true,
        },
        courier2.user_id,
      );

      // Get tokens for new users
      const mockFirebaseResponse = {
        uid: "test_client2_uid",
        phone_number: "+1234567896",
        email: "client2@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const client2Login = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "integration_client2_token",
          fullName: "Test Client 2",
          role: "client",
        })
        .set(createTestDeviceHeaders("integration_client2_device"));

      const client2Token = client2Login.body.data.tokens.accessToken;

      const courier2Login = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "integration_courier2_token",
          fullName: "Test Courier 2",
          role: "courier",
        })
        .set(createTestDeviceHeaders("integration_courier2_device"));

      const courier2Token = courier2Login.body.data.tokens.accessToken;

      // Create orders for both clients
      const order1Data = {
        deliveryTypeId: 1,
        pickupAddress: "123 Multi Client 1 Pickup, Test City, Test State",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupContactName: "Multi Client 1 Pickup",
        pickupContactPhone: "+1234567890",
        deliveryAddress: "456 Multi Client 1 Delivery, Test City, Test State",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryContactName: "Multi Client 1 Delivery",
        deliveryContactPhone: "+1234567891",
        weight: 1.5,
        dimensions: { length: 25, width: 15, height: 10 },
        declaredValue: 600,
        items: [
          {
            name: "Multi Client 1 Package",
            quantity: 1,
            weight: 1.5,
            dimensions: { length: 25, width: 15, height: 10 },
            value: 600,
          },
        ],
      };

      const order2Data = {
        deliveryTypeId: 2,
        pickupAddress: "123 Multi Client 2 Pickup, Test City, Test State",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 28.6138,
        pickupLongitude: 77.2091,
        pickupContactName: "Multi Client 2 Pickup",
        pickupContactPhone: "+1234567890",
        deliveryAddress: "456 Multi Client 2 Delivery, Test City, Test State",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 28.7042,
        deliveryLongitude: 77.1026,
        deliveryContactName: "Multi Client 2 Delivery",
        deliveryContactPhone: "+1234567891",
        weight: 3.0,
        dimensions: { length: 40, width: 30, height: 20 },
        declaredValue: 1200,
        items: [
          {
            name: "Multi Client 2 Package",
            quantity: 1,
            weight: 3.0,
            dimensions: { length: 40, width: 30, height: 20 },
            value: 1200,
          },
        ],
      };

      // Create orders simultaneously
      const [order1Response, order2Response] = await Promise.all([
        request(app.server)
          .post("/api/v1/orders")
          .set(createTestAuthHeaders(clientToken))
          .send(order1Data),
        request(app.server)
          .post("/api/v1/orders")
          .set(createTestAuthHeaders(client2Token))
          .send(order2Data),
      ]);

      expect(order1Response.status).toBe(201);
      expect(order2Response.status).toBe(201);

      const order1Id = order1Response.body.data.orderId;
      const order2Id = order2Response.body.data.orderId;

      // Both couriers should see both orders as available
      const availableResponse1 = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      const availableResponse2 = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courier2Token))
        .expect(200);

      expect(availableResponse1.body.data.length).toBe(2);
      expect(availableResponse2.body.data.length).toBe(2);

      // Couriers should only see their own orders in their personal list
      const client1Orders = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const client2Orders = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(client2Token))
        .expect(200);

      expect(client1Orders.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ orderId: order1Id }),
        ]),
      );
      expect(client1Orders.body.data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ orderId: order2Id }),
        ]),
      );

      expect(client2Orders.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ orderId: order2Id }),
        ]),
      );
      expect(client2Orders.body.data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ orderId: order1Id }),
        ]),
      );
    }, 30000);
  });

  describe("Error Recovery", () => {
    it("should handle authentication failures gracefully", async () => {
      // Test with invalid token
      const invalidTokenResponse = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders("invalid_token"))
        .expect(401);

      expect(invalidTokenResponse.body).toMatchObject({
        success: false,
        message: "Invalid token",
      });

      // Test with expired token
      const expiredTokenResponse = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders("expired_token"))
        .expect(401);

      expect(expiredTokenResponse.body).toMatchObject({
        success: false,
        message: expect.stringContaining("expired"),
      });

      // Test without token
      const noTokenResponse = await request(app.server)
        .get("/api/v1/users/me")
        .expect(401);

      expect(noTokenResponse.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should handle database connectivity issues", async () => {
      // This test would require simulating database disconnection
      // For now, we'll verify normal operation continues
      const healthResponse = await request(app.server)
        .get("/health")
        .expect(200);

      expect(healthResponse.body.status).toBe("ok");

      // Verify database queries work
      const dbStatus = await testDb.query("SELECT 1 as status");
      expect(dbStatus.rows[0].status).toBe(1);
    });

    it("should handle concurrent authentication", async () => {
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      // Multiple login attempts
      const loginAttempts = [];
      for (let i = 0; i < 5; i++) {
        loginAttempts.push(
          request(app.server)
            .post("/api/v1/auth/firebase/verify")
            .send({
              idToken: `concurrent_token_${i}`,
              fullName: testUsers.client.fullName,
              role: testUsers.client.role,
            })
            .set(createTestDeviceHeaders(`device_${i}`)),
        );
      }

      const responses = await Promise.all(loginAttempts);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Each should create separate sessions
      const sessionCount = await testDb.query(
        "SELECT COUNT(*) as count FROM users.auth_sessions WHERE user_id = $1",
        [clientUser.user_id],
      );
      expect(parseInt(sessionCount.rows[0].count)).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Performance Under Load", () => {
    it("should handle multiple concurrent API requests", async () => {
      const requests = [];

      // Mix of different endpoints
      for (let i = 0; i < 20; i++) {
        const endpoints = [
          request(app.server).get("/health"),
          request(app.server).get("/api/v1/static/delivery-types"),
          request(app.server)
            .get("/api/v1/orders/available")
            .set(createTestAuthHeaders(courierToken)),
          request(app.server)
            .get("/api/v1/orders")
            .set(createTestAuthHeaders(clientToken)),
          request(app.server)
            .get("/api/v1/drivers/me")
            .set(createTestAuthHeaders(courierToken)),
        ];

        requests.push(endpoints[i % endpoints.length]);
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBeLessThan(500);
      });

      const totalTime = endTime - startTime;
      console.log(
        `📊 Handled ${requests.length} concurrent requests in ${totalTime}ms`,
      );

      // Should complete reasonably quickly
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds
    }, 15000);

    it("should maintain data consistency under concurrent load", async () => {
      // Create multiple orders concurrently
      const orderPromises = [];
      for (let i = 0; i < 10; i++) {
        const orderData = {
          deliveryTypeId: 1,
          pickupAddress: `123 Load Test ${i} Pickup, Test City, Test State`,
          pickupCity: "Test City",
          pickupState: "Test State",
          pickupLatitude: 28.6139,
          pickupLongitude: 77.209,
          pickupContactName: `Load Test ${i} Pickup`,
          pickupContactPhone: "+1234567890",
          deliveryAddress: `456 Load Test ${i} Delivery, Test City, Test State`,
          deliveryCity: "Test City",
          deliveryState: "Test State",
          deliveryLatitude: 28.7041,
          deliveryLongitude: 77.1025,
          deliveryContactName: `Load Test ${i} Delivery`,
          deliveryContactPhone: "+1234567891",
          weight: 1.0,
          dimensions: { length: 20, width: 15, height: 10 },
          declaredValue: 500,
          items: [
            {
              name: `Load Test ${i} Package`,
              quantity: 1,
              weight: 1.0,
              dimensions: { length: 20, width: 15, height: 10 },
              value: 500,
            },
          ],
        };

        orderPromises.push(
          request(app.server)
            .post("/api/v1/orders")
            .set(createTestAuthHeaders(clientToken))
            .send(orderData),
        );
      }

      const responses = await Promise.all(orderPromises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // Verify all orders were created
      const ordersResponse = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(ordersResponse.body.data.length).toBeGreaterThanOrEqual(10);

      // Verify data consistency
      ordersResponse.body.data.forEach((order) => {
        expect(order).toMatchObject({
          orderId: expect.any(Number),
          orderUuid: expect.any(String),
          clientId: clientUser.user_id,
        });
      });
    }, 20000);
  });
});
