"use client";

import { apiRequest, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// ── Razorpay Checkout typings (minimal) ─────────────────────────────────────────

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// ── API envelopes ───────────────────────────────────────────────────────────────

type CreateOrderEnvelope = {
  success: true;
  message: string;
  data: {
    providerOrderId: string;
    publishableKey: string;
    amount: number;
    currency: string;
    orderId: number;
  };
  timestamp: string;
};

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Lazily injects Razorpay Checkout.js. Resolves immediately if already present.
 */
function loadCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay Checkout")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

export type PayResult = { status: "paid" | "cancelled" | "failed" };

export type PayPrefill = { name?: string; email?: string; contact?: string };

/**
 * Prepaid payment hook. `payForOrder` runs the full create-order → checkout →
 * verify round-trip and resolves a discriminated result. It never throws — the
 * caller can leave the order pending-payment on `cancelled`/`failed` and retry.
 */
export function usePayment() {
  async function payForOrder(
    orderId: number,
    prefill?: PayPrefill,
  ): Promise<PayResult> {
    try {
      await loadCheckout();

      const created = await apiRequest<CreateOrderEnvelope>(
        "/payments/create-order",
        { method: "POST", body: JSON.stringify({ orderId }) },
      );
      const { providerOrderId, publishableKey, amount, currency } =
        created.data;

      const Checkout = window.Razorpay;
      if (!Checkout) {
        toast.error("Payment unavailable — please retry");
        return { status: "failed" };
      }

      return await new Promise<PayResult>((resolve) => {
        const rzp = new Checkout({
          key: publishableKey,
          order_id: providerOrderId,
          amount: Math.round(amount * 100),
          currency,
          name: "Shipzy",
          description: `Order #${orderId}`,
          prefill,
          handler: async (response) => {
            try {
              await apiRequest("/payments/verify", {
                method: "POST",
                body: JSON.stringify({
                  orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              toast.success("Payment successful");
              resolve({ status: "paid" });
            } catch (error: unknown) {
              toast.error(getErrorMessage(error));
              resolve({ status: "failed" });
            }
          },
          modal: { ondismiss: () => resolve({ status: "cancelled" }) },
        });
        rzp.open();
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      return { status: "failed" };
    }
  }

  return { payForOrder };
}
