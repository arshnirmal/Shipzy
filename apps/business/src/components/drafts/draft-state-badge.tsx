import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { DraftState } from "@/types/business";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      state: {
        incomplete: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        submitted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
    },
    defaultVariants: {
      state: "incomplete",
    },
  }
);

export interface DraftStateBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  state: DraftState;
}

export function DraftStateBadge({ className, state, ...props }: DraftStateBadgeProps) {
  const label = state.charAt(0).toUpperCase() + state.slice(1);
  return (
    <div className={cn(badgeVariants({ state }), className)} {...props}>
      {label}
    </div>
  );
}
