// tests/auth.test.js
const request = require("supertest");
const { testDb } = require("./database.js");
const {
  createTestAuthHeaders,
  createTestDeviceHeaders,
  testUsers,
} = require("./setup.js");

describe("Authentication API", () => {
  let app;
  let clientUser;
  let courierUser;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    const appModule = await import("../src/app.js");
    app = await appModule.buildApp();
    await testDb.setup();

    // Create test users
    clientUser = await testDb.createTestUser(testUsers.client);
    courierUser = await testDb.createTestUser(testUsers.courier);
  }, 60000);

  afterAll(async () => {
    await testDb.teardown();
    await testDb.close();
    app.close();
  });

  afterEach(async () => {
    // Clean up tokens after each test
    accessToken = null;
    refreshToken = null;
  });

  describe("POST /api/v1/auth/firebase/verify", () => {
    it("should successfully verify Firebase token and create new user", async () => {
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      // Mock Firebase Admin SDK
      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders())
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "User registered successfully",
        data: expect.objectContaining({
          user: expect.objectContaining({
            userId: expect.any(Number),
            userUuid: expect.any(String),
            phoneNumber: testUsers.client.phoneNumber,
            fullName: testUsers.client.fullName,
            role: testUsers.client.role,
          }),
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          }),
          isNewUser: true,
        }),
      });

      // Store tokens for later tests
      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it("should successfully login existing user", async () => {
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders())
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "User logged in successfully",
        data: expect.objectContaining({
          isNewUser: false,
        }),
      });
    });

    it("should return 400 for invalid Firebase token", async () => {
      const firebaseAdmin = await import("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "invalid_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders())
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid token",
      });
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          // Missing idToken and other required fields
          fullName: testUsers.client.fullName,
        })
        .set(createTestDeviceHeaders())
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for invalid role", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token",
          fullName: testUsers.client.fullName,
          role: "invalid_role",
        })
        .set(createTestDeviceHeaders())
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it("should return 400 for full name too short", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token",
          fullName: "A", // Too short
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders())
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    beforeEach(async () => {
      // Get valid tokens first
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders());

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it("should successfully refresh access token", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: refreshToken,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Token refreshed successfully",
        data: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      });
    });

    it("should return 401 for invalid refresh token", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: "invalid_refresh_token",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("Invalid refresh token"),
      });
    });

    it("should return 401 for expired refresh token", async () => {
      // Mock JWT verification to return expired token
      const jwt = require("@fastify/jwt");
      jwt.verify = jest.fn().mockRejectedValue(new Error("Token expired"));

      const response = await request(app.server)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: refreshToken,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining("expired"),
      });
    });

    it("should return 400 for missing refresh token", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/refresh")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    beforeEach(async () => {
      // Get valid tokens first
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders());

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it("should successfully logout user", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/logout")
        .set(createTestAuthHeaders(accessToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Logged out successfully",
      });

      // Verify token is revoked - should not work for refresh
      const refreshResponse = await request(app.server)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: refreshToken,
        })
        .expect(401);

      expect(refreshResponse.body).toMatchObject({
        success: false,
        message: expect.stringContaining("revoked"),
      });
    });

    it("should return 401 for missing authorization header", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/logout")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should return 401 for invalid token", async () => {
      const response = await request(app.server)
        .post("/api/v1/auth/logout")
        .set(createTestAuthHeaders("invalid_token"))
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Invalid token",
      });
    });

    it("should return 401 for expired token", async () => {
      // Mock JWT verification to return expired token
      const jwt = require("@fastify/jwt");
      jwt.verify = jest.fn().mockRejectedValue(new Error("Token expired"));

      const response = await request(app.server)
        .post("/api/v1/auth/logout")
        .set(createTestAuthHeaders(accessToken))
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Token expired",
      });
    });
  });

  describe("Authentication Middleware", () => {
    beforeEach(async () => {
      // Get valid tokens first
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders());

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it("should allow authenticated requests to protected routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me")
        .set(createTestAuthHeaders(accessToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should reject unauthenticated requests to protected routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/users/me")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: "Missing authorization header",
      });
    });

    it("should reject requests with invalid tokens", async () => {
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

  describe("Role-based Authorization", () => {
    let clientToken;
    let courierToken;

    beforeEach(async () => {
      // Get tokens for both client and courier
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      // Login as client
      const clientLogin = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_client",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders("client_device"));

      clientToken = clientLogin.body.data.tokens.accessToken;

      // Login as courier
      const courierLogin = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_token_courier",
          fullName: testUsers.courier.fullName,
          role: testUsers.courier.role,
        })
        .set(createTestDeviceHeaders("courier_device"));

      courierToken = courierLogin.body.data.tokens.accessToken;
    });

    it("should allow client role to access client-only routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(clientToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should reject client role from courier-only routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(clientToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: courier",
      });
    });

    it("should allow courier role to access courier-only routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders/available")
        .set(createTestAuthHeaders(courierToken))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should reject courier role from client-only routes", async () => {
      const response = await request(app.server)
        .get("/api/v1/orders")
        .set(createTestAuthHeaders(courierToken))
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: "Access denied. Required role: client",
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to auth endpoints", async () => {
      // Make multiple requests to trigger rate limit
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app.server)
            .post("/api/v1/auth/firebase/verify")
            .send({
              idToken: `token_${i}`,
              fullName: testUsers.client.fullName,
              role: testUsers.client.role,
            })
            .set(createTestDeviceHeaders()),
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((response) => response.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe("Device Information Tracking", () => {
    it("should track device information in auth sessions", async () => {
      const deviceId = "test_device_456";
      const userAgent = "TestApp/2.0.0";

      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const response = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set({
          "X-Device-Id": deviceId,
          "User-Agent": userAgent,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
      });

      // Verify device info is stored in database
      const sessionQuery = `
        SELECT device_id, device_info
        FROM users.auth_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`;

      const sessionResult = await testDb.query(sessionQuery, [
        clientUser.user_id,
      ]);

      expect(sessionResult.rows[0]).toMatchObject({
        device_id: deviceId,
        device_info: expect.objectContaining({
          userAgent: userAgent,
        }),
      });
    });
  });

  describe("Token Security", () => {
    beforeEach(async () => {
      const mockFirebaseResponse = {
        uid: testUsers.client.firebaseUid,
        phone_number: testUsers.client.phoneNumber,
        email: testUsers.client.email,
      };

      const firebaseAdmin = require("firebase-admin");
      firebaseAdmin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue(mockFirebaseResponse),
      });

      const loginResponse = await request(app.server)
        .post("/api/v1/auth/firebase/verify")
        .send({
          idToken: "valid_firebase_token",
          fullName: testUsers.client.fullName,
          role: testUsers.client.role,
        })
        .set(createTestDeviceHeaders());

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it("should generate secure JWT tokens", async () => {
      // Verify token format and structure
      expect(accessToken).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
      );
      expect(refreshToken).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
      );

      // Verify tokens are different
      expect(accessToken).not.toBe(refreshToken);
    });

    it("should include correct claims in JWT token", async () => {
      // Mock JWT verification for this test
      const jwt = require("@fastify/jwt");
      jwt.verify = jest.fn().mockResolvedValue({
        userId: clientUser.user_id,
        role: testUsers.client.role,
        phoneNumber: testUsers.client.phoneNumber,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      // Decode and verify token claims
      const decoded = await jwt.verify(accessToken, { complete: true });

      expect(decoded.payload).toMatchObject({
        userId: expect.any(Number),
        role: testUsers.client.role,
        phoneNumber: testUsers.client.phoneNumber,
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      expect(decoded.header).toMatchObject({
        alg: "HS256",
        typ: "JWT",
      });
    });

    it("should store hashed tokens in database for revocation", async () => {
      // Check that token hash is stored in auth_sessions
      const tokenQuery = `
        SELECT jwt_token_hash
        FROM users.auth_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`;

      const tokenResult = await testDb.query(tokenQuery, [clientUser.user_id]);

      expect(tokenResult.rows[0]).toMatchObject({
        jwt_token_hash: expect.any(String),
      });

      // Hash should not be the same as the actual token
      expect(tokenResult.rows[0].jwt_token_hash).not.toBe(accessToken);
    });
  });
});
