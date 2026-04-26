"use client";

import { format } from "date-fns";
import { MapPin, Navigation, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import type { TrackingMilestone } from "@/types/orders";

type OrderTrackingViewProps = {
  orderId: number;
  orderStatus: string;
};

function MilestoneTimeline({ milestones }: { milestones: TrackingMilestone[] }) {
  const EVENT_LABELS: Record<string, string> = {
    created: "Order Placed",
    accepted: "Driver Assigned",
    picked_up: "Package Picked Up",
    in_transit: "In Transit",
    arrived: "Arrived at Destination",
    delivered: "Delivered",
  };

  return (
    <div className="space-y-0">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const label = EVENT_LABELS[m.eventType] ?? m.description;

        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`size-3 rounded-full ${
                  isLast ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40"
                }`}
              />
              {!isLast && <div className="w-px flex-1 bg-outline-variant/20" />}
            </div>
            <div className={`pb-4 ${isLast ? "" : ""}`}>
              <p className={`text-sm font-medium ${isLast ? "text-primary" : "text-foreground"}`}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(m.timestamp), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OrderTrackingView({ orderId, orderStatus }: OrderTrackingViewProps) {
  const { data, isLoading, error } = useOrderTracking(orderId, orderStatus);
  const tracking = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary/30 border-r-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tracking data is not available for this order.
          </p>
        </CardContent>
      </Card>
    );
  }

  const driver = tracking.driver;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Navigation className="size-4 text-primary" />
              Live Tracking
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {driver && (
            <div className="rounded-lg bg-surface-container-low p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <p className="text-sm font-medium">Driver Location</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Latitude</p>
                  <p className="font-medium">{driver.location.latitude.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Longitude</p>
                  <p className="font-medium">{driver.location.longitude.toFixed(4)}</p>
                </div>
              </div>
              {driver.locationMeta && (
                <div className="grid grid-cols-3 gap-3 text-sm border-t border-outline-variant/20 pt-3">
                  {driver.locationMeta.speed != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Speed</p>
                      <p className="font-medium flex items-center gap-1">
                        <Activity className="size-3" />
                        {driver.locationMeta.speed.toFixed(1)} km/h
                      </p>
                    </div>
                  )}
                  {driver.locationMeta.bearing != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Heading</p>
                      <p className="font-medium">{driver.locationMeta.bearing}°</p>
                    </div>
                  )}
                  {driver.locationMeta.accuracy != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Accuracy</p>
                      <p className="font-medium">±{driver.locationMeta.accuracy.toFixed(1)}m</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                Last updated {format(new Date(driver.lastUpdatedAt), "h:mm a")}
              </div>
            </div>
          )}

          {tracking.milestones.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                Journey Timeline
              </p>
              <MilestoneTimeline milestones={tracking.milestones} />
            </div>
          )}

          {!driver && tracking.milestones.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tracking events recorded yet. The driver has not started moving.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
