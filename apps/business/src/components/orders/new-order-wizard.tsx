"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, BookmarkPlus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateOrderData } from "@/hooks/use-static-data";
import { useCreateDraft } from "@/hooks/use-drafts";
import { useCreateOrder, buildCreateOrderPayload } from "@/hooks/use-create-order";
import { useTemplate } from "@/hooks/use-templates";

import { AddressSearchWidget } from "@/components/drafts/address-search-widget";
import { FulfillmentStep } from "@/components/drafts/steps/fulfillment-step";
import { PackageStep } from "@/components/drafts/steps/package-step";
import { ScheduleStep } from "@/components/drafts/steps/schedule-step";
import { NewOrderReviewStep } from "./new-order-review-step";
import { NewOrderStepper } from "./new-order-stepper";

import type { DraftFulfillment, DraftItem, DraftPackage, DraftSchedule } from "@/types/business";
import type { OrderLocation, FareBreakdown } from "@/types/orders";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: "pickup",      label: "Pickup",      description: "Where to collect from" },
  { id: "delivery",   label: "Delivery",    description: "Where it's going" },
  { id: "fulfillment",label: "Fulfillment", description: "Speed & vehicle" },
  { id: "package",    label: "Package",     description: "Items & options" },
  { id: "schedule",   label: "Schedule",    description: "Pickup time" },
  { id: "review",     label: "Review",      description: "Confirm & place order" },
] as const;

// ── Local wizard state ────────────────────────────────────────────────────────

type WizardState = {
  pickup:      OrderLocation | null;
  delivery:    OrderLocation | null;
  fulfillment: DraftFulfillment;
  pkg:         DraftPackage;
  items:       DraftItem[];
  schedule:    DraftSchedule;
  /** Computed fare — populated on the Review step */
  fare:        FareBreakdown | null;
};

