// services/backend/src/modules/auth/auth.schema.js

export const verifyFirebaseSchema = {
  body: {
    type: "object",
    required: ["idToken"],
    properties: {
      idToken: { type: "string" },
      fullName: { type: "string", minLength: 2, maxLength: 100 },
      role: { type: "string", enum: ["client", "courier"] },
    },
  },
};

export const verifyGoogleSchema = {
  body: {
    type: "object",
    required: ["idToken"],
    properties: {
      idToken: { type: "string" },
      role: { type: "string", enum: ["client", "courier"] },
    },
  },
};

export const refreshTokenSchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string" },
    },
  },
};
