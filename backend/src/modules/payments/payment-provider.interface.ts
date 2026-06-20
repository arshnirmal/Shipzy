// services/backend/src/modules/payments/payment-provider.interface.ts
// Strategy Pattern: Provider-agnostic payment interface
// Any payment gateway (Razorpay, Cashfree, Stripe) implements this interface

/**
 * Parameters for creating a payment order (prepaid checkout)
 */
export interface CreatePaymentOrderParams {
  orderId: number;
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  receipt: string; // internal order reference
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  providerOrderId: string; // e.g., razorpay order_id
  amount: number;
  currency: string;
  status: string;
}

/**
 * Parameters for verifying a payment after checkout
 */
export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  providerPaymentId: string;
  providerOrderId: string;
  method?: string; // "upi", "card", etc.
  vpa?: string; // UPI VPA if applicable
}

/**
 * Parameters for generating a UPI QR code (collect-on-delivery)
 */
export interface GenerateQRParams {
  orderId: number;
  amount: number; // in smallest currency unit (paise)
  description: string;
  expiryMinutes: number;
  notes?: Record<string, string>;
}

export interface QRCodeResult {
  success: boolean;
  qrId: string;
  imageUrl: string;
  expiresAt: Date;
}

/**
 * Webhook handling
 */
export interface WebhookResult {
  handled: boolean;
  event: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  qrCodeId?: string;
  status: "captured" | "failed" | "refunded" | "qr_credited";
  amount?: number;
  method?: string;
  vpa?: string;
}

/**
 * Refund parameters
 */
export interface RefundParams {
  providerPaymentId: string;
  amount: number; // in smallest currency unit (paise)
  reason: string;
  notes?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

/**
 * Payout parameters (Shipzy → Driver)
 */
export interface PayoutParams {
  driverId: number;
  amount: number; // in smallest currency unit (paise)
  upiId: string;
  referenceId: string; // internal payout reference
  narration: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  status: string;
  utr?: string; // Unique Transaction Reference
}

export interface BatchPayoutParams {
  payouts: PayoutParams[];
}

export interface BatchPayoutResult {
  results: Array<{
    driverId: number;
    success: boolean;
    payoutId?: string;
    error?: string;
  }>;
}

export interface PayoutStatusResult {
  payoutId: string;
  status: string;
  utr?: string;
  completedAt?: Date;
  failureReason?: string;
}

/**
 * The core PaymentProvider interface.
 * All payment gateways must implement this.
 *
 * To add a new provider:
 * 1. Create a new file in providers/ (e.g., cashfree.provider.ts)
 * 2. Implement this interface
 * 3. Register in provider-factory.ts
 */
export interface PaymentProvider {
  readonly name: string;

  // Collection — Prepaid (business pays via checkout)
  createPaymentOrder(
    params: CreatePaymentOrderParams,
  ): Promise<PaymentOrderResult>;
  verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<PaymentVerificationResult>;

  // Collection — Collect-on-Delivery (driver shows QR)
  generateQRCode(params: GenerateQRParams): Promise<QRCodeResult>;

  // Webhook handling
  handleWebhook(
    body: unknown,
    headers: Record<string, string>,
  ): Promise<WebhookResult>;

  // Refunds
  initiateRefund(params: RefundParams): Promise<RefundResult>;

  // Payouts (Shipzy → Driver)
  initiatePayout(params: PayoutParams): Promise<PayoutResult>;
  batchPayout(params: BatchPayoutParams): Promise<BatchPayoutResult>;
  getPayoutStatus(payoutId: string): Promise<PayoutStatusResult>;
}
