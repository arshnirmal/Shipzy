// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";

export const verifyGoogleSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["idToken"],
    properties: {
      idToken: { type: "string" },
      role: { type: "string", enum: ["client", "courier"] },
    },
  },
};

export const refreshTokenSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string" },
    },
  },
};

export const registerSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["fullName", "email", "password"],
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 100 },
      email: { type: "string", format: "email", maxLength: 100 },
      password: { type: "string", minLength: 8, maxLength: 255 },
      role: { type: "string", enum: ["client", "courier"], default: "client" },
      phoneNumber: { type: "string", minLength: 10, maxLength: 20 },
    },
  },
};

export const loginSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", maxLength: 100 },
      password: { type: "string", minLength: 1, maxLength: 255 },
    },
  },
};