const DEFAULT_STATE: WizardState = {
  pickup:      null,
  delivery:    null,
  fulfillment: { deliveryTypeId: 0, vehicleCategoryId: 0, paymentMethodId: 1 },
  pkg:         { notifyRecipientSms: true },
  items:       [],
  schedule:    {},
  fare:        null,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NewOrderWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const templateId = templateIdParam ? parseInt(templateIdParam, 10) : null;

  const { data: staticDataResult, isLoading: staticLoading } = useCreateOrderData();
  const { data: templateData, isLoading: templateLoading } = useTemplate(templateId);
  const createDraft  = useCreateDraft();
  const createOrder  = useCreateOrder();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  // Sync template data once
  useEffect(() => {
    if (templateData?.data && !templateLoaded) {
      const t = templateData.data;
      setState(prev => ({
        ...prev,
        pickup: t.pickupLocation ?? prev.pickup,
        delivery: t.deliveryLocation ?? prev.delivery,
        fulfillment: t.fulfillment ?? prev.fulfillment,
        pkg: t.package ?? prev.pkg,
        items: t.items?.length ? t.items : prev.items,
      }));
      setTemplateLoaded(true);
    }
  }, [templateData, templateLoaded]);

  const update = useCallback(<K extends keyof WizardState>(key: K, val: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── Step validation ────────────────────────────────────────────────────────

  const isStepValid = (i: number): boolean => {
    switch (i) {
      case 0: return !!state.pickup?.latitude && !!state.pickup?.contactName;
      case 1: return !!state.delivery?.latitude && !!state.delivery?.contactName;
      case 2: return state.fulfillment.deliveryTypeId > 0 && state.fulfillment.vehicleCategoryId > 0;
      case 3: return state.items.length > 0 && state.items.every((it) => it.name && it.quantity > 0);
      case 4: return true; // Schedule is optional
      case 5: return !!state.fare; // Fare must be computed before placing
      default: return false;
    }
  };

  const stepsWithState = STEPS.map((s, i) => ({ ...s, isComplete: isStepValid(i) }));
  const isFirstStep = step === 0;
  const isLastStep  = step === STEPS.length - 1;
  const canGoNext   = isStepValid(step);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = () => { if (canGoNext && !isLastStep) setStep((s) => s + 1); };
  const handlePrev = () => { if (!isFirstStep) setStep((s) => s - 1); };

  // ── "Save as Draft" ────────────────────────────────────────────────────────

  const handleSaveAsDraft = () => {
    const payload = {
      name: `New Order (${new Date().toLocaleDateString()})`,
      pickupLocation:   state.pickup   ?? undefined,
      deliveryLocation: state.delivery ?? undefined,
      fulfillment:      state.fulfillment.deliveryTypeId > 0 ? state.fulfillment : undefined,
      items:            state.items.length > 0 ? state.items : undefined,
      package:          Object.keys(state.pkg).length > 0 ? state.pkg : undefined,
      schedule:         state.schedule.pickupAt ? state.schedule : undefined,
    };

    createDraft.mutate(payload, {
      onSuccess: (res) => {
        toast.success("Saved as draft. You can continue editing it from Drafts.");
        router.push(`/drafts/${res.data.draftId}`);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to save draft.");
      },
    });
  };

  // ── "Place Order" ──────────────────────────────────────────────────────────

  const handlePlaceOrder = () => {
    if (!state.pickup || !state.delivery || !state.fare) {
      toast.error("Missing required order details.");
      return;
    }

    const payload = buildCreateOrderPayload({
      fulfillment: state.fulfillment,
      pickup:      state.pickup,
      delivery:    state.delivery,
      pkg:         state.pkg,
      schedule:    state.schedule,
      items:       state.items,
      pricing:     state.fare,
    });

    createOrder.mutate(payload, {
      onSuccess: (res) => {
        toast.success("Order placed successfully!");
        router.push(`/orders/${res.data.order.identifiers.orderId}`);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to place order.");
      },
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (staticLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-r-primary" />
          <p className="text-sm">Loading order options...</p>
        </div>
      </div>
    );
  }

  const staticData = staticDataResult?.data;
  if (!staticData) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
      {/* Left Sidebar — Stepper */}
      <div className="md:col-span-4 lg:col-span-3 sticky top-24">
        <NewOrderStepper
          steps={stepsWithState}
          currentStepIndex={step}
          onStepClick={(i) => {
            // Allow clicking any previously-completed step or the current one
            if (i <= step || isStepValid(i - 1)) setStep(i);
          }}
        />
      </div>

      {/* Main Form Content */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="min-h-[500px] rounded-xl border bg-card p-6 shadow-sm md:p-8">

          {/* Step 0 — Pickup */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-medium">Pickup Location</h3>
                <p className="text-sm text-muted-foreground">Where should the courier collect the package?</p>
              </div>
              <AddressSearchWidget
                label=""
                value={state.pickup as any}
                onChange={(v) => update("pickup", v as any)}
              />
            </div>
          )}

          {/* Step 1 — Delivery */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-medium">Delivery Location</h3>
                <p className="text-sm text-muted-foreground">Where is the package going?</p>
              </div>
              <AddressSearchWidget
                label=""
                value={state.delivery as any}
                onChange={(v) => update("delivery", v as any)}
              />
            </div>
          )}

          {/* Step 2 — Fulfillment */}
          {step === 2 && (
            <FulfillmentStep
              data={staticData}
              value={state.fulfillment}
              onChange={(v) => update("fulfillment", v)}
            />
          )}

          {/* Step 3 — Package */}
          {step === 3 && (
            <PackageStep
              pkg={state.pkg}
              onPkgChange={(v) => update("pkg", v)}
              items={state.items}
              onItemsChange={(v) => update("items", v)}
            />
          )}

          {/* Step 4 — Schedule */}
          {step === 4 && (
            <ScheduleStep
              schedule={state.schedule}
              onChange={(v) => update("schedule", v)}
            />
          )}

          {/* Step 5 — Review & Place Order */}
          {step === 5 && (
            <NewOrderReviewStep
              pickup={state.pickup!}
              delivery={state.delivery!}
              fulfillment={state.fulfillment}
              pkg={state.pkg}
              items={state.items}
              schedule={state.schedule}
              staticData={staticData}
              fare={state.fare}
              onFareResolved={(f) => update("fare", f)}
              onPlaceOrder={handlePlaceOrder}
              isPlacing={createOrder.isPending}
            />
          )}

        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <ChevronLeft className="mr-2 size-4" />
            Back
          </Button>

          {/* Right side: Save as Draft + Continue/Place Order */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={createDraft.isPending || createOrder.isPending}
              className="text-muted-foreground"
            >
              {createDraft.isPending ? (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-muted-foreground border-r-transparent" />
              ) : (
                <BookmarkPlus className="mr-2 size-4" />
              )}
              Save as Draft
            </Button>

            {!isLastStep && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className={cn(canGoNext && "gradient-brand text-primary-foreground")}
              >
                Continue <ChevronRight className="ml-2 size-4" />
              </Button>
            )}

            {isLastStep && (
              <Button
                onClick={handlePlaceOrder}
                disabled={!state.fare || createOrder.isPending}
                className="gradient-brand text-primary-foreground min-w-[160px]"
              >
                {createOrder.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
                    Placing Order...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="size-4" />
                    Place Order
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
