import { Check, Clock, Package, Truck, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/orders";

const STATUS_CONFIG: Record<OrderStatus, { index: number; label: string; icon: React.ElementType }> = {
  scheduled: { index: -1, label: "Scheduled", icon: Clock },
  pending: { index: 0, label: "Created", icon: Clock },
  accepted: { index: 1, label: "Accepted", icon: Check },
  picked_up: { index: 2, label: "Picked Up", icon: Package },
  in_transit: { index: 3, label: "In Transit", icon: Truck },
  delivered: { index: 4, label: "Delivered", icon: Check },
  cancelled: { index: -2, label: "Cancelled", icon: CircleDot },
  undeliverable: { index: -2, label: "Undeliverable", icon: CircleDot },
  returning: { index: -2, label: "Returning", icon: Truck },
  returned: { index: -2, label: "Returned", icon: Package },
};

export function OrderTimeline({ status }: { readonly status: OrderStatus }) {
  // Only show the happy path timeline
  const timelineStatuses: OrderStatus[] = ["pending", "accepted", "picked_up", "in_transit", "delivered"];
  
  const currentConfig = STATUS_CONFIG[status];
  const isHappyPath = currentConfig.index >= 0;

  // If scheduled, show a special single state or prepend it
  if (status === "scheduled") {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-surface-container-lowest p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-blue-700 dark:text-blue-300">Scheduled</h4>
          <p className="text-sm text-muted-foreground">This order will automatically move to Pending shortly before pickup.</p>
        </div>
      </div>
    );
  }

  // If cancelled/exception, show terminal state
  if (!isHappyPath) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <currentConfig.icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-destructive">{currentConfig.label}</h4>
          <p className="text-sm text-destructive/80">This order did not complete the standard delivery flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-5 -ml-px h-[calc(100%-2.5rem)] w-0.5 bg-border sm:left-auto sm:top-5 sm:ml-0 sm:h-0.5 sm:w-full sm:-translate-y-1/2" />
      
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-0">
        {timelineStatuses.map((stepStatus, idx) => {
          const stepConfig = STATUS_CONFIG[stepStatus];
          const isCompleted = currentConfig.index > stepConfig.index;
          const isCurrent = currentConfig.index === stepConfig.index;
          const isPending = currentConfig.index < stepConfig.index;

          const Icon = stepConfig.icon;

          return (
            <div key={stepStatus} className="relative z-10 flex flex-row items-center gap-4 sm:flex-col sm:gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary ring-4 ring-primary/20",
                  isPending && "border-border bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="sm:text-center">
                <span
                  className={cn(
                    "text-sm font-medium",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stepConfig.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
