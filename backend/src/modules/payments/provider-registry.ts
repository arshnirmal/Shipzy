// services/backend/src/modules/payments/provider-registry.ts
// Capability registry — maps provider names to their capability bundles.
// To add a new provider, implement ProviderCapabilities and call registry.register().

import { AppError } from "../../utils/error.util.js";
import type {
  ProviderCapabilities,
  CollectionProvider,
  QRProvider,
  RefundProvider,
  PayoutProvider,
  WebhookProvider,
} from "./capabilities.js";
import { razorpayProvider } from "./providers/razorpay.provider.js";

class ProviderRegistry {
  private providers = new Map<string, ProviderCapabilities>();

  register(p: ProviderCapabilities): void {
    this.providers.set(p.name, p);
  }

  private get(name: string): ProviderCapabilities {
    const p = this.providers.get(name);
    if (!p) throw new AppError(`Unknown payment provider: ${name}`, 400);
    return p;
  }

  collection(name = "razorpay"): CollectionProvider {
    return this.require(name, "collection");
  }

  qr(name = "razorpay"): QRProvider {
    return this.require(name, "qr");
  }

  refund(name = "razorpay"): RefundProvider {
    return this.require(name, "refund");
  }

  payout(name = "razorpay"): PayoutProvider {
    return this.require(name, "payout");
  }

  webhook(name: string): WebhookProvider {
    return this.require(name, "webhook");
  }

  private require<K extends keyof ProviderCapabilities>(
    name: string,
    cap: K,
  ): NonNullable<ProviderCapabilities[K]> {
    const c = this.get(name)[cap];
    if (!c) throw new AppError(`Provider ${name} does not support ${String(cap)}`, 400);
    return c as NonNullable<ProviderCapabilities[K]>;
  }
}

export const registry = new ProviderRegistry();
registry.register(razorpayProvider);

export default registry;
