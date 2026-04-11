import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="pb-20 sm:pb-24"
    >
      <div className="container-shell">
        <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-14 text-center text-primary-foreground sm:px-10">
          <div className="absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-white/16 blur-3xl" />
          <div className="absolute -right-8 bottom-1 h-28 w-28 rounded-full bg-white/18 blur-2xl" />
          <div className="absolute left-8 bottom-8 h-3 w-3 rounded-full bg-white/60" />
          <div className="absolute right-14 top-10 h-2 w-2 rounded-full bg-white/55" />

          <p className="label-md text-white/80">Start today</p>
          <h2
            id="pricing-heading"
            className="display-sm mx-auto mt-4 max-w-2xl text-white"
          >
            Ready to transform your logistics?
          </h2>
          <p className="body-md mx-auto mt-4 max-w-xl text-white/80">
            Create your account and launch deliveries in minutes.
          </p>

          <div className="mt-8">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 bg-white px-7 text-primary shadow-[var(--shadow-ambient-md)] hover:bg-white/92",
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
