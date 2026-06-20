// services/backend/src/modules/payments/payments.zod.ts
// Zod schemas and TypeScript types for the payments module

import { z } from "zod";

// ─── Request Schemas ─────────────────────────────────────────────────────────

/** POST /payments/create-order */
export const CreatePaymentOrderRequestZ = z.object({
  orderId: z.number().int().positive(),
});
export type CreatePaymentOrderRequest = z.infer<
  typeof CreatePaymentOrderRequestZ
>;

/** POST /payments/verify */
export const VerifyPaymentRequestZ = z.object({
  orderId: z.number().int().positive(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestZ>;

/** POST /payments/generate-qr */
export const GenerateQRRequestZ = z.object({
  orderId: z.number().int().positive(),
});
export type GenerateQRRequest = z.infer<typeof GenerateQRRequestZ>;

/** POST /payments/:transactionId/refund */
export const RefundRequestZ = z.object({
  reason: z.string().min(1).max(500),
});
export type RefundRequest = z.infer<typeof RefundRequestZ>;

/** GET /payments/driver/earnings */
export const DriverEarningsQueryZ = z.object({
  period: z
    .enum(["today", "week", "month", "all"])
    .optional()
    .default("today"),
});
export type DriverEarningsQuery = z.infer<typeof DriverEarningsQueryZ>;

/** GET /payments/driver/payouts */
export const DriverPayoutsQueryZ = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type DriverPayoutsQuery = z.infer<typeof DriverPayoutsQueryZ>;

// ─── Response Schemas ────────────────────────────────────────────────────────

export const PaymentOrderResponseZ = z.object({
  razorpayOrderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  razorpayKeyId: z.string(),
  orderId: z.number(),
});
export type PaymentOrderResponse = z.infer<typeof PaymentOrderResponseZ>;

export const PaymentVerifyResponseZ = z.object({
  verified: z.boolean(),
  transactionId: z.number().optional(),
  paymentStatus: z.string(),
  orderId: z.number(),
});
export type PaymentVerifyResponse = z.infer<typeof PaymentVerifyResponseZ>;

export const QRCodeResponseZ = z.object({
  qrId: z.string(),
  imageUrl: z.string(),
  amount: z.number(),
  expiresAt: z.string(),
  orderId: z.number(),
});
export type QRCodeResponse = z.infer<typeof QRCodeResponseZ>;

export const PaymentStatusResponseZ = z.object({
  orderId: z.number(),
  paymentMode: z.enum(["prepaid", "collect_on_delivery"]),
  paymentStatus: z.string(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  transactionId: z.number().nullable(),
  externalTransactionId: z.string().nullable(),
  paidAt: z.string().nullable(),
  qrCodeId: z.string().nullable(),
  qrImageUrl: z.string().nullable(),
  qrExpiresAt: z.string().nullable(),
});
export type PaymentStatusResponse = z.infer<typeof PaymentStatusResponseZ>;

export const RefundResponseZ = z.object({
  refundId: z.number(),
  transactionId: z.number(),
  amount: z.number(),
  status: z.string(),
});
export type RefundResponse = z.infer<typeof RefundResponseZ>;

export const EarningsEntryZ = z.object({
  ledgerId: z.number(),
  orderId: z.number(),
  grossAmount: z.number(),
  commissionPct: z.number(),
  commissionAmt: z.number(),
  netAmount: z.number(),
  status: z.string(),
  earnedAt: z.string(),
});

export const DriverEarningsResponseZ = z.object({
  period: z.string(),
  totalDeliveries: z.number(),
  grossEarnings: z.number(),
  totalCommission: z.number(),
  netEarnings: z.number(),
  pendingSettlement: z.number(),
  entries: z.array(EarningsEntryZ),
});
export type DriverEarningsResponse = z.infer<typeof DriverEarningsResponseZ>;

export const PayoutRecordZ = z.object({
  payoutId: z.number(),
  totalDeliveries: z.number(),
  grossAmount: z.number(),
  totalCommission: z.number(),
  netAmount: z.number(),
  payoutMethod: z.string(),
  status: z.string(),
  payoutDate: z.string(),
  completedAt: z.string().nullable(),
});

export const DriverPayoutsResponseZ = z.object({
  payouts: z.array(PayoutRecordZ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type DriverPayoutsResponse = z.infer<typeof DriverPayoutsResponseZ>;

// ─── Route Params ────────────────────────────────────────────────────────────

export const PaymentParamsZ = z.object({
  transactionId: z.coerce.number().int().positive(),
});
export type PaymentParams = z.infer<typeof PaymentParamsZ>;

export const OrderPaymentParamsZ = z.object({
  orderId: z.coerce.number().int().positive(),
});
export type OrderPaymentParams = z.infer<typeof OrderPaymentParamsZ>;

export const WebhookBodyZ = z.any();
