// tests/users.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const {
  createTestAuthHeaders,
  createTestDeviceHeaders,
  testUsers,
} = require("./setup.js");

describe("Users API", () => {
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

    const courierLogin = await request(app.server)
      .post("/api/v1/auth/firebase/verify")
      .send({
        idToken: "valid_token_courier",
        fullName: testUsers.courier.fullName,
        role: testUsers.courier.role,
      })
      .set(createTestDeviceHeaders("courier_device"));

    courierToken = courierLogin.body.data.tokens.accessToken;
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  describe("GET /api/v1/users/me", () => {
    it("should return current user profile", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "User profile retrieved successfully",
        data: expect.objectContaining({
          userId: clientUser.user_id,
          userUuid: clientUser.user_uuid,
          phoneNumber: testUsers.client.phoneNumber,
          fullName: testUsers.client.fullName,
          email: testUsers.client.email,
          role: testUsers.client.role,
          isVerified: true,
          isActive: true,
        }),
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 401 for invalid token", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders("invalid_token"))
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid token",
      });
    });
  });

  describe("PUT /api/v1/users/me", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        fullName: "Updated Client Name",
        email: "updatedclient@test.com",
        profilePictureUrl: "https://example.com/avatar.jpg",
      };

      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Profile updated successfully",
        data: expect.objectContaining({
          userId: clientUser.user_id,
          fullName: updateData.fullName,
          email: updateData.email,
          profilePictureUrl: updateData.profilePictureUrl,
        }),
      });

      // Verify database was updated
      const userQuery = "SELECT * FROM users.profiles WHERE user_id = $1";
      const updatedUser = await testDb.query(userQuery, [clientUser.user_id]);

      expect(updatedUser.rows[0]).toMatchObject({
        full_name: updateData.fullName,
        email: updateData.email,
        profile_picture_url: updateData.profilePictureUrl,
      });
    });

    it("should partially update user profile", async () => {
      const updateData = {
        fullName: "Partially Updated Name",
      };

      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
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
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({
          email: "invalid-email-format",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid profile picture URL", async () => {
      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({
          profilePictureUrl: "not-a-valid-url",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for full name too short", async () => {
      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({
          fullName: "A", // Too short
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for full name too long", async () => {
      const longName = "A".repeat(101); // Exceeds max length
      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({
          fullName: longName,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .put("/api/v1/users/me")
        .send({
          fullName: "Updated Name",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("GET /api/v1/users/me/addresses", () => {
    beforeEach(async () => {
      // Add test addresses for the client user
      const addressQuery = `
        INSERT INTO users.addresses (
          user_id, address_type, label, full_address, city, state,
          latitude, longitude, building_name, floor_number, flat_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

      await testDb.query(addressQuery, [
        clientUser.user_id,
        "home",
        "Home Address",
        "123 Test Home Street, Test City, Test State 123456",
        "Test City",
        "Test State",
        28.6139,
        77.209,
        "Test Building",
        "Ground",
        "1A",
      ]);

      await testDb.query(addressQuery, [
        clientUser.user_id,
        "work",
        "Work Address",
        "456 Test Work Avenue, Test City, Test State 123457",
        "Test City",
        "Test State",
        28.7041,
        77.1025,
        "Test Office",
        "5th",
        "501",
      ]);
    });

    it("should return user addresses", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Addresses retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({
            addressType: "home",
            label: "Home Address",
            fullAddress: expect.stringContaining("123 Test Home Street"),
            city: "Test City",
            state: "Test State",
            latitude: 28.6139,
            longitude: 77.209,
          }),
          expect.objectContaining({
            addressType: "work",
            label: "Work Address",
            fullAddress: expect.stringContaining("456 Test Work Avenue"),
            city: "Test City",
            state: "Test State",
            latitude: 28.7041,
            longitude: 77.1025,
          }),
        ]),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it("should return empty array if no addresses exist", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me/addresses")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("POST /api/v1/users/me/addresses", () => {
    it("should save new address successfully", async () => {
      const newAddress = {
        addressType: "home",
        label: "New Home",
        fullAddress: "789 New Home Street, New City, New State 789012",
        building: "New Building",
        floor: "2nd",
        flatNumber: "201",
        landmark: "Near New Mall",
        city: "New City",
        state: "New State",
        postalCode: "789012",
        latitude: 28.6139,
        longitude: 77.209,
        isDefault: true,
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(newAddress)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Address saved successfully",
        data: expect.objectContaining({
          addressType: newAddress.addressType,
          label: newAddress.label,
          fullAddress: newAddress.fullAddress,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          latitude: newAddress.latitude,
          longitude: newAddress.longitude,
          buildingName: newAddress.building,
          floorNumber: newAddress.floor,
          roomNumber: newAddress.flatNumber,
          landmark: newAddress.landmark,
          isDefault: newAddress.isDefault,
        }),
      });

      // Verify address was saved in database
      const addressQuery =
        "SELECT * FROM users.addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1";
      const savedAddress = await testDb.query(addressQuery, [
        clientUser.user_id,
      ]);

      expect(savedAddress.rows[0]).toMatchObject({
        address_type: newAddress.addressType,
        label: newAddress.label,
        full_address: newAddress.fullAddress,
        city: newAddress.city,
        state: newAddress.state,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
        building_name: newAddress.building,
        floor_number: newAddress.floor,
        flat_number: newAddress.flatNumber,
        landmark: newAddress.landmark,
      });
    });

    it("should save address without optional fields", async () => {
      const minimalAddress = {
        label: "Minimal Address",
        fullAddress: "123 Minimal Street, Minimal City, Minimal State 123456",
        city: "Minimal City",
        state: "Minimal State",
        postalCode: "123456",
        latitude: 28.6139,
        longitude: 77.209,
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(minimalAddress)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          label: minimalAddress.label,
          fullAddress: minimalAddress.fullAddress,
          city: minimalAddress.city,
          state: minimalAddress.state,
        }),
      });
    });

    it("should return 400 for missing required fields", async () => {
      const invalidAddress = {
        label: "Invalid Address",
        // Missing required fields like fullAddress, city, state, etc.
        building: "Test Building",
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidAddress)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid latitude/longitude", async () => {
      const invalidAddress = {
        label: "Invalid Location",
        fullAddress: "123 Test Street, Test City, Test State 123456",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        latitude: 91, // Invalid: > 90
        longitude: 77.209,
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidAddress)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid address type", async () => {
      const invalidAddress = {
        addressType: "invalid_type", // Not in enum
        label: "Invalid Type",
        fullAddress: "123 Test Street, Test City, Test State 123456",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        latitude: 28.6139,
        longitude: 77.209,
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidAddress)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .send({
          label: "Test Address",
          fullAddress: "123 Test Street, Test City, Test State 123456",
          city: "Test City",
          state: "Test State",
          postalCode: "123456",
          latitude: 28.6139,
          longitude: 77.209,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("DELETE /api/v1/users/me/addresses/:id", () => {
    let testAddressId;

    beforeEach(async () => {
      // Add a test address
      const addressQuery = `
        INSERT INTO users.addresses (
          user_id, address_type, label, full_address, city, state,
          latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING address_id`;

      const addressResult = await testDb.query(addressQuery, [
        clientUser.user_id,
        "home",
        "Address to Delete",
        "123 Delete Street, Test City, Test State 123456",
        "Test City",
        "Test State",
        28.6139,
        77.209,
      ]);

      testAddressId = addressResult.rows[0].address_id;
    });

    it("should delete address successfully", async () => {
      const response = await request(app.server)
        .delete(`/api/v1/users/me/addresses/${testAddressId}`)
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Address deleted successfully",
      });

      // Verify address was deleted from database
      const addressQuery =
        "SELECT * FROM users.addresses WHERE address_id = $1";
      const deletedAddress = await testDb.query(addressQuery, [testAddressId]);

      expect(deletedAddress.rows).toHaveLength(0);
    });

    it("should return 404 for non-existent address", async () => {
      const response = await request(app.server)
        .delete("/api/v1/users/me/addresses/99999")
        .set(createTestAuthHeaders(clientToken))
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Address not found",
      });
    });

    it("should return 404 for address belonging to another user", async () => {
      const response = await request(app.server)
        .delete(`/api/v1/users/me/addresses/${testAddressId}`)
        .set(createTestAuthHeaders(courierToken)) // Different user
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Address not found",
      });
    });

    it("should return 400 for invalid address ID format", async () => {
      const response = await request(app.server)
        .delete("/api/v1/users/me/addresses/invalid_id")
        .set(createTestAuthHeaders(clientToken))
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app.server)
        .delete(`/api/v1/users/me/addresses/${testAddressId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });
  });

  describe("Address Management", () => {
    beforeEach(async () => {
      // Add multiple addresses for testing
      const addresses = [
        {
          user_id: clientUser.user_id,
          address_type: "home",
          label: "Primary Home",
          full_address: "123 Primary Street, Test City, Test State 123456",
          city: "Test City",
          state: "Test State",
          latitude: 28.6139,
          longitude: 77.209,
        },
        {
          user_id: clientUser.user_id,
          address_type: "work",
          label: "Primary Work",
          full_address: "456 Work Avenue, Test City, Test State 123457",
          city: "Test City",
          state: "Test State",
          latitude: 28.7041,
          longitude: 77.1025,
        },
        {
          user_id: clientUser.user_id,
          address_type: "other",
          label: "Friend House",
          full_address: "789 Friend Street, Test City, Test State 123458",
          city: "Test City",
          state: "Test State",
          latitude: 28.6138,
          longitude: 77.2091,
        },
      ];

      for (const address of addresses) {
        await testDb.query(
          `
          INSERT INTO users.addresses (
            user_id, address_type, label, full_address, city, state,
            latitude, longitude
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
          Object.values(address),
        );
      }
    });

    it("should handle multiple addresses correctly", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((addr) => addr.label)).toEqual(
        expect.arrayContaining([
          "Primary Home",
          "Primary Work",
          "Friend House",
        ]),
      );
    });

    it("should maintain address relationships correctly", async () => {
      const addressesResponse = await request(app.server)
        .get("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      const addresses = addressesResponse.body.data;

      // Verify each address has correct user relationship
      for (const address of addresses) {
        expect(address).toMatchObject({
          city: "Test City",
          state: "Test State",
        });
      }
    });
  });

  describe("Profile Update Edge Cases", () => {
    it("should handle concurrent profile updates", async () => {
      const updateData = {
        fullName: "Concurrent Update Test",
        email: "concurrent@test.com",
      };

      // Make two concurrent updates
      const update1 = request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({ ...updateData, fullName: "Update 1" });

      const update2 = request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({ ...updateData, fullName: "Update 2" });

      const [response1, response2] = await Promise.all([update1, update2]);

      // Both should succeed or one should fail gracefully
      expect([response1.status, response2.status]).toEqual(
        expect.arrayContaining([200, 409]), // OK or Conflict
      );

      // Final state should be consistent
      const profileResponse = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(profileResponse.body.data).toMatchObject({
        fullName: expect.stringMatching(/Update [12]/),
        email: updateData.email,
      });
    });

    it("should handle empty update gracefully", async () => {
      const response = await request(app.server)
        .put("/api/v1/users/me")
        .set(createTestAuthHeaders(clientToken))
        .send({})
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Profile updated successfully",
      });
    });
  });

  describe("Data Validation", () => {
    it("should enforce data constraints in database", async () => {
      // Try to insert address with invalid postal code format
      const invalidAddress = {
        label: "Invalid Postal",
        fullAddress: "123 Test Street, Test City, Test State 123", // Too short postal code
        city: "Test City",
        state: "Test State",
        postalCode: "123", // Invalid format
        latitude: 28.6139,
        longitude: 77.209,
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(invalidAddress)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should handle special characters in addresses", async () => {
      const specialAddress = {
        label: "Special Chars & Symbols @#$%",
        fullAddress: "123 Special Street, Test City, Test State 123456",
        city: "Test City",
        state: "Test State",
        postalCode: "123456",
        latitude: 28.6139,
        longitude: 77.209,
        landmark: "Near Café & Restaurant @#$%",
      };

      const response = await request(app.server)
        .post("/api/v1/users/me/addresses")
        .set(createTestAuthHeaders(clientToken))
        .send(specialAddress)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          label: specialAddress.label,
          landmark: specialAddress.landmark,
        }),
      });
    });
  });
});
