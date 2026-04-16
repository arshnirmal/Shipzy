"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import { getStoredTokens } from "@/lib/auth";
import type {
  BulkCancelApiResponse,
  OrderFilters,
  PaginatedOrdersResponse,
} from "@/types/orders";
import type { BulkOrderResponse } from "@/types/business";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

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
    onError: (error: ApiError) => {
      console.error("Bulk cancel failed:", error.message);
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

  const token = getStoredTokens()?.accessToken;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE_URL}/business/orders/export?${params.toString()}`,
    { headers },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Export failed" }));
    throw new Error(body.message ?? "Export failed");
  }

  const blob = await response.blob();
  const dateStr = new Date().toISOString().split("T")[0];
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useBulkCreateOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orders: unknown[]) =>
      apiRequest<BulkOrderResponse>("/business/orders/bulk", {
        method: "POST",
        body: JSON.stringify({ orders }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
