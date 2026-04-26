"use client";

import { useEffect, useRef, useState } from "react";

type NetworkStatus = {
  /** Whether the browser currently has a network connection. */
  isOnline: boolean;
  /**
   * True if the connection was lost and has since recovered during this
   * page session. Useful for showing a "back online" banner.
   */
  wasOffline: boolean;
};

/**
 * Tracks the browser's online/offline state.
 *
 * Uses navigator.onLine for the initial value then listens to the window
 * `online` / `offline` events for live updates.
 *
 * TanStack Query's `refetchOnReconnect: true` (set in query-client.ts) will
 * automatically re-fetch stale queries when the browser comes back online.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const wentOffline = useRef(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (wentOffline.current) {
        setWasOffline(true);
        // Reset the "back online" flag after the banner has had time to show
        const id = setTimeout(() => setWasOffline(false), 4_000);
        return () => clearTimeout(id);
      }
    }

    function handleOffline() {
      setIsOnline(false);
      wentOffline.current = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
