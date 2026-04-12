"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "@/lib/api";
import type {
  BulkCancelApiResponse,
  OrderFilters,
  PaginatedOrdersResponse,
} from "@/types/orders";

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

export function useExportOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders-export", { ...filters, page: 1, limit: 1000 }],
    queryFn: () =>
      apiRequest<PaginatedOrdersResponse>(
        `/orders?${buildOrdersQueryString({ ...filters, page: 1, limit: 1000 })}`,
      ),
    enabled: false,
    staleTime: 0,
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
      apiRequest<BulkCancelApiResponse>("/orders/bulk-cancel", {
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
