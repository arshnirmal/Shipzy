"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Ban,
  CalendarClock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  User,
  XCircle,
} from "lucide-react";

import { useOrder } from "@/hooks/use-order";
import { NotFoundError } from "@/lib/api";
import { QueryErrorHandler } from "@/components/shared/query-error-handler";
import { RefetchIndicator } from "@/components/shared/refetch-indicator";
import { OrderTimeline } from "./order-timeline";
import { OrderStatusBadge } from "./order-status-badge";
import { PricingTable } from "./pricing-table";
import { OrderTrackingView } from "./order-tracking-view";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { DriverRatingCard } from "./driver-rating-card";
import { PaymentModeBadge, PaymentStatusBadge } from "./payment-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const CANCELLABLE_STATUSES = new Set(["pending", "accepted", "scheduled"]);
const ACTIVE_STATUSES = new Set(["accepted", "picked_up", "in_transit"]);

// ── Loading skeleton ──────────────────────────────────────────────────────────

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header strip */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Timeline */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2 flex-1 rounded-full" />
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrderDetailView({ id }: { id: string }) {
  const query = useOrder(id);
  const { data, isLoading, isFetching, refetch } = query;
  const [cancelOpen, setCancelOpen] = useState(false);

  // Loading skeleton (first fetch only)
  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  // Delegate error rendering to QueryErrorHandler
  return (
    <QueryErrorHandler
      query={query}
      notFoundLabel={`order #${id}`}
      onRetry={refetch}
    >
      {data && (() => {
        const { order, actors } = data.data;

        return (
          <div className="space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Order {order.identifiers.orderNumber ?? `#${order.identifiers.orderId}`}
                  </h2>
                  <OrderStatusBadge status={order.status} />
                  <RefetchIndicator isRefetching={isFetching && !isLoading} />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" />
                  Created {format(new Date(order.timeline.createdAt), "PPp")}
                </p>
              </div>

              {/* Cancellation reason */}
              {order.status === "cancelled" && order.cancellation?.reason && (
                <div className="flex max-w-sm items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <Ban className="size-4 shrink-0" />
                  <span className="line-clamp-2">
                    Cancelled: {order.cancellation.reason}
                  </span>
                </div>
              )}

              {/* Cancel button for cancellable orders */}
              {CANCELLABLE_STATUSES.has(order.status) && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="mr-2 size-4" />
                  Cancel Order
                </Button>
              )}
            </div>

            {/* Live Tracking for active orders */}
            {ACTIVE_STATUSES.has(order.status) && (
              <OrderTrackingView
                orderId={order.identifiers.orderId}
                orderStatus={order.status}
              />
            )}

            {/* Timeline */}
            <Card>
              <CardContent className="p-6">
                <OrderTimeline status={order.status} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Col: Route & Package */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" /> Route Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-full bg-blue-500" />
                          <h3 className="font-semibold">Pickup</h3>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.locations.pickup.contactName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="size-3" /> {order.locations.pickup.contactPhone}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {order.locations.pickup.fullAddress}
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-full bg-green-500" />
                          <h3 className="font-semibold">Delivery</h3>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.locations.delivery.contactName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="size-3" /> {order.locations.delivery.contactPhone}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {order.locations.delivery.fullAddress}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="size-4 text-muted-foreground" /> Package Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {order.package.description && (
                        <div>
                          <p className="text-sm font-medium">Description</p>
                          <p className="text-sm text-muted-foreground mt-1">{order.package.description}</p>
                        </div>
                      )}
                      {order.package.specialInstructions && (
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
                            Special Instructions
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.package.specialInstructions}
                          </p>
                        </div>
                      )}
                      {order.package.declaredValue && (
                        <div>
                          <p className="text-sm font-medium">Declared Value</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            ₹{order.package.declaredValue}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Courier & Pricing */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Assigned Courier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actors.courier ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="size-12 border">
                          <AvatarImage src={actors.courier.profilePictureUrl ?? ""} />
                          <AvatarFallback>
                            <User className="size-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{actors.courier.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {actors.courier.phone}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
                        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
                          <User className="size-5" />
                        </div>
                        <p className="text-sm">Looking for nearby drivers…</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <PricingTable pricing={order.pricing} />

                {/* Payment Information */}
                {order.paymentInfo && (
                  <Card>
                    <CardHeader className="border-b bg-muted/30 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="size-4 text-muted-foreground" /> Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Mode</span>
                          <PaymentModeBadge mode={order.paymentInfo.paymentMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <PaymentStatusBadge status={order.paymentInfo.paymentStatus} />
                        </div>
                        {order.paymentInfo.paidAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Paid At</span>
                            <span className="text-sm font-medium">
                              {format(new Date(order.paymentInfo.paidAt), "PPp")}
                            </span>
                          </div>
                        )}
                        {order.paymentInfo.transactionId && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transaction</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              #{order.paymentInfo.transactionId}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {order.status === "delivered" && actors.courier && (
                  <DriverRatingCard driverId={actors.courier.userId} />
                )}
              </div>
            </div>

            {/* Cancel Order Dialog */}
            <CancelOrderDialog
              open={cancelOpen}
              orderId={order.identifiers.orderId}
              onOpenChange={setCancelOpen}
              onCancelled={() => {
                // Refetch happens automatically via query invalidation
              }}
            />
          </div>
        );
      })()}
    </QueryErrorHandler>
  );
}
