import { cn } from "@/lib/utils";

/**
 * Server-rendered progress bar — plain divs with the same visuals and aria as
 * the Radix Progress client component, at zero JS cost. Used by server
 * components that need a percentage tracker (campaign bands).
 */
export function ProgressBar({
  percent,
  label,
  className,
  barClassName,
}: {
  percent: number;
  label: string;
  /** Extra classes for the track (e.g. a lighter track on dark sections). */
  className?: string;
  /** Extra classes for the fill bar. */
  barClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-primary/20", className)}
    >
      <div
        className={cn("bg-gold-gradient h-full rounded-full", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
