"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
};

type DraftStepperProps = {
  steps: Step[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
};

export function DraftStepper({ steps, currentStepIndex, onStepClick }: DraftStepperProps) {
  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isPast = index < currentStepIndex;
        const isComplete = step.isComplete;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(index)}
            className={cn(
              "flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all",
              isActive
                ? "border-primary bg-primary/5 shadow-[var(--shadow-ambient-md)]"
                : "border-border hover:bg-surface-container-low",
              (!isPast && !isActive) && "opacity-60",
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
