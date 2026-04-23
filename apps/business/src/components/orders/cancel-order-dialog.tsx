"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCancelOrder } from "@/hooks/use-cancel-order";

type CancelOrderDialogProps = {
  open: boolean;
  orderId: number | null;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
};

export function CancelOrderDialog({
  open,
  orderId,
  onOpenChange,
  onCancelled,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const cancelOrder = useCancelOrder();

  const MIN_REASON_LEN = 3;
  const MAX_REASON_LEN = 500;
  const isValid = reason.trim().length >= MIN_REASON_LEN && reason.length <= MAX_REASON_LEN;

  const handleCancel = () => {
    if (!orderId || !isValid) return;

    cancelOrder.mutate(
      { orderId, reason: reason.trim() },
      {
        onSuccess: (res) => {
          const refund = res.data.refund;
          toast.success(
            `Order cancelled.${refund.initiated ? ` Refund of ₹${refund.amount.toFixed(2)} initiated.` : ""}`,
          );
          setReason("");
          onOpenChange(false);
          onCancelled?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to cancel order.");
        },
      },
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setReason("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. A refund will be initiated if applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for cancellation</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Customer is unavailable at destination"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={MAX_REASON_LEN}
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/{MAX_REASON_LEN} characters (min {MIN_REASON_LEN})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!isValid || cancelOrder.isPending}
          >
            {cancelOrder.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
