import { Badge } from "@/components/ui/badge";
import { CreditCard, QrCode, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import type { PaymentMode, PaymentStatus } from "@/types/orders";

// ── Payment Mode Badge ───────────────────────────────────────────────────────

const MODE_CONFIG: Record<PaymentMode, { label: string; icon: typeof CreditCard; className: string }> = {
  prepaid: {
    label: "Prepaid",
    icon: CreditCard,
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10",
  },
  collect_on_delivery: {
    label: "Collect on Delivery",
    icon: QrCode,
    className: "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/10",
  },
};

export function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  const config = MODE_CONFIG[mode] ?? {
    label: mode,
    icon: CreditCard,
    className: "bg-muted text-muted-foreground",
  };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

// ── Payment Status Badge ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: {
    label: "Payment Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
  },
  completed: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/10",
  },
  failed: {
    label: "Payment Failed",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-border hover:bg-muted",
  },
  expired: {
    label: "Expired",
    icon: Clock,
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10",
  },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  };
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
