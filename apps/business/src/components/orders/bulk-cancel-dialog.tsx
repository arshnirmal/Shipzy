"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type BulkCancelDialogProps = {
  open: boolean;
  count: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isPending: boolean;
};

export function BulkCancelDialog({
  open,
  count,
  onConfirm,
  onClose,
  isPending,
}: BulkCancelDialogProps) {
  const [reason, setReason] = useState("");
  const isValid = reason.trim().length >= 5;

  function handleConfirm() {
    if (isValid) {
      onConfirm(reason.trim());
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-surface-container-lowest border border-outline-variant/20">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>

          <div>
            <DialogTitle className="text-lg font-semibold">
              Cancel {count} order{count !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              This action cannot be undone. Orders in active statuses will be
              cancelled and refunds will be initiated.
            </DialogDescription>
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label className="text-xs font-medium text-muted-foreground">
              Cancellation reason{" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Min 5 characters…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded for all selected orders.
            </p>
          </div>

          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Keep orders
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!isValid || isPending}
              onClick={handleConfirm}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Cancel orders
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
