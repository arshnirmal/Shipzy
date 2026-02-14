// tests/orders.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const {
  createTestAuthHeaders,
  createTestDeviceHeaders,
  testAddresses,
  testOrder,
  testUsers,
} = require("./setup.js");

describe("Orders API", () => {
  let app;
  let clientUser;
  let courierUser1;
  let courierUser2;
  let clientToken;
  let courierToken1;
  let courierToken2;

  beforeAll(async () => {
    const appModule = await import("../src/app.js");
    app = await appModule.buildApp();
    await testDb.setup();

    // Create test users
    clientUser = await testDb.createTestUser(testUsers.client);
    courierUser1 = await testDb.createTestUser(testUsers.courier);
    courierUser2 = await testDb.createTestUser({
      ...testUsers.courier,
      phoneNumber: "+1234567892",
      firebaseUid: "test_courier_2_uid",
      fullName: "Test Courier 2",
      email: "courier2@test.com",
    });

    // Set up courier status
    await testDb.createTestDriver(
      {
        vehicle: {
          categoryId: 1,
          vehicleNumber: "DL12CD5678",
          model: "Honda Activa",
          year: 2023,
        },
        isAvailable: true,
        isOnline: true,
      },
      courierUser1.user_id,
    );

    await testDb.createTestDriver(
      {
        vehicle: {
          categoryId: 2,
          vehicleNumber: "DL12EF9012",
          model: "Bajaj Auto",
          year: 2023,
        },
        isAvailable: true,
        isOnline: true,
      },
      courierUser2.user_id,
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
        idToken: "valid_token_client",
        fullName: testUsers.client.fullName,
        role: testUsers.client.role,
      })
      .set(createTestDeviceHeaders("client_device"));

    clientToken = clientLogin.body.data.tokens.accessToken;

    const courierLogin1 = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "valid_token_courier1",
        fullName: testUsers.courier.fullName,
        role: testUsers.courier.role,
      })
      .set(createTestDeviceHeaders("courier1_device"));

    courierToken1 = courierLogin1.body.data.tokens.accessToken;

    const courierLogin2 = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "valid_token_courier2",
        fullName: "Test Courier 2",
        role: "courier",
      })
      .set(createTestDeviceHeaders("courier2_device"));

    courierToken2 = courierLogin2.body.data.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  describe("POST /api/v1/orders/calculate-fare", () => {
    it("should calculate fare successfully", async () => {
      const fareRequest = {
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        weight: 2.5,
        deliveryTypeId: 1,
        declaredValue: 1000,
      };

      const response = await request(app.server)
        .post("/api/v1/orders/calculate-fare")
        .set(createTestAuthHeaders(clientToken))
        .send(fareRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Fare calculated successfully",
        data: expect.objectContaining({
          baseFare: expect.any(Number),
          distanceFee: expect.any(Number),
          weightFee: expect.any(Number),
          totalFare: expect.any(Number),
          estimatedDistance: expect.any(Number),
          estimatedDuration: expect.any(Number),
        }),
      });

      expect(response.body.data.totalFare).toBeGreaterThan(0);
      expect(response.body.data.baseFare).toBeGreaterThan(0);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders/calculate-fare")
        .set(createTestAuthHeaders(clientToken))
        .send({
          // Missing required fields
          pickupLatitude: 28.6139,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid coordinates", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders/calculate-fare")
        .set(createTestAuthHeaders(clientToken))
        .send({
          pickupLatitude: 91, // Invalid latitude
          pickupLongitude: 77.209,
          deliveryLatitude: 28.7041,
          deliveryLongitude: 77.1025,
          weight: 2.5,
          deliveryTypeId: 1,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for negative weight", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders/calculate-fare")
        .set(createTestAuthHeaders(clientToken))
        .send({
          pickupLatitude: 28.6139,
          pickupLongitude: 77.209,
          deliveryLatitude: 28.7041,
          deliveryLongitude: 77.1025,
          weight: -1, // Invalid negative weight
          deliveryTypeId: 1,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should work without authentication", async () => {
      const fareRequest = {
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        weight: 2.5,
        deliveryTypeId: 1,
      };

      const response = await request(app.server)
        .post("/api/v1/orders/calculate-fare")
        .send(fareRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalFare: expect.any(Number),
        }),
      });
    });
  });

  describe("POST /api/v1/orders", () => {
    let testOrderId;

    it("should create order successfully", async () => {
      const orderData = {
        deliveryTypeId: 1,
        pickupAddress: testAddresses.pickup.fullAddress,
        pickupCity: testAddresses.pickup.city,
        pickupState: testAddresses.pickup.state,
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress: testAddresses.delivery.fullAddress,
        deliveryCity: testAddresses.delivery.city,
        deliveryState: testAddresses.delivery.state,
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: testOrder.weight,
        dimensions: testOrder.dimensions,
        declaredValue: testOrder.declaredValue,
        specialInstructions: testOrder.specialInstructions,
        items: testOrder.items,
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(orderData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order created successfully",
        data: expect.objectContaining({
          orderId: expect.any(Number),
          orderUuid: expect.any(String),
          clientId: clientUser.user_id,
          deliveryTypeId: orderData.deliveryTypeId,
          status: expect.objectContaining({
            statusId: 1,
            name: "pending",
          }),
          pickupLocation: expect.objectContaining({
            address: orderData.pickupAddress,
            latitude: orderData.pickupLatitude,
            longitude: orderData.pickupLongitude,
          }),
          deliveryLocation: expect.objectContaining({
            address: orderData.deliveryAddress,
            latitude: orderData.deliveryLatitude,
            longitude: orderData.deliveryLongitude,
          }),
          weight: orderData.weight,
          dimensions: orderData.dimensions,
          declaredValue: orderData.declaredValue,
          specialInstructions: orderData.specialInstructions,
        }),
      });

      testOrderId = response.body.data.orderId;
    });

    it("should return 403 for non-client role", async () => {
      const orderData = {
        deliveryTypeId: 1,
        pickupAddress: testAddresses.pickup.fullAddress,
        pickupCity: testAddresses.pickup.city,
        pickupState: testAddresses.pickup.state,
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress: testAddresses.delivery.fullAddress,
        deliveryCity: testAddresses.delivery.city,
        deliveryState: testAddresses.delivery.state,
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        specialInstructions: "Handle with care",
        items: [
          {
            name: "Test Package",
            quantity: 1,
            weight: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            value: 1000,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(courierToken1))
        .send(orderData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: client",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders")
        .send({
          deliveryTypeId: 1,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupContactName: "Pickup Contact",
          pickupContactPhone: "+1234567890",
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryContactName: "Delivery Contact",
          deliveryContactPhone: "+1234567891",
          weight: 2.5,
          dimensions: { length: 30, width: 20, height: 15 },
          declaredValue: 1000,
          items: [
            {
              name: "Test Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 400 for invalid order data", async () => {
      const invalidOrder = {
        deliveryTypeId: 999, // Invalid delivery type
        pickupAddress: testAddresses.pickup.fullAddress,
        pickupCity: testAddresses.pickup.city,
        pickupState: testAddresses.pickup.state,
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress: testAddresses.delivery.fullAddress,
        deliveryCity: testAddresses.delivery.city,
        deliveryState: testAddresses.delivery.state,
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        items: [
          {
            name: "Test Package",
            quantity: 1,
            weight: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            value: 1000,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidOrder)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should create order with minimal required data", async () => {
      const minimalOrder = {
        deliveryTypeId: 1,
        pickupAddress: testAddresses.pickup.fullAddress,
        pickupCity: testAddresses.pickup.city,
        pickupState: testAddresses.pickup.state,
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryAddress: testAddresses.delivery.fullAddress,
        deliveryCity: testAddresses.delivery.city,
        deliveryState: testAddresses.delivery.state,
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Delivery Contact",
        deliveryContactPhone: "+1234567891",
        weight: 1.0,
        dimensions: { length: 20, width: 15, height: 10 },
        declaredValue: 500,
        items: [
          {
            name: "Minimal Package",
            quantity: 1,
            weight: 1.0,
            dimensions: { length: 20, width: 15, height: 10 },
            value: 500,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(minimalOrder)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          orderId: expect.any(Number),
          orderUuid: expect.any(String),
        }),
      });
    });
  });

  describe("GET /api/v1/orders", () => {
    beforeEach(async () => {
      // Create multiple test orders
      const orders = [
        {
          deliveryTypeId: 1,
          statusId: 1, // Pending
          weight: 2.5,
          declaredValue: 1000,
        },
        {
          deliveryTypeId: 2,
          statusId: 2, // Assigned
          weight: 1.5,
          declaredValue: 500,
        },
        {
          deliveryTypeId: 1,
          statusId: 5, // Completed
          weight: 3.0,
          declaredValue: 1500,
        },
      ];

      for (const orderData of orders) {
        await testDb.createTestOrder(
          {
            ...orderData,
            clientId: clientUser.user_id,
            pickupAddress: testAddresses.pickup.fullAddress,
            pickupLatitude: testAddresses.pickup.latitude,
            pickupLongitude: testAddresses.pickup.longitude,
            pickupCity: testAddresses.pickup.city,
            pickupState: testAddresses.pickup.state,
            deliveryAddress: testAddresses.delivery.fullAddress,
            deliveryLatitude: testAddresses.delivery.latitude,
            deliveryLongitude: testAddresses.delivery.longitude,
            deliveryCity: testAddresses.delivery.city,
            deliveryState: testAddresses.delivery.state,
            pickupContactName: "Test Pickup",
            pickupContactPhone: "+1234567890",
            deliveryContactName: "Test Delivery",
            deliveryContactPhone: "+1234567891",
            specialInstructions: "Test order",
            items: [
              {
                name: "Test Package",
                quantity: 1,
                weight: orderData.weight,
                dimensions: { length: 30, width: 20, height: 15 },
                value: orderData.declaredValue,
              },
            ],
          },
          clientUser.user_id,
        );
      }
    });

    it("should return user orders", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Orders retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            orderId: expect.any(Number),
            orderUuid: expect.any(String),
            clientId: clientUser.user_id,
            deliveryTypeId: expect.any(Number),
            status: expect.objectContaining({
              statusId: expect.any(Number),
              name: expect.any(String),
            }),
            weight: expect.any(Number),
            declaredValue: expect.any(Number),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should support pagination", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?page=1&limit=2")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 2,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it("should filter orders by status", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?status=pending")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            status: expect.objectContaining({
              name: "pending",
            }),
          }),
        ]),
      });

      // All returned orders should have pending status
      response.body.data.forEach((order) => {
        expect(order.status.name).toBe("pending");
      });
    });

    it("should filter orders by date range", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?startDate=2024-01-01&endDate=2024-12-31")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should return empty array for user with no orders", async () => {
      // Create user without orders
      const newClient = await testDb.createTestUser({
        ...testUsers.client,
        phoneNumber: "+1234567893",
        firebaseUid: "test_client_no_orders_uid",
        fullName: "Client No Orders",
        email: "client_no_orders@test.com",
      });

      const mockFirebaseResponse = {
        uid: "test_client_no_orders_uid",
        phone_number: "+1234567893",
        email: "client_no_orders@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_no_orders",
          fullName: "Client No Orders",
          role: "client",
        })
        .set(createTestDeviceHeaders("client_no_orders_device"));

      const noOrdersToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(noOrdersToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        pagination: expect.objectContaining({
          total: 0,
          totalPages: 0,
        }),
      });
    });

    it("should return 403 for non-client role", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(courierToken1))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: client",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("GET /api/v1/orders/available", () => {
    beforeEach(async () => {
      // Create orders in different statuses
      await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1, // Pending
          weight: 2.5,
          declaredValue: 1000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Available Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Available Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Available for pickup",
          items: [
            {
              name: "Available Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        },
        clientUser.user_id,
      );

      // Create assigned order (should not appear in available)
      const assignedOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 2, // Assigned
          weight: 1.5,
          declaredValue: 500,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Assigned Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Assigned Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Already assigned",
          items: [
            {
              name: "Assigned Package",
              quantity: 1,
              weight: 1.5,
              dimensions: { length: 25, width: 15, height: 10 },
              value: 500,
            },
          ],
        },
        clientUser.user_id,
      );

      // Assign the order to courier1
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at
        ) VALUES ($1, $2, $3, NOW())
      `,
        [assignedOrder.order_id, courierUser1.user_id, 2],
      );
    });

    it("should return available orders for couriers", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken1))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Available orders retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            orderId: expect.any(Number),
            orderUuid: expect.any(String),
            status: expect.objectContaining({
              statusId: 1,
              name: "pending",
            }),
            pickupLocation: expect.objectContaining({
              address: expect.any(String),
              latitude: expect.any(Number),
              longitude: expect.any(Number),
            }),
            deliveryLocation: expect.objectContaining({
              address: expect.any(String),
              latitude: expect.any(Number),
              longitude: expect.any(Number),
            }),
            weight: expect.any(Number),
            declaredValue: expect.any(Number),
            estimatedFare: expect.any(Number),
          }),
        ]),
      });
    });

    it("should not return assigned orders in available list", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken1))
        .expect(200);

      const availableOrders = response.body.data;

      // Should not contain assigned orders
      availableOrders.forEach((order) => {
        expect(order.status.name).not.toBe("assigned");
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(clientToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should filter available orders by courier capabilities", async () => {
      // Create order that exceeds courier1's vehicle capacity
      await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1,
          weight: 50, // Too heavy for 2-wheeler
          declaredValue: 10000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Heavy Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Heavy Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Heavy order",
          items: [
            {
              name: "Heavy Package",
              quantity: 1,
              weight: 50,
              dimensions: { length: 100, width: 80, height: 60 },
              value: 10000,
            },
          ],
        },
        clientUser.user_id,
      );

      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken1)) // 2-wheeler courier
        .expect(200);

      // Should not include orders that exceed vehicle capacity
      const availableOrders = response.body.data;
      availableOrders.forEach((order) => {
        expect(order.weight).toBeLessThanOrEqual(10); // 2-wheeler limit
      });
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1,
          weight: 2.5,
          declaredValue: 1000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Order Detail Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Order Detail Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Order details test",
          items: [
            {
              name: "Detail Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        },
        clientUser.user_id,
      );
    });

    it("should return order details for client", async () => {
      const response = await request(app.server)
        .get(`/api/v1/orders/${testOrder.order_id}`)
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order details retrieved successfully",
        data: expect.objectContaining({
          orderId: testOrder.order_id,
          orderUuid: expect.any(String),
          clientId: clientUser.user_id,
          status: expect.objectContaining({
            statusId: 1,
            name: "pending",
          }),
          pickupLocation: expect.objectContaining({
            address: testAddresses.pickup.fullAddress,
            latitude: testAddresses.pickup.latitude,
            longitude: testAddresses.pickup.longitude,
          }),
          deliveryLocation: expect.objectContaining({
            address: testAddresses.delivery.fullAddress,
            latitude: testAddresses.delivery.latitude,
            longitude: testAddresses.delivery.longitude,
          }),
          weight: 2.5,
          declaredValue: 1000,
          items: expect.arrayContaining([
            expect.objectContaining({
              name: "Detail Package",
              quantity: 1,
              weight: 2.5,
              value: 1000,
            }),
          ]),
        }),
      });
    });

    it("should return order details for assigned courier", async () => {
      // Assign order to courier
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at
        ) VALUES ($1, $2, $3, NOW())
      `,
        [testOrder.order_id, courierUser1.user_id, 2],
      );

      // Update order status to assigned
      await testDb.query(
        `
        UPDATE orders.requests SET status_id = 2 WHERE order_id = $1
      `,
        [testOrder.order_id],
      );

      const response = await request(app.server)
        .get(`/api/v1/orders/${testOrder.order_id}`)
        .set(createTestAuthHeaders(courierToken1))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          orderId: testOrder.order_id,
          assignment: expect.objectContaining({
            assignmentId: expect.any(Number),
            courierId: courierUser1.user_id,
            status: expect.objectContaining({
              statusId: 2,
              name: "assigned",
            }),
          }),
        }),
      });
    });

    it("should return 404 for non-existent order", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/99999")
        .set(createTestAuthHeaders(clientToken))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order not found",
      });
    });

    it("should return 403 for order belonging to another client", async () => {
      // Create another client
      const otherClient = await testDb.createTestUser({
        ...testUsers.client,
        phoneNumber: "+1234567894",
        firebaseUid: "test_other_client_uid",
        fullName: "Other Client",
        email: "other_client@test.com",
      });

      const otherOrder = await testDb.createTestOrder(
        {
          clientId: otherClient.user_id,
          deliveryTypeId: 1,
          statusId: 1,
          weight: 1.0,
          declaredValue: 500,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Other Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Other Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Other client order",
          items: [
            {
              name: "Other Package",
              quantity: 1,
              weight: 1.0,
              dimensions: { length: 20, width: 15, height: 10 },
              value: 500,
            },
          ],
        },
        otherClient.user_id,
      );

      const response = await request(app.server)
        .get(`/api/v1/orders/${otherOrder.order_id}`)
        .set(createTestAuthHeaders(clientToken)) // Original client trying to access other client's order
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Order belongs to another user.",
      });
    });

    it("should return 400 for invalid order ID format", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/invalid_id")
        .set(createTestAuthHeaders(clientToken))
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get(`/api/v1/orders/${testOrder.order_id}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("POST /api/v1/orders/:id/cancel", () => {
    let cancellableOrder;
    let assignedOrder;

    beforeEach(async () => {
      // Create cancellable order (pending)
      cancellableOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1, // Pending
          weight: 2.5,
          declaredValue: 1000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Cancellable Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Cancellable Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Cancellable order",
          items: [
            {
              name: "Cancellable Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        },
        clientUser.user_id,
      );

      // Create assigned order (should not be cancellable by client)
      assignedOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 2, // Assigned
          weight: 1.5,
          declaredValue: 500,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Assigned Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Assigned Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Assigned order",
          items: [
            {
              name: "Assigned Package",
              quantity: 1,
              weight: 1.5,
              dimensions: { length: 25, width: 15, height: 10 },
              value: 500,
            },
          ],
        },
        clientUser.user_id,
      );

      // Assign the order to courier
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at
        ) VALUES ($1, $2, $3, NOW())
      `,
        [assignedOrder.order_id, courierUser1.user_id, 2],
      );
    });

    it("should cancel pending order successfully", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${cancellableOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Changed mind",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order cancelled successfully",
        data: expect.objectContaining({
          orderId: cancellableOrder.order_id,
          status: expect.objectContaining({
            statusId: 6, // Cancelled
            name: "cancelled",
          }),
        }),
      });

      // Verify order status was updated in database
      const orderQuery =
        "SELECT status_id FROM orders.requests WHERE order_id = $1";
      const updatedOrder = await testDb.query(orderQuery, [
        cancellableOrder.order_id,
      ]);

      expect(updatedOrder.rows[0].status_id).toBe(6); // Cancelled
    });

    it("should return 400 for missing cancellation reason", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${cancellableOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 404 for non-existent order", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders/99999/cancel")
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Test reason",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order not found",
      });
    });

    it("should return 403 for order belonging to another client", async () => {
      // Create another client
      const otherClient = await testDb.createTestUser({
        ...testUsers.client,
        phoneNumber: "+1234567895",
        firebaseUid: "test_other_client_cancel_uid",
        fullName: "Other Client Cancel",
        email: "other_client_cancel@test.com",
      });

      const otherOrder = await testDb.createTestOrder(
        {
          clientId: otherClient.user_id,
          deliveryTypeId: 1,
          statusId: 1,
          weight: 1.0,
          declaredValue: 500,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Other Cancel Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Other Cancel Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Other client cancellable order",
          items: [
            {
              name: "Other Cancel Package",
              quantity: 1,
              weight: 1.0,
              dimensions: { length: 20, width: 15, height: 10 },
              value: 500,
            },
          ],
        },
        otherClient.user_id,
      );

      const response = await request(app.server)
        .post(`/api/v1/orders/${otherOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Trying to cancel other client order",
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Order belongs to another user.",
      });
    });

    it("should return 400 for already cancelled order", async () => {
      // Cancel the order first
      await request(app.server)
        .post(`/api/v1/orders/${cancellableOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "First cancellation",
        })
        .expect(200);

      // Try to cancel again
      const response = await request(app.server)
        .post(`/api/v1/orders/${cancellableOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Second cancellation attempt",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order cannot be cancelled in current status",
      });
    });

    it("should return 400 for assigned order cancellation by client", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${assignedOrder.order_id}/cancel`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          reason: "Trying to cancel assigned order",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order cannot be cancelled in current status",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${cancellableOrder.order_id}/cancel`)
        .send({
          reason: "Unauthenticated cancellation",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("POST /api/v1/orders/:id/accept", () => {
    let availableOrder;
    let assignedOrder;

    beforeEach(async () => {
      // Create available order
      availableOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1, // Pending
          weight: 2.5,
          declaredValue: 1000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Available Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Available Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Available for acceptance",
          items: [
            {
              name: "Available Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        },
        clientUser.user_id,
      );

      // Create already assigned order
      assignedOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 2, // Assigned
          weight: 1.5,
          declaredValue: 500,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Assigned Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Assigned Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Already assigned",
          items: [
            {
              name: "Assigned Package",
              quantity: 1,
              weight: 1.5,
              dimensions: { length: 25, width: 15, height: 10 },
              value: 500,
            },
          ],
        },
        clientUser.user_id,
      );

      // Assign to another courier
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at
        ) VALUES ($1, $2, $3, NOW())
      `,
        [assignedOrder.order_id, courierUser2.user_id, 2],
      );
    });

    it("should accept available order successfully", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
          notes: "I will pick up within 30 minutes",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order accepted successfully",
        data: expect.objectContaining({
          orderId: availableOrder.order_id,
          assignment: expect.objectContaining({
            assignmentId: expect.any(Number),
            courierId: courierUser1.user_id,
            status: expect.objectContaining({
              statusId: 2,
              name: "assigned",
            }),
            estimatedArrivalTime: "2024-12-25T15:30:00Z",
            notes: "I will pick up within 30 minutes",
          }),
        }),
      });

      // Verify order status was updated
      const orderQuery =
        "SELECT status_id FROM orders.requests WHERE order_id = $1";
      const updatedOrder = await testDb.query(orderQuery, [
        availableOrder.order_id,
      ]);

      expect(updatedOrder.rows[0].status_id).toBe(2); // Assigned

      // Verify assignment was created
      const assignmentQuery =
        "SELECT * FROM orders.courier_assignments WHERE order_id = $1";
      const assignment = await testDb.query(assignmentQuery, [
        availableOrder.order_id,
      ]);

      expect(assignment.rows[0]).toMatchObject({
        courier_id: courierUser1.user_id,
        assignment_status_id: 2,
        estimated_arrival_time: new Date("2024-12-25T15:30:00Z"),
        notes: "I will pick up within 30 minutes",
      });
    });

    it("should return 404 for non-existent order", async () => {
      const response = await request(app.server)
        .post("/api/v1/orders/99999/accept")
        .set(createTestAuthHeaders(courierToken1))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order not found",
      });
    });

    it("should return 404 for order not available for acceptance", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${assignedOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order not available for acceptance",
      });
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          // Missing estimatedArrivalTime
          notes: "Missing arrival time",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid estimated arrival time format", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          estimatedArrivalTime: "invalid-date-format",
          notes: "Invalid time format",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for order exceeding vehicle capacity", async () => {
      // Create heavy order
      const heavyOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 1,
          weight: 50, // Too heavy for 2-wheeler
          declaredValue: 10000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Heavy Order Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Heavy Order Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Very heavy order",
          items: [
            {
              name: "Heavy Package",
              quantity: 1,
              weight: 50,
              dimensions: { length: 100, width: 80, height: 60 },
              value: 10000,
            },
          ],
        },
        clientUser.user_id,
      );

      const response = await request(app.server)
        .post(`/api/v1/orders/${heavyOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1)) // 2-wheeler courier
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
          notes: "Trying to accept heavy order",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order exceeds vehicle capacity",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 409 for concurrent acceptance attempts", async () => {
      // Make two concurrent acceptance requests
      const accept1 = request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          estimatedArrivalTime: "2024-12-25T15:30:00Z",
          notes: "First acceptance",
        });

      const accept2 = request(app.server)
        .post(`/api/v1/orders/${availableOrder.order_id}/accept`)
        .set(createTestAuthHeaders(courierToken2))
        .send({
          estimatedArrivalTime: "2024-12-25T15:45:00Z",
          notes: "Second acceptance",
        });

      const [response1, response2] = await Promise.all([accept1, accept2]);

      // One should succeed, one should fail
      expect([response1.status, response2.status]).toEqual(
        expect.arrayContaining([200, 409]),
      );

      // The successful one should have created an assignment
      const successResponse = response1.status === 200 ? response1 : response2;
      expect(successResponse.body).toMatchObject({
        success: true,
        message: "Order accepted successfully",
      });
    });
  });

  describe("PUT /api/v1/orders/:id/status", () => {
    let assignedOrder;
    let acceptedAssignment;

    beforeEach(async () => {
      // Create order and assign to courier
      assignedOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 2, // Assigned
          weight: 2.5,
          declaredValue: 1000,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Status Update Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Status Update Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Status update test",
          items: [
            {
              name: "Status Update Package",
              quantity: 1,
              weight: 2.5,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 1000,
            },
          ],
        },
        clientUser.user_id,
      );

      // Create assignment
      const assignmentResult = await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at, accepted_at
        ) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING assignment_id
      `,
        [assignedOrder.order_id, courierUser1.user_id, 2],
      );

      acceptedAssignment = assignmentResult.rows[0];
    });

    it("should update order status successfully", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 3, // Picked up
          notes: "Package picked up successfully",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Order status updated successfully",
        data: expect.objectContaining({
          orderId: assignedOrder.order_id,
          status: expect.objectContaining({
            statusId: 3,
            name: "picked_up",
          }),
          assignment: expect.objectContaining({
            notes: "Package picked up successfully",
          }),
        }),
      });

      // Verify order status was updated
      const orderQuery =
        "SELECT status_id FROM orders.requests WHERE order_id = $1";
      const updatedOrder = await testDb.query(orderQuery, [
        assignedOrder.order_id,
      ]);

      expect(updatedOrder.rows[0].status_id).toBe(3);

      // Verify assignment was updated
      const assignmentQuery =
        "SELECT * FROM orders.courier_assignments WHERE assignment_id = $1";
      const updatedAssignment = await testDb.query(assignmentQuery, [
        acceptedAssignment.assignment_id,
      ]);

      expect(updatedAssignment.rows[0]).toMatchObject({
        assignment_status_id: 3,
        notes: "Package picked up successfully",
      });
    });

    it("should update status to in_transit", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 4, // In transit
          notes: "Package in transit to delivery location",
        })
        .expect(200);

      expect(response.body.data.status.statusId).toBe(4);
      expect(response.body.data.assignment.notes).toBe(
        "Package in transit to delivery location",
      );
    });

    it("should update status to delivered", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 5, // Delivered
          notes: "Package delivered successfully",
        })
        .expect(200);

      expect(response.body.data.status.statusId).toBe(5);

      // Verify completion time was set
      const assignmentQuery =
        "SELECT completed_at FROM orders.courier_assignments WHERE assignment_id = $1";
      const completedAssignment = await testDb.query(assignmentQuery, [
        acceptedAssignment.assignment_id,
      ]);

      expect(completedAssignment.rows[0].completed_at).toBeTruthy();
    });

    it("should return 400 for invalid status transition", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 6, // Cancelled - invalid transition from assigned
          notes: "Invalid status transition",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid status transition",
      });
    });

    it("should return 400 for invalid status ID", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 999, // Invalid status ID
          notes: "Invalid status ID",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for missing status ID", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken1))
        .send({
          notes: "Missing status ID",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 404 for non-existent order", async () => {
      const response = await request(app.server)
        .put("/api/v1/orders/99999/status")
        .set(createTestAuthHeaders(courierToken1))
        .send({
          statusId: 3,
          notes: "Non-existent order",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Order not found",
      });
    });

    it("should return 404 for order not assigned to courier", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(courierToken2)) // Different courier
        .send({
          statusId: 3,
          notes: "Wrong courier trying to update",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Assignment not found",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .set(createTestAuthHeaders(clientToken))
        .send({
          statusId: 3,
          notes: "Client trying to update status",
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
        .send({
          statusId: 3,
          notes: "Unauthenticated request",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should handle status transitions correctly", async () => {
      const statusTransitions = [
        { statusId: 3, name: "picked_up" }, // Assigned -> Picked up
        { statusId: 4, name: "in_transit" }, // Picked up -> In transit
        { statusId: 5, name: "delivered" }, // In transit -> Delivered
      ];

      for (const transition of statusTransitions) {
        const response = await request(app.server)
          .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
          .set(createTestAuthHeaders(courierToken1))
          .send({
            statusId: transition.statusId,
            notes: `Updated to ${transition.name}`,
          })
          .expect(200);

        expect(response.body.data.status.statusId).toBe(transition.statusId);

        // Update for next transition
        assignedOrder.order_id = response.body.data.orderId; // In case order_id changes
      }
    });

    // --- Rating tests (client rates delivered order) ---
    describe("POST /api/v1/orders/:id/rate", () => {
      let newOrderId;

      beforeEach(async () => {
        // Create an order via API so controllers/services manage assignments/statuses
        const orderBody = {
          deliveryTypeId: 1,
          vehicleCategoryId: 1,
          weightTierId: 1,
          paymentMethodId: 1,
          fareBreakdown: {
            basePrice: 50,
            distanceKm: 5.2,
            distancePrice: 25,
            weightSurcharge: 0,
            totalPrice: 75,
            currency: "INR",
          },
          pickup: {
            address: testAddresses.pickup.fullAddress,
            latitude: testAddresses.pickup.latitude,
            longitude: testAddresses.pickup.longitude,
            city: testAddresses.pickup.city,
            state: testAddresses.pickup.state,
            postalCode: testAddresses.pickup.postalCode,
            contactName: "Client Pickup",
            contactPhone: "+1234567890",
          },
          delivery: {
            address: testAddresses.delivery.fullAddress,
            latitude: testAddresses.delivery.latitude,
            longitude: testAddresses.delivery.longitude,
            city: testAddresses.delivery.city,
            state: testAddresses.delivery.state,
            postalCode: testAddresses.delivery.postalCode,
            contactName: "Client Delivery",
            contactPhone: "+1234567891",
          },
        };

        const res = await request(app.server)
          .post("/api/v1/orders")
          .set(createTestAuthHeaders(clientToken))
          .send(orderBody)
          .expect(201);

        newOrderId = res.body.data.orderId;

        // Accept as courier
        await request(app.server)
          .post(`/api/v1/orders/${newOrderId}/accept`)
          .set(createTestAuthHeaders(courierToken1))
          .expect(200);

        // Advance status to delivered
        await request(app.server)
          .put(`/api/v1/orders/${newOrderId}/status`)
          .set(createTestAuthHeaders(courierToken1))
          .send({ status: "picked_up" })
          .expect(200);

        await request(app.server)
          .put(`/api/v1/orders/${newOrderId}/status`)
          .set(createTestAuthHeaders(courierToken1))
          .send({ status: "delivered" })
          .expect(200);
      });

      it("should allow client to rate a delivered order", async () => {
        const response = await request(app.server)
          .post(`/api/v1/orders/${newOrderId}/rate`)
          .set(createTestAuthHeaders(clientToken))
          .send({ rating: 5, comment: "Great delivery" })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: "Order rated successfully",
          data: expect.objectContaining({ rating: 5, orderId: newOrderId }),
        });

        // Duplicate rating should fail
        const dup = await request(app.server)
          .post(`/api/v1/orders/${newOrderId}/rate`)
          .set(createTestAuthHeaders(clientToken))
          .send({ rating: 4 })
          .expect(400);

        expect(dup.body.message).toMatch(/Rating already exists/);
      });

      it("should not allow rating before delivery", async () => {
        // Create another order and accept but do not deliver
        const res = await request(app.server)
          .post("/api/v1/orders")
          .set(createTestAuthHeaders(clientToken))
          .send({
            deliveryTypeId: 1,
            vehicleCategoryId: 1,
            weightTierId: 1,
            paymentMethodId: 1,
            fareBreakdown: { basePrice: 50, distanceKm: 1, distancePrice: 10, weightSurcharge: 0, totalPrice: 60, currency: "INR" },
            pickup: { address: testAddresses.pickup.fullAddress, latitude: testAddresses.pickup.latitude, longitude: testAddresses.pickup.longitude, city: testAddresses.pickup.city, state: testAddresses.pickup.state, postalCode: testAddresses.pickup.postalCode, contactName: "Client", contactPhone: "+1234567890" },
            delivery: { address: testAddresses.delivery.fullAddress, latitude: testAddresses.delivery.latitude, longitude: testAddresses.delivery.longitude, city: testAddresses.delivery.city, state: testAddresses.delivery.state, postalCode: testAddresses.delivery.postalCode, contactName: "Client", contactPhone: "+1234567891" },
          })
          .expect(201);

        const pendingOrderId = res.body.data.orderId;

        await request(app.server)
          .post(`/api/v1/orders/${pendingOrderId}/accept`)
          .set(createTestAuthHeaders(courierToken1))
          .expect(200);

        const response = await request(app.server)
          .post(`/api/v1/orders/${pendingOrderId}/rate`)
          .set(createTestAuthHeaders(clientToken))
          .send({ rating: 5 })
          .expect(400);

        expect(response.body.message).toMatch(/rate delivered orders/i);
      });

      it("should reject rating by non-owner", async () => {
        const otherClient = await testDb.createTestUser({
          ...testUsers.client,
          phoneNumber: "+1234567999",
          firebaseUid: "other_client_uid",
        });

        const firebaseAdmin = require("firebase-admin");
        firebaseAdmin.auth = () => ({ verifyIdToken: jest.fn().mockResolvedValue({ uid: "other_client_uid", phone_number: "+1234567999" }) });

        const loginResp = await request(app.server)
          .post("/api/v1/auth/firebase/verify")
          .send({ idToken: "valid_token_other_client", fullName: "Other Client", role: "client" })
          .set(createTestDeviceHeaders("other_client_device"));

        const otherToken = loginResp.body.data.tokens.accessToken;

        const response = await request(app.server)
          .post(`/api/v1/orders/${newOrderId}/rate`)
          .set(createTestAuthHeaders(otherToken))
          .send({ rating: 4 })
          .expect(403);

        expect(response.body.message).toMatch(/rate your own orders/i);
      });

      it("should validate rating value range", async () => {
        const response = await request(app.server)
          .post(`/api/v1/orders/${newOrderId}/rate`)
          .set(createTestAuthHeaders(clientToken))
          .send({ rating: 10 })
          .expect(400);

        expect(response.body.message).toMatch(/between 1 and 5/i);
      });
    });

        const response = await request(app.server)
          .put(`/api/v1/orders/${assignedOrder.order_id}/status`)
          .set(createTestAuthHeaders(courierToken1))
          .send({
            statusId: transition.to,
            notes: "Invalid transition",
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid status transition",
        });
      }
    });
  });

  describe("Order Filtering and Search", () => {
    beforeEach(async () => {
      // Create orders with different statuses and dates
      const orders = [
        { statusId: 1, weight: 1.0, declaredValue: 500, date: "2024-01-15" },
        { statusId: 2, weight: 2.0, declaredValue: 1000, date: "2024-02-15" },
        { statusId: 3, weight: 3.0, declaredValue: 1500, date: "2024-03-15" },
        { statusId: 5, weight: 1.5, declaredValue: 750, date: "2024-04-15" },
      ];

      for (const orderData of orders) {
        await testDb.createTestOrder(
          {
            ...orderData,
            clientId: clientUser.user_id,
            deliveryTypeId: 1,
            pickupAddress: testAddresses.pickup.fullAddress,
            pickupLatitude: testAddresses.pickup.latitude,
            pickupLongitude: testAddresses.pickup.longitude,
            pickupCity: testAddresses.pickup.city,
            pickupState: testAddresses.pickup.state,
            deliveryAddress: testAddresses.delivery.fullAddress,
            deliveryLatitude: testAddresses.delivery.latitude,
            deliveryLongitude: testAddresses.delivery.longitude,
            deliveryCity: testAddresses.delivery.city,
            deliveryState: testAddresses.delivery.state,
            pickupContactName: `Order ${orderData.statusId} Pickup`,
            pickupContactPhone: "+1234567890",
            deliveryContactName: `Order ${orderData.statusId} Delivery`,
            deliveryContactPhone: "+1234567891",
            specialInstructions: `Order ${orderData.statusId} test`,
            items: [
              {
                name: `Order ${orderData.statusId} Package`,
                quantity: 1,
                weight: orderData.weight,
                dimensions: { length: 30, width: 20, height: 15 },
                value: orderData.declaredValue,
              },
            ],
          },
          clientUser.user_id,
        );
      }
    });

    it("should filter orders by status", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?status=assigned")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const assignedOrders = response.body.data;

      assignedOrders.forEach((order) => {
        expect(order.status.name).toBe("assigned");
      });
    });

    it("should filter orders by date range", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?startDate=2024-02-01&endDate=2024-03-31")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const dateFilteredOrders = response.body.data;

      // Should include orders from Feb and March
      const orderDates = dateFilteredOrders.map(
        (order) => new Date(order.createdAt).toISOString().split("T")[0],
      );

      expect(orderDates).toEqual(
        expect.arrayContaining(["2024-02-15", "2024-03-15"]),
      );
    });

    it("should filter orders by weight range", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?minWeight=1.5&maxWeight=2.5")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const weightFilteredOrders = response.body.data;

      weightFilteredOrders.forEach((order) => {
        expect(order.weight).toBeGreaterThanOrEqual(1.5);
        expect(order.weight).toBeLessThanOrEqual(2.5);
      });
    });

    it("should sort orders by creation date", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?sortBy=createdAt&sortOrder=desc")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const sortedOrders = response.body.data;

      // Should be sorted by creation date descending
      for (let i = 0; i < sortedOrders.length - 1; i++) {
        expect(
          new Date(sortedOrders[i].createdAt).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(sortedOrders[i + 1].createdAt).getTime(),
        );
      }
    });

    it("should combine multiple filters", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders?status=pending&minWeight=0.5&maxWeight=1.5")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const filteredOrders = response.body.data;

      filteredOrders.forEach((order) => {
        expect(order.status.name).toBe("pending");
        expect(order.weight).toBeGreaterThanOrEqual(0.5);
        expect(order.weight).toBeLessThanOrEqual(1.5);
      });
    });
  });

  describe("Performance and Load Testing", () => {
    it("should handle multiple concurrent order operations", async () => {
      // Create multiple orders concurrently
      const createPromises = [];
      for (let i = 0; i < 5; i++) {
        const orderData = {
          deliveryTypeId: 1,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupContactName: `Concurrent Pickup ${i}`,
          pickupContactPhone: "+1234567890",
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryContactName: `Concurrent Delivery ${i}`,
          deliveryContactPhone: "+1234567891",
          weight: 1.0 + i * 0.5,
          dimensions: { length: 20 + i * 5, width: 15 + i * 2, height: 10 + i },
          declaredValue: 500 + i * 100,
          specialInstructions: `Concurrent order ${i}`,
          items: [
            {
              name: `Concurrent Package ${i}`,
              quantity: 1,
              weight: 1.0 + i * 0.5,
              dimensions: {
                length: 20 + i * 5,
                width: 15 + i * 2,
                height: 10 + i,
              },
              value: 500 + i * 100,
            },
          ],
        };

        createPromises.push(
          request(app.server)
            .post("/api/v1/orders")
            .set(createTestAuthHeaders(clientToken))
            .send(orderData),
        );
      }

      const responses = await Promise.all(createPromises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // Verify orders were created
      const ordersResponse = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(ordersResponse.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it("should handle concurrent status updates", async () => {
      // Create and assign order
      const testOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 2,
          weight: 2.0,
          declaredValue: 800,
          pickupAddress: testAddresses.pickup.fullAddress,
          pickupLatitude: testAddresses.pickup.latitude,
          pickupLongitude: testAddresses.pickup.longitude,
          pickupCity: testAddresses.pickup.city,
          pickupState: testAddresses.pickup.state,
          deliveryAddress: testAddresses.delivery.fullAddress,
          deliveryLatitude: testAddresses.delivery.latitude,
          deliveryLongitude: testAddresses.delivery.longitude,
          deliveryCity: testAddresses.delivery.city,
          deliveryState: testAddresses.delivery.state,
          pickupContactName: "Concurrent Status Pickup",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Concurrent Status Delivery",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "Concurrent status test",
          items: [
            {
              name: "Concurrent Status Package",
              quantity: 1,
              weight: 2.0,
              dimensions: { length: 30, width: 20, height: 15 },
              value: 800,
            },
          ],
        },
        clientUser.user_id,
      );

      // Assign to courier
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at, accepted_at
        ) VALUES ($1, $2, $3, NOW(), NOW())
      `,
        [testOrder.order_id, courierUser1.user_id, 2],
      );

      // Make concurrent status updates
      const statusUpdates = [
        { statusId: 3, notes: "Concurrent update 1" },
        { statusId: 4, notes: "Concurrent update 2" },
        { statusId: 5, notes: "Concurrent update 3" },
      ];

      const updatePromises = statusUpdates.map((updateData) =>
        request(app.server)
          .put(`/api/v1/orders/${testOrder.order_id}/status`)
          .set(createTestAuthHeaders(courierToken1))
          .send(updateData),
      );

      const responses = await Promise.all(updatePromises);

      // At least one should succeed (depending on validation)
      const successCount = responses.filter(
        (response) => response.status === 200,
      ).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Data Validation and Constraints", () => {
    it("should enforce order data validation", async () => {
      const invalidOrder = {
        deliveryTypeId: 1,
        pickupAddress: "", // Empty address
        pickupCity: testAddresses.pickup.city,
        pickupState: testAddresses.pickup.state,
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Invalid Pickup",
        pickupContactPhone: "+1234567890",
        deliveryAddress: testAddresses.delivery.fullAddress,
        deliveryCity: testAddresses.delivery.city,
        deliveryState: testAddresses.delivery.state,
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Invalid Delivery",
        deliveryContactPhone: "+1234567891",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        items: [
          {
            name: "Invalid Package",
            quantity: 1,
            weight: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            value: 1000,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidOrder)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should handle edge case coordinates", async () => {
      const edgeCaseOrder = {
        deliveryTypeId: 1,
        pickupAddress: "Edge Case Pickup, Test City, Test State",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: 0, // Equator
        pickupLongitude: 0, // Prime meridian
        pickupContactName: "Edge Case Pickup",
        pickupContactPhone: "+1234567890",
        deliveryAddress: "Edge Case Delivery, Test City, Test State",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: 90, // North pole
        deliveryLongitude: 180, // International date line
        deliveryContactName: "Edge Case Delivery",
        deliveryContactPhone: "+1234567891",
        weight: 1.0,
        dimensions: { length: 20, width: 15, height: 10 },
        declaredValue: 500,
        items: [
          {
            name: "Edge Case Package",
            quantity: 1,
            weight: 1.0,
            dimensions: { length: 20, width: 15, height: 10 },
            value: 500,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(edgeCaseOrder)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should handle special characters in order data", async () => {
      const specialCharOrder = {
        deliveryTypeId: 1,
        pickupAddress:
          "123 Special & Symbols @#$% Street, Test City, Test State",
        pickupCity: "Test City",
        pickupState: "Test State",
        pickupLatitude: testAddresses.pickup.latitude,
        pickupLongitude: testAddresses.pickup.longitude,
        pickupContactName: "Special & Contact @#$%",
        pickupContactPhone: "+1234567890",
        deliveryAddress:
          "456 Special & Delivery @#$% Avenue, Test City, Test State",
        deliveryCity: "Test City",
        deliveryState: "Test State",
        deliveryLatitude: testAddresses.delivery.latitude,
        deliveryLongitude: testAddresses.delivery.longitude,
        deliveryContactName: "Special & Delivery @#$%",
        deliveryContactPhone: "+1234567891",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        specialInstructions: "Handle with special care & attention @#$%",
        items: [
          {
            name: "Special & Package @#$%",
            quantity: 1,
            weight: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            value: 1000,
          },
        ],
      };

      const response = await request(app.server)
        .post("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .send(specialCharOrder)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          specialInstructions: specialCharOrder.specialInstructions,
        }),
      });
    });
  });
});
