"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { CreateOrderDataResponse } from "@/types/business";

export function useCreateOrderData() {
  return useQuery({
    queryKey: ["static", "create-order-data"],
    queryFn: () =>
      apiRequest<CreateOrderDataResponse>("/static/create-order-data", {}, { auth: false }),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
