import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/orders";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10",
  },
  accepted: {
    label: "Accepted",
    className:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10",
  },
  picked_up: {
    label: "Picked Up",
    className:
      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10",
  },
  in_transit: {
    label: "In Transit",
    className:
      "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/10",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/10",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10",
  },
  undeliverable: {
    label: "Undeliverable",
    className:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10",
  },
  returned: {
    label: "Returned",
    className:
      "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/10",
  },
  returning: {
    label: "Returning",
    className:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium capitalize ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
