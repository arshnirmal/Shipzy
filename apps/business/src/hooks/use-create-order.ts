"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import type { FareBreakdown, OrderLocation, PaymentMode } from "@/types/orders";
import type { DraftFulfillment, DraftItem, DraftPackage, DraftSchedule } from "@/types/business";

// ── Payload ───────────────────────────────────────────────────────────────────

export type CreateOrderPayload = {
  fulfillment: {
    deliveryTypeId: number;
    vehicleCategoryId: number;
    weightTierId?: number | null;
    packageTypeId?: number | null;
    paymentMethodId: number;
    paymentMode?: PaymentMode;
  };
  locations: {
    pickup: OrderLocation;
    delivery: OrderLocation;
  };
  package?: {
    description?: string | null;
    specialInstructions?: string | null;
    declaredValue?: number | null;
    notifyRecipientSms?: boolean;
  };
  schedule?: {
    pickupAt?: string | null;
    deliveryAt?: string | null;
  };
  pricing: FareBreakdown;
  items?: { itemName: string; quantity: number; weightKg?: number }[];
};

// ── Response ──────────────────────────────────────────────────────────────────

export type CreateOrderResponse = {
  success: true;
  message: string;
  data: { order: { identifiers: { orderId: number; orderUuid: string; orderNumber?: string | null } } };
  timestamp: string;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      apiRequest<CreateOrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts the wizard's local DraftItem[] into the shape POST /orders expects.
 */
export function mapDraftItemsToOrderItems(
  items: DraftItem[],
): CreateOrderPayload["items"] {
  return items.map((it) => ({
    itemName: it.name,
    quantity: it.quantity,
  }));
}

/**
 * Builds a full CreateOrderPayload from the wizard's local state + computed fare.
 * Returns null if any required fields are missing.
 */
export function buildCreateOrderPayload(opts: {
  fulfillment: DraftFulfillment;
  pickup: OrderLocation;
  delivery: OrderLocation;
  pkg: DraftPackage;
  schedule: DraftSchedule;
  items: DraftItem[];
  pricing: FareBreakdown;
}): CreateOrderPayload {
  return {
    fulfillment: {
      deliveryTypeId: opts.fulfillment.deliveryTypeId,
      vehicleCategoryId: opts.fulfillment.vehicleCategoryId,
      weightTierId: opts.fulfillment.weightTierId ?? null,
      packageTypeId: opts.fulfillment.packageTypeId ?? null,
      paymentMethodId: opts.fulfillment.paymentMethodId,
      paymentMode: opts.fulfillment.paymentMode ?? "prepaid",
    },
    locations: {
      pickup: opts.pickup,
      delivery: opts.delivery,
    },
    package: {
      description: opts.pkg.description ?? null,
      specialInstructions: opts.pkg.specialInstructions ?? null,
      declaredValue: opts.pkg.declaredValue ?? null,
      notifyRecipientSms: opts.pkg.notifyRecipientSms ?? false,
    },
    schedule: {
      pickupAt: opts.schedule.pickupAt ?? null,
      deliveryAt: opts.schedule.deliveryAt ?? null,
    },
    pricing: opts.pricing,
    items: mapDraftItemsToOrderItems(opts.items),
  };
}
