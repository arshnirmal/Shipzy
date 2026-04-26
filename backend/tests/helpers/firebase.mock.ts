import { jest } from "@jest/globals";

const verifyFirebaseTokenMock = jest
  .fn<() => Promise<{ uid: string; email: string; name: string }>>()
  .mockResolvedValue({
    uid: "test-firebase-uid",
    email: "test@example.com",
    name: "Test User",
  });

await jest.unstable_mockModule("../../src/config/firebase.js", () => ({
  __esModule: true,
  default: undefined,
  firebaseAuth: undefined,
  verifyFirebaseToken: verifyFirebaseTokenMock,
}));

export { verifyFirebaseTokenMock };
