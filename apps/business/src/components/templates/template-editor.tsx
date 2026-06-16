"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DraftStepper } from "../drafts/draft-stepper";
import { AddressSearchWidget } from "../drafts/address-search-widget";
import { BasicsStep } from "../drafts/steps/basics-step";
import { FulfillmentStep } from "../drafts/steps/fulfillment-step";
import { PackageStep } from "../drafts/steps/package-step";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateOrderData } from "@/hooks/use-static-data";
import { useCreateTemplate, useUpdateTemplate, useTemplate } from "@/hooks/use-templates";
import type { TemplateUpdatePayload, TemplateCreatePayload, Template } from "@/types/business";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

type TemplateEditorProps = {
  readonly mode: "create" | "edit";
  readonly templateId?: number;
};

const STEPS = [
  { id: "basics",       label: "Basics",       description: "Name this template" },
  { id: "pickup",       label: "Pickup",       description: "Default pickup location" },
  { id: "delivery",    label: "Delivery",     description: "Default delivery location" },
  { id: "fulfillment", label: "Fulfillment",  description: "Speed & vehicle" },
  { id: "package",     label: "Package",      description: "Items & options" },
];

export function TemplateEditor({ mode, templateId }: TemplateEditorProps) {
  const router = useRouter();
  const { data: templateData, isLoading: templateLoading } = useTemplate(templateId ?? null);
  const { data: staticDataResult, isLoading: staticLoading } = useCreateOrderData();
  
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [currentStep, setCurrentStep] = useState(0);

  // Local state
  const [localTemplate, setLocalTemplate] = useState<TemplateUpdatePayload>({
    name: "",
    description: "",
  });

  // Sync when query loads
  useEffect(() => {
    if (mode === "edit" && templateData?.data) {
      setLocalTemplate({
        name:             templateData.data.name ?? "",
        description:      templateData.data.description ?? "",
        pickupLocation:   templateData.data.pickupLocation ?? undefined,
        deliveryLocation: templateData.data.deliveryLocation ?? undefined,
        fulfillment:      templateData.data.fulfillment ?? undefined,
        items:            templateData.data.items ?? [],
        package:          templateData.data.package ?? { notifyRecipientSms: false },
      });
    }
  }, [templateData, mode]);

  // Explicit save
  const saveTemplate = useCallback(
    (payload: TemplateUpdatePayload, onSuccess?: (data: any) => void) => {
      // Basic validation for name
      if (!payload.name || payload.name.trim().length < 2) {
        toast.error("Template name must be at least 2 characters.");
        return;
      }

      if (mode === "edit" && templateId) {
        updateTemplate.mutate(
          { id: templateId, payload },
          { 
            onSuccess: (data) => {
              if (onSuccess) onSuccess(data);
            },
            onError: () => toast.error("Failed to save template") 
          }
        );
      } else if (mode === "create") {
        createTemplate.mutate(payload as TemplateCreatePayload, {
          onSuccess: (res) => {
            if (onSuccess) onSuccess(res);
            toast.success("Template created!");
            router.push(`/templates/${res.data.templateId}`);
          },
          onError: () => toast.error("Failed to create template")
        });
      }
    },
    [mode, templateId, createTemplate, updateTemplate, router]
  );

  if ((mode === "edit" && templateLoading) || staticLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Loading template editor...
      </div>
    );
  }

  const staticData = staticDataResult?.data;
  if (!staticData) return null;

  // ── Step validation ────────────────────────────────────────────────────────

  const isStepComplete = (index: number) => {
    switch (index) {
      case 0: return (localTemplate.name?.trim().length ?? 0) >= 2;
      case 1: return !!localTemplate.pickupLocation?.latitude && !!localTemplate.pickupLocation?.contactName;
      case 2: return !!localTemplate.deliveryLocation?.latitude && !!localTemplate.deliveryLocation?.contactName;
      case 3: return !!localTemplate.fulfillment?.deliveryTypeId && !!localTemplate.fulfillment?.vehicleCategoryId;
      case 4: return (localTemplate.items?.length ?? 0) > 0 && localTemplate.items!.every((i) => i.name && i.quantity > 0);
      default: return false;
    }
  };

  const stepsWithState = STEPS.map((s, i) => ({ ...s, isComplete: isStepComplete(i) }));
  const canGoNext   = isStepComplete(currentStep);
  const isFirstStep = currentStep === 0;
  const isLastStep  = currentStep === STEPS.length - 1;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleUpdate = (patch: Partial<TemplateUpdatePayload>) => {
    setLocalTemplate((prev) => ({ ...prev, ...patch }));
  };

  const handleManualSave = () => {
    saveTemplate(localTemplate, () => {
      if (mode === "edit") {
        toast.success("Template saved.");
      }
    });
  };

  const isSaving = updateTemplate.isPending || createTemplate.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
      {/* Left Sidebar (Stepper) */}
      <div className="md:col-span-4 lg:col-span-3 sticky top-24">
        <DraftStepper
          steps={stepsWithState}
          currentStepIndex={currentStep}
          onStepClick={(i) => {
            setCurrentStep(i);
          }}
        />

        {/* Save status + explicit Save button */}
        <div className="mt-6 rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{mode === "edit" ? `Template #${templateId}` : "New Template"}</span>
            <span className="flex items-center gap-1">
              {isSaving ? (
                <>
                  <div className="size-3 animate-spin rounded-full border border-muted-foreground border-r-transparent" />
                  Saving…
                </>
              ) : (
                <><Save className="size-3" /> Ready</>
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleManualSave}
            disabled={isSaving || !localTemplate.name}
          >
            <Save className="mr-2 size-3.5" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="min-h-[500px] rounded-xl border bg-card p-6 shadow-sm md:p-8">

          {currentStep === 0 && (
            <BasicsStep
              name={localTemplate.name ?? ""}
              setName={(n) => handleUpdate({ name: n })}
              notes={localTemplate.description ?? ""}
              setNotes={(d) => handleUpdate({ description: d })}
            />
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-medium">Pickup Location</h3>
                <p className="text-sm text-muted-foreground">Default pickup for this template (Optional)</p>
              </div>
              <AddressSearchWidget
                label=""
                value={localTemplate.pickupLocation as any}
                onChange={(v) => handleUpdate({ pickupLocation: v as any })}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-medium">Delivery Location</h3>
                <p className="text-sm text-muted-foreground">Default delivery for this template (Optional)</p>
              </div>
              <AddressSearchWidget
                label=""
                value={localTemplate.deliveryLocation as any}
                onChange={(v) => handleUpdate({ deliveryLocation: v as any })}
              />
            </div>
          )}

          {currentStep === 3 && (
            <FulfillmentStep
              data={staticData}
              value={localTemplate.fulfillment ?? { deliveryTypeId: 0, vehicleCategoryId: 0, paymentMethodId: 1 }}
              onChange={(v) => handleUpdate({ fulfillment: v })}
            />
          )}

          {currentStep === 4 && (
            <PackageStep
              pkg={localTemplate.package ?? { notifyRecipientSms: false }}
              onPkgChange={(v) => handleUpdate({ package: v })}
              items={localTemplate.items ?? []}
              onItemsChange={(v) => handleUpdate({ items: v })}
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
            <ChevronLeft className="mr-2 size-4" /> Back
          </Button>

          <Button
            onClick={isLastStep ? handleManualSave : handleNext}
            disabled={(isLastStep ? !localTemplate.name : !canGoNext) || isSaving}
            className={cn(canGoNext && "gradient-brand text-primary-foreground")}
          >
            {isLastStep ? "Save Template" : (
              <>Continue <ChevronRight className="ml-2 size-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
