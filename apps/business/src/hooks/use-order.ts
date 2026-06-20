"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";


/** Shape returned by GET /api/v1/orders/:id */
type OrderDetailResponse = {
  success: true;
  message: string;
  data: OrderDetails;
  timestamp: string;
};

/**
 * We keep this type in sync with what the backend's orders.zod OrderDetailsZ
 * actually returns. It extends OrderListItem with actor info.
 */
export type OrderDetails = {
  order: import("@/types/orders").BaseOrder & {
    paymentInfo?: import("@/types/orders").PaymentInfo | null;
    cancellation?: { reason?: string | null };
    assignment?: {
      assignmentId: number;
      status: string;
      assignedAt?: string | null;
      timeline?: Record<string, string | null> | null;
    } | null;
  };
  actors: {
    client: { userId: number; name?: string | null; phone?: string | null };
    courier?: {
      userId: number;
      name?: string | null;
      phone?: string | null;
      profilePictureUrl?: string | null;
    } | null;
  };
};

export function useOrder(id: string | number | null) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () =>
      apiRequest<{ success: true; message: string; data: OrderDetails; timestamp: string }>(
        `/orders/${id}`,
      ),
    enabled: id !== null && id !== undefined,
    staleTime: 20_000,
  });
}
