"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

type MetricItem = {
  value: number;
  suffix: string;
  label: string;
};

const metrics: MetricItem[] = [
  { value: 10, suffix: "K+", label: "Deliveries" },
  { value: 500, suffix: "+", label: "Businesses" },
  { value: 99.8, suffix: "%", label: "On-Time" },
  { value: 30, suffix: "min", label: "Avg." },
];

function formatMetric(metric: MetricItem, value: number) {
  if (metric.value === 99.8) {
    return `${(value / 10).toFixed(1)}${metric.suffix}`;
  }

  return `${value}${metric.suffix}`;
}

function MetricCard({ metric, start }: { metric: MetricItem; start: boolean }) {
  const animatedValue = useAnimatedCounter(
    metric.value === 99.8 ? 998 : metric.value,
    {
      start,
      duration: 1400,
    },
  );

  return (
    <li className="space-y-1 text-center sm:text-left lg:px-4">
      <p className="display-sm text-primary">
        {formatMetric(metric, animatedValue)}
      </p>
      <p className="body-sm text-muted-foreground">{metric.label}</p>
    </li>
  );
}

export function MetricsBar() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.35,
  });

  return (
    <section className="pb-8" aria-label="Business metrics">
      <div ref={ref} className="container-shell">
        <div className="surface-pane rounded-2xl px-6 py-6 shadow-[var(--shadow-ambient-sm)] md:px-10">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                metric={metric}
                start={isVisible}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
