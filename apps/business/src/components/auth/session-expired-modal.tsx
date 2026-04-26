"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { onSessionExpired } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";

/**
 * Session Expired Modal
 *
 * Listens for the `session:expired` CustomEvent dispatched by apiRequest()
 * when a token refresh fails. Shows a non-dismissable dialog prompting the
 * user to sign back in — without losing their current URL or any unsaved
 * form state (unlike a hard redirect to /login).
 *
 * Mount this once at the root of the authenticated app (AppProviders).
 */
export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const cleanup = onSessionExpired(() => setOpen(true));
    return cleanup;
  }, []);

  function handleSignedIn() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      // Prevent accidental dismissal — user must sign in
      onOpenChange={() => {}}
    >
      <DialogContent className="sm:max-w-[420px] overflow-y-auto max-h-[90dvh]">
        <DialogHeader className="items-center text-center pb-2">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-amber-500/10">
            <ShieldAlert className="size-7 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">Session Expired</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your session has expired due to inactivity. Sign in again to
            continue — your current work is safe.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <LoginForm onSuccess={handleSignedIn} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
