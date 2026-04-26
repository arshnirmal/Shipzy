"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** True when a background refetch is in progress (isFetching && !isLoading). */
  isRefetching: boolean;
  className?: string;
};

/**
 * Non-intrusive background refresh indicator.
 *
 * Shows an animated pulsing dot + "Refreshing…" label when a stale query is
 * silently revalidating in the background. Intentionally small and subtle so
 * it doesn't distract from content.
 *
 * Usage: pass `isFetching && !isLoading` from any useQuery result.
 *
 * ```tsx
 * <RefetchIndicator isRefetching={isFetching && !isLoading} />
 * ```
 */
export function RefetchIndicator({ isRefetching, className }: Props) {
  if (!isRefetching) return null;

  return (
    <span
      role="status"
      aria-label="Refreshing data"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 animate-pulse rounded-full bg-primary"
      />
      Refreshing
    </span>
  );
}
