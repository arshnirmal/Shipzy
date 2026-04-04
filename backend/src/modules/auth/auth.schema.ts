// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GoogleAuthRequestZ,
  RefreshTokenRequestZ,
  RegisterRequestZ,
  LoginRequestZ,
} from "./auth.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

export const verifyGoogleSchema: FastifySchema = {
  body: zodToJsonSchema(GoogleAuthRequestZ as unknown as ZodToJsonSchemaInput),
};

export const refreshTokenSchema: FastifySchema = {
  body: zodToJsonSchema(
    RefreshTokenRequestZ as unknown as ZodToJsonSchemaInput,
  ),
};

export const registerSchema: FastifySchema = {
  body: zodToJsonSchema(RegisterRequestZ as unknown as ZodToJsonSchemaInput),
};

export const loginSchema: FastifySchema = {
  body: zodToJsonSchema(LoginRequestZ as unknown as ZodToJsonSchemaInput),
};
