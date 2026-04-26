import { z } from "zod";

export const MONTHLY_VOLUME_VALUES = [
  "0-100",
  "100-500",
  "500-2000",
  "2000+",
] as const;

export type MonthlyVolume = (typeof MONTHLY_VOLUME_VALUES)[number];

const monthlyVolumeEnum = z.enum(MONTHLY_VOLUME_VALUES);

/** E.164-style Indian mobile: +91 and exactly 10 digits, first digit 6–9. */
const INDIAN_MOBILE_E164 = /^\+91[6-9]\d{9}$/;

/** Standard 15-char GSTIN (case-insensitive). */
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function normalizePhoneForValidation(raw: string): string {
  return raw.replaceAll(/\s/g, "").trim();
}

/** Stored value is always `+91` plus 0–10 digits only. */
const PHONE_STORED_SHAPE = /^\+91\d{0,10}$/;

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const businessRegisterSchema = z.object({
  fullName: z
    .string()
    .max(100)
    .refine((s) => s.trim().length >= 2, {
      message: "Full name must be at least 2 characters.",
    })
    .refine((s) => /^[\p{L}\s'.-]+$/u.test(s.trim()), {
      message:
        "Use letters, spaces, apostrophes, hyphens, or periods only (no numbers).",
    }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address." })
    .max(100),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(72)
    .regex(/[A-Za-z]/, {
      message: "Password must include at least one letter.",
    })
    .regex(/\d/, {
      message: "Password must include at least one number.",
    }),
  phoneNumber: z.string().refine(
    (raw) => {
      const n = normalizePhoneForValidation(raw);
      if (!PHONE_STORED_SHAPE.test(n)) return false;
      if (n === "+91") return true;
      if (n.length !== 13) return false;
      return INDIAN_MOBILE_E164.test(n);
    },
    {
      message:
        "Enter all 10 digits after +91 (mobile must start with 6–9), or leave digits empty.",
    },
  ),
  businessName: z
    .string()
    .max(200)
    .refine((s) => s.trim().length >= 2, {
      message: "Business name must be at least 2 characters.",
    }),
  gstNumber: z.string().refine(
    (raw) => {
      const s = raw.trim();
      if (s === "") return true;
      return GSTIN.test(s.toUpperCase());
    },
    {
      message: "Enter a valid 15-character GSTIN or leave this field blank.",
    },
  ),
  monthlyVolume: monthlyVolumeEnum.optional(),
});

export type BusinessRegisterValues = z.infer<typeof businessRegisterSchema>;
