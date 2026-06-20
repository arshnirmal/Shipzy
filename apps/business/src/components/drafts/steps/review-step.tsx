"use client";

import { useEffect, useState } from "react";
import type { Draft, CreateOrderData } from "@/types/business";
import type { FareBreakdown } from "@/types/orders";
import {
  CheckCircle2,
  MapPin,
  Truck,
  Package,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/orders/pricing-table";
import { PaymentModeBadge } from "@/components/orders/payment-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

type ReviewStepProps = {
  draft: Draft;
  staticData: CreateOrderData;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ReviewStep({
  draft,
  staticData,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const [fare, setFare] = useState<FareBreakdown | null>(null);
  const [fareLoading, setFareLoading] = useState(true);
  const [fareError, setFareError] = useState<string | null>(null);

  // Derive static strings
  const deliveryType = staticData.deliveryTypes.find(
    (d) => d.deliveryTypeId === draft.fulfillment?.deliveryTypeId,
  )?.displayName;
  const vehicle = staticData.vehicleCategories.find(
    (v) => v.categoryId === draft.fulfillment?.vehicleCategoryId,
  )?.displayName;
  const paymentMethod = staticData.paymentMethods.find(
    (p) => p.methodId === draft.fulfillment?.paymentMethodId,
  )?.displayName;

  useEffect(() => {
    const hasRequirements =
      draft.pickupLocation?.latitude &&
      draft.deliveryLocation?.latitude &&
      draft.fulfillment?.deliveryTypeId &&
      draft.fulfillment?.vehicleCategoryId;

    if (!hasRequirements) {
      setFareError("Missing required location or fulfillment details to calculate fare.");
      setFareLoading(false);
      return;
    }

    const calculateFare = async () => {
      try {
        setFareLoading(true);
        setFareError(null);

        const body = {
          fulfillment: {
            deliveryTypeId:    draft.fulfillment!.deliveryTypeId,
            vehicleCategoryId: draft.fulfillment!.vehicleCategoryId,
            weightTierId:      draft.fulfillment!.weightTierId ?? null,
            packageTypeId:     draft.fulfillment!.packageTypeId ?? null,
          },
          locations: {
            pickup:   { latitude: draft.pickupLocation!.latitude,   longitude: draft.pickupLocation!.longitude },
            delivery: { latitude: draft.deliveryLocation!.latitude, longitude: draft.deliveryLocation!.longitude },
          },
        };

        const res = await apiRequest<{
          success: true;
          data: { pricing: FareBreakdown; estimatedDurationMins: number };
        }>("/business/orders/calculate-fare", {
          method: "POST",
          body: JSON.stringify(body),
        });

        setFare(res.data.pricing);
      } catch (err: any) {
        setFareError(err.message || "Failed to calculate pricing");
      } finally {
        setFareLoading(false);
      }
    };

    calculateFare();
  }, [
    draft.pickupLocation?.latitude,
    draft.pickupLocation?.longitude,
    draft.deliveryLocation?.latitude,
    draft.deliveryLocation?.longitude,
    draft.fulfillment?.deliveryTypeId,
    draft.fulfillment?.vehicleCategoryId,
    draft.fulfillment?.weightTierId,
    draft.fulfillment?.packageTypeId,
  ]);

  const canSubmit = !fareLoading && !fareError && fare;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Review and Submit</h3>
          <p className="text-sm text-muted-foreground">
            Verify details before creating the order.
          </p>
        </div>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="gradient-brand min-w-[140px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
              Submitting…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Submit Order
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 align-top">
        {/* Left Col: Details Summary */}
        <div className="lg:col-span-7 space-y-6">
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
                        {draft.pickupLocation?.fullAddress}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {draft.pickupLocation?.contactName} •{" "}
                        {draft.pickupLocation?.contactPhone}
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-1 size-4 rounded-full border-4 border-background bg-green-500" />
                      <p className="font-medium text-sm">Delivery</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {draft.deliveryLocation?.fullAddress}
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        {draft.deliveryLocation?.contactName} •{" "}
                        {draft.deliveryLocation?.contactPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fulfillment */}
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
                      <PaymentModeBadge mode={draft.fulfillment?.paymentMode ?? "prepaid"} />
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                      <Clock className="size-4" /> Schedule
                    </h4>
                    {draft.schedule?.pickupAt ? (
                      <>
                        <p className="text-sm mt-3 font-medium">
                          {format(new Date(draft.schedule.pickupAt), "PPP")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(draft.schedule.pickupAt), "p")}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm mt-3 font-medium">
                        Immediate Dispatch
                      </p>
                    )}
                  </div>
                </div>

                {/* Package */}
                <div className="p-6">
                  <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground">
                    <Package className="size-4" /> Package ({draft.items.length}{" "}
                    items)
                  </h4>
                  <div className="mt-4 space-y-2">
                    {draft.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        {it.value ? (
                          <span className="text-muted-foreground">
                            ₹{it.value}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Pricing */}
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
                  Please check your locations and fulfillment selections.
                </p>
              </CardContent>
            </Card>
          ) : fare ? (
            <PricingTable pricing={fare} isEstimate />
          ) : null}
        </div>
      </div>
    </div>
  );
}
