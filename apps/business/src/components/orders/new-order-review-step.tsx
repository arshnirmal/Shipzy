"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Truck,
  Package,
  Clock,
  ShieldCheck,
  ShoppingCart,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingTable } from "@/components/orders/pricing-table";
import { PaymentModeBadge } from "@/components/orders/payment-status-badge";
import type { CreateOrderData, DraftFulfillment, DraftItem, DraftPackage, DraftSchedule } from "@/types/business";
import type { FareBreakdown, OrderLocation } from "@/types/orders";

type NewOrderReviewStepProps = {
  pickup:       OrderLocation;
  delivery:     OrderLocation;
  fulfillment:  DraftFulfillment;
  pkg:          DraftPackage;
  items:        DraftItem[];
  schedule:     DraftSchedule;
  staticData:   CreateOrderData;
  /** Currently computed fare — may be null before the first calculation */
  fare:         FareBreakdown | null;
  /** Called when a new fare is successfully computed */
  onFareResolved: (fare: FareBreakdown) => void;
  onPlaceOrder: () => void;
  isPlacing:    boolean;
};

export function NewOrderReviewStep({
  pickup,
  delivery,
  fulfillment,
  pkg,
  items,
  schedule,
  staticData,
  fare,
  onFareResolved,
  onPlaceOrder,
  isPlacing,
}: NewOrderReviewStepProps) {
  const [fareLoading, setFareLoading] = useState(true);
  const [fareError,   setFareError]   = useState<string | null>(null);

  // Derive human-readable labels
  const deliveryType = staticData.deliveryTypes.find(
    (d) => d.deliveryTypeId === fulfillment.deliveryTypeId,
  )?.displayName;
  const vehicle = staticData.vehicleCategories.find(
    (v) => v.categoryId === fulfillment.vehicleCategoryId,
  )?.displayName;
  const paymentMethod = staticData.paymentMethods.find(
    (p) => p.methodId === fulfillment.paymentMethodId,
  )?.displayName;

  // ── Fare calculation ───────────────────────────────────────────────────────
  useEffect(() => {
    const calculate = async () => {
      try {
        setFareLoading(true);
        setFareError(null);

        const body = {
          fulfillment: {
            deliveryTypeId:   fulfillment.deliveryTypeId,
            vehicleCategoryId: fulfillment.vehicleCategoryId,
            weightTierId:     fulfillment.weightTierId ?? null,
            packageTypeId:    fulfillment.packageTypeId ?? null,
          },
          locations: {
            pickup:   { latitude: pickup.latitude,   longitude: pickup.longitude },
            delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
          },
        };

        const res = await apiRequest<{
          success: true;
          data: { pricing: FareBreakdown; estimatedDurationMins: number };
        }>("/business/orders/calculate-fare", {
          method: "POST",
          body: JSON.stringify(body),
        });

        onFareResolved(res.data.pricing);
      } catch (err: any) {
        setFareError(err.message || "Failed to calculate pricing.");
      } finally {
        setFareLoading(false);
      }
    };

    calculate();
    // Re-run only if the key inputs change
  }, [
    pickup.latitude, pickup.longitude,
    delivery.latitude, delivery.longitude,
    fulfillment.deliveryTypeId, fulfillment.vehicleCategoryId,
    fulfillment.weightTierId, fulfillment.packageTypeId,
  ]); // onFareResolved intentionally omitted — stable callback from parent

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-medium">Review &amp; Place Order</h3>
          <p className="text-sm text-muted-foreground">
            Verify your details — the order will be placed immediately on confirmation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 align-top">
        {/* Left: Summary */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Route */}
                <div className="p-6 space-y-4">
                  <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                    <MapPin className="size-4" /> Route
                  </h4>
                  <div className="relative pl-6">
                    <div className="absolute left-[9px] top-4 bottom-4 w-px bg-border" />

                    <div className="relative mb-6">
                      <div className="absolute -left-6 top-1 size-4 rounded-full border-4 border-background bg-blue-500" />
                      <p className="font-medium text-sm">Pickup</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {pickup.fullAddress}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {pickup.contactName} • {pickup.contactPhone}
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-1 size-4 rounded-full border-4 border-background bg-green-500" />
                      <p className="font-medium text-sm">Delivery</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {delivery.fullAddress}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {delivery.contactName} • {delivery.contactPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fulfillment + Schedule */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                      <Truck className="size-4" /> Fulfillment
                    </h4>
                    <p className="text-sm mt-3 font-medium">
                      {deliveryType} • {vehicle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Payment: {paymentMethod}
                    </p>
                    <div className="mt-2">
                      <PaymentModeBadge mode={fulfillment.paymentMode ?? "prepaid"} />
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                      <Clock className="size-4" /> Schedule
                    </h4>
                    {schedule.pickupAt ? (
                      <>
                        <p className="text-sm mt-3 font-medium">
                          {format(new Date(schedule.pickupAt), "PPP")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(schedule.pickupAt), "p")}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm mt-3 font-medium">Immediate Dispatch</p>
                    )}
                  </div>
                </div>

                {/* Package */}
                <div className="p-6">
                  <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                    <Package className="size-4" /> Package ({items.length} items)
                  </h4>
                  <div className="mt-4 space-y-2">
                    {items.map((it, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        {it.value ? (
                          <span className="text-muted-foreground">₹{it.value}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {(pkg.description || pkg.specialInstructions) && (
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {pkg.description && <p>Description: {pkg.description}</p>}
                      {pkg.specialInstructions && (
                        <p>Instructions: {pkg.specialInstructions}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Pricing */}
        <div className="lg:col-span-5">
          {fareLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-r-primary mb-4" />
                <p>Calculating live fare...</p>
              </CardContent>
            </Card>
          ) : fareError ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6 text-center text-destructive">
                <ShieldCheck className="size-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">{fareError}</p>
                <p className="text-xs mt-2 opacity-80">
                  Please go back and check your locations and fulfillment selections.
                </p>
              </CardContent>
            </Card>
          ) : fare ? (
            <PricingTable pricing={fare} isEstimate={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
