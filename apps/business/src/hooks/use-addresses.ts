"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type SavedAddress = {
  addressId: number;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType: string;
  label: string;
  isDefault: boolean;
  landmark?: string | null;
  building?: string | null;
  floor?: string | null;
  flatNumber?: string | null;
};

type AddressListResponse = {
  success: true;
  message: string;
  data: {
    addresses: SavedAddress[];
    total: number;
  };
  timestamp: string;
};

type AddressResponse = {
  success: true;
  message: string;
  data: {
    address: SavedAddress;
  };
  timestamp: string;
};

type AddressDeleteResponse = {
  success: true;
  message: string;
  data: {
    deletion: {
      addressId: number;
      deleted: boolean;
    };
  };
  timestamp: string;
};

export type CreateAddressPayload = {
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType: string;
  label: string;
  isDefault?: boolean;
  landmark?: string;
  building?: string;
  floor?: string;
  flatNumber?: string;
};

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiRequest<AddressListResponse>("/users/me/addresses"),
    staleTime: 60_000,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      apiRequest<AddressResponse>("/users/me/addresses", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<AddressDeleteResponse>(`/users/me/addresses/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
