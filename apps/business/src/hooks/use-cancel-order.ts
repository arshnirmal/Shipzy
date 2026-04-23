"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { CancelOrderPayload, CancelOrderResponse } from "@/types/orders";

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      apiRequest<CancelOrderResponse>(`/orders/${orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancellation: { reason } } satisfies CancelOrderPayload),
      }),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
