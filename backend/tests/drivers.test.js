// tests/drivers.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const {
  createTestAuthHeaders,
  createTestDeviceHeaders,
  testUsers,
  testVehicle,
} = require("./setup.js");

describe("Drivers API", () => {
  let app;
  let courierUser;
  let clientUser;
  let courierToken;
  let clientToken;

  beforeAll(async () => {
    const appModule = await import("../src/app.js");
    app = await appModule.buildApp();
    await testDb.setup();

    // Create test users
    courierUser = await testDb.createTestUser(testUsers.courier);
    clientUser = await testDb.createTestUser(testUsers.client);

    // Set up courier status and vehicle
    await testDb.createTestDriver(
      {
        vehicle: testVehicle,
        isAvailable: false,
        isOnline: false,
        currentLocation: { lat: 28.6139, lng: 77.209 },
      },
      courierUser.user_id,
    );

    // Get auth tokens
    const mockFirebaseResponse = {
      uid: testUsers.courier.firebaseUid,
      phone_number: testUsers.courier.phoneNumber,
      email: testUsers.courier.email,
    };

    const firebaseAdmin = require("firebase-admin");
    firebaseAdmin.auth = () => ({
      verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
    });

    const courierLogin = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "valid_token_courier",
        fullName: testUsers.courier.fullName,
        role: testUsers.courier.role,
      })
      .set(createTestDeviceHeaders("courier_device"));

    courierToken = courierLogin.body.data.tokens.accessToken;

    const clientLogin = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "valid_token_client",
        fullName: testUsers.client.fullName,
        role: testUsers.client.role,
      })
      .set(createTestDeviceHeaders("client_device"));

    clientToken = clientLogin.body.data.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  describe("GET /api/v1/drivers/me", () => {
    it("should return driver profile", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Driver profile retrieved successfully",
        data: expect.objectContaining({
          userId: courierUser.user_id,
          userUuid: courierUser.user_uuid,
          phoneNumber: testUsers.courier.phoneNumber,
          fullName: testUsers.courier.fullName,
          email: testUsers.courier.email,
          role: testUsers.courier.role,
          vehicle: expect.objectContaining({
            vehicleId: expect.any(Number),
            categoryId: testVehicle.categoryId,
            vehicleNumber: testVehicle.vehicleNumber,
            model: testVehicle.model,
            year: testVehicle.year,
            isActive: true,
          }),
          status: expect.objectContaining({
            isAvailable: false,
            isOnline: false,
            currentLocation: expect.objectContaining({
              lat: 28.6139,
              lng: 77.209,
            }),
          }),
        }),
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(clientToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });

    it("should return 404 for courier without driver setup", async () => {
      // Create courier user without driver status
      const newCourier = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567893",
        firebaseUid: "test_courier_no_setup_uid",
      });

      const mockFirebaseResponse = {
        uid: "test_courier_no_setup_uid",
        phone_number: "+1234567893",
        email: "courier_no_setup@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_no_setup",
          fullName: "Courier No Setup",
          role: "courier",
        })
        .set(createTestDeviceHeaders("courier_no_setup_device"));

      const noSetupToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(noSetupToken))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Driver profile not found. Please complete driver setup.",
      });
    });
  });

  describe("PUT /api/v1/drivers/me", () => {
    it("should update driver profile successfully", async () => {
      const updateData = {
        fullName: "Updated Courier Name",
        email: "updatedcourier@test.com",
        profilePictureUrl: "https://example.com/courier-avatar.jpg",
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Driver profile updated successfully",
        data: expect.objectContaining({
          userId: courierUser.user_id,
          fullName: updateData.fullName,
          email: updateData.email,
          profilePictureUrl: updateData.profilePictureUrl,
        }),
      });

      // Verify database was updated
      const userQuery = "SELECT * FROM users.profiles WHERE user_id = $1";
      const updatedUser = await testDb.query(userQuery, [courierUser.user_id]);

      expect(updatedUser.rows[0]).toMatchObject({
        full_name: updateData.fullName,
        email: updateData.email,
        profile_picture_url: updateData.profilePictureUrl,
      });
    });

    it("should partially update driver profile", async () => {
      const updateData = {
        fullName: "Partially Updated Courier",
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          fullName: updateData.fullName,
        }),
      });
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .send({
          email: "invalid-email-format",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .send({
          fullName: "Updated Name",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .set(createTestAuthHeaders(clientToken))
        .send({
          fullName: "Updated Name",
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });
  });

  describe("PUT /api/v1/drivers/me/availability", () => {
    it("should toggle availability successfully", async () => {
      // Initially set to false, should toggle to true
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({
          isAvailable: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Availability updated successfully",
        data: expect.objectContaining({
          isAvailable: true,
          isOnline: expect.any(Boolean),
        }),
      });

      // Verify database was updated
      const statusQuery =
        "SELECT * FROM logistics.courier_status WHERE courier_id = $1";
      const updatedStatus = await testDb.query(statusQuery, [
        courierUser.user_id,
      ]);

      expect(updatedStatus.rows[0]).toMatchObject({
        is_available: true,
      });
    });

    it("should toggle availability back to false", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({
          isAvailable: false,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          isAvailable: false,
        }),
      });
    });

    it("should return 400 for missing isAvailable field", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid isAvailable type", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({
          isAvailable: "not_boolean",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .send({
          isAvailable: true,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(clientToken))
        .send({
          isAvailable: true,
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });
  });

  describe("PUT /api/v1/drivers/me/location", () => {
    it("should update location successfully", async () => {
      const newLocation = {
        latitude: 28.7041,
        longitude: 77.1025,
        accuracy: 10,
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send(newLocation)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Location updated successfully",
        data: expect.objectContaining({
          currentLocation: expect.objectContaining({
            lat: newLocation.latitude,
            lng: newLocation.longitude,
          }),
          lastLocationUpdate: expect.any(String),
        }),
      });

      // Verify database was updated
      const statusQuery =
        "SELECT * FROM logistics.courier_status WHERE courier_id = $1";
      const updatedStatus = await testDb.query(statusQuery, [
        courierUser.user_id,
      ]);

      expect(updatedStatus.rows[0]).toMatchObject({
        current_location: expect.any(Object), // PostGIS point
      });
    });

    it("should return 400 for missing latitude", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send({
          longitude: 77.209,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for missing longitude", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send({
          latitude: 28.6139,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid latitude range", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send({
          latitude: 91, // Invalid: > 90
          longitude: 77.209,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid longitude range", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send({
          latitude: 28.6139,
          longitude: 181, // Invalid: > 180
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .send({
          latitude: 28.6139,
          longitude: 77.209,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(clientToken))
        .send({
          latitude: 28.6139,
          longitude: 77.209,
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });
  });

  describe("GET /api/v1/drivers/me/assignments", () => {
    beforeEach(async () => {
      // Create test orders and assignments
      const testOrder = {
        clientId: clientUser.user_id,
        deliveryTypeId: 1,
        statusId: 2, // Assigned
        pickupAddress: "123 Pickup Street, Test City, Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupCity: "Test City",
        pickupState: "Test State",
        deliveryAddress: "456 Delivery Avenue, Test City, Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryCity: "Test City",
        deliveryState: "Test State",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        pickupContactName: "Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryContactName: "Delivery Contact",
        deliveryContactPhone: "+1234567891",
        specialInstructions: "Handle with care",
      };

      // Create pickup and delivery locations
      const pickupLocation = await testDb.query(
        `
        INSERT INTO logistics.locations (address, latitude, longitude, city, state)
        VALUES ($1, $2, $3, $4, $5) RETURNING location_id
      `,
        [
          testOrder.pickupAddress,
          testOrder.pickupLatitude,
          testOrder.pickupLongitude,
          testOrder.pickupCity,
          testOrder.pickupState,
        ],
      );

      const deliveryLocation = await testDb.query(
        `
        INSERT INTO logistics.locations (address, latitude, longitude, city, state)
        VALUES ($1, $2, $3, $4, $5) RETURNING location_id
      `,
        [
          testOrder.deliveryAddress,
          testOrder.deliveryLatitude,
          testOrder.deliveryLongitude,
          testOrder.deliveryCity,
          testOrder.deliveryState,
        ],
      );

      // Create order
      const order = await testDb.query(
        `
        INSERT INTO orders.requests (
          client_id, delivery_type_id, status_id, pickup_location_id, delivery_location_id,
          pickup_contact_name, pickup_contact_phone, delivery_contact_name, delivery_contact_phone,
          weight_kg, dimensions, declared_value, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING order_id
      `,
        [
          testOrder.clientId,
          testOrder.deliveryTypeId,
          testOrder.statusId,
          pickupLocation.rows[0].location_id,
          deliveryLocation.rows[0].location_id,
          testOrder.pickupContactName,
          testOrder.pickupContactPhone,
          testOrder.deliveryContactName,
          testOrder.deliveryContactPhone,
          testOrder.weight,
          JSON.stringify(testOrder.dimensions),
          testOrder.declaredValue,
          testOrder.specialInstructions,
        ],
      );

      // Create assignment
      await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at
        ) VALUES ($1, $2, $3, NOW())
      `,
        [
          order.rows[0].order_id,
          courierUser.user_id,
          2, // Assigned
        ],
      );

      // Update courier status to available
      await testDb.query(
        `
        UPDATE logistics.courier_status
        SET is_available = true, current_assignment_id = $1
        WHERE courier_id = $2
      `,
        [order.rows[0].order_id, courierUser.user_id],
      );
    });

    it("should return active assignments", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/assignments")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Active assignments retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            orderId: expect.any(Number),
            orderUuid: expect.any(String),
            status: expect.objectContaining({
              statusId: 2,
              name: "assigned",
            }),
            pickupLocation: expect.objectContaining({
              address: expect.stringContaining("123 Pickup Street"),
              latitude: 28.6139,
              longitude: 77.209,
            }),
            deliveryLocation: expect.objectContaining({
              address: expect.stringContaining("456 Delivery Avenue"),
              latitude: 28.7041,
              longitude: 77.1025,
            }),
            assignment: expect.objectContaining({
              assignmentId: expect.any(Number),
              assignedAt: expect.any(String),
            }),
          }),
        ]),
      });
    });

    it("should return empty array when no assignments", async () => {
      // Create courier without assignments
      const newCourier = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567894",
        firebaseUid: "test_courier_no_assignments_uid",
      });

      await testDb.createTestDriver(
        {
          vehicle: testVehicle,
          isAvailable: true,
          isOnline: true,
        },
        newCourier.user_id,
      );

      const mockFirebaseResponse = {
        uid: "test_courier_no_assignments_uid",
        phone_number: "+1234567894",
        email: "courier_no_assignments@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_no_assignments",
          fullName: "Courier No Assignments",
          role: "courier",
        })
        .set(createTestDeviceHeaders("courier_no_assignments_device"));

      const noAssignmentsToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/drivers/me/assignments")
        .set(createTestAuthHeaders(noAssignmentsToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/assignments")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/assignments")
        .set(createTestAuthHeaders(clientToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });
  });

  describe("GET /api/v1/drivers/me/earnings", () => {
    beforeEach(async () => {
      // Create completed orders with earnings
      const completedOrder = {
        clientId: clientUser.user_id,
        deliveryTypeId: 1,
        statusId: 5, // Completed
        pickupAddress: "123 Completed Pickup Street, Test City, Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupCity: "Test City",
        pickupState: "Test State",
        deliveryAddress: "456 Completed Delivery Avenue, Test City, Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryCity: "Test City",
        deliveryState: "Test State",
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 1000,
        pickupContactName: "Completed Pickup Contact",
        pickupContactPhone: "+1234567890",
        deliveryContactName: "Completed Delivery Contact",
        deliveryContactPhone: "+1234567891",
        specialInstructions: "Completed order",
      };

      // Create locations and order
      const pickupLocation = await testDb.query(
        `
        INSERT INTO logistics.locations (address, latitude, longitude, city, state)
        VALUES ($1, $2, $3, $4, $5) RETURNING location_id
      `,
        [
          completedOrder.pickupAddress,
          completedOrder.pickupLatitude,
          completedOrder.pickupLongitude,
          completedOrder.pickupCity,
          completedOrder.pickupState,
        ],
      );

      const deliveryLocation = await testDb.query(
        `
        INSERT INTO logistics.locations (address, latitude, longitude, city, state)
        VALUES ($1, $2, $3, $4, $5) RETURNING location_id
      `,
        [
          completedOrder.deliveryAddress,
          completedOrder.deliveryLatitude,
          completedOrder.deliveryLongitude,
          completedOrder.deliveryCity,
          completedOrder.deliveryState,
        ],
      );

      const order = await testDb.query(
        `
        INSERT INTO orders.requests (
          client_id, delivery_type_id, status_id, pickup_location_id, delivery_location_id,
          pickup_contact_name, pickup_contact_phone, delivery_contact_name, delivery_contact_phone,
          weight_kg, dimensions, declared_value, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING order_id
      `,
        [
          completedOrder.clientId,
          completedOrder.deliveryTypeId,
          completedOrder.statusId,
          pickupLocation.rows[0].location_id,
          deliveryLocation.rows[0].location_id,
          completedOrder.pickupContactName,
          completedOrder.pickupContactPhone,
          completedOrder.deliveryContactName,
          completedOrder.deliveryContactPhone,
          completedOrder.weight,
          JSON.stringify(completedOrder.dimensions),
          completedOrder.declaredValue,
          completedOrder.specialInstructions,
        ],
      );

      // Create assignment and completion
      const assignment = await testDb.query(
        `
        INSERT INTO orders.courier_assignments (
          order_id, courier_id, assignment_status_id, assigned_at, completed_at
        ) VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour', NOW()) RETURNING assignment_id
      `,
        [
          order.rows[0].order_id,
          courierUser.user_id,
          4, // Completed
        ],
      );

      // Add earnings record
      await testDb.query(
        `
        INSERT INTO payments.earnings (
          courier_id, order_id, assignment_id, base_fare, distance_fee,
          weight_fee, surge_multiplier, total_earnings, payment_status_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          courierUser.user_id,
          order.rows[0].order_id,
          assignment.rows[0].assignment_id,
          50.0,
          20.0,
          10.0,
          1.2,
          96.0,
          2, // Paid
        ],
      );
    });

    it("should return earnings summary", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/earnings")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Earnings retrieved successfully",
        data: expect.objectContaining({
          totalEarnings: expect.any(Number),
          totalOrders: expect.any(Number),
          averageOrderValue: expect.any(Number),
          earningsByPeriod: expect.arrayContaining([
            expect.objectContaining({
              period: expect.any(String),
              earnings: expect.any(Number),
              orders: expect.any(Number),
            }),
          ]),
          recentEarnings: expect.arrayContaining([
            expect.objectContaining({
              orderId: expect.any(Number),
              orderUuid: expect.any(String),
              earnings: expect.any(Number),
              completedAt: expect.any(String),
            }),
          ]),
        }),
      });

      expect(response.body.data.totalEarnings).toBeGreaterThan(0);
      expect(response.body.data.totalOrders).toBeGreaterThan(0);
    });

    it("should return zero earnings for new driver", async () => {
      // Create new courier without completed orders
      const newCourier = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567895",
        firebaseUid: "test_courier_no_earnings_uid",
      });

      await testDb.createTestDriver(
        {
          vehicle: testVehicle,
          isAvailable: true,
          isOnline: true,
        },
        newCourier.user_id,
      );

      const mockFirebaseResponse = {
        uid: "test_courier_no_earnings_uid",
        phone_number: "+1234567895",
        email: "courier_no_earnings@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_no_earnings",
          fullName: "Courier No Earnings",
          role: "courier",
        })
        .set(createTestDeviceHeaders("courier_no_earnings_device"));

      const noEarningsToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/drivers/me/earnings")
        .set(createTestAuthHeaders(noEarningsToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalEarnings: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        }),
      });
    });

    it("should accept date range parameters", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";

      const response = await request(app.server)
        .get(
          `/api/v1/drivers/me/earnings?startDate=${startDate}&endDate=${endDate}`,
        )
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          totalEarnings: expect.any(Number),
          totalOrders: expect.any(Number),
        }),
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/earnings")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 403 for non-courier role", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me/earnings")
        .set(createTestAuthHeaders(clientToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });
  });

  describe("GET /api/v1/drivers/me/rating", () => {
    it("should return rating stats when ratings exist", async () => {
      // Create a delivered order and insert a rating for the courier
      const deliveredOrder = await testDb.createTestOrder(
        {
          clientId: clientUser.user_id,
          deliveryTypeId: 1,
          statusId: 5, // Delivered
          weight: 1.0,
          declaredValue: 100,
          pickupAddress: "Rating Pickup",
          pickupLatitude: 28.6139,
          pickupLongitude: 77.209,
          pickupCity: "Test City",
          pickupState: "Test State",
          deliveryAddress: "Rating Delivery",
          deliveryLatitude: 28.7041,
          deliveryLongitude: 77.1025,
          deliveryCity: "Test City",
          deliveryState: "Test State",
          pickupContactName: "Client",
          pickupContactPhone: "+1234567890",
          deliveryContactName: "Recipient",
          deliveryContactPhone: "+1234567891",
          specialInstructions: "",
          items: [
            {
              name: "Item",
              quantity: 1,
              weight: 1.0,
              dimensions: { length: 10, width: 10, height: 5 },
              value: 100,
            },
          ],
        },
        clientUser.user_id,
      );

      // Ensure courier_status exists for courierUser (created in beforeAll)
      // Insert a rating row referencing the delivered order
      await testDb.query(
        `INSERT INTO public.driver_ratings (order_id, driver_id, customer_id, rating, comment) VALUES ($1, $2, $3, $4, $5)`,
        [
          deliveredOrder.order_id,
          courierUser.user_id,
          clientUser.user_id,
          5,
          "Excellent",
        ],
      );

      const response = await request(app.server)
        .get("/api/v1/drivers/me/rating")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Rating stats retrieved successfully",
        data: expect.objectContaining({
          averageRating: 5,
          totalRatings: 1,
          ratingDistribution: expect.objectContaining({ 5: 1 }),
        }),
      });
    });

    it("should return zeros if driver has no recent ratings", async () => {
      // Create a fresh courier user without any ratings
      const newCourier = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567800",
        firebaseUid: "test_courier_no_ratings_uid",
      });

      await testDb.createTestDriver(
        { vehicle: testVehicle },
        newCourier.user_id,
      );

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: "test_courier_no_ratings_uid",
          phone_number: "+1234567800",
        }),
      });

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_new_courier",
          fullName: "No Ratings Courier",
          role: "courier",
        })
        .set(createTestDeviceHeaders("new_courier_device"));

      const newCourierToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/drivers/me/rating")
        .set(createTestAuthHeaders(newCourierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          averageRating: 0,
          totalRatings: 0,
        }),
      });
    });
  });

  describe("Driver Status Management", () => {
    it("should handle online/offline status correctly", async () => {
      // Go online
      await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({ isAvailable: true })
        .expect(200);

      // Update location to simulate being online
      await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send({
          latitude: 28.6139,
          longitude: 77.209,
        })
        .expect(200);

      // Check status
      const profileResponse = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(profileResponse.body.data.status.isAvailable).toBe(true);
    });

    it("should handle multiple availability toggles", async () => {
      // Toggle multiple times
      await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({ isAvailable: true })
        .expect(200);

      await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({ isAvailable: false })
        .expect(200);

      await request(app.server)
        .put("/api/v1/drivers/me/availability")
        .set(createTestAuthHeaders(courierToken))
        .send({ isAvailable: true })
        .expect(200);

      // Verify final state
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body.data.status.isAvailable).toBe(true);
    });
  });

  describe("Location Tracking", () => {
    it("should handle location updates with accuracy", async () => {
      const locationWithAccuracy = {
        latitude: 28.7041,
        longitude: 77.1025,
        accuracy: 5,
        heading: 90,
        speed: 10,
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send(locationWithAccuracy)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          currentLocation: expect.objectContaining({
            lat: locationWithAccuracy.latitude,
            lng: locationWithAccuracy.longitude,
          }),
        }),
      });
    });

    it("should handle rapid location updates", async () => {
      const locations = [
        { latitude: 28.6139, longitude: 77.209 },
        { latitude: 28.614, longitude: 77.2091 },
        { latitude: 28.6141, longitude: 77.2092 },
        { latitude: 28.6142, longitude: 77.2093 },
      ];

      for (const location of locations) {
        await request(app.server)
          .put("/api/v1/drivers/me/location")
          .set(createTestAuthHeaders(courierToken))
          .send(location)
          .expect(200);
      }

      // Verify final location
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body.data.status.currentLocation).toMatchObject({
        lat: 28.6142,
        lng: 77.2093,
      });
    });

    it("should handle boundary location values", async () => {
      // Test extreme but valid coordinates
      const boundaryLocations = [
        { latitude: -90, longitude: -180 },
        { latitude: 90, longitude: 180 },
        { latitude: 0, longitude: 0 },
      ];

      for (const location of boundaryLocations) {
        const response = await request(app.server)
          .put("/api/v1/drivers/me/location")
          .set(createTestAuthHeaders(courierToken))
          .send(location)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
        });
      }
    });
  });

  describe("Vehicle Management Integration", () => {
    it("should include vehicle information in driver profile", async () => {
      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body.data.vehicle).toMatchObject({
        vehicleId: expect.any(Number),
        categoryId: testVehicle.categoryId,
        vehicleNumber: testVehicle.vehicleNumber,
        model: testVehicle.model,
        year: testVehicle.year,
        isActive: true,
      });
    });

    it("should handle driver without vehicle", async () => {
      // Create courier without vehicle
      const newCourier = await testDb.createTestUser({
        ...testUsers.courier,
        phoneNumber: "+1234567896",
        firebaseUid: "test_courier_no_vehicle_uid",
      });

      await testDb.createTestDriver(
        {
          isAvailable: true,
          isOnline: true,
          // No vehicle
        },
        newCourier.user_id,
      );

      const mockFirebaseResponse = {
        uid: "test_courier_no_vehicle_uid",
        phone_number: "+1234567896",
        email: "courier_no_vehicle@test.com",
      };

      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin
        .auth()
        .verifyIdToken.mockResolvedValue(mockFirebaseResponse);

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_no_vehicle",
          fullName: "Courier No Vehicle",
          role: "courier",
        })
        .set(createTestDeviceHeaders("courier_no_vehicle_device"));

      const noVehicleToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(noVehicleToken))
        .expect(200);

      expect(response.body.data.vehicle).toBeNull();
    });
  });

  describe("Performance and Load Testing", () => {
    it("should handle concurrent driver operations", async () => {
      // Simulate concurrent operations
      const operations = [
        request(app.server)
          .get("/api/v1/drivers/me")
          .set(createTestAuthHeaders(courierToken)),
        request(app.server)
          .put("/api/v1/drivers/me/availability")
          .set(createTestAuthHeaders(courierToken))
          .send({ isAvailable: true }),
        request(app.server)
          .put("/api/v1/drivers/me/location")
          .set(createTestAuthHeaders(courierToken))
          .send({ latitude: 28.6139, longitude: 77.209 }),
        request(app.server)
          .get("/api/v1/drivers/me/assignments")
          .set(createTestAuthHeaders(courierToken)),
        request(app.server)
          .get("/api/v1/drivers/me/earnings")
          .set(createTestAuthHeaders(courierToken)),
      ];

      const responses = await Promise.all(operations);

      // All operations should succeed
      responses.forEach((response) => {
        expect(response.status).toBeLessThan(500);
      });
    });

    it("should handle rapid availability toggles", async () => {
      const toggles = [];
      for (let i = 0; i < 10; i++) {
        toggles.push(
          request(app.server)
            .put("/api/v1/drivers/me/availability")
            .set(createTestAuthHeaders(courierToken))
            .send({ isAvailable: i % 2 === 0 }),
        );
      }

      const responses = await Promise.all(toggles);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Final state should be consistent
      const finalResponse = await request(app.server)
        .get("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(finalResponse.body.data.status.isAvailable).toBe(false); // Last toggle was odd number (false)
    });
  });

  describe("Data Validation and Constraints", () => {
    it("should enforce database constraints on driver operations", async () => {
      // Try to update with invalid data
      const invalidUpdate = {
        fullName: "", // Empty name should fail
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me")
        .set(createTestAuthHeaders(courierToken))
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should handle malformed location data", async () => {
      const malformedLocation = {
        latitude: "not_a_number",
        longitude: 77.209,
      };

      const response = await request(app.server)
        .put("/api/v1/drivers/me/location")
        .set(createTestAuthHeaders(courierToken))
        .send(malformedLocation)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });
  });

  describe("Assignment Management", () => {
    it("should update assignment count in courier status", async () => {
      // Create order and assignment
      const testOrder = {
        clientId: clientUser.user_id,
        deliveryTypeId: 1,
        statusId: 2, // Assigned
        pickupAddress: "123 Assignment Test Street, Test City, Test State",
        pickupLatitude: 28.6139,
        pickupLongitude: 77.209,
        pickupCity: "Test City",
        pickupState: "Test State",
        deliveryAddress: "456 Assignment Test Avenue, Test City, Test State",
        deliveryLatitude: 28.7041,
        deliveryLongitude: 77.1025,
        deliveryCity: "Test City",
        deliveryState: "Test State",
        weight: 1.0,
        dimensions: { length: 20, width: 15, height: 10 },
        declaredValue: 500,
        pickupContactName: "Assignment Test Contact",
        pickupContactPhone: "+1234567890",
        deliveryContactName: "Assignment Test Contact",
        deliveryContactPhone: "+1234567891",
        specialInstructions: "Assignment test",
      };

      // Create order and assignment
      await testDb.createTestOrder(testOrder, clientUser.user_id);

      // Check assignments endpoint
      const response = await request(app.server)
        .get("/api/v1/drivers/me/assignments")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
