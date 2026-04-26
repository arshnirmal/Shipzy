"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DraftStepper } from "./draft-stepper";
import { AddressSearchWidget } from "./address-search-widget";
import { BasicsStep } from "./steps/basics-step";
import { FulfillmentStep } from "./steps/fulfillment-step";
import { PackageStep } from "./steps/package-step";
import { ScheduleStep } from "./steps/schedule-step";
import { ReviewStep } from "./steps/review-step";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateOrderData } from "@/hooks/use-static-data";
import { useDraft, useUpdateDraft, useSubmitDraft } from "@/hooks/use-drafts";
import type { DraftUpdatePayload, ResolvedAddress, Draft } from "@/types/business";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

type DraftEditorProps = {
  readonly draftId: number;
};

const STEPS = [
  { id: "basics", label: "Basics", description: "Name and notes" },
  { id: "pickup", label: "Pickup", description: "Where is it located?" },
  { id: "delivery", label: "Delivery", description: "Where is it going?" },
  { id: "fulfillment", label: "Fulfillment", description: "Method and vehicle" },
  { id: "package", label: "Package", description: "Items and options" },
  { id: "schedule", label: "Schedule", description: "Pickup time" },
  { id: "review", label: "Review", description: "Calculate fare and submit" },
];

export function DraftEditor({ draftId }: DraftEditorProps) {
  const router = useRouter();
  const { data: draftData, isLoading: draftLoading } = useDraft(draftId);
  const { data: staticDataResult, isLoading: staticLoading } = useCreateOrderData();
  const updateDraft = useUpdateDraft(draftId);
  const submitDraft = useSubmitDraft();

  const [currentStep, setCurrentStep] = useState(0);

  // We keep a shadow copy of the draft state locally to avoid lagging inputs
  const [localDraft, setLocalDraft] = useState<DraftUpdatePayload>({});
  
  // Sync when query loads
  useEffect(() => {
    if (draftData?.data) {
      setLocalDraft({
        name: draftData.data.name ?? "",
        notes: draftData.data.notes ?? "",
        pickupLocation: draftData.data.pickupLocation ?? undefined,
        deliveryLocation: draftData.data.deliveryLocation ?? undefined,
        fulfillment: draftData.data.fulfillment ?? undefined,
        items: draftData.data.items ?? [],
        package: draftData.data.package ?? { notifyRecipientSms: true },
        schedule: draftData.data.schedule ?? {},
      });
    }
  }, [draftData]);

  // Debounced auto-save function
  const triggerAutoSave = useCallback((payload: DraftUpdatePayload) => {
    updateDraft.mutate(payload, {
      onError: () => toast.error("Failed to auto-save draft"),
    });
  }, [updateDraft]);

  if (draftLoading || staticLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  const draft = draftData?.data;
  const staticData = staticDataResult?.data;

  if (!draft || !staticData) return null;

  // Validation logic per step
  const isStepComplete = (index: number) => {
    switch (index) {
      case 0: return true; // Basics always valid
      case 1: return !!localDraft.pickupLocation?.latitude && !!localDraft.pickupLocation?.contactName;
      case 2: return !!localDraft.deliveryLocation?.latitude && !!localDraft.deliveryLocation?.contactName;
      case 3: return !!localDraft.fulfillment?.deliveryTypeId && !!localDraft.fulfillment?.vehicleCategoryId;
      case 4: return (localDraft.items?.length ?? 0) > 0 && localDraft.items!.every(i => i.name && i.quantity > 0);
      case 5: return true; // Schedule always valid (optional)
      case 6: return false; // Review is never "complete" until submitted
      default: return false;
    }
  };

  const stepsWithState = STEPS.map((s, i) => ({
    ...s,
    isComplete: isStepComplete(i),
  }));

  const canGoNext = isStepComplete(currentStep);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      triggerAutoSave(localDraft);
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      triggerAutoSave(localDraft);
      setCurrentStep(s => s - 1);
    }
  };

  const handleUpdate = (patch: Partial<DraftUpdatePayload>) => {
    setLocalDraft(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = () => {
    triggerAutoSave(localDraft);
    submitDraft.mutate(draftId, {
      onSuccess: () => {
        toast.success("Order submitted successfully!");
        router.push("/orders");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to submit draft");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
      {/* Left Sidebar (Stepper) */}
      <div className="md:col-span-4 lg:col-span-3 sticky top-24">
        <DraftStepper 
          steps={stepsWithState} 
          currentStepIndex={currentStep} 
          onStepClick={(i) => {
             // Only allow clicking to steps we've reached or unlocked
             // For now, simplicity: allow free navigation
             triggerAutoSave(localDraft);
             setCurrentStep(i);
          }} 
        />
        
        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>Draft ID #{draftId}</span>
          <span className="flex items-center gap-1">
             {updateDraft.isPending ? "Saving..." : <><Save className="size-3"/> Saved</>}
          </span>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="min-h-[500px] rounded-xl border bg-card p-6 shadow-sm md:p-8">
          
          {/* Step Renderers */}
          {currentStep === 0 && (
            <BasicsStep 
              name={localDraft.name ?? ""} setName={n => handleUpdate({name: n})}
              notes={localDraft.notes ?? ""} setNotes={n => handleUpdate({notes: n})}
            />
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-medium">Pickup Location</h3>
                <p className="text-sm text-muted-foreground">Where should the courier collect the package?</p>
              </div>
              <AddressSearchWidget 
                label=""
                value={localDraft.pickupLocation as any} 
                onChange={v => handleUpdate({pickupLocation: v as any})} 
              />
            </div>
          )}

          {currentStep === 2 && (
             <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-medium">Delivery Location</h3>
                <p className="text-sm text-muted-foreground">Where is the package going?</p>
              </div>
              <AddressSearchWidget 
                label=""
                value={localDraft.deliveryLocation as any} 
                onChange={v => handleUpdate({deliveryLocation: v as any})} 
              />
            </div>
          )}

          {currentStep === 3 && (
            <FulfillmentStep 
              data={staticData}
              value={localDraft.fulfillment ?? { deliveryTypeId: 0, vehicleCategoryId: 0, paymentMethodId: 1 }}
              onChange={v => handleUpdate({fulfillment: v})}
            />
          )}

          {currentStep === 4 && (
            <PackageStep 
              pkg={localDraft.package ?? {}}
              onPkgChange={v => handleUpdate({package: v})}
              items={localDraft.items ?? []}
              onItemsChange={v => handleUpdate({items: v})}
            />
          )}

          {currentStep === 5 && (
             <ScheduleStep 
               schedule={localDraft.schedule ?? {}}
               onChange={v => handleUpdate({schedule: v})}
             />
          )}

          {currentStep === 6 && (
            <ReviewStep 
              draft={{...draft, ...localDraft} as Draft} 
              staticData={staticData}
              onSubmit={handleSubmit}
              isSubmitting={submitDraft.isPending}
            />
          )}

        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={isFirstStep}
          >
            <ChevronLeft className="mr-2 size-4" /> Previous
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
        </div>
      </div>
    </div>
  );
}
