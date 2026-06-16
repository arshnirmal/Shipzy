"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
};

type NewOrderStepperProps = {
  steps: Step[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
};

export function NewOrderStepper({ steps, currentStepIndex, onStepClick }: NewOrderStepperProps) {
  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, index) => {
        const isActive   = index === currentStepIndex;
        const isPast     = index < currentStepIndex;
        const isComplete = step.isComplete;
        const isUnlocked = isActive || isPast;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(index)}
            disabled={!isUnlocked}
            type="button"
            className={cn(
              "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all",
              isActive
                ? "border-primary bg-primary/5 shadow-[var(--shadow-ambient-md)]"
                : isUnlocked
                ? "border-border hover:bg-surface-container-low"
                : "border-border opacity-40 cursor-not-allowed",
            )}
          >
            <div className="mt-0.5 shrink-0">
              {isComplete ? (
                <CheckCircle2 className="size-5 text-primary" />
              ) : (
                <Circle
                  className={cn(
                    "size-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p
                className={cn(
                  "text-sm font-medium leading-none",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
