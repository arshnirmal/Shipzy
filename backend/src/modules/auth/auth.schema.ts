// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  GoogleAuthRequestZ,
  RefreshTokenRequestZ,
  RegisterRequestZ,
  LoginRequestZ,
} from "./auth.zod.js";

const _VerifyGoogleJson = zodToJsonSchema(GoogleAuthRequestZ as any, "VerifyGoogle");
const VerifyGoogleJson =
  (_VerifyGoogleJson.definitions &&
    (_VerifyGoogleJson.definitions as any).VerifyGoogle) ||
  _VerifyGoogleJson;
const _RefreshTokenJson = zodToJsonSchema(RefreshTokenRequestZ as any, "RefreshToken");
const RefreshTokenJson =
  (_RefreshTokenJson.definitions &&
    (_RefreshTokenJson.definitions as any).RefreshToken) ||
  _RefreshTokenJson;
const _RegisterJson = zodToJsonSchema(RegisterRequestZ as any, "Register");
const RegisterJson =
  (_RegisterJson.definitions && (_RegisterJson.definitions as any).Register) ||
  _RegisterJson;
const _LoginJson = zodToJsonSchema(LoginRequestZ as any, "Login");
const LoginJson =
  (_LoginJson.definitions && (_LoginJson.definitions as any).Login) ||
  _LoginJson;

export const verifyGoogleSchema: FastifySchema = { body: VerifyGoogleJson };
export const refreshTokenSchema: FastifySchema = { body: RefreshTokenJson };
export const registerSchema: FastifySchema = { body: RegisterJson };
export const loginSchema: FastifySchema = { body: LoginJson };
