"use client";

import React, { Component, type ReactNode } from "react";
import { ServerErrorState } from "@/components/shared/error-states";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Props = {
  children: ReactNode;
  /**
   * Change this key to reset the boundary (e.g. pass the current pathname so
   * navigating to a new page always clears the error state).
   */
  resetKey?: string | number;
  /** Optional custom fallback UI. */
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * React class-based error boundary.
 *
 * Catches render-phase errors from any child and renders a recovery UI.
 * Use `resetKey` to clear the error when the user navigates to a new route.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary resetKey={pathname}>
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, forward to an error tracking service (e.g. Sentry)
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when the consumer explicitly changes `resetKey` (e.g. route change)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6">
          <ServerErrorState
            onRetry={this.reset}
            className="min-h-[240px]"
          />
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-3.5" />
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
