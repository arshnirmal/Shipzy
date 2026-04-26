import { QueryClient } from "@tanstack/react-query";
import { isRetryable } from "@/lib/api";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep cached data fresh for 30 s; background refetch after that.
        staleTime: 30_000,

        // Smart retry: never retry deterministic failures (4xx), back off on
        // transient ones (network drop, 5xx) up to 3 times.
        retry: (failureCount, error) => {
          if (!isRetryable(error)) return false;
          return failureCount < 3;
        },
        // Exponential backoff: 1 s, 2 s, 4 s — capped at 10 s.
        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),

        // Serve stale cache immediately while revalidating in the background.
        // This gives users instant data even on slow connections.
        refetchOnWindowFocus: true,

        // When coming back online TanStack will automatically trigger a
        // refetch for stale queries — pair with use-network-status hook.
        refetchOnReconnect: true,

        // "offlineFirst" means cached data is returned immediately without
        // a network request when the browser reports offline. Prevents
        // a wave of failed fetches when the user is temporarily disconnected.
        networkMode: "offlineFirst",
      },
      mutations: {
        // Mutations are not automatically retried — the caller decides.
        retry: 0,
        // Also use offlineFirst so optimistic updates work offline.
        networkMode: "offlineFirst",
      },
    },
  });
}
