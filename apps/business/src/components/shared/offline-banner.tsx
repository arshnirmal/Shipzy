"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { cn } from "@/lib/utils";

/**
 * Fixed offline notification banner.
 *
 * - Appears at the very top of the viewport when the user loses connectivity.
 * - Shows a brief "back online" confirmation and then auto-hides.
 * - Purely informational — no actions required.
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"offline" | "back-online">("offline");

  useEffect(() => {
    if (!isOnline) {
      setPhase("offline");
      setVisible(true);
    } else if (wasOffline) {
      setPhase("back-online");
      setVisible(true);
      const id = setTimeout(() => setVisible(false), 3_000);
      return () => clearTimeout(id);
    } else {
      setVisible(false);
    }
  }, [isOnline, wasOffline]);

  if (!visible) return null;

  const isOffline = phase === "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all duration-300",
        isOffline
          ? "bg-amber-500/95 text-amber-950 shadow-lg"
          : "bg-emerald-500/95 text-emerald-950 shadow-lg",
      )}
    >
      {isOffline ? (
        <>
          <CloudOff className="size-4 shrink-0" />
          <span>
            You&apos;re offline — showing cached data. Changes won&apos;t save until you reconnect.
          </span>
        </>
      ) : (
        <>
          <Wifi className="size-4 shrink-0" />
          <span>Back online! Refreshing data…</span>
        </>
      )}
    </div>
  );
}
