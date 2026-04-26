"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";

import { createQueryClient, asyncStoragePersister } from "@/lib/query-client";

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        // Optional: only persist specific queries (e.g. not user sessions if you prefer)
        // or just persist everything by default, which is what we do here.
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
