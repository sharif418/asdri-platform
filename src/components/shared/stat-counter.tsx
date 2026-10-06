"use client";

import { useEffect, useRef, useState } from "react";
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
 *
 * Round 4: the in-view trigger is a plain IntersectionObserver (was
 * framer-motion's useInView) — one fewer runtime dependency on the page.
 */
export function StatCounter({ value, suffix = "", lang, durationMs = 1600, className }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(value); // SSR truth, animated only after mount

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      // ancient browser: skip the animation entirely (deferred to a microtask
      // so React doesn't flag a synchronous cascade inside the effect)
      const id = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

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
