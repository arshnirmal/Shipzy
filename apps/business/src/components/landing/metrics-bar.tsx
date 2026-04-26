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
    <li className="flex flex-col space-y-1 text-center sm:text-left lg:items-start">
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
    <section
      className="relative z-10 -mt-10 pb-10 sm:-mt-14 sm:pb-12"
      aria-labelledby="metrics-heading"
    >
      <h2 id="metrics-heading" className="sr-only">
        Platform metrics
      </h2>
      <div ref={ref} className="container-shell">
        {/* max-w-4xl matches hero inner column so the strip aligns with headline/CTAs */}
        <div className="surface-pane mx-auto w-full max-w-4xl rounded-lg px-6 py-8 shadow-[var(--shadow-ambient-sm)] sm:px-8 md:px-10">
          <ul className="grid gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 lg:grid-cols-4 lg:gap-6">
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
