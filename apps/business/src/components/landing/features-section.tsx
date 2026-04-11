"use client";

import { BarChart3, Boxes, Users2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

const features = [
  {
    title: "Order Management",
    description:
      "Create, track, and orchestrate bulk delivery requests from one focused workspace.",
    icon: Boxes,
  },
  {
    title: "Real-time Analytics",
    description:
      "Monitor on-time ratios, fulfillment speed, and delivery costs with live business insights.",
    icon: BarChart3,
  },
  {
    title: "Team Collaboration",
    description:
      "Invite team members, define permissions, and run operations with shared visibility.",
    icon: Users2,
  },
];

export function FeaturesSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.2,
  });

  return (
    <section id="features" className="bg-surface-container-low py-20 sm:py-24">
      <div className="container-shell">
        <div className="max-w-2xl">
          <p className="label-md text-primary">What You Can Do</p>
          <h2 className="display-md mt-4 text-on-surface">
            Precision tools for modern operations teams
          </h2>
          <p className="body-lg mt-4 text-muted-foreground">
            Built for teams that treat logistics as a strategic function, not a
            back-office task.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className={`surface-elevated border-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-ambient-lg)] ${
                isVisible ? "reveal-visible" : "reveal"
              }`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="headline-sm text-on-surface">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="body-md text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
