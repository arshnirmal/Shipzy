"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { SessionExpiredModal } from "@/components/auth/session-expired-modal";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider>
          {/* Global network/session overlays */}
          <OfflineBanner />
          <SessionExpiredModal />

          {children}

          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
