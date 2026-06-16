"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest, ApiError, getErrorMessage } from "@/lib/api";
import type {
  BulkCancelApiResponse,
  OrderFilters,
  PaginatedOrdersResponse,
} from "@/types/orders";
import type { BulkOrderResponse } from "@/types/business";

function buildOrdersQueryString(filters: OrderFilters): string {
  const params = new URLSearchParams();

  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);

  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("dateFrom", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) params.set("dateTo", `${filters.dateTo}T23:59:59.999Z`);
  if (filters.deliveryTypeId) params.set("deliveryTypeId", filters.deliveryTypeId);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

  return params.toString();
}

export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () =>
      apiRequest<PaginatedOrdersResponse>(
        `/orders?${buildOrdersQueryString(filters)}`,
      ),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useBulkCancelOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ids,
      reason,
    }: {
      ids: number[];
      reason: string;
    }) =>
      apiRequest<BulkCancelApiResponse>("/business/orders/bulk-cancel", {
        method: "POST",
        body: JSON.stringify({ orders: { ids, reason } }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Triggers a CSV download by calling the authenticated streaming export endpoint.
 * Uses raw fetch (not apiRequest) because the response is a binary blob, not JSON.
 */
export async function downloadOrdersCsv(filters: Partial<OrderFilters>): Promise<void> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.dateFrom) params.set("dateFrom", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) params.set("dateTo", `${filters.dateTo}T23:59:59.999Z`);

  const response = await fetch(
    `/api/proxy/business/orders/export?${params.toString()}`,
    { headers: {} }, // Cookies are sent automatically to same-origin
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Export failed" }));
    throw new ApiError(body.message ?? "Export failed", response.status, body);
  }

  const blob = await response.blob();
  const dateStr = new Date().toISOString().split("T")[0];
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useBulkCreateOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orders: import("@/types/business").BulkOrderRow[]) =>
      apiRequest<BulkOrderResponse>("/business/orders/bulk", {
        method: "POST",
        body: JSON.stringify({ orders }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
