import type {
  CreatePaymentOrderParams, PaymentOrderResult,
  VerifyPaymentParams, PaymentVerificationResult,
  GenerateQRParams, QRCodeResult,
  RefundParams, RefundResult,
  PayoutParams, PayoutResult, BatchPayoutParams, BatchPayoutResult, PayoutStatusResult,
} from "./payment-provider.interface.js";

export interface WebhookEvent {
  handled: boolean;
  eventId: string;
  eventType: string;
  status: "captured" | "failed" | "refunded" | "qr_credited" | "payout_processed" | "payout_failed";
  providerOrderId?: string;
  providerPaymentId?: string;
  qrCodeId?: string;
  providerPayoutId?: string;
  amount?: number; // paise
  vpa?: string;
  raw: unknown;
}

export interface CollectionProvider {
  createPaymentOrder(p: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(p: VerifyPaymentParams): Promise<PaymentVerificationResult>;
}
export interface QRProvider { generateQRCode(p: GenerateQRParams): Promise<QRCodeResult>; }
export interface RefundProvider { initiateRefund(p: RefundParams): Promise<RefundResult>; }
export interface PayoutProvider {
  initiatePayout(p: PayoutParams): Promise<PayoutResult>;
  batchPayout(p: BatchPayoutParams): Promise<BatchPayoutResult>;
  getPayoutStatus(id: string): Promise<PayoutStatusResult>;
}
export interface WebhookProvider {
  verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent>;
}

export interface ProviderCapabilities {
  readonly name: string;
  collection?: CollectionProvider;
  qr?: QRProvider;
  refund?: RefundProvider;
  payout?: PayoutProvider;
  webhook?: WebhookProvider;
}
