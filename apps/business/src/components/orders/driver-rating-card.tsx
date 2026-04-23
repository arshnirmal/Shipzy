"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDriverRating } from "@/hooks/use-driver-rating";
import { Loader2 } from "lucide-react";

type DriverRatingCardProps = {
  driverId: number;
};

function StarRating({ average, total }: { average: number; total: number }) {
  const fullStars = Math.floor(average);
  const hasHalf = average - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`size-4 ${
              i < fullStars
                ? "fill-amber-400 text-amber-400"
                : i === fullStars && hasHalf
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold">{average.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({total} ratings)</span>
    </div>
  );
}

function DistributionBar({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[String(star)] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right font-medium">{star}</span>
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DriverRatingCard({ driverId }: DriverRatingCardProps) {
  const { data, isLoading } = useDriverRating(driverId);
  const rating = data?.data.rating;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!rating) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Star className="size-4 text-amber-400" />
          Driver Rating
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StarRating average={rating.summary.average} total={rating.summary.total} />
        <DistributionBar distribution={rating.distribution} />

        {rating.recent.length > 0 && (
          <div className="border-t border-outline-variant/20 pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Recent Reviews
            </p>
            <div className="space-y-2">
              {rating.recent.slice(0, 3).map((r, i) => (
                <div key={i} className="rounded-md bg-surface-container-low p-2.5">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: r.rating }, (_, j) => (
                      <Star key={j} className="size-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
