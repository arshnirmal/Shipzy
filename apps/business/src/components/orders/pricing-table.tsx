import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FareBreakdown } from "@/types/orders";

type PricingTableProps = {
  readonly pricing: FareBreakdown;
  readonly className?: string;
  readonly isEstimate?: boolean;
};

export function PricingTable({ pricing, className, isEstimate = false }: PricingTableProps) {
  const formatAmount = (amt?: number | null) => {
    if (amt == null) return "—";
    return `₹${amt.toFixed(2)}`;
  };

  const hasDiscount = pricing.discountPct && pricing.discountAmount && pricing.discountPct > 0;

  return (
    <div className={cn("rounded-lg border bg-surface-container-lowest", className)}>
      <div className="border-b bg-muted/30 px-4 py-3">
        <h4 className="font-medium">
          {isEstimate ? "Estimated Fare Breakdown" : "Fare Breakdown"}
        </h4>
        {hasDiscount && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Volume pricing tier applied. You saved {pricing.discountPct}%!
          </p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Base Price</span>
          <span className="font-medium">{formatAmount(pricing.basePrice)}</span>
        </div>
        
        {pricing.distancePrice > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Distance Charge ({pricing.distanceKm.toFixed(1)} km)</span>
            <span className="font-medium">{formatAmount(pricing.distancePrice)}</span>
          </div>
        )}

        {pricing.weightSurcharge > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weight Surcharge</span>
            <span className="font-medium">{formatAmount(pricing.weightSurcharge)}</span>
          </div>
        )}

        {pricing.specialHandlingFee ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Special Handling</span>
            <span className="font-medium">{formatAmount(pricing.specialHandlingFee)}</span>
          </div>
        ) : null}

        {pricing.platformFee ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee</span>
            <span className="font-medium">{formatAmount(pricing.platformFee)}</span>
          </div>
        ) : null}

        <div className="my-2 border-t border-dashed" />

        {hasDiscount && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatAmount(pricing.subtotalBeforeTax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
              <span className="flex items-center gap-2">
                Volume Discount 
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                  {pricing.discountPct}% OFF
                </Badge>
              </span>
              <span className="font-medium">-{formatAmount(pricing.discountAmount)}</span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">GST (18%)</span>
          <span className="font-medium">{formatAmount(pricing.gstAmount)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/5 p-3 font-semibold text-primary">
          <span>Total {isEstimate ? "Estimate" : "Amount"}</span>
          <span>{formatAmount(pricing.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
