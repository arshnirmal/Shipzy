import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildTestApp, inject, authHeaders } from "../helpers/app.js";
import {
  createAdmin,
  createClient,
  createCourier,
} from "../helpers/fixtures.js";

describe("Admin module", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/admin/drivers/:userId/onboarding-review approves pending_review and sets isVerified", async () => {
    const admin = await createAdmin(app);
    const courier = await createCourier(app, { activate: false });

    const lic = "https://res.cloudinary.com/demo/image/upload/v1/lic.jpg";
    const reg = "https://res.cloudinary.com/demo/image/upload/v1/reg.jpg";
    const ins = "https://res.cloudinary.com/demo/image/upload/v1/ins.jpg";

    const kycResponse = await inject(app, {
      method: "POST",
      url: "/api/v1/drivers/me/kyc",
      headers: authHeaders(courier.accessToken),
      payload: {
        license: { url: lic },
        vehicleReg: { url: reg },
        insurance: { url: ins },
      },
    });
    expect(kycResponse.statusCode).toBe(200);

    const reviewResponse = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${courier.user.userId}/onboarding-review`,
      headers: authHeaders(admin.accessToken),
      payload: { decision: "approve" },
    });

    expect(reviewResponse.statusCode).toBe(200);
    const reviewBody = reviewResponse.json();
    expect(reviewBody.success).toBe(true);
    expect(reviewBody.data.userId).toBe(courier.user.userId);
    expect(reviewBody.data.isVerified).toBe(true);
    expect(reviewBody.data.onboarding.status).toBe("approved");
    expect(typeof reviewBody.data.onboarding.approvedAt).toBe("string");

    const profileResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me",
      headers: authHeaders(courier.accessToken),
    });
    expect(profileResponse.statusCode).toBe(200);
    const driver = profileResponse.json().data.driver;
    expect(driver.isVerified).toBe(true);
  });

  it("POST onboarding-review rejects with reason and clears verification", async () => {
    const admin = await createAdmin(app);
    const courier = await createCourier(app, { activate: false });

    const lic = "https://res.cloudinary.com/demo/image/upload/v2/lic.jpg";
    const reg = "https://res.cloudinary.com/demo/image/upload/v2/reg.jpg";
    const ins = "https://res.cloudinary.com/demo/image/upload/v2/ins.jpg";

    await inject(app, {
      method: "POST",
      url: "/api/v1/drivers/me/kyc",
      headers: authHeaders(courier.accessToken),
      payload: {
        license: { url: lic },
        vehicleReg: { url: reg },
        insurance: { url: ins },
      },
    });

    const reviewResponse = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${courier.user.userId}/onboarding-review`,
      headers: authHeaders(admin.accessToken),
      payload: {
        decision: "reject",
        rejectedReason: "Documents do not match registered vehicle.",
      },
    });

    expect(reviewResponse.statusCode).toBe(200);
    const reviewBody = reviewResponse.json();
    expect(reviewBody.data.onboarding.status).toBe("rejected");
    expect(reviewBody.data.onboarding.rejectedReason).toContain("Documents");
    expect(reviewBody.data.isVerified).toBe(false);

    const profileResponse = await inject(app, {
      method: "GET",
      url: "/api/v1/drivers/me",
      headers: authHeaders(courier.accessToken),
    });
    expect(profileResponse.json().data.driver.isVerified).toBe(false);
  });

  it("returns 403 for non-admin callers", async () => {
    const courier = await createCourier(app, { activate: false });

    await inject(app, {
      method: "POST",
      url: "/api/v1/drivers/me/kyc",
      headers: authHeaders(courier.accessToken),
      payload: {
        license: { url: "https://res.cloudinary.com/demo/image/upload/v3/lic.jpg" },
        vehicleReg: { url: "https://res.cloudinary.com/demo/image/upload/v3/reg.jpg" },
        insurance: { url: "https://res.cloudinary.com/demo/image/upload/v3/ins.jpg" },
      },
    });

    const forbidden = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${courier.user.userId}/onboarding-review`,
      headers: authHeaders(courier.accessToken),
      payload: { decision: "approve" },
    });
    expect(forbidden.statusCode).toBe(403);
  });

  it("returns 422 when target is not a courier", async () => {
    const admin = await createAdmin(app);
    const client = await createClient(app);

    const res = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${client.user.userId}/onboarding-review`,
      headers: authHeaders(admin.accessToken),
      payload: { decision: "approve" },
    });
    expect(res.statusCode).toBe(422);
  });

  it("returns 404 for unknown user id", async () => {
    const admin = await createAdmin(app);
    const res = await inject(app, {
      method: "POST",
      url: "/api/v1/admin/drivers/999999999/onboarding-review",
      headers: authHeaders(admin.accessToken),
      payload: { decision: "approve" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 409 when onboarding is not pending_review", async () => {
    const admin = await createAdmin(app);
    const courier = await createCourier(app, { activate: false });

    const conflict = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${courier.user.userId}/onboarding-review`,
      headers: authHeaders(admin.accessToken),
      payload: { decision: "approve" },
    });
    expect(conflict.statusCode).toBe(409);
  });

  it("returns 400 when reject is missing rejectedReason", async () => {
    const admin = await createAdmin(app);
    const courier = await createCourier(app, { activate: false });

    await inject(app, {
      method: "POST",
      url: "/api/v1/drivers/me/kyc",
      headers: authHeaders(courier.accessToken),
      payload: {
        license: { url: "https://res.cloudinary.com/demo/image/upload/v4/lic.jpg" },
        vehicleReg: { url: "https://res.cloudinary.com/demo/image/upload/v4/reg.jpg" },
        insurance: { url: "https://res.cloudinary.com/demo/image/upload/v4/ins.jpg" },
      },
    });

    const bad = await inject(app, {
      method: "POST",
      url: `/api/v1/admin/drivers/${courier.user.userId}/onboarding-review`,
      headers: authHeaders(admin.accessToken),
      payload: { decision: "reject" },
    });
    expect(bad.statusCode).toBe(400);
  });
});
