import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { cn } from "@/lib/utils";

type KPICardProps = {
  readonly title: string;
  readonly value: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly subValue?: string;
  readonly subLabel?: string;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
  readonly isLoading?: boolean;
  readonly className?: string;
};

export function KPICard({
  title,
  value,
  prefix = "",
  suffix = "",
  subValue,
  subLabel,
  trend,
  isLoading = false,
  className,
}: KPICardProps) {
  const animatedValue = useAnimatedCounter(value, { duration: 1000 });
  const displayValue = `${prefix}${animatedValue.toLocaleString()}${suffix}`;

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-[var(--shadow-ambient-md)]", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend && (
          <div
            className={cn(
              "flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              trend.isPositive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {displayValue}
          </div>
        )}
        {(subValue || subLabel) && !isLoading && (
          <div className="mt-2 flex items-baseline gap-1.5 text-sm">
            {subValue && <span className="font-medium text-foreground">{subValue}</span>}
            {subLabel && <span className="text-muted-foreground">{subLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
