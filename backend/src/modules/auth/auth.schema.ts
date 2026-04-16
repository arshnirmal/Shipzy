// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";
import { z } from "zod";
import {
  BusinessRegisterRequestZ,
  GoogleAuthRequestZ,
  RefreshTokenRequestZ,
  RegisterRequestZ,
  LoginRequestZ,
  AuthResponseZ,
} from "./auth.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const authResponseJson = toJsonSchema(AuthResponseZ);

const logoutResponseJson = toJsonSchema(
  z.object({ message: z.string() }).strict(),
);

export const verifyGoogleSchema: FastifySchema = {
  body: toJsonSchema(GoogleAuthRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(authResponseJson),
    201: successEnvelope(authResponseJson),
  },
};

export const refreshTokenSchema: FastifySchema = {
  body: toJsonSchema(RefreshTokenRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(authResponseJson),
  },
};

export const registerSchema: FastifySchema = {
  body: toJsonSchema(RegisterRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(authResponseJson),
  },
};

export const loginSchema: FastifySchema = {
  body: toJsonSchema(LoginRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(authResponseJson),
  },
};

export const businessRegisterSchema: FastifySchema = {
  body: toJsonSchema(BusinessRegisterRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(authResponseJson),
  },
};

export const logoutSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(logoutResponseJson),
  },
};
