"use client";

import { useCallback, useRef } from "react";
import { apiRequest } from "@/lib/api";
import type { AddressSearchResponse, PlaceRetrieveResponse } from "@/types/business";

const DEBOUNCE_MS = 500;

/**
 * Hook that exposes address search and place-retrieve methods backed by the
 * backend Mapbox proxy at /api/v1/addresses.
 *
 * Uses a session-token pattern identical to the Flutter app:
 *  1. POST /addresses/search → returns suggestions + sessionToken
 *  2. POST /addresses/retrieve (mapboxId + sessionToken) → full lat/lng + context
 */
export function useAddressSearch() {
  const sessionTokenRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (query: string): Promise<AddressSearchResponse["data"]["search"]> => {
      return apiRequest<AddressSearchResponse>("/addresses/search", {
        method: "POST",
        body: JSON.stringify({ query, limit: 8, country: "IN" }),
      }).then((res) => {
        sessionTokenRef.current = res.data.search.sessionToken;
        return res.data.search;
      });
    },
    [],
  );

  const searchDebounced = useCallback(
    (query: string, onResult: (suggestions: AddressSearchResponse["data"]["search"]["suggestions"]) => void, onError?: (err: Error) => void) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.trim().length < 2) {
        onResult([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await search(query);
          onResult(result.suggestions);
        } catch (err) {
          onError?.(err as Error);
        }
      }, DEBOUNCE_MS);
    },
    [search],
  );

  const retrieve = useCallback(
    (mapboxId: string): Promise<PlaceRetrieveResponse["data"]["place"]> => {
      const sessionToken = sessionTokenRef.current ?? crypto.randomUUID();
      return apiRequest<PlaceRetrieveResponse>("/addresses/retrieve", {
        method: "POST",
        body: JSON.stringify({ mapboxId, sessionToken }),
      }).then((res) => res.data.place);
    },
    [],
  );

  return { searchDebounced, retrieve };
}
