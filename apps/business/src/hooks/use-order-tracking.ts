"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { TrackingResponse } from "@/types/orders";

const ACTIVE_STATUSES = new Set(["accepted", "picked_up", "in_transit"]);

export function useOrderTracking(
  orderId: number | null,
  orderStatus?: string | null,
) {
  const isActive = orderId !== null && !!orderStatus && ACTIVE_STATUSES.has(orderStatus);

  return useQuery({
    queryKey: ["orders", "tracking", orderId],
    queryFn: () =>
      apiRequest<TrackingResponse>(`/orders/${orderId}/tracking`),
    enabled: isActive,
    refetchInterval: isActive ? 10_000 : false,
    staleTime: 5_000,
  });
}
