// services/backend/src/modules/auth/auth.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import { VerifyGoogleZ, RefreshTokenZ, RegisterZ, LoginZ } from "./auth.zod.js";

const VerifyGoogleJson = zodToJsonSchema(VerifyGoogleZ as any, "VerifyGoogle");
const RefreshTokenJson = zodToJsonSchema(RefreshTokenZ as any, "RefreshToken");
const RegisterJson = zodToJsonSchema(RegisterZ as any, "Register");
const LoginJson = zodToJsonSchema(LoginZ as any, "Login");

export const verifyGoogleSchema: FastifySchema = { body: VerifyGoogleJson };
export const refreshTokenSchema: FastifySchema = { body: RefreshTokenJson };
export const registerSchema: FastifySchema = { body: RegisterJson };
export const loginSchema: FastifySchema = { body: LoginJson };
