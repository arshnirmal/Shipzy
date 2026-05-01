import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-24"
    >
      <div className="gradient-mesh absolute inset-0 -z-20" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_10%,oklch(0.72_0.15_264_/_0.16),transparent_34%),radial-gradient(circle_at_80%_65%,oklch(0.65_0.13_190_/_0.14),transparent_42%)]" />
      <div className="orb-float pulse-soft absolute -top-16 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="container-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p
            className="label-md reveal reveal-visible text-primary"
            style={{ animationDelay: "0.08s" }}
          >
            Built for local commerce
          </p>
          <h1
            id="hero-heading"
            className="display-lg reveal reveal-visible mt-5 text-on-surface"
            style={{ animationDelay: "0.2s" }}
          >
            The Next Era of Logistics
          </h1>
          <p
            className="body-lg reveal reveal-visible mx-auto mt-7 max-w-2xl text-muted-foreground"
            style={{ animationDelay: "0.34s" }}
          >
            Manage last-mile deliveries with smarter routes, clearer operations,
            and a platform designed for teams that move fast.
          </p>

          <div
            className="reveal reveal-visible mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.46s" }}
          >
            <Link
              href="/?auth=register"
              className={cn(
                buttonVariants({ size: "touch" }),
                "gradient-brand text-primary-foreground shadow-[var(--shadow-ambient-md)]",
              )}
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "touch" }),
                "border-outline-variant/20 bg-surface-container-lowest/80",
              )}
            >
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
