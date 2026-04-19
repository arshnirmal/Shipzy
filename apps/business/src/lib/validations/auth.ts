import { z } from "zod";

export const MONTHLY_VOLUME_VALUES = [
  "0-100",
  "100-500",
  "500-2000",
  "2000+",
] as const;

export type MonthlyVolume = (typeof MONTHLY_VOLUME_VALUES)[number];

const monthlyVolumeEnum = z.enum(MONTHLY_VOLUME_VALUES);

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
    .min(2, { message: "Full Name must be at least 2 characters." })
    .max(100),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .max(100),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(72),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." })
    .max(20)
    .optional()
    .or(z.literal("")),
  businessName: z
    .string()
    .min(2, { message: "Business Name must be at least 2 characters." })
    .max(200),
  gstNumber: z
    .string()
    .max(15, { message: "GST Number cannot exceed 15 characters." })
    .optional()
    .or(z.literal("")),
  monthlyVolume: monthlyVolumeEnum.optional(),
});

export type BusinessRegisterValues = z.infer<typeof businessRegisterSchema>;
