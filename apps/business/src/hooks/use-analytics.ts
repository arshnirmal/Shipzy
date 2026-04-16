"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { AnalyticsResponse } from "@/types/business";

export function useAnalytics(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["analytics", dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      return apiRequest<AnalyticsResponse>(`/business/analytics?${params.toString()}`);
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 60_000,
  });
}
