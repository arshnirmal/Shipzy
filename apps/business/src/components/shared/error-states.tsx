"use client";

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CloudOff,
  FileQuestion,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Shared layout shell ───────────────────────────────────────────────────────

type ErrorShellProps = {
  icon: React.ReactNode;
  headline: string;
  subtext: string;
  action?: React.ReactNode;
  variant?: "destructive" | "warning" | "muted";
  className?: string;
};

function ErrorShell({
  icon,
  headline,
  subtext,
  action,
  variant = "muted",
  className,
}: ErrorShellProps) {
  const colorMap = {
    destructive: {
      wrap: "border-destructive/30 bg-destructive/5",
      iconWrap: "bg-destructive/10 text-destructive",
      headline: "text-destructive",
      sub: "text-destructive/70",
    },
    warning: {
      wrap: "border-amber-500/30 bg-amber-500/5",
      iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      headline: "text-amber-700 dark:text-amber-300",
      sub: "text-amber-600/80 dark:text-amber-400/80",
    },
    muted: {
      wrap: "border-border bg-surface-container-low",
      iconWrap: "bg-muted text-muted-foreground",
      headline: "text-foreground",
      sub: "text-muted-foreground",
    },
  };

  const c = colorMap[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-14 text-center",
        c.wrap,
        className,
      )}
    >
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-full",
          c.iconWrap,
        )}
      >
        {icon}
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className={cn("text-base font-semibold tracking-tight", c.headline)}>
          {headline}
        </p>
        <p className={cn("text-sm leading-relaxed", c.sub)}>{subtext}</p>
      </div>
      {action}
    </div>
  );
}

// ── Typed error state components ─────────────────────────────────────────────

type RetryProps = {
  onRetry?: () => void;
  className?: string;
};

/** Network offline / DNS failure */
export function NetworkErrorState({ onRetry, className }: RetryProps) {
  return (
    <ErrorShell
      icon={<CloudOff className="size-7" />}
      headline="You're offline"
      subtext="It looks like you've lost your internet connection. Check your network and try again."
      variant="warning"
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        )
      }
    />
  );
}

/** Request timed out */
export function TimeoutErrorState({ onRetry, className }: RetryProps) {
  return (
    <ErrorShell
      icon={<AlertTriangle className="size-7" />}
      headline="Request timed out"
      subtext="The server took too long to respond. This is usually temporary — please try again."
      variant="warning"
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        )
      }
    />
  );
}

/** 404 Not found */
export function NotFoundState({
  label = "resource",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <ErrorShell
      icon={<FileQuestion className="size-7" />}
      headline="Not found"
      subtext={`The ${label} you're looking for doesn't exist or may have been removed.`}
      variant="muted"
      className={className}
    />
  );
}

/** 5xx server error */
export function ServerErrorState({ onRetry, className }: RetryProps) {
  return (
    <ErrorShell
      icon={<ServerCrash className="size-7" />}
      headline="Something went wrong"
      subtext="We're having trouble on our end. Our team has been notified — please try again in a moment."
      variant="destructive"
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )
      }
    />
  );
}

/** 401 session expired (shown inline if modal is not yet visible) */
export function AuthErrorState({ className }: { className?: string }) {
  return (
    <ErrorShell
      icon={<ShieldAlert className="size-7" />}
      headline="Session expired"
      subtext="Your session has expired. Please sign in again to continue."
      variant="warning"
      className={className}
    />
  );
}

/** Catch-all for unclassified errors */
export function GenericErrorState({ onRetry, className }: RetryProps) {
  return (
    <ErrorShell
      icon={<AlertTriangle className="size-7" />}
      headline="Something went wrong"
      subtext="An unexpected error occurred. Please try again or contact support if the issue persists."
      variant="destructive"
      className={className}
      action={
        onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        )
      }
    />
  );
}
