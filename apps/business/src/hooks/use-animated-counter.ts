"use client";

import { useEffect, useState } from "react";

type UseAnimatedCounterOptions = {
  duration?: number;
  start?: boolean;
};

export function useAnimatedCounter(
  target: number,
  { duration = 1300, start = true }: UseAnimatedCounterOptions = {},
) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!start || prefersReducedMotion) {
      return;
    }

    const startedAt = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const elapsed = time - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [duration, prefersReducedMotion, start, target]);

  if (prefersReducedMotion && start) {
    return target;
  }

  return value;
}
