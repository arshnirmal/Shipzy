// services/backend/src/modules/auth/auth.zod.ts
import { z } from "zod";
import { BaseUserZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

export const AuthRoleZ = z.enum(["client", "courier"]);

// Register Request
export const RegisterRequestZ = z
  .object({
    identity: z
      .object({
        fullName: z.string().min(2).max(100),
        role: AuthRoleZ,
        phoneNumber: z.string().min(10).max(20).optional(),
      })
      .strict(),
    credentials: z
      .object({
        email: z.string().email().max(100),
        password: z.string().min(8).max(255),
      })
      .strict(),
  })
  .strict();
export type RegisterRequest = z.infer<typeof RegisterRequestZ>;

// Login Request
export const LoginRequestZ = z
  .object({
    credentials: z
      .object({
        email: z.string().email().max(100),
        password: z.string().min(1).max(255),
      })
      .strict(),
  })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequestZ>;

// Google Auth Request
export const GoogleAuthRequestZ = z
  .object({
    provider: z
      .object({
        idToken: z.string().min(1),
      })
      .strict(),
    identity: z
      .object({
        role: AuthRoleZ,
      })
      .strict(),
  })
  .strict();
export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestZ>;

// Business Register Request
export const BusinessRegisterRequestZ = z
  .object({
    identity: z
      .object({
        fullName: z.string().min(2).max(100),
        phoneNumber: z.string().min(10).max(20).optional(),
      })
      .strict(),
    credentials: z
      .object({
        email: z.string().email().max(100),
        password: z.string().min(8).max(72),
      })
      .strict(),
    business: z
      .object({
        businessName: z.string().min(2).max(200),
        gstNumber: z.string().max(15).optional(),
        monthlyVolume: z
          .enum(["0-100", "100-500", "500-2000", "2000+"])
          .optional(),
      })
      .strict(),
  })
  .strict();
export type BusinessRegisterRequest = z.infer<typeof BusinessRegisterRequestZ>;

// Refresh Token Request
export const RefreshTokenRequestZ = z
  .object({
    tokens: z
      .object({
        refreshToken: z.string().min(1),
      })
      .strict(),
  })
  .strict();
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

// Auth Tokens
export const AuthTokensZ = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number().int().positive(),
    tokenType: z.literal("Bearer"),
  })
  .strict();
export type AuthTokens = z.infer<typeof AuthTokensZ>;

export const AuthSessionZ = z
  .object({
    method: z.enum(["email", "google", "refresh"]),
    isNewUser: z.boolean().optional(),
  })
  .strict();
export type AuthSession = z.infer<typeof AuthSessionZ>;

// Auth Response (includes user and tokens)
export const AuthResponseZ = z
  .object({
    actor: z
      .object({
        user: BaseUserZ,
      })
      .strict(),
    auth: z
      .object({
        tokens: AuthTokensZ,
        session: AuthSessionZ,
      })
      .strict(),
  })
  .strict();
export type AuthResponse = z.infer<typeof AuthResponseZ>;
