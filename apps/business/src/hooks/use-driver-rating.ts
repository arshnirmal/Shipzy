"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { DriverRatingResponse } from "@/types/orders";

export function useDriverRating(driverId: number | null) {
  return useQuery({
    queryKey: ["drivers", "rating", driverId],
    queryFn: () =>
      apiRequest<DriverRatingResponse>(`/ratings/drivers/${driverId}`),
    enabled: driverId !== null && driverId !== undefined,
    staleTime: 120_000,
  });
}
