// services/backend/src/modules/auth/auth.zod.ts
import { z } from "zod";
import { ClientUserZ, DriverUserZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

// Register Request
export const RegisterRequestZ = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(100),
  password: z.string().min(8).max(255),
  role: z.enum(["client", "courier"]),
  phoneNumber: z.string().min(10).max(20).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestZ>;

// Login Request
export const LoginRequestZ = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(255),
});
export type LoginRequest = z.infer<typeof LoginRequestZ>;

// Google Auth Request
export const GoogleAuthRequestZ = z.object({
  idToken: z.string().min(1),
  role: z.enum(["client", "courier"]),
});
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestZ>;

// Refresh Token Request
export const RefreshTokenRequestZ = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Auth Tokens
export const AuthTokensZ = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  tokenType: z.literal("Bearer"),
});
export type AuthTokens = z.infer<typeof AuthTokensZ>;

// Auth Response (includes user and tokens)
export const AuthResponseZ = z.object({
  user: z.union([ClientUserZ, DriverUserZ]),
  tokens: AuthTokensZ,
});
export type AuthResponse = z.infer<typeof AuthResponseZ>;

