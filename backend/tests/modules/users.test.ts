import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import { createClient } from "../helpers/fixtures.js";

describe("Users Module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/v1/users/me", () => {
    it("returns profile for authenticated user", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me",
        headers: authHeaders(account.accessToken),
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.profile.userId).toBe(account.user.userId);
    });

    it("returns 401 when token is missing", async () => {
      const response = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/v1/users/me", () => {
    it("updates profile fields and ignores unknown fields", async () => {
      const account = await createClient(app);

      const updateResponse = await inject(app, {
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: authHeaders(account.accessToken),
        payload: {
          fullName: "Updated Client Name",
          phoneNumber: "8888888888",
          unknownField: "ignored",
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      const meResponse = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me",
        headers: authHeaders(account.accessToken),
      });

      expect(meResponse.statusCode).toBe(200);
      const meBody = meResponse.json();
      expect(meBody.data.profile.fullName).toBe("Updated Client Name");
      expect(meBody.data.profile.phoneNumber).toBe("8888888888");
    });

    it("returns 401 when not authenticated", async () => {
      const response = await inject(app, {
        method: "PATCH",
        url: "/api/v1/users/me",
        payload: {
          fullName: "No Auth",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("/api/v1/users/me/addresses", () => {
    const validAddress = {
      fullAddress: "123 MG Road, Bengaluru",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Home",
      addressType: "home",
    };

    it("returns empty addresses for new user and saved addresses after creation", async () => {
      const account = await createClient(app);

      const emptyResponse = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me/addresses",
        headers: authHeaders(account.accessToken),
      });

      expect(emptyResponse.statusCode).toBe(200);
      expect(emptyResponse.json().data.addresses).toEqual([]);

      const saveResponse = await inject(app, {
        method: "POST",
        url: "/api/v1/users/me/addresses",
        headers: authHeaders(account.accessToken),
        payload: validAddress,
      });

      expect(saveResponse.statusCode).toBe(201);
      const saved = saveResponse.json().data.address;
      expect(saved.addressId).toEqual(expect.any(Number));

      const listResponse = await inject(app, {
        method: "GET",
        url: "/api/v1/users/me/addresses",
        headers: authHeaders(account.accessToken),
      });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json().data.addresses.length).toBe(1);
    });

    it("validates required fields when saving address", async () => {
      const account = await createClient(app);

      const response = await inject(app, {
        method: "POST",
        url: "/api/v1/users/me/addresses",
        headers: authHeaders(account.accessToken),
        payload: {
          label: "Incomplete",
        },
      });

      expect([400, 422]).toContain(response.statusCode);
    });

    it("deletes own address, returns 404 for missing, and 403 for another user address", async () => {
      const owner = await createClient(app);
      const anotherUser = await createClient(app);

      const saveResponse = await inject(app, {
        method: "POST",
        url: "/api/v1/users/me/addresses",
        headers: authHeaders(owner.accessToken),
        payload: validAddress,
      });
      expect(saveResponse.statusCode).toBe(201);
      const addressId = saveResponse.json().data.address.addressId;

      const foreignDelete = await inject(app, {
        method: "DELETE",
        url: `/api/v1/users/me/addresses/${addressId}`,
        headers: authHeaders(anotherUser.accessToken),
      });
      expect(foreignDelete.statusCode).toBe(403);

      const ownerDelete = await inject(app, {
        method: "DELETE",
        url: `/api/v1/users/me/addresses/${addressId}`,
        headers: authHeaders(owner.accessToken),
      });
      expect(ownerDelete.statusCode).toBe(200);

      const missingDelete = await inject(app, {
        method: "DELETE",
        url: `/api/v1/users/me/addresses/${addressId}`,
        headers: authHeaders(owner.accessToken),
      });
      expect(missingDelete.statusCode).toBe(404);
    });
  });
});
