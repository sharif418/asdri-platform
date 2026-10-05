"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { toBnDigits } from "@/lib/format";
import type { Language } from "@/types";

interface StatCounterProps {
  value: number;
  suffix?: string;
  lang: Language;
  durationMs?: number;
  className?: string;
}

/**
 * Animated count-up that renders Bengali digits in `bn` mode.
 * Starts when scrolled into view (once).
 *
 * Round 3: the SERVER render (and any no-JS reader, crawler or slow phone)
 * shows the FINAL value — the animation only runs client-side after hydration,
 * so the markup never ships six zeros.
 */
export function StatCounter({ value, suffix = "", lang, durationMs = 1600, className }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(value); // SSR truth, animated only after mount

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutExpo for a premium settle — starts from 0 once in view (the
      // SSR markup already showed the true final value).
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    // The first rAF callback resets the count to zero (async — no cascading
    // synchronous setState), then the animation climbs to the true value.
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  const text = lang === "bn" ? toBnDigits(display) : String(display);

  return (
    <span ref={ref} className={className}>
      {text}
      {suffix}
    </span>
  );
}
