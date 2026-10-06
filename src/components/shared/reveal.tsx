import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveals — pure CSS (`animation-timeline: view()`), no
 * client component, no IntersectionObserver, no framer-motion.
 *
 * Why: every `<Reveal>` used to be a *client* boundary, so the server
 * content passed as `children` was serialized twice — once into the HTML,
 * once into the inline RSC flight payload (117 KB of the 268 KB home
 * document). As server components the wrappers add ~40 bytes each.
 *
 * Progressive enhancement:
 * - Chromium 115+ / Safari 26+ (`animation-timeline: view()`): the element
 *   fades up as it enters the viewport, driven by the compositor thread —
 *   smoother than the old JS reveals and immune to main-thread jank.
 * - Firefox (no support yet): `@supports` gate leaves the element fully
 *   visible — no animation, nothing ever hidden.
 * - `prefers-reduced-motion`: no animation, content visible.
 * - No-JS readers, crawlers, and slow phones: content visible (the old
 *   framer-motion version shipped `opacity:0` inline styles that stayed
 *   invisible forever if JS never ran — that bug is gone).
 */

interface RevealProps {
  children: ReactNode;
  /** Seconds the old JS reveal waited before animating (0–0.15 typical). Mapped to a timeline-range shift. */
  delay?: number;
  /** Legacy prop (pixels) — accepted for API compatibility; the CSS keyframe is tuned to 24px. */
  y?: number;
  /** Legacy prop — the CSS reveal is inherently once-only. */
  once?: boolean;
  className?: string;
}

/** Wrap content to fade-up on scroll. Server component; works with zero JS. */
export function Reveal({ children, delay = 0, y, once, className }: RevealProps) {
  void y;
  void once;
  const style = delay > 0 ? ({ "--reveal-shift": `${Math.round(delay * 60)}%` } as CSSProperties) : undefined;
  return (
    <div className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Optional element id (e.g. aria-controls target for tab lists). */
  id?: string;
}

/** Parent wrapper for staggered `RevealItem` children (CSS view() timeline does the staggering). */
export function Stagger({ children, className, id }: StaggerProps) {
  return (
    <div id={id} className={cn("reveal-stagger", className)}>
      {children}
    </div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("reveal-item", className)}>{children}</div>;
}
