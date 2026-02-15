// services/backend/src/modules/auth/auth.zod.ts
import { z } from "zod";

export const VerifyGoogleZ = z.object({
  idToken: z.string().min(1),
  role: z.enum(["client", "courier"]).optional(),
});
export type VerifyGoogle = z.infer<typeof VerifyGoogleZ>;

export const RefreshTokenZ = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshToken = z.infer<typeof RefreshTokenZ>;

export const RegisterZ = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(100),
  password: z.string().min(8).max(255),
  role: z.enum(["client", "courier"]).optional(),
  phoneNumber: z.string().min(6).max(20).optional(),
});
export type Register = z.infer<typeof RegisterZ>;

export const LoginZ = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(255),
});
export type Login = z.infer<typeof LoginZ>;
