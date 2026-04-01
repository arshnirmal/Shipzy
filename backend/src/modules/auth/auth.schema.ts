// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GoogleAuthRequestZ,
  RefreshTokenRequestZ,
  RegisterRequestZ,
  LoginRequestZ,
} from "./auth.zod.js";

export const verifyGoogleSchema: FastifySchema = { body: zodToJsonSchema(GoogleAuthRequestZ as any) };
export const refreshTokenSchema: FastifySchema = { body: zodToJsonSchema(RefreshTokenRequestZ as any) };
export const registerSchema: FastifySchema = { body: zodToJsonSchema(RegisterRequestZ as any) };
export const loginSchema: FastifySchema = { body: zodToJsonSchema(LoginRequestZ as any) };
