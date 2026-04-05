import "../helpers/firebase.mock.js";

import { jest } from "@jest/globals";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import { createClient } from "../helpers/fixtures.js";
import { verifyFirebaseTokenMock } from "../helpers/firebase.mock.js";

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@shipzy.test`;

describe("Auth Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(() => {
    verifyFirebaseTokenMock.mockReset().mockResolvedValue({
      uid: "test-firebase-uid",
      email: "test@example.com",
      name: "Test User",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /api/v1/auth/register", () => {
    it("registers a new user and returns tokens", async () => {
      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          identity: { fullName: "Auth Register", role: "client" },
          credentials: {
            email: uniqueEmail("register"),
            password: "StrongPass123!",
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.actor.user.userId).toEqual(expect.any(Number));
      expect(body.data.auth.tokens.accessToken).toEqual(expect.any(String));
      expect(body.data.auth.tokens.refreshToken).toEqual(expect.any(String));
    });

    it("rejects duplicate email registration", async () => {
      const email = uniqueEmail("duplicate");
      const payload = {
        identity: { fullName: "Auth Register", role: "client" },
        credentials: { email, password: "StrongPass123!" },
      };

      const first = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload,
      });
      expect(first.statusCode).toBe(201);

      const second = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload,
      });
      expect([400, 409]).toContain(second.statusCode);
    });

    it("validates required fields and role/password constraints", async () => {
      const missingFields = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {},
      });
      expect([400, 422]).toContain(missingFields.statusCode);

      const invalidRole = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          identity: { fullName: "User", role: "admin" },
          credentials: {
            email: uniqueEmail("bad-role"),
            password: "StrongPass123!",
          },
        },
      });
      expect([400, 422]).toContain(invalidRole.statusCode);

      const shortPassword = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          identity: { fullName: "User", role: "client" },
          credentials: { email: uniqueEmail("short-pass"), password: "short" },
        },
      });
      expect([400, 422]).toContain(shortPassword.statusCode);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns tokens for valid credentials", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          credentials: account.credentials,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.auth.tokens.accessToken).toEqual(expect.any(String));
      expect(body.data.auth.tokens.refreshToken).toEqual(expect.any(String));
    });

    it("rejects wrong password and unknown email", async () => {
      const account = await createClient(app);

      const wrongPassword = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          credentials: {
            email: account.credentials.email,
            password: "WrongPass123!",
          },
        },
      });
      expect(wrongPassword.statusCode).toBe(401);

      const unknownEmail = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          credentials: {
            email: uniqueEmail("unknown"),
            password: "WrongPass123!",
          },
        },
      });
      expect(unknownEmail.statusCode).toBe(401);
    });

    it("validates missing credentials", async () => {
      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {},
      });

      expect([400, 422]).toContain(response.statusCode);
    });
  });

  describe("POST /api/v1/auth/google/verify", () => {
    it("creates user on first sign-in and returns existing user tokens afterwards", async () => {
      verifyFirebaseTokenMock.mockResolvedValue({
        uid: "google-first-uid",
        email: uniqueEmail("google"),
        name: "Google First",
      });

      const first = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/google/verify",
        payload: {
          provider: { idToken: "valid-token" },
          identity: { role: "client" },
        },
      });
      expect(first.statusCode).toBe(201);

      const second = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/google/verify",
        payload: {
          provider: { idToken: "valid-token" },
          identity: { role: "client" },
        },
      });
      expect(second.statusCode).toBe(200);
    });

    it("returns 401 when Firebase verification fails", async () => {
      const firebaseError = Object.assign(new Error("Invalid Firebase token"), {
        code: "auth/invalid-id-token",
      });
      verifyFirebaseTokenMock.mockRejectedValueOnce(firebaseError);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/google/verify",
        payload: {
          provider: { idToken: "invalid-token" },
          identity: { role: "client" },
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("returns a new access token for valid refresh token", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: {
            refreshToken: account.refreshToken,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.auth.tokens.accessToken).toEqual(expect.any(String));
      expect(body.data.auth.tokens.refreshToken).toBe(account.refreshToken);
    });

    it("rejects invalid refresh token and access token type misuse", async () => {
      const account = await createClient(app);

      const invalid = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: { refreshToken: "not-a-jwt" },
        },
      });
      expect(invalid.statusCode).toBe(401);

      const accessAsRefresh = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: { refreshToken: account.accessToken },
        },
      });
      expect(accessAsRefresh.statusCode).toBe(401);
    });

    it("rejects refresh token after logout and after same-device re-login", async () => {
      const account = await createClient(app);

      const logout = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: authHeaders(account.accessToken),
      });
      expect(logout.statusCode).toBe(200);

      const revokedRefresh = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: { refreshToken: account.refreshToken },
        },
      });
      expect(revokedRefresh.statusCode).toBe(401);

      const email = uniqueEmail("same-device");
      const password = "StrongPass123!";
      const deviceId = "same-device-id";

      const registerResponse = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/register",
        headers: { "x-device-id": deviceId },
        payload: {
          identity: { fullName: "Device User", role: "client" },
          credentials: { email, password },
        },
      });
      expect(registerResponse.statusCode).toBe(201);
      const oldRefresh = registerResponse.json().data.auth.tokens.refreshToken;

      const reloginResponse = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/login",
        headers: { "x-device-id": deviceId },
        payload: {
          credentials: { email, password },
        },
      });
      expect(reloginResponse.statusCode).toBe(200);

      const staleRefreshAttempt = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: { refreshToken: oldRefresh },
        },
      });
      expect(staleRefreshAttempt.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out and rejects revoked access token on protected endpoint", async () => {
      const account = await createClient(app);

      const logoutResponse = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: authHeaders(account.accessToken),
      });
      expect(logoutResponse.statusCode).toBe(200);

      const meAfterLogout = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me",
        headers: authHeaders(account.accessToken),
      });
      expect(meAfterLogout.statusCode).toBe(401);
    });

    it("returns 401 on missing token", async () => {
      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/logout",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("Rate limiting", () => {
    it("returns 429 on the 11th /login request in same window", async () => {
      const account = await createClient(app);
      const ip = "10.10.10.10";
      let finalStatus = 0;

      for (let i = 0; i < 11; i += 1) {
        const response = await inject(
          app,
          {
            method: "POST",
            url: "/api/v1/auth/login",
            payload: {
              credentials: {
                email: account.credentials.email,
                password: "WrongPass123!",
              },
            },
          },
          ip,
        );
        finalStatus = response.statusCode;
      }

      expect(finalStatus).toBe(429);
    });

    it("returns 429 on the 11th /register request in same window", async () => {
      const ip = "10.10.10.11";
      let finalStatus = 0;

      for (let i = 0; i < 11; i += 1) {
        const response = await inject(
          app,
          {
            method: "POST",
            url: "/api/v1/auth/register",
            payload: {
              identity: { fullName: `Rate User ${i}`, role: "client" },
              credentials: {
                email: uniqueEmail(`register-limit-${i}`),
                password: "StrongPass123!",
              },
            },
          },
          ip,
        );
        finalStatus = response.statusCode;
      }

      expect(finalStatus).toBe(429);
    });

    it("returns 429 on the 11th /refresh request in same window", async () => {
      const account = await createClient(app);
      const ip = "10.10.10.12";
      let finalStatus = 0;

      for (let i = 0; i < 11; i += 1) {
        const response = await inject(
          app,
          {
            method: "POST",
            url: "/api/v1/auth/refresh",
            payload: {
              tokens: { refreshToken: account.refreshToken },
            },
          },
          ip,
        );
        finalStatus = response.statusCode;
      }

      expect(finalStatus).toBe(429);
    });

    it("returns 429 on the 11th /google/verify request in same window", async () => {
      verifyFirebaseTokenMock.mockResolvedValue({
        uid: "rate-limit-google-uid",
        email: uniqueEmail("google-rate"),
        name: "Google Rate",
      });

      const ip = "10.10.10.13";
      let finalStatus = 0;

      for (let i = 0; i < 11; i += 1) {
        const response = await inject(
          app,
          {
            method: "POST",
            url: "/api/v1/auth/google/verify",
            payload: {
              provider: { idToken: `google-token-${i}` },
              identity: { role: "client" },
            },
          },
          ip,
        );
        finalStatus = response.statusCode;
      }

      expect(finalStatus).toBe(429);
    });
  });

  describe("Token type enforcement", () => {
    it("rejects refresh token on authenticated endpoint", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me",
        headers: authHeaders(account.refreshToken),
      });

      expect(response.statusCode).toBe(401);
    });

    it("rejects access token on refresh endpoint", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/auth/refresh",
        payload: {
          tokens: {
            refreshToken: account.accessToken,
          },
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
