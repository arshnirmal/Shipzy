// services/backend/src/modules/payments/provider-factory.ts
// Factory that maps payment methods to their provider implementation.
// To add a new provider, implement PaymentProvider and register here.

import type { PaymentProvider } from "./payment-provider.interface.js";
import { razorpayProvider } from "./providers/razorpay.provider.js";

/**
 * Get the payment provider for a given payment method.
 *
 * For MVP, all online payment methods route through Razorpay.
 * In the future, you can add logic to route specific methods to
 * different providers (e.g., Cashfree for payouts, Stripe for international).
 */
export function getPaymentProvider(_methodName?: string): PaymentProvider {
  // Future: switch on methodName
  // case "cashfree_upi": return cashfreeProvider;
  // case "stripe": return stripeProvider;
  return razorpayProvider;
}

/**
 * Get the payout provider (for driver settlements).
 * Separated from collection provider so they can be different.
 */
export function getPayoutProvider(): PaymentProvider {
  // Future: could use a different provider for payouts
  return razorpayProvider;
}
