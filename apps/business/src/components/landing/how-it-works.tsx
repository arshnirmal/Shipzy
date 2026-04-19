"use client";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

const steps = [
  {
    title: "Create your account",
    description:
      "Set up your business profile and invite operations teammates in minutes.",
  },
  {
    title: "Connect your store",
    description:
      "Sync orders and configure delivery preferences for your workflow.",
  },
  {
    title: "Start shipping",
    description:
      "Dispatch instantly and manage delivery performance from one dashboard.",
  },
];

export function HowItWorks() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.2,
  });

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-20 sm:py-24"
    >
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-md text-primary">How It Works</p>
          <h2
            id="how-it-works-heading"
            className="display-md mt-4 text-on-surface"
          >
            Get started in three quick steps
          </h2>
        </div>

        <div
          ref={ref}
          className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-6"
        >
          {steps.map((step, index) => (
            <article
              key={step.title}
              className={`surface-pane rounded-lg p-6 text-left shadow-[var(--shadow-ambient-sm)] ${
                isVisible ? "reveal-visible" : "reveal"
              }`}
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <div className="mb-4 inline-flex size-11 min-h-11 min-w-11 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
                {index + 1}
              </div>
              <h3 className="headline-sm text-on-surface">{step.title}</h3>
              <p className="body-md mt-3 text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
