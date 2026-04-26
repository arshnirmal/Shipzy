"use client";

import type { ReactNode } from "react";
import {
  AuthError,
  NetworkError,
  NotFoundError,
  TimeoutError,
} from "@/lib/api";
import {
  AuthErrorState,
  GenericErrorState,
  NetworkErrorState,
  NotFoundState,
  ServerErrorState,
  TimeoutErrorState,
} from "@/components/shared/error-states";

type QueryLike = {
  isLoading: boolean;
  isFetching?: boolean;
  error: unknown;
  refetch?: () => void;
};

type Props = {
  /** A TanStack Query result object (from useQuery). */
  query: QueryLike;
  /** Label used in NotFound messages, e.g. "order" or "draft". */
  notFoundLabel?: string;
  /** Override the retry callback (defaults to query.refetch). */
  onRetry?: () => void;
  /** Rendered when the query has data and no error. */
  children: ReactNode;
};

/**
 * Declarative wrapper that renders the correct error state based on the
 * type of error thrown by a TanStack Query hook.
 *
 * Renders `children` only when there is no error and loading is complete.
 *
 * Usage:
 * ```tsx
 * <QueryErrorHandler query={ordersQuery} notFoundLabel="order">
 *   <OrdersTable ... />
 * </QueryErrorHandler>
 * ```
 */
export function QueryErrorHandler({
  query,
  notFoundLabel,
  onRetry,
  children,
}: Props) {
  const { isLoading, error } = query;
  const retry = onRetry ?? query.refetch;

  if (isLoading) {
    // The parent is responsible for rendering a skeleton / Suspense fallback
    return null;
  }

  if (error) {
    if (error instanceof NetworkError) {
      return <NetworkErrorState onRetry={retry} />;
    }
    if (error instanceof TimeoutError) {
      return <TimeoutErrorState onRetry={retry} />;
    }
    if (error instanceof AuthError) {
      return <AuthErrorState />;
    }
    if (error instanceof NotFoundError) {
      return <NotFoundState label={notFoundLabel} />;
    }
    // ServerError and everything else
    return <ServerErrorState onRetry={retry} />;
  }

  return <>{children}</>;
}
